from fastapi import Depends, Header, HTTPException
from app.services.jwt_service import verify_guest_token, verify_admin_token


async def get_current_guest(authorization: str = Header(...)) -> dict:
    """Extract guest from Bearer token in Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization[7:]
    return verify_guest_token(token)


async def get_admin(x_admin_secret: str = Header(...)) -> bool:
    return verify_admin_token(x_admin_secret)
