from fastapi import APIRouter, HTTPException
from app.schemas.auth import TokenVerifyRequest, TokenVerifyResponse
from app.services.jwt_service import verify_guest_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify-token", response_model=TokenVerifyResponse)
async def verify_token(payload: TokenVerifyRequest):
    """
    Verify a guest gallery JWT token.
    Returns decoded guest claims if valid, or 401 if expired/invalid.
    """
    claims = verify_guest_token(payload.token)
    return claims
