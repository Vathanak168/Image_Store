from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_admin
from app.models.event import Event
from app.models.table import EventTable
from app.schemas.table import TableCreate, TableUpdate, TableResponse
import uuid

router = APIRouter(prefix="/events", tags=["tables"])


@router.post("/{event_id}/tables", response_model=TableResponse, status_code=201)
async def create_table(
    event_id: uuid.UUID,
    payload: TableCreate,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Create a new table/zone for an event. (Admin only)"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    table = EventTable(
        id=uuid.uuid4(),
        event_id=event_id,
        name=payload.name,
        table_number=payload.table_number,
    )
    db.add(table)
    await db.commit()
    await db.refresh(table)
    return table


@router.get("/{event_id}/tables", response_model=list[TableResponse])
async def list_tables(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all tables for an event. Public endpoint for dropdowns."""
    result = await db.execute(
        select(EventTable)
        .where(EventTable.event_id == event_id)
        .order_by(EventTable.table_number)
    )
    return result.scalars().all()


@router.get("/{event_id}/tables/{table_id}", response_model=TableResponse)
async def get_table(
    event_id: uuid.UUID,
    table_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific table."""
    result = await db.execute(
        select(EventTable)
        .where(EventTable.id == table_id)
        .where(EventTable.event_id == event_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table


@router.patch("/{event_id}/tables/{table_id}", response_model=TableResponse)
async def update_table(
    event_id: uuid.UUID,
    table_id: uuid.UUID,
    payload: TableUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Update table details. (Admin only)"""
    result = await db.execute(
        select(EventTable)
        .where(EventTable.id == table_id)
        .where(EventTable.event_id == event_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    if payload.name is not None:
        table.name = payload.name
    if payload.table_number is not None:
        table.table_number = payload.table_number

    await db.commit()
    await db.refresh(table)
    return table


@router.delete("/{event_id}/tables/{table_id}", status_code=204)
async def delete_table(
    event_id: uuid.UUID,
    table_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(get_admin),
):
    """Delete a table. Photos in this table will lose their table tag. (Admin only)"""
    result = await db.execute(
        select(EventTable)
        .where(EventTable.id == table_id)
        .where(EventTable.event_id == event_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    await db.delete(table)
    await db.commit()
