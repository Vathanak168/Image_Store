from fastapi import APIRouter, Depends, UploadFile, File, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_guest
from app.models.photo import Photo, PhotoGuest, AccessLog
from app.services.face_service import match_faces
import uuid

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("")
async def get_gallery(
    current_guest: dict = Depends(get_current_guest),
    db: AsyncSession = Depends(get_db),
):
    """Get all photos matched to the current guest (from JWT token)."""
    guest_id = uuid.UUID(current_guest["sub"])
    event_id = uuid.UUID(current_guest["event_id"])

    # Fetch matched photos
    result = await db.execute(
        select(Photo, PhotoGuest)
        .join(PhotoGuest, Photo.id == PhotoGuest.photo_id)
        .where(PhotoGuest.guest_id == guest_id)
        .where(Photo.status == "published")
        .order_by(PhotoGuest.confidence.desc())
    )
    rows = result.all()

    matched = [
        {
            "id": str(p.id),
            "url_thumb": p.url_thumb,
            "url_preview": p.url_preview,
            "filename": p.filename,
            "confidence": pg.confidence,
        }
        for p, pg in rows if pg.confidence >= 0.85
    ]
    suggested = [
        {
            "id": str(p.id),
            "url_thumb": p.url_thumb,
            "url_preview": p.url_preview,
            "filename": p.filename,
            "confidence": pg.confidence,
        }
        for p, pg in rows if pg.confidence < 0.85
    ]

    # Log access
    db.add(AccessLog(guest_id=guest_id, action="view"))
    await db.commit()

    return {"photos": matched, "suggested": suggested}


@router.post("/face-scan")
async def face_scan(
    selfie: UploadFile = File(...),
    current_guest: dict = Depends(get_current_guest),
    db: AsyncSession = Depends(get_db),
):
    """Upload a selfie to find AI-matched photos for this guest."""
    file_bytes = await selfie.read()
    event_id = current_guest["event_id"]
    matches = await match_faces(file_bytes, event_id)
    return {"matches": matches, "count": len(matches)}


@router.get("/by-table/{table_number}")
async def gallery_by_table(
    table_number: int,
    current_guest: dict = Depends(get_current_guest),
    db: AsyncSession = Depends(get_db),
):
    """Fallback Layer 3: Browse photos by table/zone number."""
    event_id = uuid.UUID(current_guest["event_id"])
    result = await db.execute(
        select(Photo)
        .where(Photo.event_id == event_id)
        .where(Photo.table_tag == table_number)
        .where(Photo.status == "published")
    )
    photos = result.scalars().all()
    return {
        "photos": [
            {"id": str(p.id), "url_thumb": p.url_thumb, "url_preview": p.url_preview}
            for p in photos
        ]
    }
