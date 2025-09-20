import uuid
import logging
from supabase import create_client, Client
from app.core.config import settings
from fastapi import HTTPException, UploadFile
from datetime import datetime, timezone

# --- Configuração do Logger ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# --- Inicialização do Cliente Supabase ---
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

# --- Funções de Serviço ---

def get_user_profile_by_address(address: str) -> dict | None:
    """Busca um perfil de usuário pelo endereço no Supabase."""
    logger.info(f"Buscando perfil para o endereço: {address}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        response = supabase.table('users').select('*').eq('address', address).single().execute()
        return response.data if response.data else None
    except Exception:
        # A biblioteca pode lançar um erro se .single() não encontrar nada.
        return None

def create_initial_user_profile(address: str) -> dict:
    """Cria um registro de perfil inicial para um novo usuário."""
    logger.info(f"Criando perfil inicial para o novo endereço: {address}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        user_data = {"address": address, "created_at": now_iso, "updated_at": now_iso}
        response = supabase.table('users').insert(user_data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Erro ao criar perfil inicial para {address}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Não foi possível criar o perfil inicial do usuário.")

async def upload_file_to_supabase(file: UploadFile, user_address: str) -> str:
    """Faz o upload de um arquivo para o Supabase Storage."""
    logger.info(f"Iniciando upload de arquivo para o usuário: {user_address}, arquivo: {file.filename}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de armazenamento indisponível.")
    try:
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        # O caminho agora usa 'profile_images' para consistência
        unique_filename = f"profile_images/{user_address}/{uuid.uuid4()}.{file_extension}"
        file_content = await file.read()
        if not file_content:
            raise HTTPException(status_code=400, detail="Arquivo vazio")
        
        supabase.storage.from_(settings.supabase_storage_bucket).upload(
            path=unique_filename,
            file=file_content,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        public_url = supabase.storage.from_(settings.supabase_storage_bucket).get_public_url(unique_filename)
        return public_url
    except Exception as e:
        logger.error(f"Exceção durante o upload: {e}", exc_info=True)
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
    """
    Insere ou atualiza o perfil de um usuário usando os nomes de coluna corretos.
    """
    logger.info(f"Iniciando 'upsert' de perfil para o endereço: {address}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        # Dicionário de dados alinhado com a tabela real no Supabase
        user_data = {
            "address": address,
            "username": username,
            "email": email,
            "bio": bio,
            "profile_image_url": profile_image_url,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        logger.info(f"Dados do perfil a serem salvos: {user_data}")
        response = supabase.table('users').upsert(user_data).execute()
        if hasattr(response, 'error') and response.error:
            # Lança o erro específico do Supabase para facilitar a depuração
            raise Exception(str(response.error))
        return response.data
    except Exception as e:
        logger.error(f"Exceção ao fazer upsert do perfil: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno ao atualizar o perfil: {e}")

# --- Funções de Serviço para Repositórios (Adicionadas) ---

def create_repository(repo_data: dict) -> dict:
    """Cria um novo repositório no banco de dados."""
    logger.info(f"Criando novo repositório: {repo_data.get('name')}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        response = supabase.table('repositories').insert(repo_data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar repositório: {e}")

def get_public_repositories() -> list[dict]:
    """Lista todos os repositórios públicos."""
    logger.info("Buscando todos os repositórios públicos.")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        response = supabase.table('repositories').select('*').eq('visibility', 'public').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar repositórios: {e}")

def get_user_repositories(user_address: str) -> list[dict]:
    """Lista os repositórios de um usuário específico."""
    logger.info(f"Buscando repositórios para o usuário: {user_address}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        response = supabase.table('repositories').select('*').eq('owner_address', user_address).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar repositórios do usuário: {e}")

def get_repository_by_id(repo_id: str) -> dict | None:
    """Busca um único repositório pelo seu ID."""
    logger.info(f"Buscando repositório com ID: {repo_id}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        response = supabase.table('repositories').select('*').eq('id', repo_id).single().execute()
        return response.data
    except Exception:
        return None

def update_repository(repo_id: str, update_data: dict) -> dict:
    """Atualiza os dados de um repositório."""
    logger.info(f"Atualizando repositório com ID: {repo_id}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        response = supabase.table('repositories').update(update_data).eq('id', repo_id).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar repositório: {e}")

def delete_repository(repo_id: str):
    """Deleta um repositório."""
    logger.info(f"Deletando repositório com ID: {repo_id}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        supabase.table('repositories').delete().eq('id', repo_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar repositório: {e}")

def increment_column(repo_id: str, column_name: str) -> int:
    """Incrementa um contador (stars, forks) de forma segura usando uma função do DB."""
    logger.info(f"Incrementando '{column_name}' para o repositório ID: {repo_id}")
    if supabase is None:
        raise HTTPException(status_code=503, detail="Serviço de banco de dados indisponível.")
    try:
        response = supabase.rpc('increment_counter', {'repo_id': repo_id, 'column_name': column_name}).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao incrementar contador: {e}")

