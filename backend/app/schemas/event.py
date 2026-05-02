from pydantic import BaseModel
from datetime import date
from uuid import UUID


class EventCreate(BaseModel):
    name: str
    date: date
    venue: str
    slug: str
    accent_color: str = "#C9A96E"


class EventResponse(BaseModel):
    id: UUID
    name: str
    date: date
    venue: str
    slug: str
    accent_color: str
    status: str

    model_config = {"from_attributes": True}
