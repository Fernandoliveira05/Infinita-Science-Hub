from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from eth_account.messages import encode_defunct
from eth_account import Account
import secrets, time, jwt
from app.core.security import create_jwt

from app.core.config import settings


router = APIRouter()

# Mock simples (no futuro: Supabase DB)
nonces = {}  # {address: (nonce, timestamp)}

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


# ================== ROTAS ==================
@router.post("/nonce", response_model=NonceResponse)
async def get_nonce(address: str = Body(..., embed=True)):
    """
    Gera um nonce único para o endereço informado.
    O usuário deve assinar este nonce com sua wallet.
    """
    nonce = secrets.token_hex(16)
    nonces[address.lower()] = (nonce, time.time())
    return NonceResponse(address=address.lower(), nonce=nonce)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    record = nonces.get(req.address.lower())
    if not record:
        raise HTTPException(status_code=400, detail="Nonce not found")

    nonce, ts = record
    if time.time() - ts > 300:
        raise HTTPException(status_code=400, detail="Nonce expired")

    token = create_jwt(req.address)
    return TokenResponse(access_token=token)


@router.get("/me")
async def get_me(token: str):
    """
    Retorna informações do usuário autenticado.
    """
    try:
        data = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {"address": data["sub"]}
