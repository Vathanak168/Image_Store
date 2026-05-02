from pydantic import BaseModel


class TokenVerifyRequest(BaseModel):
    token: str


class TokenVerifyResponse(BaseModel):
    sub: str
    event_id: str
    type: str
    exp: int
    iat: int
