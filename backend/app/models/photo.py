import uuid
from sqlalchemy import String, Integer, Text, ForeignKey, Float, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.database import Base


class Photo(Base):
    __tablename__ = "photos"

    id:           Mapped[uuid.UUID]   = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_id:     Mapped[uuid.UUID]   = mapped_column(ForeignKey("events.id"))
    filename:     Mapped[str]         = mapped_column(String(255))
    url_thumb:    Mapped[str]         = mapped_column(Text)
    url_preview:  Mapped[str]         = mapped_column(Text)
    url_original: Mapped[str]         = mapped_column(Text)
    table_tag:    Mapped[int | None]  = mapped_column(Integer)
    ai_faces:     Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status:       Mapped[str]         = mapped_column(String(20), default="staged")
    uploaded_at:  Mapped[datetime]    = mapped_column(default=datetime.utcnow)

    event:        Mapped["Event"]            = relationship(back_populates="photos")
    photo_guests: Mapped[list["PhotoGuest"]] = relationship(back_populates="photo")


class PhotoGuest(Base):
    __tablename__ = "photo_guests"

    photo_id:   Mapped[uuid.UUID] = mapped_column(ForeignKey("photos.id"), primary_key=True)
    guest_id:   Mapped[uuid.UUID] = mapped_column(ForeignKey("guests.id"), primary_key=True)
    confidence: Mapped[float]     = mapped_column(Float, default=0.0)
    matched_by: Mapped[str]       = mapped_column(String(20), default="ai")

    photo: Mapped["Photo"] = relationship(back_populates="photo_guests")
    guest: Mapped["Guest"] = relationship(back_populates="photo_guests")


class AccessLog(Base):
    __tablename__ = "access_logs"

    id:         Mapped[uuid.UUID]      = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    guest_id:   Mapped[uuid.UUID]      = mapped_column(ForeignKey("guests.id"))
    photo_id:   Mapped[uuid.UUID | None] = mapped_column(ForeignKey("photos.id"), nullable=True)
    action:     Mapped[str]            = mapped_column(String(20))
    created_at: Mapped[datetime]       = mapped_column(default=datetime.utcnow)
