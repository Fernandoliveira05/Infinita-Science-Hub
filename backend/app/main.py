import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import audits, auth, blocks, repos, users
from app.core.config import settings
from app.utils.logger import get_logger
logger = get_logger()


def create_app() -> FastAPI:
    """
    Cria e configura a aplicação FastAPI.
    """
    app = FastAPI(
        title="Infinita Science Hub API",
        description="Backend for the Infinita Science Hub platform",
        version="1.0.0",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rotas
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(users.router, prefix="/api/users", tags=["Users"])
    app.include_router(repos.router, prefix="/api/repos", tags=["Repositories"])
    app.include_router(blocks.router, prefix="/api/blocks", tags=["Blocks"])
    app.include_router(audits.router, prefix="/api/audits", tags=["Audits"]) 

    @app.get("/health")
    async def health_check():
        """
        Endpoint de saúde para monitoramento.
        """
        logger.info("Health check accessed")
        return {"status": "ok", "service": "Infinita Science Hub API"}

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
    )
