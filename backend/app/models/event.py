import uuid
from sqlalchemy import String, Date, Uuid, Boolean, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from app.core.database import Base


DEFAULT_FEATURES = {
    "face_scan":      True,
    "qr_access":      True,
    "table_browse":   False,   # renamed from table_browsing
    "download":       True,
    "show_suggested": True,
}


class Event(Base):
    __tablename__ = "events"

    id:               Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name:             Mapped[str]       = mapped_column(String(255))
    date:             Mapped[date]      = mapped_column(Date)
    venue:            Mapped[str]       = mapped_column(String(255))
    slug:             Mapped[str]       = mapped_column(String(100), unique=True)
    accent_color:     Mapped[str]       = mapped_column(String(7), default="#C9A96E")
    cover_image_url:  Mapped[str | None] = mapped_column(String(500), nullable=True)
    status:           Mapped[str]       = mapped_column(String(20), default="draft")
    is_multi_session: Mapped[bool]      = mapped_column(Boolean, default=False)
    features:         Mapped[dict]      = mapped_column(JSON, default=DEFAULT_FEATURES)
    table_count:      Mapped[int]       = mapped_column(Integer, default=0)
    table_naming:     Mapped[str]       = mapped_column(String(20), default="numeric")

    guests:   Mapped[list["Guest"]]      = relationship(back_populates="event")
    photos:   Mapped[list["Photo"]]      = relationship(back_populates="event")
    sessions: Mapped[list["Session"]]    = relationship(back_populates="event", order_by="Session.order")
    tables:   Mapped[list["EventTable"]] = relationship(back_populates="event", order_by="EventTable.table_number")
