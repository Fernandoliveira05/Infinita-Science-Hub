# app/services/supabase_service.py
from __future__ import annotations

import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse

from fastapi import HTTPException, UploadFile
from supabase import create_client, Client

from app.core.config import settings

# -----------------------------
# Logger
# -----------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# -----------------------------
# Supabase Client
# -----------------------------
supabase: Client | None = None
logger.info("Iniciando o módulo de serviço do Supabase...")

try:
    supabase_url = settings.supabase_url
    supabase_key = settings.supabase_service_role_key
    if not supabase_url or not supabase_key:
        raise ValueError("Credenciais do Supabase não configuradas.")
    logger.info("Tentando se conectar à URL do Supabase...")
    supabase = create_client(supabase_url, supabase_key)
    logger.info("✅ Conexão com o Supabase estabelecida com sucesso!")
except Exception as e:
    logger.critical(f"❌ FALHA CRÍTICA ao conectar com o Supabase: {e}")

# -----------------------------
# Helpers
# -----------------------------
def _ensure_client():
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# ==========================================================
# STORAGE SERVICE (público/privado com Signed URL)
# ==========================================================
class StorageService:
    """
    Lida com upload e URLs no Supabase Storage.
    - Se supabase_bucket_public = 'true': retorna public URL
    - Caso contrário: retorna Signed URL
    """
    def __init__(self):
        _ensure_client()
        self.client: Client = supabase
        self.bucket: str = settings.supabase_storage_bucket  # ex.: 'mime'
        self.bucket_public: bool = str(
            getattr(settings, "supabase_bucket_public", "true")
        ).lower() == "true"
        self.base = settings.supabase_url.rstrip("/")

    def _key(self, block_id: str, filename: str, folder: str = "blocks") -> str:
        ext = (filename.split(".")[-1] if "." in filename else "bin").lower()
        return f"{folder}/{block_id}/{uuid.uuid4()}.{ext}"

    def upload(self, *, content: bytes, content_type: str, key: str) -> None:
        self.client.storage.from_(self.bucket).upload(
            path=key,
            file=content,
            file_options={"content-type": content_type, "upsert": "true"},
        )

    def _extract_public_url(self, raw) -> Optional[str]:
        """
        Supabase-py v2 normalmente retorna dict:
        { "data": { "publicUrl": "/storage/v1/object/public/<bucket>/<key>" } }
        """
        if isinstance(raw, dict):
            data = raw.get("data") or {}
            url = data.get("publicUrl") or data.get("public_url")
            if url:
                return self._abs(url)
        data = getattr(raw, "data", None)
        if data:
            url = getattr(data, "publicUrl", None) or getattr(data, "public_url", None)
            if url:
                return self._abs(url)
        url = getattr(raw, "public_url", None) or getattr(raw, "publicUrl", None)
        if url:
            return self._abs(url)
        return None

    def _extract_signed_url(self, raw) -> Optional[str]:
        """
        create_signed_url:
        { "data": { "signedUrl": "/storage/v1/object/sign/<bucket>/<key>?token=..." } }
        ou { "signedURL": "..."} dependendo da lib.
        """
        if isinstance(raw, dict):
            data = raw.get("data") or {}
            url = data.get("signedUrl") or data.get("signedURL")
            if url:
                return self._abs(url)
            token = data.get("token")
            path = data.get("path")
            if token and path:
                return f"{self.base}/storage/v1/object/sign/{self.bucket}/{path}?token={token}"
            url = raw.get("signedUrl") or raw.get("signedURL")
            if url:
                return self._abs(url)

        data = getattr(raw, "data", None)
        if data:
            url = getattr(data, "signedUrl", None) or getattr(data, "signedURL", None)
            if url:
                return self._abs(url)

        url = getattr(raw, "signedUrl", None) or getattr(raw, "signedURL", None)
        if url:
            return self._abs(url)
        return None

    def _abs(self, maybe_relative: str) -> str:
        if maybe_relative.startswith("/"):
            return f"{self.base}{maybe_relative}"
        return maybe_relative

    def url_for(self, key: str, *, signed_seconds: int = 60 * 60 * 24 * 365) -> str:
        """
        Retorna URL navegável. Se bucket for público, tenta publicUrl;
        senão, assina. Se a SDK devolver caminho relativo, prefixa base.
        """
        if self.bucket_public:
            raw = self.client.storage.from_(self.bucket).get_public_url(key)
            url = self._extract_public_url(raw)
            if not url:
                url = f"{self.base}/storage/v1/object/public/{self.bucket}/{key}"
            return url

        raw = self.client.storage.from_(self.bucket).create_signed_url(
            key, expire_in=signed_seconds
        )
        url = self._extract_signed_url(raw)
        if not url:
            token = (raw.get("data") or {}).get("token") if isinstance(raw, dict) else None
            if token:
                return f"{self.base}/storage/v1/object/sign/{self.bucket}/{key}?token={token}"
            raise HTTPException(status_code=500, detail="Não foi possível gerar Signed URL.")
        return url

    def delete_by_key(self, key: str) -> None:
        self.client.storage.from_(self.bucket).remove([key])

    def extract_key_from_url(self, url: str) -> Optional[str]:
        """
        Suporta:
          /storage/v1/object/public/<bucket>/<key>
          /storage/v1/object/sign/<bucket>/<key>?token=...
          URLs absolutas ou relativas.
        """
        try:
            parsed = urlparse(url)
            path = parsed.path

            if "/storage/v1/object/public/" in path:
                bucket_and_key = path.split("/storage/v1/object/public/", 1)[1]
                bucket_name, _, key = bucket_and_key.partition("/")
                if bucket_name == self.bucket and key:
                    return key
                return None

            if "/storage/v1/object/sign/" in path:
                bucket_and_key = path.split("/storage/v1/object/sign/", 1)[1]
                bucket_name, _, key = bucket_and_key.partition("/")
                if "?" in key:
                    key = key.split("?", 1)[0]
                if bucket_name == self.bucket and key:
                    return key
                return None

            if path.startswith("object/"):
                if path.startswith("object/public/"):
                    bucket_and_key = path.split("object/public/", 1)[1]
                elif path.startswith("object/sign/"):
                    bucket_and_key = path.split("object/sign/", 1)[1]
                else:
                    return None
                bucket_name, _, key = bucket_and_key.partition("/")
                if "?" in key:
                    key = key.split("?", 1)[0]
                if bucket_name == self.bucket and key:
                    return key
            return None
        except Exception:
            return None

