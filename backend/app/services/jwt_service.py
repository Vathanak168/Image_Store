import jwt
from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import HTTPException
from app.core.config import settings


def generate_guest_token(guest_id: UUID, event_id: UUID) -> str:
    payload = {
        "sub":      str(guest_id),
        "event_id": str(event_id),
        "type":     "guest",
        "exp":      datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRE_DAYS),
        "iat":      datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_guest_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "guest":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def verify_admin_token(secret: str) -> bool:
    if secret != settings.ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Admin access denied")
    return True
