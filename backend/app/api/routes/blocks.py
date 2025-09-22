# app/api/routes/blocks.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from typing import List, Dict, Any, Optional
from uuid import UUID

from app.models.schema import BlockCreate, BlockUpdate, BlockOut
from app.services import supabase_service, ai_services
# <-- MUDANÇA: Importa a função de cálculo de hash
from app.services.blockchain_service import calculate_repository_hash
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

    # 1. Cria o novo bloco
    new_block = supabase_service.create_block(block_data)
    
    # 2. <-- MUDANÇA: Recalcula e atualiza o hash do repositório pai
    repo_id = new_block['repo_id']
    repo_hash = calculate_repository_hash(repo_id)
    supabase_service.update_repository(repo_id, {"current_hash": repo_hash})

    # 3. Envia para a análise da IA em segundo plano
    background_tasks.add_task(ai_services.submit_block_for_analysis, BlockOut(**new_block))
    return new_block


@router.put("/{block_id}", response_model=BlockOut)
async def update_block(
    block_id: str,
    data: BlockUpdate,
    background_tasks: BackgroundTasks,
    user: Dict[str, Any] = Depends(get_current_user)
):
    block = supabase_service.get_block_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloco não encontrado")

    if block["owner_address"] != user["address"]:
        raise HTTPException(status_code=403, detail="Acesso negado: você não é o dono do bloco")

    # 1. Atualiza os dados do bloco
    update_data = data.dict(exclude_unset=True)
    updated_block = supabase_service.update_block(block_id, update_data)

    # 2. <-- MUDANÇA: Recalcula e atualiza o hash do repositório pai
    repo_id = updated_block['repo_id']
    repo_hash = calculate_repository_hash(repo_id)
    supabase_service.update_repository(repo_id, {"current_hash": repo_hash})
    
    # Opcional: Reenviar para análise da IA
    # background_tasks.add_task(ai_services.submit_block_for_analysis, BlockOut(**updated_block))
    
    return updated_block


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(
    block_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    block = supabase_service.get_block_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloco não encontrado")

    if block["owner_address"] != user["address"]:
        raise HTTPException(status_code=403, detail="Acesso negado: você não é o dono do bloco")

    # <-- MUDANÇA: Pega o ID do repositório ANTES de deletar o bloco
    repo_id = block['repo_id']

    # 1. Deleta o bloco
    supabase_service.delete_block(block_id)
    
    # 2. <-- MUDANÇA: Recalcula e atualiza o hash do repositório pai
    repo_hash = calculate_repository_hash(repo_id)
    supabase_service.update_repository(repo_id, {"current_hash": repo_hash})
    
    return None


# --- Rotas que não precisam de alteração ---

@router.get("/repo/{repo_id}", response_model=List[BlockOut])
async def list_blocks(repo_id: UUID):
    return supabase_service.list_blocks_for_repo(str(repo_id))


@router.get("/{block_id}", response_model=BlockOut)
async def get_block(block_id: str):
    block = supabase_service.get_block_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloco não encontrado")
    return block


@router.post("/{block_id}/assets", status_code=status.HTTP_201_CREATED)
async def upload_block_asset(
    block_id: str,
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
    # OBS: Se o upload de um asset deve mudar o hash, a lógica de atualização seria adicionada aqui.
    return {"url": public_url, "filename": file.filename, "mime": file.content_type, "kind": kind or "other"}


@router.delete("/{block_id}/assets", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block_asset(
    block_id: str,
    asset_url: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    block = supabase_service.get_block_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Bloco não encontrado")

    if block["owner_address"] != user["address"]:
        raise HTTPException(status_code=403, detail="Acesso negado: você não é o dono do bloco")

    await supabase_service.delete_block_asset(asset_url)
    # OBS: Se a remoção de um asset deve mudar o hash, a lógica de atualização seria adicionada aqui.
    return None