storage_service = StorageService()

# =============================
# USERS
# =============================
def get_user_profile_by_address(address: str) -> dict | None:
    logger.info(f"Buscando perfil para o endereço: {address}")
    _ensure_client()
    try:
        resp = supabase.table("users").select("*").eq("address", address).single().execute()
        return resp.data if resp.data else None
    except Exception:
        return None

def create_initial_user_profile(address: str) -> dict:
    logger.info(f"Criando perfil inicial para o novo endereço: {address}")
    _ensure_client()
    try:
        now_iso = _now_iso()
        user_data = {"address": address, "created_at": now_iso, "updated_at": now_iso}
        resp = supabase.table("users").insert(user_data).execute()
        return resp.data[0]
    except Exception as e:
        logger.error(f"Erro ao criar perfil inicial para {address}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Não foi possível criar o perfil inicial do usuário.")

def update_user_nonce(address: str, nonce: str | None) -> dict:
    logger.info(f"Atualizando nonce para o endereço: {address}")
    _ensure_client()
    try:
        resp = supabase.table("users").update({"nonce": nonce}).eq("address", address).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado ao tentar atualizar o nonce.")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar nonce: {e}")

def insert_or_update_user_profile(
    address: str,
    username: Optional[str],
    email: Optional[str],
    bio: Optional[str],
    profile_image_url: Optional[str],
    description: Optional[str] = None,  # ✅ agora aceitamos description
) -> list[dict]:
    """
    Upsert de perfil de usuário com on_conflict='address'.
    - Normaliza address para lowercase.
    - Inclui description.
    """
    logger.info(f"Iniciando 'upsert' de perfil para o endereço: {address}")
    _ensure_client()
    try:
        addr = (address or "").lower().strip()
        now_iso = _now_iso()

        user_data = {
            "address": addr,
            "username": username,
            "email": email,
            "bio": bio,
            "profile_image_url": profile_image_url,
            "description": description,          # ✅ inclui description
            "updated_at": now_iso,
        }

        resp = supabase.table("users").upsert(
            user_data,
            on_conflict="address",               # ✅ evita 23505
        ).execute()
        if hasattr(resp, "error") and resp.error:
            raise Exception(str(resp.error))
        if resp.data:
            return resp.data

        # fallback: garante retorno
        get = supabase.table("users").select("*").eq("address", addr).single().execute()
        if get.data:
            return [get.data]

        ins = supabase.table("users").insert({**user_data, "created_at": now_iso}).execute()
        return ins.data

    except Exception as e:
        msg = str(getattr(e, "args", [""])[0] or e)
        if "23505" in msg or "unique" in msg.lower():
            try:
                upd = supabase.table("users").update({
                    "username": username,
                    "email": email,
                    "bio": bio,
                    "profile_image_url": profile_image_url,
                    "description": description,    # ✅ mantém description
                    "updated_at": _now_iso(),
                }).eq("address", (address or "").lower().strip()).execute()

                if upd.data and len(upd.data):
                    return upd.data

                now_iso = _now_iso()
                ins = supabase.table("users").insert({
                    "address": (address or "").lower().strip(),
                    "username": username,
                    "email": email,
                    "bio": bio,
                    "profile_image_url": profile_image_url,
                    "description": description,
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }).execute()
                return ins.data
            except Exception as e2:
                logger.error(f"Falha no fallback do upsert/update de usuário: {e2}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Erro interno ao atualizar o perfil: {e2}")

        logger.error(f"Exceção ao fazer upsert do perfil: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno ao atualizar o perfil: {e}")

