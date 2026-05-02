from pydantic import BaseModel
from datetime import date
from uuid import UUID
from typing import Optional


class EventFeatures(BaseModel):
    face_scan:      bool = True
    qr_access:      bool = True
    table_browsing: bool = True
    download:       bool = True
    show_suggested: bool = True


class EventCreate(BaseModel):
    name:             str
    date:             date
    venue:            str
    slug:             str
    accent_color:     str = "#C9A96E"
    is_multi_session: bool = False
    features:         EventFeatures = EventFeatures()


class EventUpdate(BaseModel):
    name:             Optional[str]           = None
    venue:            Optional[str]           = None
    accent_color:     Optional[str]           = None
    status:           Optional[str]           = None
    is_multi_session: Optional[bool]          = None
    features:         Optional[EventFeatures] = None


class EventResponse(BaseModel):
    id:               UUID
    name:             str
    date:             date
    venue:            str
    slug:             str
    accent_color:     str
    status:           str
    is_multi_session: bool
    features:         dict

    model_config = {"from_attributes": True}
