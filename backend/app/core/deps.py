from fastapi import Depends, Header, HTTPException
from app.services.jwt_service import verify_guest_token, verify_admin_token

import uuid

async def get_current_guest(authorization: str = Header(...)) -> dict:
    """Extract guest from Bearer token in Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization[7:]
    
    try:
        return verify_guest_token(token)
    except HTTPException as e:
        # Fallback: Allow anonymous access if the token is just an event ID
        try:
            # If it's a valid UUID, treat it as an anonymous guest for this event
            event_id = uuid.UUID(token)
            return {
                "sub": str(uuid.uuid4()), # Dummy guest ID
                "event_id": str(event_id),
                "type": "anonymous"
            }
        except ValueError:
            raise e

async def get_admin(x_admin_secret: str = Header(...)) -> bool:
    return verify_admin_token(x_admin_secret)
