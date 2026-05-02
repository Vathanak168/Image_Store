from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class SessionCreate(BaseModel):
    name:      str
    order:     int = 0
    icon:      Optional[str] = None
    cover_url: Optional[str] = None


class SessionUpdate(BaseModel):
    name:      Optional[str] = None
    order:     Optional[int] = None
    icon:      Optional[str] = None
    cover_url: Optional[str] = None


class SessionReorder(BaseModel):
    """Bulk reorder: list of {id, order} pairs"""
    sessions: list[dict]  # [{"id": "uuid", "order": 0}, ...]


class SessionResponse(BaseModel):
    id:        UUID
    event_id:  UUID
    name:      str
    order:     int
    icon:      Optional[str]
    cover_url: Optional[str]

    model_config = {"from_attributes": True}
