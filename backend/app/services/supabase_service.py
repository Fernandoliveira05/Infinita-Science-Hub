import uuid
import logging
from supabase import create_client, Client
from app.core.config import settings
from fastapi import HTTPException, UploadFile
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

supabase: Client | None = None
logger.info("Iniciando o módulo de serviço do Supabase...")
try:
    supabase_url = settings.supabase_url
    supabase_key = settings.supabase_service_role_key
    if not supabase_url or not supabase_key:
        raise ValueError("Credenciais do Supabase não configuradas.")
    logger.info(f"Tentando se conectar à URL do Supabase...")
    supabase = create_client(supabase_url, supabase_key)
    logger.info("✅ Conexão com o Supabase estabelecida com sucesso!")
except Exception as e:
    logger.critical(f"❌ FALHA CRÍTICA ao conectar com o Supabase: {e}")

def get_user_profile_by_address(address: str) -> dict | None:
    """Busca um perfil de usuário pelo endereço no Supabase."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        response = supabase.table('users').select('*').eq('address', address).single().execute()
        return response.data if response.data else None
    except Exception:
        return None

def create_initial_user_profile(address: str) -> dict:
    """Cria um registro de perfil inicial para um novo usuário."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        user_data = {"address": address, "created_at": now_iso, "updated_at": now_iso}
        response = supabase.table('users').insert(user_data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Não foi possível criar o perfil: {e}")

async def upload_file_to_supabase(file: UploadFile, user_address: str) -> str:
    """Faz o upload de um arquivo para o Supabase Storage."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de armazenamento indisponível.")
    try:
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"profile_images/{user_address}/{uuid.uuid4()}.{file_extension}"
        file_content = await file.read()
        if not file_content:
            raise HTTPException(status_code=400, detail="Arquivo vazio")
        
        supabase.storage.from_(settings.supabase_storage_bucket).upload(
            path=unique_filename,
            file=file_content,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        return supabase.storage.from_(settings.supabase_storage_bucket).get_public_url(unique_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno no upload: {e}")
    finally:
        if file:
            await file.close()

def insert_or_update_user_profile(
    address: str, 
    username: str | None, 
    email: str | None,
    bio: str | None, 
    profile_image_url: str | None
) -> list[dict]:
    """Insere ou atualiza o perfil de um usuário usando os nomes de coluna corretos."""
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        user_data = {
            "address": address,
            "username": username,
            "email": email,
            "bio": bio,
            "profile_image_url": profile_image_url,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # AQUI ESTÁ A CORREÇÃO: on_conflict="address"
        # Isso diz ao Supabase: "Se um registro com este 'address' já existir, ATUALIZE-O.
        # Senão, insira um novo."
        response = supabase.table('users').upsert(user_data, on_conflict="address").execute()
        
        if hasattr(response, 'error') and response.error:
            raise Exception(str(response.error))
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao atualizar o perfil: {e}")