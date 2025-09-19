from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time, uuid

from app.api.routes.auth import get_me  # mock de auth, depois trocamos por Depends(get_current_user)

router = APIRouter(prefix="/blocks", tags=["Blocks"])

# Mock DB em memória (no futuro → Supabase)
blocks_db: Dict[str, Dict[str, Any]] = {}  # {block_id: block_data}


# ================== MODELS ==================
class BlockBase(BaseModel):
    repo_id: str
    type: str  # "text" | "image" | "video" | "audio" | "reference"
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = {}
    status: str = "in_review"  # sempre nasce assim

class BlockCreate(BlockBase):
    pass

class BlockUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None

class BlockOut(BlockBase):
    id: str
    owner: str
    created_at: float
    updated_at: float


# ================== ROTAS ==================
@router.post("/", response_model=BlockOut)
async def create_block(data: BlockCreate, user=Depends(get_me)):
    """
    Cria um novo proof block dentro de um repositório.
    """
    block_id = str(uuid.uuid4())
    block = {
        "id": block_id,
        "repo_id": data.repo_id,
        "type": data.type,
        "title": data.title,
        "description": data.description,
        "content": data.content,
        "status": "in_review",  # sempre nasce em revisão
        "owner": user["address"],
        "created_at": time.time(),
        "updated_at": time.time(),
    }
    blocks_db[block_id] = block
    return block


@router.get("/repo/{repo_id}", response_model=List[BlockOut])
async def list_blocks(repo_id: str):
    """
    Lista todos os blocks de um repositório.
    """
    return [b for b in blocks_db.values() if b["repo_id"] == repo_id]


@router.get("/{block_id}", response_model=BlockOut)
async def get_block(block_id: str):
    """
    Retorna os detalhes de um block.
    """
    block = blocks_db.get(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    return block


@router.put("/{block_id}", response_model=BlockOut)
async def update_block(block_id: str, data: BlockUpdate, user=Depends(get_me)):
    """
    Atualiza título, descrição ou conteúdo de um block.
    O status não pode ser alterado manualmente.
    """
    block = blocks_db.get(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    if block["owner"] != user["address"]:
        raise HTTPException(status_code=403, detail="Not your block")

    updates = data.dict(exclude_unset=True)
    block.update({**updates, "updated_at": time.time()})
    blocks_db[block_id] = block
    return block


@router.delete("/{block_id}")
async def delete_block(block_id: str, user=Depends(get_me)):
    """
    Remove um block do repositório.
    """
    block = blocks_db.get(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    if block["owner"] != user["address"]:
        raise HTTPException(status_code=403, detail="Not your block")

    del blocks_db[block_id]
    return {"detail": "Block deleted"}
