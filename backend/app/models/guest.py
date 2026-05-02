import uuid
from sqlalchemy import String, Integer, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.database import Base


class Guest(Base):
    __tablename__ = "guests"

    id:               Mapped[uuid.UUID]    = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_id:         Mapped[uuid.UUID]    = mapped_column(ForeignKey("events.id"))
    name:             Mapped[str]          = mapped_column(String(255))
    phone:            Mapped[str | None]   = mapped_column(String(30))
    email:            Mapped[str | None]   = mapped_column(String(255))
    table_number:     Mapped[int | None]   = mapped_column(Integer)
    token:            Mapped[str | None]   = mapped_column(String(512))
    token_expires_at: Mapped[datetime | None]
    face_embedding:   Mapped[dict | None]  = mapped_column(JSON, nullable=True)
    link_sent_at:     Mapped[datetime | None]

    event:        Mapped["Event"]             = relationship(back_populates="guests")
    photo_guests: Mapped[list["PhotoGuest"]]  = relationship(back_populates="guest")
