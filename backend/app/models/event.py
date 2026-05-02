import uuid
from sqlalchemy import String, Date, Uuid, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from app.core.database import Base


DEFAULT_FEATURES = {
    "face_scan":      True,
    "qr_access":      True,
    "table_browsing": True,
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
    status:           Mapped[str]       = mapped_column(String(20), default="draft")
    is_multi_session: Mapped[bool]      = mapped_column(Boolean, default=False)
    features:         Mapped[dict]      = mapped_column(JSON, default=DEFAULT_FEATURES)

    guests:   Mapped[list["Guest"]]      = relationship(back_populates="event")
    photos:   Mapped[list["Photo"]]      = relationship(back_populates="event")
    sessions: Mapped[list["Session"]]    = relationship(back_populates="event", order_by="Session.order")
    tables:   Mapped[list["EventTable"]] = relationship(back_populates="event", order_by="EventTable.table_number")
