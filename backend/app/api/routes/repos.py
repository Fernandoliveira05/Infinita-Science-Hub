from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time, uuid

from app.api.routes.auth import get_me

router = APIRouter(prefix="/repos", tags=["Repositories"])

# Mock DB em memória (no futuro → Supabase)
repos_db: Dict[str, Dict[str, Any]] = {}


# ================== MODELS ==================
class Collaborator(BaseModel):
    id: str
    name: str
    role: str = "contributor"  # owner | maintainer | contributor | viewer


class RepoBase(BaseModel):
    name: str
    description: Optional[str] = None
    visibility: str = "public"  # public | private


class RepoCreate(RepoBase):
    pass


class RepoUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None


class RepoOut(RepoBase):
    id: str
    owner: str
    stars: int
    forks: int
    donations: float
    collaborators: List[Collaborator]
    created_at: float
    updated_at: float


# ================== ROTAS ==================
@router.post("/", response_model=RepoOut)
async def create_repo(data: RepoCreate, user=Depends(get_me)):
    repo_id = str(uuid.uuid4())
    repo = {
        "id": repo_id,
        "name": data.name,
        "description": data.description,
        "visibility": data.visibility,
        "owner": user["address"],
        "stars": 0,
        "forks": 0,
        "donations": 0.0,
        "collaborators": [
            {"id": user["address"], "name": "Owner", "role": "owner"}
        ],
        "created_at": time.time(),
        "updated_at": time.time(),
    }
    repos_db[repo_id] = repo
    return repo


@router.get("/", response_model=List[RepoOut])
async def list_repos():
    """Lista todos os repositórios públicos."""
    return [r for r in repos_db.values() if r["visibility"] == "public"]


@router.get("/mine", response_model=List[RepoOut])
async def list_my_repos(user=Depends(get_me)):
    """Lista todos os repositórios do usuário logado."""
    return [r for r in repos_db.values() if r["owner"] == user["address"]]


@router.get("/{repo_id}", response_model=RepoOut)
async def get_repo(repo_id: str):
    repo = repos_db.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo


@router.put("/{repo_id}", response_model=RepoOut)
async def update_repo(repo_id: str, data: RepoUpdate, user=Depends(get_me)):
    repo = repos_db.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    if repo["owner"] != user["address"]:
        raise HTTPException(status_code=403, detail="Not your repository")

    updates = data.dict(exclude_unset=True)
    repo.update({**updates, "updated_at": time.time()})
    repos_db[repo_id] = repo
    return repo


@router.delete("/{repo_id}")
async def delete_repo(repo_id: str, user=Depends(get_me)):
    repo = repos_db.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    if repo["owner"] != user["address"]:
        raise HTTPException(status_code=403, detail="Not your repository")

    del repos_db[repo_id]
    return {"detail": "Repository deleted"}


# ================== FUNÇÕES EXTRAS ==================
@router.post("/{repo_id}/star")
async def toggle_star(repo_id: str, user=Depends(get_me)):
    repo = repos_db.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    # no mock: apenas soma 1 sempre
    repo["stars"] += 1
    return {"stars": repo["stars"]}


@router.post("/{repo_id}/fork")
async def fork_repo(repo_id: str, user=Depends(get_me)):
    repo = repos_db.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    fork_id = str(uuid.uuid4())
    fork = repo.copy()
    fork.update({
        "id": fork_id,
        "owner": user["address"],
        "stars": 0,
        "forks": 0,
        "donations": 0.0,
        "collaborators": [
            {"id": user["address"], "name": "Owner", "role": "owner"}
        ],
        "created_at": time.time(),
        "updated_at": time.time(),
    })
    repos_db[fork_id] = fork
    repo["forks"] += 1
    return fork
