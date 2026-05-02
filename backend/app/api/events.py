from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.core.deps import get_admin
from app.models.event import Event
from app.models.guest import Guest
from app.models.photo import Photo, AccessLog
from app.schemas.event import EventCreate, EventResponse
import uuid

router = APIRouter(prefix="/events", tags=["events"])


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


@router.get("/{event_id}/analytics")
async def event_analytics(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Get event statistics: guests, photos, downloads, views."""
    # Guest counts
    total_guests = await db.scalar(
        select(func.count()).select_from(Guest).where(Guest.event_id == event_id)
    )
    invited_guests = await db.scalar(
        select(func.count()).select_from(Guest)
        .where(Guest.event_id == event_id)
        .where(Guest.link_sent_at.isnot(None))
    )

    # Photo counts
    total_photos = await db.scalar(
        select(func.count()).select_from(Photo).where(Photo.event_id == event_id)
    )
    published_photos = await db.scalar(
        select(func.count()).select_from(Photo)
        .where(Photo.event_id == event_id)
        .where(Photo.status == "published")
    )

    # Access log counts
    total_views = await db.scalar(
        select(func.count()).select_from(AccessLog)
        .where(AccessLog.action == "view")
    )
    total_downloads = await db.scalar(
        select(func.count()).select_from(AccessLog)
        .where(AccessLog.action == "download")
    )

    return {
        "guests": {"total": total_guests or 0, "invited": invited_guests or 0},
        "photos": {"total": total_photos or 0, "published": published_photos or 0},
        "activity": {"views": total_views or 0, "downloads": total_downloads or 0},
    }

