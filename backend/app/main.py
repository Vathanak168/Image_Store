import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import gallery, events, guests, photos, auth
from app.core.database import engine, Base

# Import all models so Base.metadata knows about them
from app.models import event, guest, photo  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables on startup (dev mode with SQLite)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Event Photo Delivery API",
    version="1.0.0",
    description="Premium event photo delivery platform — Backend API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded photos from /static/...
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=uploads_dir), name="static")

app.include_router(auth.router)
app.include_router(gallery.router)
app.include_router(events.router)
app.include_router(guests.router)
app.include_router(photos.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
