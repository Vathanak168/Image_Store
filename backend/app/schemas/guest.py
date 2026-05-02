from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class GuestCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    table_number: Optional[int] = None


class GuestImport(BaseModel):
    guests: list[GuestCreate]


class GuestResponse(BaseModel):
    id: UUID
    name: str
    phone: Optional[str]
    email: Optional[str]
    table_number: Optional[int]
    token: Optional[str]
    link_sent_at: Optional[datetime]

    model_config = {"from_attributes": True}


class GuestTokenResponse(BaseModel):
    id: UUID
    name: str
    token: str
    gallery_url: str
