from fastapi import APIRouter, Depends, UploadFile, File, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_guest
from app.models.photo import Photo, PhotoGuest, AccessLog
from app.models.session import Session
from app.services.face_service import match_faces
from app.services.cache_service import get_cache, set_cache, invalidate_guest_cache
import uuid

router = APIRouter(prefix="/gallery", tags=["gallery"])

# Pagination constant
PAGE_SIZE = 20


@router.get("")
async def get_gallery(
    offset: int = 0,
    limit: int = PAGE_SIZE,
    current_guest: dict = Depends(get_current_guest),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all photos matched to the current guest (from JWT token).
    Supports pagination: ?offset=0&limit=20
    Results cached 60s per guest to handle 1000 concurrent users.
    """
    guest_id  = uuid.UUID(current_guest["sub"])
    event_id  = uuid.UUID(current_guest["event_id"])
    cache_key = f"gallery:{guest_id}:{offset}:{limit}"

    # ── Cache hit: skip DB entirely ──
    cached = await get_cache(cache_key)
    if cached:
        return cached

    # ── DB query ──
    result = await db.execute(
        select(Photo, PhotoGuest)
        .join(PhotoGuest, Photo.id == PhotoGuest.photo_id)
        .where(PhotoGuest.guest_id == guest_id)
        .where(Photo.status == "published")
        .order_by(PhotoGuest.confidence.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = result.all()

    matched = [
        {
            "id":          str(p.id),
            "url_thumb":   p.url_thumb,
            "url_preview": p.url_preview,
            "url_original":p.url_original,
            "filename":    p.filename,
            "confidence":  pg.confidence,
            "session_id":  str(p.session_id) if p.session_id else None,
        }
        for p, pg in rows if pg.confidence >= 0.85
    ]
    suggested = [
        {
            "id":          str(p.id),
            "url_thumb":   p.url_thumb,
            "url_preview": p.url_preview,
            "filename":    p.filename,
            "confidence":  pg.confidence,
            "session_id":  str(p.session_id) if p.session_id else None,
        }
        for p, pg in rows if pg.confidence < 0.85
    ]

    response = {
        "photos":    matched,
        "suggested": suggested,
        "pagination": {"offset": offset, "limit": limit, "has_more": len(rows) == limit},
    }

    # ── Cache for 60s ──
    await set_cache(cache_key, response, ttl_seconds=60)

    # Log access (fire and forget — don't block response)
    db.add(AccessLog(guest_id=guest_id, action="view"))
    await db.commit()

    return response


@router.post("/face-scan")
async def face_scan(
    selfie: UploadFile = File(...),
    current_guest: dict = Depends(get_current_guest),
    db: AsyncSession = Depends(get_db),
):
    """Upload a selfie to find AI-matched photos for this guest."""
    file_bytes = await selfie.read()
    event_id   = current_guest["event_id"]
    matches    = await match_faces(file_bytes, event_id)
    return {"matches": matches, "count": len(matches)}


@router.get("/by-table/{table_number}")
async def gallery_by_table(
    table_number: int,
    current_guest: dict = Depends(get_current_guest),
    db: AsyncSession = Depends(get_db),
):
    """Fallback Layer 3: Browse photos by table/zone number."""
    event_id   = uuid.UUID(current_guest["event_id"])
    cache_key  = f"table:{event_id}:{table_number}"

    cached = await get_cache(cache_key)
    if cached:
        return cached

    result = await db.execute(
        select(Photo)
        .where(Photo.event_id == event_id)
        .where(Photo.table_tag == table_number)
        .where(Photo.status == "published")
    )
    photos = result.scalars().all()
    response = {
        "photos": [
            {
                "id":          str(p.id),
                "url_thumb":   p.url_thumb,
                "url_preview": p.url_preview,
                "session_id":  str(p.session_id) if p.session_id else None,
            }
            for p in photos
        ]
    }

    await set_cache(cache_key, response, ttl_seconds=60)
    return response


@router.get("/by-session/{session_id}")
async def gallery_by_session(
    session_id: uuid.UUID,
    offset: int = 0,
    limit: int = PAGE_SIZE,
    current_guest: dict = Depends(get_current_guest),
    db: AsyncSession = Depends(get_db),
):
    """Browse all published photos in a specific session/program tab."""
    event_id  = uuid.UUID(current_guest["event_id"])
    cache_key = f"session:{session_id}:{offset}:{limit}"

    cached = await get_cache(cache_key)
    if cached:
        return cached

    # Verify session belongs to this event
    sess_result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .where(Session.event_id == event_id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        return {"photos": [], "session": None}

    result = await db.execute(
        select(Photo)
        .where(Photo.session_id == session_id)
        .where(Photo.status == "published")
        .order_by(Photo.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
    )
    photos = result.scalars().all()

    response = {
        "session": {
            "id":   str(session.id),
            "name": session.name,
            "icon": session.icon,
        },
        "photos": [
            {
                "id":          str(p.id),
                "url_thumb":   p.url_thumb,
                "url_preview": p.url_preview,
                "url_original":p.url_original,
                "filename":    p.filename,
            }
            for p in photos
        ],
        "pagination": {"offset": offset, "limit": limit, "has_more": len(photos) == limit},
    }

    await set_cache(cache_key, response, ttl_seconds=60)
    return response
