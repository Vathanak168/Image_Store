from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class PhotoResponse(BaseModel):
    id: UUID
    filename: str
    url_thumb: str
    url_preview: str
    url_original: str
    status: str
    uploaded_at: datetime
    table_tag: Optional[int]

    model_config = {"from_attributes": True}


class GalleryPhotoOut(BaseModel):
    id: str
    url_thumb: str
    url_preview: str
    filename: str
    confidence: float


class GalleryResponse(BaseModel):
    photos: list[GalleryPhotoOut]
    suggested: list[GalleryPhotoOut]


class DownloadResponse(BaseModel):
    download_url: str
