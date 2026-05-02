from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class TableCreate(BaseModel):
    name: str
    table_number: Optional[int] = None


class TableUpdate(BaseModel):
    name: Optional[str] = None
    table_number: Optional[int] = None


class TableResponse(BaseModel):
    id: UUID
    event_id: UUID
    name: str
    table_number: Optional[int]

    model_config = {"from_attributes": True}
