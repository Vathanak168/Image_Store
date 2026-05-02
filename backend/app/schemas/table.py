from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class TableConfigureRequest(BaseModel):
    table_count:  int
    table_naming: str = "numeric"   # "numeric" | "alphabetic" | "custom"


class TableCreate(BaseModel):
    name: Optional[str] = None
    table_number: Optional[int] = None


class TableUpdate(BaseModel):
    table_label: Optional[str] = None   # maps to model.name
    table_number: Optional[int] = None


class TableResponse(BaseModel):
    id:           UUID
    event_id:     UUID
    table_number: Optional[int]
    table_label:  Optional[str] = None  # mapped from model.name
    photo_count:  int = 0
    photos:       list[str] = []        # up to 4 thumbnail URLs

    model_config = {"from_attributes": True}
