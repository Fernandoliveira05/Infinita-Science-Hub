from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import httpx

from app.core.config import settings

router = APIRouter(prefix="/audits", tags=["Audits"])



@router.post("/analyze-block")
async def analyze_block(
    block_id: str = Form(...),
    block_type: str = Form(..., description="text, image, video, audio, reference"),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Envia o bloco (conteúdo + metadados) para o n8n realizar auditoria.
    O n8n devolve status (`in_review`, `validated`, `error`) e descrição gerada pela IA.
    """

    payload = {
        "block_id": block_id,
        "block_type": block_type,
        "title": title,
        "description": description,
    }

    files = None
    if file:
        files = {"file": (file.filename, await file.read(), file.content_type)}

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.n8n_base_url}{settings.n8n_workflow_analyze_block}",
                data=payload,
                files=files,
                headers={
                    "Authorization": f"Bearer {settings.n8n_api_key}"
                } if settings.n8n_api_key else None,
            )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="n8n analysis failed")

        result = response.json()

        # Exemplo esperado do n8n:
        # {
        #   "status": "validated",
        #   "ai_description": "This block contains an image of the experiment setup...",
        #   "confidence": 0.92
        # }

        return JSONResponse(
            content={
                "block_id": block_id,
                "status": result.get("status", "in_review"),
                "ai_description": result.get("ai_description", ""),
                "confidence": result.get("confidence"),
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(e)}")
