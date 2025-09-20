from fastapi import APIRouter, Depends, HTTPException, status, Body, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from eth_account.messages import encode_defunct
from eth_account import Account
import secrets
import jwt

from app.services import supabase_service
from app.core.config import settings
from app.core.security import create_jwt

router = APIRouter()

# --- Esquema de Segurança para o Swagger ---
# HTTPBearer() informa ao Swagger para mostrar o campo "Authorize" para tokens Bearer.
security_scheme = HTTPBearer()

# ================== MODELS ==================
class NonceResponse(BaseModel):
    address: str
    nonce: str

class LoginRequest(BaseModel):
    address: str
    signature: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class DevLoginRequest(BaseModel):
    address: str

# ================== DEPENDÊNCIA DE AUTENTICAÇÃO ==================
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    """
    Decodifica o token JWT fornecido pelo esquema de segurança e retorna os dados do usuário.
    Esta é a dependência padrão para todas as rotas protegidas.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        address: str = payload.get("sub")
        if address is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")
        user = supabase_service.get_user_profile_by_address(address)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado.")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")

# ================== ROTAS PÚBLICAS DE AUTENTICAÇÃO ==================
@router.post("/nonce", response_model=NonceResponse)
async def get_nonce(address: str = Body(..., embed=True, pattern="^0x[a-fA-F0-9]{40}$")):
    """
    (Produção) Gera e salva um nonce único para o endereço informado.
    """
    lower_address = address.lower()
    
    user = supabase_service.get_user_profile_by_address(lower_address)
    if not user:
        supabase_service.create_initial_user_profile(lower_address)

    nonce = f"Bem-vindo ao Infinita Science Hub! Assine esta mensagem para provar que você controla esta carteira. Nonce: {secrets.token_hex(16)}"
    
    supabase_service.update_user_nonce(lower_address, nonce)
    
    return NonceResponse(address=lower_address, nonce=nonce)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """
    (Produção) Verifica a assinatura do nonce e retorna um token JWT se for válida.
    """
    lower_address = req.address.lower()
    user = supabase_service.get_user_profile_by_address(lower_address)
    if not user or not user.get("nonce"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nonce não encontrado ou expirado.")

    stored_nonce = user["nonce"]

    try:
        message = encode_defunct(text=stored_nonce)
        recovered_address = Account.recover_message(message, signature=req.signature)
        if recovered_address.lower() != lower_address:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Assinatura inválida.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Falha na verificação da assinatura: {e}")

    supabase_service.update_user_nonce(lower_address, None)
    token = create_jwt(lower_address)
    return TokenResponse(access_token=token)

# ================== ROTA DE LOGIN PARA DESENVOLVIMENTO ==================
@router.post("/dev-login", response_model=TokenResponse, include_in_schema=(settings.app_env == "development"))
async def developer_login(req: DevLoginRequest):
    """
    (APENAS DESENVOLVIMENTO) Gera um token de acesso sem verificação de assinatura.
    Esta rota só fica visível e funciona se APP_ENV=development no arquivo .env.
    """
    if settings.app_env != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint não encontrado")

    lower_address = req.address.lower()
    
    user = supabase_service.get_user_profile_by_address(lower_address)
    if not user:
        supabase_service.create_initial_user_profile(lower_address)

    token = create_jwt(lower_address)
    return TokenResponse(access_token=token)

# ================== ROTA AUTENTICADA ==================
@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """
    Endpoint de logout. Requer um token válido.
    """
    return {"detail": "Logout bem-sucedido. O token deve ser removido no cliente."}