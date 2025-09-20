# app/api/routes/blocks.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from typing import List, Dict, Any, Optional
from uuid import UUID

from app.models.schema import BlockCreate, BlockUpdate, BlockOut
from app.services import supabase_service, ai_services
from app.api.routes.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=BlockOut, status_code=status.HTTP_201_CREATED)
async def create_block(
    data: BlockCreate,
    background_tasks: BackgroundTasks,
    user: Dict[str, Any] = Depends(get_current_user)
):
    repo = supabase_service.get_repository_by_id(str(data.repo_id))
    if not repo:
        raise HTTPException(status_code=404, detail="Repositório não encontrado.")

    block_data = data.dict()
    block_data['owner_address'] = user["address"]
    block_data['repo_id'] = str(block_data['repo_id'])

    new_block = supabase_service.create_block(block_data)
    background_tasks.add_task(ai_services.submit_block_for_analysis, BlockOut(**new_block))
    return new_block

@router.get("/repo/{repo_id}", response_model=List[BlockOut])
async def list_blocks(repo_id: UUID):
    return supabase_service.list_blocks_for_repo(str(repo_id))

@router.get("/{block_id}", response_model=BlockOut)
async def get_block(block_id: str):  # <<<< trocado para str
    block = supabase_service.get_block_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloco não encontrado")
    return block

@router.put("/{block_id}", response_model=BlockOut)
async def update_block(
    block_id: str,  # <<<< trocado para str
    data: BlockUpdate,
    background_tasks: BackgroundTasks,
    user: Dict[str, Any] = Depends(get_current_user)
):
    block = supabase_service.get_block_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloco não encontrado")

    if block["owner_address"] != user["address"]:
        raise HTTPException(status_code=403, detail="Acesso negado: você não é o dono do bloco")

    update_data = data.dict(exclude_unset=True)
    updated_block = supabase_service.update_block(block_id, update_data)
    return updated_block

@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(block_id: str,  # <<<< trocado para str
                       user: Dict[str, Any] = Depends(get_current_user)):
    block = supabase_service.get_block_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloco não encontrado")

    if block["owner_address"] != user["address"]:
        raise HTTPException(status_code=403, detail="Acesso negado: você não é o dono do bloco")

    supabase_service.delete_block(block_id)
    return None

# --- Upload bruto de arquivo (se você adicionou essa rota, ajuste o tipo também) ---

@router.post("/{block_id}/assets", status_code=status.HTTP_201_CREATED)
async def upload_block_asset(
    block_id: str,  # <<<< trocado para str
    file: UploadFile = File(...),
    kind: Optional[str] = Form(None),
    user: Dict[str, Any] = Depends(get_current_user)
):
    block = supabase_service.get_block_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloco não encontrado")

    if block["owner_address"] != user["address"]:
        raise HTTPException(status_code=403, detail="Acesso negado: você não é o dono do bloco")

    public_url = await supabase_service.upload_block_asset(
        file=file, block_id=block_id, user_address=user["address"], kind=kind
    )
    return {"url": public_url, "filename": file.filename, "mime": file.content_type, "kind": kind or "other"}

@router.delete("/{block_id}/assets", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block_asset(
    block_id: str,  # <<<< trocado para str
    asset_url: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    block = supabase_service.get_block_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloco não encontrado")

    if block["owner_address"] != user["address"]:
        raise HTTPException(status_code=403, detail="Acesso negado: você não é o dono do bloco")

    await supabase_service.delete_block_asset(asset_url)
    return None
