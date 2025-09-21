from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# ================== Modelos de Usuário ==================

# Modelo para a resposta do perfil de usuário (reflete a tabela)
class UserProfile(BaseModel):
    address: str
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    description: Optional[str] = None  # <-- NOVO (descrição longa do perfil)
    profile_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Modelo para atualização de perfil (o que o usuário pode enviar)
class UpdateUserProfile(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    description: Optional[str] = None  # <-- NOVO (descrição longa do perfil)
    # O profile_image_url é atualizado por uma rota específica de upload.

    class Config:
        orm_mode = True

# ================== Outros Modelos (mantidos como referência) ==================

class LoginRequest(BaseModel):
    address: str
    signature: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ================== Modelos de Repositório (Nova Versão) ==================

class Collaborator(BaseModel):
    address: str
    role: str = "contributor"

class RepositoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    visibility: str = "public"

class RepositoryCreate(RepositoryBase):
    pass

class RepositoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None

class RepositoryOut(RepositoryBase):
    id: UUID
    owner_address: str
    stars: int
    forks: int
    donations: float
    collaborators: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# ================== Modelos de Bloco (Novos) ==================

class BlockBase(BaseModel):
    """
    Campos base para um bloco, usados na criação.
    """
    repo_id: UUID
    type: str
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = {}

class BlockCreate(BlockBase):
    """
    Modelo para o corpo da requisição de criação de um bloco. Herda de BlockBase.
    """
    pass

class BlockUpdate(BaseModel):
    """
    Modelo para o corpo da requisição de atualização de um bloco.
    """
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    order_index: Optional[int] = None

class BlockOut(BlockBase):
    """
    Modelo completo para a resposta da API ao retornar um bloco.
    """
    id: UUID
    owner_address: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# ================== Modelos de Auditoria (Novos) ==================

class BlockAuditResult(BaseModel):
    """
    Modelo do payload que a IA envia de volta para nosso webhook após analisar um bloco.
    """
    prediction_id: str
    block_id: UUID
    repo_id: UUID
    ai_status: str = Field(..., pattern="^(approved|rejected)$")
    ai_description: str
    raw_response: Optional[Dict[str, Any]] = None

class AuditLogOut(BaseModel):
    """
    Modelo para retornar um log de auditoria da nossa API.
    """
    id: UUID
    prediction_id: str
    block_id: UUID
    repo_id: UUID
    ai_status: str
    ai_description: str
    created_at: datetime

    class Config:
        orm_mode = True
