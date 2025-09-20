from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # FastAPI Config
    app_name: str = "Infinita Science Hub"
    app_env: str = "development"
    app_port: int = 8000
    app_host: str = "0.0.0.0"

    # JWT / Auth
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_seconds: int = 3600

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_storage_bucket: str
    supabase_db_url: str

    # Database
    database_url: str

    # CORS
    cors_origins: list[str] = ["*"]

    # --- NOVAS CONFIGURAÇÕES PARA INTEGRAÇÃO DA IA ---

    # URL do webhook no N8N que recebe os dados do bloco para análise.
    # Se não for definida, o envio para a IA será pulado.
    N8N_BLOCK_ANALYSIS_URL: Optional[str] = None

    # Um segredo compartilhado entre nossa API e a IA (N8N) para proteger o webhook.
    # A IA deve enviar este segredo no header 'x-webhook-secret'.
    WEBHOOK_SECRET: Optional[str] = None

    class Config:
        # Pede para o Pydantic carregar as variáveis de um arquivo .env
        env_file = ".env"

# Cria uma instância única das configurações para ser usada em toda a aplicação
settings = Settings()