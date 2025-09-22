from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from app.models.schema import RepositoryCreate, RepositoryUpdate, RepositoryOut
from app.services import supabase_service
# <-- MUDANÇA: Importa a função que calcula o hash
from app.services.blockchain_service import calculate_repository_hash
from app.api.routes.auth import get_current_user

router = APIRouter()

# --- CRUD básico ---

@router.post("/", response_model=RepositoryOut, status_code=status.HTTP_201_CREATED)
async def create_repo(data: RepositoryCreate, user: Dict[str, Any] = Depends(get_current_user)):
    """Cria um novo repositório no Supabase e calcula seu hash inicial."""
    user_address = user["address"]
    user_profile = supabase_service.get_user_profile_by_address(user_address)
    username = user_profile.get('username') if user_profile else "Owner"

    repo_data = data.dict()
    repo_data['owner_address'] = user_address
    repo_data['collaborators'] = [{
        "address": user_address, "username": username, "role": "owner"
    }]
    
    # 1. Cria o repositório no banco de dados
    new_repo = supabase_service.create_repository(repo_data)
    repo_id = new_repo["id"]

    # 2. <-- MUDANÇA: Calcula o hash do repositório recém-criado (que ainda não tem blocos)
    repo_hash = calculate_repository_hash(repo_id)

    # 3. <-- MUDANÇA: Salva o hash no novo campo 'current_hash' e retorna o repo atualizado
    updated_repo = supabase_service.update_repository(repo_id, {"current_hash": repo_hash})
    return updated_repo


@router.put("/{repo_id}", response_model=RepositoryOut)
async def update_repo(repo_id: str, data: RepositoryUpdate, user: Dict[str, Any] = Depends(get_current_user)):
    """Atualiza os dados de um repositório e recalcula seu hash."""
    repo = supabase_service.get_repository_by_id(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repositório não encontrado")

    if repo["owner_address"] != user["address"]:
        raise HTTPException(status_code=403, detail="Acesso negado: você não é o dono do repositório")

    # 1. Atualiza os dados do repositório (nome, descrição, etc.)
    update_data = data.dict(exclude_unset=True)
    supabase_service.update_repository(repo_id, update_data)

    # 2. <-- MUDANÇA: Recalcula o hash APÓS a atualização dos dados
    repo_hash = calculate_repository_hash(repo_id)

    # 3. <-- MUDANÇA: Salva o novo hash e retorna o estado final do repositório
    updated_repo_with_hash = supabase_service.update_repository(repo_id, {"current_hash": repo_hash})
    return updated_repo_with_hash


# --- O RESTANTE DO ARQUIVO PERMANECE IGUAL ---

@router.get("/", response_model=List[RepositoryOut])
async def list_repos():
    """Lista todos os repositórios públicos do Supabase."""
    return supabase_service.get_public_repositories()


@router.get("/mine", response_model=List[RepositoryOut])
async def list_my_repos(user: Dict[str, Any] = Depends(get_current_user)):
    """Lista todos os repositórios do usuário logado."""
    return supabase_service.get_user_repositories(user["address"])


@router.get("/starred", response_model=List[RepositoryOut])
async def get_my_starred_repos(user: Dict[str, Any] = Depends(get_current_user)):
    """Busca todos os repositórios favoritados pelo utilizador logado."""
    return supabase_service.get_starred_repositories_for_user(user["address"])


@router.post("/{repo_id}/star", status_code=status.HTTP_204_NO_CONTENT)
async def star_a_repository(repo_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Adiciona um repositório aos favoritos do utilizador logado."""
    repo = supabase_service.get_repository_by_id(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repositório não encontrado")
    
    supabase_service.star_repository(user["address"], repo_id)
    return None


@router.delete("/{repo_id}/star", status_code=status.HTTP_204_NO_CONTENT)
async def unstar_a_repository(repo_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Remove um repositório dos favoritos do utilizador logado."""
    repo = supabase_service.get_repository_by_id(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repositório não encontrado")

    supabase_service.unstar_repository(user["address"], repo_id)
    return None


@router.post("/{repo_id}/fork", response_model=RepositoryOut, status_code=status.HTTP_201_CREATED)
async def fork_repo(repo_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Cria um fork de um repositório para o utilizador logado."""
    original_repo = supabase_service.get_repository_by_id(repo_id)
    if not original_repo:
        raise HTTPException(status_code=404, detail="Repositório não encontrado")

    user_address = user["address"]
    user_profile = supabase_service.get_user_profile_by_address(user_address)
    username = user_profile.get('username') if user_profile else "Owner"

    fork_data = {
        "name": original_repo['name'],
        "description": original_repo['description'],
        "visibility": original_repo['visibility'],
        "owner_address": user_address,
        "collaborators": [{
            "address": user_address, "username": username, "role": "owner"
        }]
    }
    
    new_fork = supabase_service.create_repository(fork_data)
    supabase_service.increment_column(repo_id, 'forks')
    return new_fork


@router.get("/{repo_id}", response_model=RepositoryOut)
async def get_repo(repo_id: str):
    """Busca um repositório pelo seu ID."""
    repo = supabase_service.get_repository_by_id(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repositório não encontrado")
    return repo


@router.delete("/{repo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_repo(repo_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    """Deleta um repositório."""
    repo = supabase_service.get_repository_by_id(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repositório não encontrado")

    if repo["owner_address"] != user["address"]:
        raise HTTPException(status_code=403, detail="Acesso negado: você não é o dono do repositório")
    
    supabase_service.delete_repository(repo_id)
    return None