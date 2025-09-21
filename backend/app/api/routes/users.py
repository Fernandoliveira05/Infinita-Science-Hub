# app/api/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import Dict, Any

from app.models.schema import UserProfile, UpdateUserProfile
from app.services import supabase_service
from app.api.routes.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_my_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """
    Retorna o perfil do usuário autenticado.
    """
    return user


@router.put("/me", response_model=UserProfile)
async def update_my_profile(
    data: UpdateUserProfile,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Atualiza campos do perfil do usuário autenticado.
    Aceita: username, email, bio, description.
    """
    address = user["address"]
    current_profile = user

    updated_profile = supabase_service.insert_or_update_user_profile(
        address=address,
        username=data.username if data.username is not None else current_profile.get("username"),
        email=data.email if data.email is not None else current_profile.get("email"),
        bio=data.bio if data.bio is not None else current_profile.get("bio"),
        description=data.description if getattr(data, "description", None) is not None else current_profile.get("description"),
        profile_image_url=current_profile.get("profile_image_url"),
    )
    if not updated_profile:
        raise HTTPException(status_code=500, detail="Falha ao atualizar o perfil.")
    return updated_profile[0]


@router.post("/me/avatar", response_model=UserProfile)
async def upload_avatar(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Faz upload do avatar e salva a URL no perfil.
    """
    address = user["address"]
    current_profile = user

    # sobe o arquivo e obtém URL (pública ou assinada)
    public_url = await supabase_service.upload_file_to_supabase(
        file=file, user_address=address
    )

    updated_profile = supabase_service.insert_or_update_user_profile(
        address=address,
        username=current_profile.get("username"),
        email=current_profile.get("email"),
        bio=current_profile.get("bio"),
        description=current_profile.get("description"),
        profile_image_url=public_url,
    )
    if not updated_profile:
        raise HTTPException(status_code=500, detail="Falha ao atualizar o avatar.")
    return updated_profile[0]


@router.delete("/me/avatar", response_model=UserProfile)
async def remove_avatar(user: Dict[str, Any] = Depends(get_current_user)):
    """
    Remove a imagem atual do avatar (apaga do Storage se pertencer ao bucket)
    e limpa o campo profile_image_url no perfil.
    """
    address = user["address"]
    current_url = user.get("profile_image_url")

    # apaga do storage e zera profile_image_url
    supabase_service.remove_user_avatar(address, current_url)

    # retorna perfil atualizado do banco
    db_user = supabase_service.get_user_profile_by_address(address.lower())
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return db_user


@router.get("/{address}", response_model=UserProfile)
async def get_public_user_profile(address: str):
    """
    Retorna o perfil público de qualquer endereço.
    """
    db_user = supabase_service.get_user_profile_by_address(address.lower())
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return db_user
