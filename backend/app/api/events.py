from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.core.deps import get_admin
from app.models.event import Event
from app.models.guest import Guest
from app.models.photo import Photo, AccessLog
from app.models.session import Session
from app.schemas.event import EventCreate, EventUpdate, EventResponse
import uuid

router = APIRouter(prefix="/events", tags=["events"])


# ── Helper: build toggle_status object ────────────────────────────────────────

async def _build_toggle_status(event: Event, db: AsyncSession) -> dict:
    """Check each feature toggle's readiness based on actual event data."""
    photo_count = await db.scalar(
        select(func.count()).select_from(Photo).where(Photo.event_id == event.id)
    ) or 0
    guest_count = await db.scalar(
        select(func.count()).select_from(Guest).where(Guest.event_id == event.id)
    ) or 0

    features = event.features or {}

    def status(key: str, ready: bool, reason: str | None = None) -> dict:
        return {"enabled": features.get(key, False), "ready": ready, "reason": reason}

    return {
        "face_scan":      status("face_scan",      photo_count > 0,        "Upload photos first"       if photo_count == 0 else None),
        "qr_access":      status("qr_access",      guest_count > 0,        "Import guests first"       if guest_count == 0 else None),
        "table_browse":   status("table_browse",   event.table_count > 0,  "Configure tables first"    if event.table_count == 0 else None),
        "download":       status("download",       True),
        "show_suggested": status("show_suggested", True),
    }


# ── List events ───────────────────────────────────────────────────────────────

@router.get("", response_model=list[EventResponse])
async def list_events(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """List all events. Admin only."""
    result = await db.execute(select(Event).order_by(Event.date.desc()))
    return result.scalars().all()


# ── Create event ──────────────────────────────────────────────────────────────

@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    payload: EventCreate,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Create a new event. Requires X-Admin-Secret header."""
    event = Event(
        id=uuid.uuid4(),
        name=payload.name,
        date=payload.date,
        venue=payload.venue,
        slug=payload.slug,
        accent_color=payload.accent_color,
        cover_image_url=payload.cover_image_url,
        is_multi_session=payload.is_multi_session,
        features=payload.features.model_dump(),
        status="draft",
    )
    db.add(event)
    try:
        await db.commit()
        await db.refresh(event)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Slug already exists")
    return event


# ── Get active event ──────────────────────────────────────────────────────────

@router.get("/active", response_model=EventResponse)
async def get_active_event(db: AsyncSession = Depends(get_db)):
    """Get the most recent event. Used by Landing Page to know which features to display."""
    result = await db.execute(select(Event).order_by(Event.date.desc()).limit(1))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="No active event found")
    return event


# ── Get event config (PUBLIC — Guest side) ────────────────────────────────────

@router.get("/{event_id}/config")
async def get_event_config(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint. Returns full event config for the Guest Landing Page.
    Includes mode, features, sessions, table info, and branding.
    """
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Load sessions if multi-session
    sessions_data = []
    if event.is_multi_session:
        sess_result = await db.execute(
            select(Session)
            .where(Session.event_id == event_id)
            .order_by(Session.order)
        )
        sessions_data = [
            {"id": str(s.id), "name": s.name, "icon": s.icon, "order": s.order}
            for s in sess_result.scalars().all()
        ]

    features = event.features or {}

    return {
        "event_id":        str(event.id),
        "name":            event.name,
        "date":            str(event.date),
        "venue":           event.venue,
        "accent_color":    event.accent_color,
        "cover_image_url": event.cover_image_url,
        "slug":            event.slug,
        "mode":            "multi_session" if event.is_multi_session else "simple",
        "features": {
            "face_scan":      features.get("face_scan", True),
            "qr_access":      features.get("qr_access", True),
            "table_browse":   features.get("table_browse", False),
            "download":       features.get("download", True),
            "show_suggested": features.get("show_suggested", True),
        },
        "sessions":        sessions_data,
        "table_count":     event.table_count,
        "table_naming":    event.table_naming,
    }


# ── Update feature toggles (ADMIN) ────────────────────────────────────────────

@router.patch("/{event_id}/toggles")
async def update_event_toggles(
    event_id: uuid.UUID,
    payload:  dict,
    db:       AsyncSession = Depends(get_db),
    _admin:   bool         = Depends(get_admin),
):
    """
    Admin endpoint: update feature toggles.
    Returns updated features + toggle_status with readiness checks.
    """
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    current = dict(event.features or {})
    current.update(payload)
    event.features = current

    await db.commit()
    await db.refresh(event)

    toggle_status = await _build_toggle_status(event, db)
    return {
        "features":      event.features,
        "toggle_status": toggle_status,
    }


# ── Get single event ──────────────────────────────────────────────────────────

@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get event details by ID. Public endpoint (used by frontend)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# ── Update event ──────────────────────────────────────────────────────────────

@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: uuid.UUID,
    payload:  EventUpdate,
    db:       AsyncSession = Depends(get_db),
    _admin:   bool         = Depends(get_admin),
):
    """Update event info, mode, or feature toggles. Admin only."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if payload.name is not None:
        event.name = payload.name
    if payload.venue is not None:
        event.venue = payload.venue
    if payload.accent_color is not None:
        event.accent_color = payload.accent_color
    if payload.cover_image_url is not None:
        event.cover_image_url = payload.cover_image_url
    if payload.status is not None:
        event.status = payload.status
    if payload.is_multi_session is not None:
        event.is_multi_session = payload.is_multi_session
    if payload.features is not None:
        current = dict(event.features or {})
        current.update(payload.features.model_dump(exclude_none=True))
        event.features = current

    await db.commit()
    await db.refresh(event)
    return event


# ── Event analytics ───────────────────────────────────────────────────────────

@router.get("/{event_id}/analytics")
async def event_analytics(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Get event statistics: guests, photos, downloads, views."""
    total_guests = await db.scalar(
        select(func.count()).select_from(Guest).where(Guest.event_id == event_id)
    )
    invited_guests = await db.scalar(
        select(func.count()).select_from(Guest)
        .where(Guest.event_id == event_id)
        .where(Guest.link_sent_at.isnot(None))
    )
    total_photos = await db.scalar(
        select(func.count()).select_from(Photo).where(Photo.event_id == event_id)
    )
    published_photos = await db.scalar(
        select(func.count()).select_from(Photo)
        .where(Photo.event_id == event_id)
        .where(Photo.status == "published")
    )
    total_views = await db.scalar(
        select(func.count()).select_from(AccessLog)
        .where(AccessLog.action == "view")
    )
    total_downloads = await db.scalar(
        select(func.count()).select_from(AccessLog)
        .where(AccessLog.action == "download")
    )

    return {
        "guests":   {"total": total_guests or 0,   "invited": invited_guests or 0},
        "photos":   {"total": total_photos or 0,   "published": published_photos or 0},
        "activity": {"views": total_views or 0,    "downloads": total_downloads or 0},
    }
