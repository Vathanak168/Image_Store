import uuid
from sqlalchemy import String, Date, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id:           Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name:         Mapped[str]       = mapped_column(String(255))
    date:         Mapped[date]      = mapped_column(Date)
    venue:        Mapped[str]       = mapped_column(String(255))
    slug:         Mapped[str]       = mapped_column(String(100), unique=True)
    accent_color: Mapped[str]       = mapped_column(String(7), default="#C9A96E")
    status:       Mapped[str]       = mapped_column(String(20), default="draft")

    guests: Mapped[list["Guest"]] = relationship(back_populates="event")
    photos: Mapped[list["Photo"]] = relationship(back_populates="event")
