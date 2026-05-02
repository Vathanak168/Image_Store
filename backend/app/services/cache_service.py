"""
In-memory cache service for high-concurrency gallery responses.
Handles 1000+ simultaneous users by serving cached gallery data
instead of hitting the database on every request.

For multi-server deployments: replace with Redis cache.
For single-server (current setup): this in-memory cache is sufficient.
"""
import asyncio
from typing import Any
from datetime import datetime, timedelta

# Cache store: { key: (value, expires_at) }
_cache: dict[str, tuple[Any, datetime]] = {}
_lock = asyncio.Lock()


async def get_cache(key: str) -> Any | None:
    """Return cached value if not expired, else None."""
    async with _lock:
        entry = _cache.get(key)
        if entry:
            value, expires_at = entry
            if datetime.utcnow() < expires_at:
                return value
            del _cache[key]
    return None


async def set_cache(key: str, value: Any, ttl_seconds: int = 60) -> None:
    """Store value in cache with TTL in seconds."""
    async with _lock:
        _cache[key] = (value, datetime.utcnow() + timedelta(seconds=ttl_seconds))


async def invalidate_event_cache(event_id: str) -> None:
    """Invalidate all cache entries for a specific event.
    Called when admin publishes/unpublishes a photo.
    """
    async with _lock:
        keys_to_delete = [k for k in _cache if event_id in k]
        for k in keys_to_delete:
            del _cache[k]


async def invalidate_guest_cache(guest_id: str) -> None:
    """Invalidate cache for a specific guest gallery."""
    async with _lock:
        key = f"gallery:{guest_id}"
        if key in _cache:
            del _cache[key]


def cache_stats() -> dict:
    """Return cache statistics for monitoring."""
    now = datetime.utcnow()
    active = sum(1 for _, (_, exp) in _cache.items() if now < exp)
    return {"total_keys": len(_cache), "active_keys": active}