# ---------- Avatar helpers ----------
async def upload_file_to_supabase(file: UploadFile, user_address: str) -> str:
    """
    Sobe avatar em: avatars/<address>/<uuid>.<ext>
    Retorna URL pública (ou signed) conforme config do bucket.
    """
    _ensure_client()
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Arquivo vazio")

        ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "bin"
        key = f"avatars/{user_address}/{uuid.uuid4()}.{ext}"
        content_type = file.content_type or "application/octet-stream"

        storage_service.upload(content=content, content_type=content_type, key=key)
        url = storage_service.url_for(key, signed_seconds=int(timedelta(days=365).total_seconds()))
        return url
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no upload de avatar para {user_address}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao subir avatar.")
    finally:
        try:
            await file.close()
        except Exception:
            pass

def remove_user_avatar(address: str, current_url: Optional[str]) -> None:
    """
    Remove o arquivo do storage (se a URL pertencer ao bucket) e limpa profile_image_url.
    """
    _ensure_client()
    try:
        if current_url:
            key = storage_service.extract_key_from_url(current_url)
            if key:
                storage_service.delete_by_key(key)

        resp = supabase.table("users").update(
            {"profile_image_url": None, "updated_at": _now_iso()}
        ).eq("address", address.lower().strip()).execute()

        if hasattr(resp, "error") and resp.error:
            raise Exception(str(resp.error))
    except Exception as e:
        logger.error(f"Erro ao remover avatar do usuário {address}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao remover avatar.")

# =============================
# REPOSITORIES
# =============================
def create_repository(repo_data: dict) -> dict:
    logger.info(f"Criando novo repositório: {repo_data.get('name')}")
    _ensure_client()
    try:
        now_iso = _now_iso()
        repo_data.setdefault("created_at", now_iso)
        repo_data.setdefault("updated_at", now_iso)
        repo_data.setdefault("stars", 0)
        repo_data.setdefault("forks", 0)
        resp = supabase.table("repositories").insert(repo_data).execute()
        return resp.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar repositório: {e}")

def get_public_repositories() -> list[dict]:
    logger.info("Buscando todos os repositórios públicos.")
    _ensure_client()
    try:
        resp = supabase.table("repositories").select("*").eq("visibility", "public").execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar repositórios: {e}")

def get_user_repositories(user_address: str) -> list[dict]:
    logger.info(f"Buscando repositórios para o usuário: {user_address}")
    _ensure_client()
    try:
        resp = supabase.table("repositories").select("*").eq("owner_address", user_address).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar repositórios do usuário: {e}")

def get_repository_by_id(repo_id: str) -> dict | None:
    logger.info(f"Buscando repositório com ID: {repo_id}")
    _ensure_client()
    try:
        resp = supabase.table("repositories").select("*").eq("id", repo_id).single().execute()
        return resp.data
    except Exception:
        return None

def update_repository(repo_id: str, update_data: dict) -> dict:
    logger.info(f"Atualizando repositório com ID: {repo_id}")
    _ensure_client()
    try:
        update_data["updated_at"] = _now_iso()
        resp = supabase.table("repositories").update(update_data).eq("id", repo_id).execute()
        return resp.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar repositório: {e}")

