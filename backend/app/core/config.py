from pydantic_settings import BaseSettings

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
    supabase_db_url: str  # Deve corresponder à variável supabase_db_url no .env

    # Database
    database_url: str

    # CORS
    cors_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()
print(settings.dict())
