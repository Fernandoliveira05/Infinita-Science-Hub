from fastapi.responses import JSONResponse
from typing import Any, Optional


def success_response(
    data: Any,
    message: str = "Success",
    status_code: int = 200,
) -> JSONResponse:
    """
    Retorna resposta padronizada de sucesso.
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data,
        },
    )


def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    details: Optional[Any] = None,
) -> JSONResponse:
    """
    Retorna resposta padronizada de erro.
    """
    payload = {
        "success": False,
        "message": message,
    }
    if details is not None:
        payload["details"] = details

    return JSONResponse(
        status_code=status_code,
        content=payload,
    )
