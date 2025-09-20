from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import List, Dict, Any
from uuid import UUID

from app.models.schema import BlockAuditResult, AuditLogOut
from app.services import supabase_service
from app.core.config import settings

router = APIRouter()

# --- Validação de Segurança do Webhook ---
async def verify_webhook_token(x_webhook_secret: str = Header(...)):
    """
    Uma camada simples de segurança para garantir que apenas o N8N/IA possa chamar nosso webhook.
    """
    if settings.WEBHOOK_SECRET is None:
        # Se a variável não estiver configurada, não validamos, mas alertamos.
        # Em produção, isso deveria lançar um erro.
        print("ALERTA: WEBHOOK_SECRET não configurado, o webhook está desprotegido.")
        return
    if x_webhook_secret != settings.WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Secret do webhook inválido.")

# --- Rotas ---

@router.post("/webhook/block-audit", response_model=AuditLogOut, dependencies=[Depends(verify_webhook_token)])
async def receive_block_audit_result(result: BlockAuditResult):
    """
    Endpoint para a IA (N8N) enviar o resultado da análise de um bloco.
    """
    audit_log = supabase_service.create_audit_log_and_update_block(result.dict())
    return audit_log

@router.get("/repos/{repo_id}/audits", response_model=List[AuditLogOut])
async def get_repository_audits(repo_id: UUID):
    """
    Busca todos os logs de auditoria de um repositório específico.
    """
    return supabase_service.get_audit_logs_for_repo(str(repo_id))

@router.post("/repos/{repo_id}/submit-final-review")
async def submit_repository_for_final_review(repo_id: UUID):
    """
    Coleta todos os resultados de auditoria e os envia para uma análise final da IA.
    (Esta é uma implementação de exemplo)
    """
    audit_logs = supabase_service.get_audit_logs_for_repo(str(repo_id))
    
    if not audit_logs:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nenhum bloco foi auditado ainda. Não é possível submeter para revisão final.")

    # Aqui, você enviaria `audit_logs` para um segundo webhook da IA
    # que faria a análise consolidada.
    # Ex: final_review = await ai_service.submit_repo_for_final_analysis(audit_logs)
    
    # Por enquanto, retornamos os logs coletados como confirmação.
    return {
        "message": "Repositório enviado para revisão final com sucesso.",
        "repo_id": repo_id,
        "audit_count": len(audit_logs),
        "audit_logs": audit_logs
    }
