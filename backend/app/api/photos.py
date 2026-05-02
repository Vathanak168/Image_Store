from fastapi import APIRouter, Depends, UploadFile, File, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_admin
from app.models.photo import Photo
from app.schemas.photo import PhotoResponse, DownloadResponse
from app.services.image_pipeline import process_and_upload
from app.services.storage_service import generate_signed_download_url
from app.services.cache_service import invalidate_event_cache
import uuid

router = APIRouter(prefix="/photos", tags=["photos"])


@router.post("/upload", response_model=PhotoResponse, status_code=201)
async def upload_photo(
    file: UploadFile = File(...),
    event_id:   str  = Header(..., alias="X-Event-Id"),
    table_tag:  int  = Header(None, alias="X-Table-Tag"),
    table_id:   str  = Header(None, alias="X-Table-Id"),
    session_id: str  = Header(None, alias="X-Session-Id"),
    db: AsyncSession = Depends(get_db),
    _admin: bool     = Depends(get_admin),
):
    """
    Photographer uploads a photo. Runs 3-tier image pipeline (thumb/preview/original)
    and stores the photo with status='staged' until published.
    Optionally tag with X-Session-Id for multi-session events.
    """
    file_bytes   = await file.read()
    event_uuid   = uuid.UUID(event_id)
    session_uuid = uuid.UUID(session_id) if session_id else None
    table_uuid   = uuid.UUID(table_id) if table_id else None

    # Run image pipeline: resize + upload 3 versions to R2
    urls = await process_and_upload(
        file_bytes=file_bytes,
        filename=file.filename or "photo.jpg",
        event_id=event_id,
    )

    photo = Photo(
        id=uuid.uuid4(),
        event_id=event_uuid,
        session_id=session_uuid,
        filename=file.filename or "photo.jpg",
        url_thumb=urls["url_thumb"],
        url_preview=urls["url_preview"],
        url_original=urls["url_original"],
        table_tag=table_tag,
        table_id=table_uuid,
        status="staged",
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    return photo


@router.patch("/{photo_id}/publish", response_model=PhotoResponse)
async def publish_photo(
    photo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Photographer reviews and publishes a staged photo so guests can see it.
    Invalidates gallery cache so guests see fresh content immediately.
    """
    result = await db.execute(select(Photo).where(Photo.id == photo_id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    if photo.status == "published":
        raise HTTPException(status_code=409, detail="Photo already published")

    photo.status = "published"
    await db.commit()
    await db.refresh(photo)

    # Invalidate cache so all guests see the new photo immediately
    await invalidate_event_cache(str(photo.event_id))

    return photo


@router.get("/{photo_id}/download", response_model=DownloadResponse)
async def download_photo(
    photo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a signed URL for secure original-quality photo download.
    URL expires in 1 hour.
    """
    result = await db.execute(select(Photo).where(Photo.id == photo_id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Extract the R2 object key from the full CDN URL
    from app.core.config import settings
    key = photo.url_original.replace(f"{settings.CDN_BASE_URL}/", "")

    download_url = await generate_signed_download_url(key=key, expires=3600)
    return {"download_url": download_url}
