from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import get_admin
from app.models.event import Event
from app.models.table import EventTable
from app.models.photo import Photo
from app.schemas.table import TableConfigureRequest, TableUpdate, TableResponse
from app.services.image_pipeline import process_and_upload
import uuid
import string

router = APIRouter(prefix="/events", tags=["tables"])


def _make_label(naming: str, number: int) -> str | None:
    """Generate a table label based on naming convention."""
    if naming == "numeric":
        return f"Table {number}"
    elif naming == "alphabetic":
        # A=1, B=2 ... Z=26, AA=27 ...
        label = ""
        n = number
        while n > 0:
            n, r = divmod(n - 1, 26)
            label = string.ascii_uppercase[r] + label
        return f"Table {label}"
    else:
        return None   # custom — admin sets later


async def _table_response(table: EventTable, db: AsyncSession) -> dict:
    """Build a full TableResponse dict including photo thumbnails."""
    result = await db.execute(
        select(Photo.url_thumb)
        .where(Photo.table_id == table.id)
        .where(Photo.status == "published")
        .limit(4)
    )
    thumb_urls = [row[0] for row in result.fetchall()]
    return {
        "id":           table.id,
        "event_id":     table.event_id,
        "table_number": table.table_number,
        "table_label":  table.name,
        "photo_count":  table.photo_count,
        "photos":       thumb_urls,
    }


# ── 3A. Configure tables (bulk generate) ─────────────────────────────────────

@router.post("/{event_id}/tables/configure")
async def configure_tables(
    event_id:  uuid.UUID,
    payload:   TableConfigureRequest,
    db:        AsyncSession = Depends(get_db),
    _admin:    bool         = Depends(get_admin),
):
    """
    Delete all existing tables for this event, regenerate from count + naming.
    Also updates event.table_count and event.table_naming.
    """
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Validate
    if payload.table_count < 1 or payload.table_count > 200:
        raise HTTPException(status_code=400, detail="table_count must be between 1 and 200")
    if payload.table_naming not in ("numeric", "alphabetic", "custom"):
        raise HTTPException(status_code=400, detail="table_naming must be numeric, alphabetic, or custom")

    # Delete existing tables (photos keep their table_id but FK is SET NULL via ON DELETE SET NULL)
    existing = await db.execute(
        select(EventTable).where(EventTable.event_id == event_id)
    )
    for tbl in existing.scalars().all():
        await db.delete(tbl)
    await db.flush()

    # Generate new tables
    new_tables = []
    for i in range(1, payload.table_count + 1):
        tbl = EventTable(
            id=uuid.uuid4(),
            event_id=event_id,
            table_number=i,
            name=_make_label(payload.table_naming, i),
            photo_count=0,
        )
        db.add(tbl)
        new_tables.append(tbl)

    # Update event metadata
    event.table_count  = payload.table_count
    event.table_naming = payload.table_naming

    await db.commit()
    for tbl in new_tables:
        await db.refresh(tbl)

    return [await _table_response(tbl, db) for tbl in new_tables]


# ── 3B. Get all tables ────────────────────────────────────────────────────────

@router.get("/{event_id}/tables")
async def list_tables(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all tables for an event with photo thumbnails. Public endpoint."""
    result = await db.execute(
        select(EventTable)
        .where(EventTable.event_id == event_id)
        .order_by(EventTable.table_number)
    )
    tables = result.scalars().all()
    return [await _table_response(tbl, db) for tbl in tables]


# ── 3C. Update single table label ─────────────────────────────────────────────

@router.patch("/{event_id}/tables/{table_id}")
async def update_table(
    event_id:  uuid.UUID,
    table_id:  uuid.UUID,
    payload:   TableUpdate,
    db:        AsyncSession = Depends(get_db),
    _admin:    bool         = Depends(get_admin),
):
    """Update table label (and optionally table_number). Admin only."""
    result = await db.execute(
        select(EventTable)
        .where(EventTable.id == table_id)
        .where(EventTable.event_id == event_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    if payload.table_label is not None:
        table.name = payload.table_label
    if payload.table_number is not None:
        table.table_number = payload.table_number

    await db.commit()
    await db.refresh(table)
    return await _table_response(table, db)


# ── 3D. Upload photos to a specific table ─────────────────────────────────────

@router.post("/{event_id}/tables/{table_id}/photos")
async def upload_table_photos(
    event_id: uuid.UUID,
    table_id: uuid.UUID,
    files:    list[UploadFile] = File(...),
    db:       AsyncSession     = Depends(get_db),
    _admin:   bool             = Depends(get_admin),
):
    """Upload one or more photos to a specific table. Admin only."""
    result = await db.execute(
        select(EventTable)
        .where(EventTable.id == table_id)
        .where(EventTable.event_id == event_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    uploaded = []
    for file in files:
        file_bytes = await file.read()
        urls = await process_and_upload(
            file_bytes=file_bytes,
            filename=file.filename or "photo.jpg",
            event_id=str(event_id),
        )
        photo = Photo(
            id=uuid.uuid4(),
            event_id=event_id,
            table_id=table_id,
            table_tag=table.table_number,
            filename=file.filename or "photo.jpg",
            url_thumb=urls["url_thumb"],
            url_preview=urls["url_preview"],
            url_original=urls["url_original"],
            status="staged",
        )
        db.add(photo)
        table.photo_count += 1
        uploaded.append(photo)

    await db.commit()
    for p in uploaded:
        await db.refresh(p)

    return [
        {
            "id":          str(p.id),
            "filename":    p.filename,
            "url_thumb":   p.url_thumb,
            "url_preview": p.url_preview,
            "status":      p.status,
        }
        for p in uploaded
    ]


# ── 3E. Get photos for a specific table ───────────────────────────────────────

@router.get("/{event_id}/tables/{table_id}/photos")
async def list_table_photos(
    event_id: uuid.UUID,
    table_id: uuid.UUID,
    status:   str = "published",
    limit:    int = 20,
    offset:   int = 0,
    db:       AsyncSession = Depends(get_db),
):
    """Get paginated photos for a specific table. Public endpoint."""
    result = await db.execute(
        select(EventTable)
        .where(EventTable.id == table_id)
        .where(EventTable.event_id == event_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    query = select(Photo).where(Photo.table_id == table_id)
    if status:
        query = query.where(Photo.status == status)
    query = query.order_by(Photo.uploaded_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    photos = result.scalars().all()

    total = await db.scalar(
        select(func.count()).select_from(Photo)
        .where(Photo.table_id == table_id)
        .where(Photo.status == status)
    )

    return {
        "table":      {"id": str(table.id), "table_label": table.name, "table_number": table.table_number},
        "photos":     [
            {
                "id":           str(p.id),
                "filename":     p.filename,
                "url_thumb":    p.url_thumb,
                "url_preview":  p.url_preview,
                "url_original": p.url_original,
                "status":       p.status,
            }
            for p in photos
        ],
        "pagination": {"offset": offset, "limit": limit, "total": total, "has_more": (offset + limit) < total},
    }
