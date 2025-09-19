from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Importa as funções que interagem com o Supabase
from app.services import supabase_service
from app.api.routes.auth import get_me

router = APIRouter()

# ================== MODELS ==================
class UserProfile(BaseModel):
    address: str
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None


# ================== ROTAS ==================
@router.get("/me", response_model=UserProfile)
async def get_my_profile(user: Dict[str, Any] = Depends(get_me)):
    """Retorna o perfil do usuário logado, buscando no Supabase."""
    address = user["address"]
    db_user = supabase_service.get_user_profile_by_address(address)
    
    if not db_user:
        return supabase_service.create_initial_user_profile(address)
        
    return db_user


@router.put("/me", response_model=UserProfile)
async def update_my_profile(data: UserUpdate, user: Dict[str, Any] = Depends(get_me)):
    """Atualiza nome ou bio do usuário no Supabase."""
    address = user["address"]
    
    current_profile = supabase_service.get_user_profile_by_address(address)
    if not current_profile:
        raise HTTPException(status_code=404, detail="User profile not found, cannot update.")

    # CORREÇÃO: Usar .get() para acessar as chaves de forma segura.
    # Se a chave não existir no dicionário, .get() retorna None, evitando o KeyError.
    name_to_update = data.username if data.username is not None else current_profile.get('username')
    bio_to_update = data.bio if data.bio is not None else current_profile.get('bio')
    
    updated_profile = supabase_service.insert_or_update_user_profile(
        address=address,
        name=name_to_update,
        bio=bio_to_update,
        avatar_url=current_profile.get('avatar_url')  # Mantém o avatar_url existente
    )
    return updated_profile[0]


@router.post("/me/avatar", response_model=UserProfile)
async def upload_avatar(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_me)):
    """Faz upload do avatar para o Supabase Storage e atualiza a URL no perfil do usuário."""
    address = user["address"]

    current_profile = supabase_service.get_user_profile_by_address(address)
    if not current_profile:
        raise HTTPException(status_code=404, detail="User profile not found, cannot upload avatar.")

    public_url = await supabase_service.upload_file_to_supabase(file=file, user_address=address)
    
    updated_profile = supabase_service.insert_or_update_user_profile(
        address=address,
        name=current_profile.get('name'),
        bio=current_profile.get('bio'),
        avatar_url=public_url
    )
    return updated_profile[0]


@router.get("/{address}", response_model=UserProfile)
async def get_user_profile(address: str):
    """Consulta o perfil público de outro usuário no Supabase."""
    db_user = supabase_service.get_user_profile_by_address(address)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

