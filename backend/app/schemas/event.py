from pydantic import BaseModel
from datetime import date
from uuid import UUID
from typing import Optional


class EventFeatures(BaseModel):
    face_scan:      bool = True
    qr_access:      bool = True
    table_browse:   bool = False   # renamed from table_browsing
    download:       bool = True
    show_suggested: bool = True


class EventCreate(BaseModel):
    name:             str
    date:             date
    venue:            str
    slug:             str
    accent_color:     str = "#C9A96E"
    cover_image_url:  Optional[str] = None
    is_multi_session: bool = False
    features:         EventFeatures = EventFeatures()


class EventUpdate(BaseModel):
    name:             Optional[str]           = None
    venue:            Optional[str]           = None
    accent_color:     Optional[str]           = None
    cover_image_url:  Optional[str]           = None
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
    cover_image_url:  Optional[str]
    status:           str
    is_multi_session: bool
    features:         dict
    table_count:      int = 0
    table_naming:     str = "numeric"

    model_config = {"from_attributes": True}
