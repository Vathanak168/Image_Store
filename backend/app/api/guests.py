from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.deps import get_admin
from app.models.guest import Guest
from app.models.event import Event
from app.schemas.guest import GuestImport, GuestResponse, GuestTokenResponse
from app.services.jwt_service import generate_guest_token
import uuid

router = APIRouter(prefix="/events", tags=["guests"])


@router.post("/{event_id}/guests/import", status_code=201)
async def import_guests(
    event_id: uuid.UUID,
    payload: GuestImport,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """
    Bulk-import guests for an event.
    Generates a unique JWT gallery token for each guest.
    """
    # Verify event exists
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    created = []
    for g in payload.guests:
        guest_id = uuid.uuid4()
        token = generate_guest_token(guest_id=guest_id, event_id=event_id)
        guest = Guest(
            id=guest_id,
            event_id=event_id,
            name=g.name,
            phone=g.phone,
            email=g.email,
            table_number=g.table_number,
            token=token,
        )
        db.add(guest)
        created.append({"id": str(guest_id), "name": g.name, "token": token})

    await db.commit()
    return {"imported": len(created), "guests": created}


@router.post("/{event_id}/guests/invite")
async def send_invites(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """
    Mark link_sent_at for all guests in this event.
    SMS/WhatsApp sending is handled externally (e.g., Twilio).
    Returns the list of tokens and gallery URLs.
    """
    result = await db.execute(
        select(Guest).where(Guest.event_id == event_id)
    )
    guests = result.scalars().all()
    if not guests:
        raise HTTPException(status_code=404, detail="No guests found for this event")

    now = datetime.now(timezone.utc)
    tokens = []
    for guest in guests:
        guest.link_sent_at = now
        gallery_url = f"/g/{guest.token}"
        tokens.append(
            GuestTokenResponse(
                id=guest.id,
                name=guest.name,
                token=guest.token or "",
                gallery_url=gallery_url,
            )
        )

    await db.commit()
    return {"sent_count": len(tokens), "guests": tokens}


@router.get("/{event_id}/guests", response_model=list[GuestResponse])
async def list_guests(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """List all guests for an event with their token status."""
    result = await db.execute(
        select(Guest).where(Guest.event_id == event_id).order_by(Guest.name)
    )
    return result.scalars().all()
