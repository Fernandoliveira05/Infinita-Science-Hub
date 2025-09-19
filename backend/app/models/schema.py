from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Modelo para a resposta do perfil de usuário
class UserProfile(BaseModel):
    address: str
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None  # URL para a foto de perfil
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Modelo para requisição de login (usando a Metamask)
class LoginRequest(BaseModel):
    address: str
    signature: str


# Modelo para resposta do token JWT
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Modelo para atualização de perfil de usuário
class UpdateUserProfile(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        orm_mode = True


# Modelo para criar um repositório
class CreateRepositoryRequest(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True

    class Config:
        orm_mode = True


# Modelo para atualizar repositório
class UpdateRepositoryRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

    class Config:
        orm_mode = True


# Modelo para retorno de repositórios
class RepositoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Modelo para criação de auditoria (logs)
class CreateAuditLogRequest(BaseModel):
    action: str
    target: str
    description: Optional[str] = None

    class Config:
        orm_mode = True


# Modelo para retorno de auditoria
class AuditLogResponse(BaseModel):
    id: int
    action: str
    target: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
