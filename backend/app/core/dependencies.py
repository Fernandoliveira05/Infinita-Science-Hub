from fastapi import Depends, HTTPException, Header
from typing import Optional, Dict, Any
import time

# Mock DB (futuro → Postgres/Supabase)
sessions: Dict[str, Dict[str, Any]] = {}


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    Retorna o usuário autenticado a partir do header Authorization.
    - Authorization: Bearer <wallet_address>
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    try:
        scheme, token = authorization.split(" ")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    if scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authorization must use Bearer scheme")

    address = token.lower()

    # Verifica sessão mock (futuro: validar assinatura e JWT)
    if address not in sessions:
        # cria sessão fake para simplificar agora
        sessions[address] = {
            "address": address,
            "created_at": time.time(),
            "roles": ["user"],
        }

    return sessions[address]


async def get_supabase_client():
    """
    Retorna cliente do Supabase (mock).
    No futuro vamos inicializar com SUPABASE_URL + SUPABASE_KEY.
    """
    return {"supabase": "fake-client"}
