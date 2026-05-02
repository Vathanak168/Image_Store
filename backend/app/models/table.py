import uuid
from sqlalchemy import String, Integer, ForeignKey, Uuid, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.database import Base


class EventTable(Base):
    """Physical tables/zones at an event where guests are seated."""
    __tablename__ = "event_tables"
    __table_args__ = (
        Index("ix_event_tables_event_id", "event_id"),
    )

    id:           Mapped[uuid.UUID]  = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_id:     Mapped[uuid.UUID]  = mapped_column(ForeignKey("events.id"))
    name:         Mapped[str | None] = mapped_column(String(100), nullable=True)  # table_label in API
    table_number: Mapped[int | None] = mapped_column(Integer)
    photo_count:  Mapped[int]        = mapped_column(Integer, default=0)
    created_at:   Mapped[datetime]   = mapped_column(default=datetime.utcnow)

    event:  Mapped["Event"]       = relationship(back_populates="tables")
    photos: Mapped[list["Photo"]] = relationship(back_populates="event_table")
