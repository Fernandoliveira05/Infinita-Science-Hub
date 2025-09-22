from pydantic_settings import BaseSettings
from typing import Optional, List

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
    cors_origins: List[str] = ["*"] # Usando List[str] para consistência de importação

    # --- NOVAS CONFIGURAÇÕES PARA INTEGRAÇÃO DA IA ---
    N8N_BLOCK_ANALYSIS_URL: Optional[str] = None
    WEBHOOK_SECRET: Optional[str] = None

    # --- CAMPOS QUE ESTAVAM FALTANDO ---
    # Adicionados para o frontend
    VITE_SUPABASE_URL: str
    VITE_SUPABASE_BUCKET: str

    # Adicionados para a integração com Blockchain
    SERVER_PRIVATE_KEY: str
    ETHEREUM_NODE_URL: str
    CONTRACT_ADDRESS: str


    class Config:
        # Pede para o Pydantic carregar as variáveis de um arquivo .env
        env_file = ".env"
        # Boa prática: garante que 'MY_VAR' no .env corresponda a 'my_var' no Pydantic
        case_sensitive = False

# Cria uma instância única das configurações para ser usada em toda a aplicação
settings = Settings()