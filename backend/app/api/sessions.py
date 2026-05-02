from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_admin
from app.models.event import Event
from app.models.session import Session
from app.schemas.session import SessionCreate, SessionUpdate, SessionReorder, SessionResponse
import uuid

router = APIRouter(prefix="/events", tags=["sessions"])


@router.post("/{event_id}/sessions", response_model=SessionResponse, status_code=201)
async def create_session(
    event_id: uuid.UUID,
    payload: SessionCreate,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Create a new program/session for a multi-session event. (Admin only)"""
    # Verify event exists and is multi-session
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event.is_multi_session:
        raise HTTPException(status_code=400, detail="Event is not multi-session. Enable multi-session mode first.")

    session = Session(
        id=uuid.uuid4(),
        event_id=event_id,
        name=payload.name,
        order=payload.order,
        icon=payload.icon,
        cover_url=payload.cover_url,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{event_id}/sessions", response_model=list[SessionResponse])
async def list_sessions(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all sessions for an event, ordered by display order. Public endpoint."""
    result = await db.execute(
        select(Session)
        .where(Session.event_id == event_id)
        .order_by(Session.order)
    )
    return result.scalars().all()


@router.patch("/{event_id}/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    payload: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Update session name, icon, order. (Admin only)"""
    result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .where(Session.event_id == event_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if payload.name is not None:
        session.name = payload.name
    if payload.order is not None:
        session.order = payload.order
    if payload.icon is not None:
        session.icon = payload.icon
    if payload.cover_url is not None:
        session.cover_url = payload.cover_url

    await db.commit()
    await db.refresh(session)
    return session


@router.delete("/{event_id}/sessions/{session_id}", status_code=204)
async def delete_session(
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Delete a session. Photos in this session become untagged (session_id = null). (Admin only)"""
    result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .where(Session.event_id == event_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()


@router.patch("/{event_id}/sessions/reorder", status_code=200)
async def reorder_sessions(
    event_id: uuid.UUID,
    payload: SessionReorder,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Bulk reorder sessions by drag-and-drop. Pass list of {id, order}. (Admin only)"""
    for item in payload.sessions:
        sid = uuid.UUID(item["id"])
        result = await db.execute(
            select(Session)
            .where(Session.id == sid)
            .where(Session.event_id == event_id)
        )
        session = result.scalar_one_or_none()
        if session:
            session.order = item["order"]

    await db.commit()
    return {"reordered": len(payload.sessions)}
