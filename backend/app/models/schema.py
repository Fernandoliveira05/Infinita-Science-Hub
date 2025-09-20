from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

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
    

# ================== Modelos de Repositório (Nova Versão) ==================

class Collaborator(BaseModel):
    """
    Modelo para validação de dados de um colaborador.
    """
    address: str
    role: str = "contributor"  # Ex: owner, contributor

class RepositoryBase(BaseModel):
    """
    Campos base para um repositório.
    """
    name: str
    description: Optional[str] = None
    visibility: str = "public"

class RepositoryCreate(RepositoryBase):
    """
    Modelo para o corpo da requisição de criação de um repositório.
    """
    pass

class RepositoryUpdate(BaseModel):
    """
    Modelo para o corpo da requisição de atualização de um repositório.
    Todos os campos são opcionais.
    """
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None

class RepositoryOut(RepositoryBase):
    """
    Modelo completo para a resposta da API ao retornar um repositório.
    Reflete a estrutura da tabela 'repositories'.
    """
    id: UUID
    owner_address: str
    stars: int
    forks: int
    donations: float
    # O campo collaborators no DB é um JSONB, então aqui usamos um tipo flexível.
    collaborators: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        # Habilita a compatibilidade com modelos de ORM (como os do Supabase)
        orm_mode = True

