from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Dict, Any

# 1. IMPORTA os modelos corretos do seu arquivo central de schemas
from app.models.schema import UserProfile, UpdateUserProfile
from app.services import supabase_service
from app.api.routes.auth import get_me

router = APIRouter()

# 2. As definições de modelo locais foram REMOVIDAS daqui


@router.get("/me", response_model=UserProfile)
async def get_my_profile(user: Dict[str, Any] = Depends(get_me)):
    """Retorna o perfil do usuário logado, buscando no Supabase."""
    address = user["address"]
    db_user = supabase_service.get_user_profile_by_address(address)
    if not db_user:
        return supabase_service.create_initial_user_profile(address)
    return db_user

@router.put("/me", response_model=UserProfile)
async def update_my_profile(data: UpdateUserProfile, user: Dict[str, Any] = Depends(get_me)): # 3. Usa o modelo de update CORRETO
    """Atualiza o perfil do usuário no Supabase."""
    address = user["address"]
    current_profile = supabase_service.get_user_profile_by_address(address)
    if not current_profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado, não é possível atualizar.")

    # 4. A chamada de função agora usa os nomes de campo CORRETOS
    updated_profile = supabase_service.insert_or_update_user_profile(
        address=address,
        username=data.username if data.username is not None else current_profile.get('username'),
        email=data.email if data.email is not None else current_profile.get('email'),
        bio=data.bio if data.bio is not None else current_profile.get('bio'),
        profile_image_url=current_profile.get('profile_image_url') # Mantém a imagem atual
    )
    return updated_profile[0]

@router.post("/me/avatar", response_model=UserProfile)
async def upload_avatar(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_me)):
    """Faz upload do avatar e atualiza a URL no perfil do usuário."""
    address = user["address"]
    current_profile = supabase_service.get_user_profile_by_address(address)
    if not current_profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado, não é possível fazer upload.")

    public_url = await supabase_service.upload_file_to_supabase(file=file, user_address=address)
    
    # 5. A chamada de função aqui também foi CORRIGIDA
    updated_profile = supabase_service.insert_or_update_user_profile(
        address=address,
        username=current_profile.get('username'),
        email=current_profile.get('email'),
        bio=current_profile.get('bio'),
        profile_image_url=public_url # Define a nova URL
    )
    return updated_profile[0]

@router.get("/{address}", response_model=UserProfile)
async def get_user_profile(address: str):
    """Consulta o perfil público de outro usuário no Supabase."""
    db_user = supabase_service.get_user_profile_by_address(address)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return db_user