import uuid
from sqlalchemy import String, Integer, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.database import Base


class Session(Base):
    """Sub-event / program within an event.
    E.g., a wedding might have: Ceremony, Reception, Party, After-Party.
    Photos are tagged to a session so guests can browse by program.
    """
    __tablename__ = "sessions"

    id:        Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_id:  Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"))
    name:      Mapped[str]       = mapped_column(String(255))           # "Ceremony", "Reception"
    order:     Mapped[int]       = mapped_column(Integer, default=0)    # display order
    icon:      Mapped[str | None] = mapped_column(String(10))           # emoji: "💍", "🥂", "🎉"
    cover_url: Mapped[str | None] = mapped_column(String(500))          # cover image URL
    created_at: Mapped[datetime]  = mapped_column(default=datetime.utcnow)

    event:  Mapped["Event"]        = relationship(back_populates="sessions")
    photos: Mapped[list["Photo"]]  = relationship(back_populates="session")
