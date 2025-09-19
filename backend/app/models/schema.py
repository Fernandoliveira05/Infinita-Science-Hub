from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ================== Modelos de Usuário ==================

# Modelo para a resposta do perfil de usuário (reflete a tabela)
class UserProfile(BaseModel):
    address: str
    username: Optional[str] = None
    email: Optional[str] = None  # Campo adicionado
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None  # Nome da coluna corrigido
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Modelo para atualização de perfil (o que o usuário pode enviar)
class UpdateUserProfile(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    # O profile_image_url é atualizado por uma rota específica de upload, por isso não está aqui.

    class Config:
        orm_mode = True

# ================== Outros Modelos (mantidos como referência) ==================

class LoginRequest(BaseModel):
    address: str
    signature: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