def delete_repository(repo_id: str):
    logger.info(f"Deletando repositório com ID: {repo_id}")
    _ensure_client()
    try:
        supabase.table("repositories").delete().eq("id", repo_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar repositório: {e}")

def increment_column(repo_id: str, column_name: str) -> int:
    logger.info(f"Incrementando '{column_name}' para o repositório ID: {repo_id}")
    _ensure_client()
    try:
        resp = supabase.rpc("increment_counter", {"repo_id": repo_id, "column_name": column_name}).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao incrementar contador: {e}")

# =============================
# BLOCKS
# =============================
def create_block(block_data: dict) -> dict:
    _ensure_client()
    try:
        now_iso = _now_iso()
        block_data.setdefault("created_at", now_iso)
        block_data.setdefault("updated_at", now_iso)
        block_data.setdefault("status", "in_review")
        block_data.setdefault("content", {})
        resp = supabase.table("blocks").insert(block_data).execute()
        return resp.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar bloco: {e}")

def list_blocks_for_repo(repo_id: str) -> list[dict]:
    _ensure_client()
    try:
        resp = supabase.table("blocks").select("*").eq("repo_id", repo_id).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar blocos: {e}")

def get_block_by_id(block_id: str) -> dict | None:
    _ensure_client()
    try:
        resp = supabase.table("blocks").select("*").eq("id", block_id).single().execute()
        return resp.data
    except Exception:
        return None

def update_block(block_id: str, update_data: dict) -> dict:
    _ensure_client()
    try:
        update_data["updated_at"] = _now_iso()
        resp = supabase.table("blocks").update(update_data).eq("id", block_id).execute()
        return resp.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar bloco: {e}")

def delete_block(block_id: str):
    _ensure_client()
    try:
        supabase.table("blocks").delete().eq("id", block_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar bloco: {e}")

# =============================
# BLOCK ASSETS (Supabase Storage)
# =============================
async def upload_block_asset(file: UploadFile, block_id: str, user_address: str, kind: str | None) -> str:
    """
    Upload de asset no Storage e retorno de URL:
    - bucket público -> public URL
    - bucket privado -> Signed URL (1 ano)
    Caminho: blocks/<block_id>/<uuid>.<ext>
    """
    _ensure_client()
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Arquivo vazio")

        key = storage_service._key(block_id, file.filename or "file.bin", folder="blocks")
        content_type = file.content_type or "application/octet-stream"

        storage_service.upload(content=content, content_type=content_type, key=key)
        url = storage_service.url_for(key, signed_seconds=int(timedelta(days=365).total_seconds()))
        return url
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no upload do asset do bloco {block_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao subir arquivo do bloco.")
    finally:
        try:
            await file.close()
        except Exception:
            pass

async def delete_block_asset(asset_url: str) -> None:
    """
    Remove um arquivo do bucket a partir da URL (public ou signed).
    Suporta padrões:
      https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<key>
      https://<proj>.supabase.co/storage/v1/object/sign/<bucket>/<key>?token=...
      /storage/v1/object/sign/<bucket>/<key>?token=...
    """
    _ensure_client()
    try:
        key = storage_service.extract_key_from_url(asset_url)
        if not key:
            raise HTTPException(status_code=400, detail="URL inválida para remoção.")
        storage_service.delete_by_key(key)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar asset {asset_url}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao remover arquivo do bloco.")

# =============================
# AUDIT LOGS
# =============================
def create_audit_log_and_update_block(audit_data: dict) -> dict:
    logger.info(f"Salvando log de auditoria para o bloco: {audit_data.get('block_id')}")
    _ensure_client()
    try:
        block_id = str(audit_data.get("block_id"))
        new_status = audit_data.get("ai_status")

        upd = supabase.table("blocks").update({"status": new_status}).eq("id", block_id).execute()
        if not upd.data:
            raise HTTPException(status_code=404, detail=f"Bloco com ID {block_id} não encontrado para atualização.")

        ins = supabase.table("audit_logs").insert(audit_data).execute()
        return ins.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar log de auditoria: {e}")

def get_audit_logs_for_repo(repo_id: str) -> list[dict]:
    logger.info(f"Buscando logs de auditoria para o repositório: {repo_id}")
    _ensure_client()
    try:
        resp = supabase.table("audit_logs").select("*").eq("repo_id", repo_id).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar logs de auditoria: {e}")

# =============================
# STARS (favoritos)
# =============================
def star_repository(user_address: str, repo_id: str):
    logger.info(f"Utilizador {user_address} a favoritar o repo {repo_id}")
    _ensure_client()
    try:
        supabase.table("user_repository_stars").insert(
            {"user_address": user_address, "repo_id": repo_id}
        ).execute()
        increment_column(repo_id, "stars")
    except Exception as e:
        if "23505" in str(e):
            raise HTTPException(status_code=409, detail="Repositório já favoritado.")
        raise HTTPException(status_code=500, detail=f"Erro ao favoritar repositório: {e}")

def unstar_repository(user_address: str, repo_id: str):
    logger.info(f"Utilizador {user_address} a remover favorito do repo {repo_id}")
    _ensure_client()
    try:
        supabase.table("user_repository_stars").delete().match(
            {"user_address": user_address, "repo_id": repo_id}
        ).execute()
        supabase.rpc("decrement_counter", {"repo_id": repo_id, "column_name": "stars"}).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover favorito: {e}")

def get_starred_repositories_for_user(user_address: str) -> list[dict]:
    logger.info(f"Buscando repositórios favoritados por: {user_address}")
    _ensure_client()
    try:
        resp = supabase.rpc("get_starred_repos_by_address", {"p_user_address": user_address}).execute()
        return resp.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar repositórios favoritados: {e}")
