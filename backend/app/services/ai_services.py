import httpx
import logging
from app.core.config import settings
from app.models.schema import BlockOut

logger = logging.getLogger(__name__)

# URL do webhook N8N para análise de blocos (deve estar nas suas configurações)
N8N_BLOCK_ANALYSIS_URL = settings.N8N_BLOCK_ANALYSIS_URL 

async def submit_block_for_analysis(block: BlockOut):
    """
    Envia os dados de um bloco para a IA de forma assíncrona.
    """
    if not N8N_BLOCK_ANALYSIS_URL:
        logger.warning("A URL para análise de IA (N8N_BLOCK_ANALYSIS_URL) não está configurada. Análise pulada.")
        return

    # Monta o payload com os dados relevantes para a IA
    payload = {
        "block_id": str(block.id),
        "repo_id": str(block.repo_id),
        "description": block.description,
        "content": block.content, # Contém o arquivo bruto ou texto
        "type": block.type
    }

    logger.info(f"Enviando bloco {block.id} para análise de IA.")
    
    try:
        # Usamos httpx para fazer uma chamada de rede assíncrona sem bloquear a aplicação
        async with httpx.AsyncClient() as client:
            response = await client.post(N8N_BLOCK_ANALYSIS_URL, json=payload, timeout=30.0)
            response.raise_for_status() # Lança um erro se a resposta for 4xx ou 5xx
        logger.info(f"Bloco {block.id} enviado com sucesso para análise. Status: {response.status_code}")
    except httpx.RequestError as e:
        logger.error(f"Erro ao enviar bloco {block.id} para análise de IA: {e}")
