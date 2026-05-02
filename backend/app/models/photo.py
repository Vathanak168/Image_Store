import uuid
from sqlalchemy import String, Integer, Text, ForeignKey, Float, Uuid, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.database import Base


class Photo(Base):
    __tablename__ = "photos"
    __table_args__ = (
        # Performance indexes for 1000-concurrent-user queries
        Index("ix_photos_event_id_status", "event_id", "status"),
        Index("ix_photos_session_id",      "session_id"),
    )

    id:           Mapped[uuid.UUID]   = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_id:     Mapped[uuid.UUID]   = mapped_column(ForeignKey("events.id"))
    session_id:   Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sessions.id"), nullable=True)
    filename:     Mapped[str]         = mapped_column(String(255))
    url_thumb:    Mapped[str]         = mapped_column(Text)
    url_preview:  Mapped[str]         = mapped_column(Text)
    url_original: Mapped[str]              = mapped_column(Text)
    table_tag:    Mapped[int | None]       = mapped_column(Integer) # Legacy fallback
    table_id:     Mapped[uuid.UUID | None] = mapped_column(ForeignKey("event_tables.id"), nullable=True)
    ai_faces:     Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status:       Mapped[str]         = mapped_column(String(20), default="staged")
    uploaded_at:  Mapped[datetime]    = mapped_column(default=datetime.utcnow)

    event:        Mapped["Event"]            = relationship(back_populates="photos")
    session:      Mapped["Session | None"]   = relationship(back_populates="photos")
    event_table:  Mapped["EventTable | None"]= relationship(back_populates="photos")
    photo_guests: Mapped[list["PhotoGuest"]] = relationship(back_populates="photo")


class PhotoGuest(Base):
    __tablename__ = "photo_guests"
    __table_args__ = (
        # Critical index: guest gallery query hits this for every user
        Index("ix_photo_guests_guest_id", "guest_id"),
    )

    photo_id:   Mapped[uuid.UUID] = mapped_column(ForeignKey("photos.id"), primary_key=True)
    guest_id:   Mapped[uuid.UUID] = mapped_column(ForeignKey("guests.id"), primary_key=True)
    confidence: Mapped[float]     = mapped_column(Float, default=0.0)
    matched_by: Mapped[str]       = mapped_column(String(20), default="ai")

    photo: Mapped["Photo"] = relationship(back_populates="photo_guests")
    guest: Mapped["Guest"] = relationship(back_populates="photo_guests")


class AccessLog(Base):
    __tablename__ = "access_logs"
    __table_args__ = (
        Index("ix_access_logs_created_at", "created_at"),
    )

    id:         Mapped[uuid.UUID]        = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    guest_id:   Mapped[uuid.UUID]        = mapped_column(ForeignKey("guests.id"))
    photo_id:   Mapped[uuid.UUID | None] = mapped_column(ForeignKey("photos.id"), nullable=True)
    action:     Mapped[str]              = mapped_column(String(20))
    created_at: Mapped[datetime]         = mapped_column(default=datetime.utcnow)

