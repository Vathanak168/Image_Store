from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# SQLite needs connect_args for async; PostgreSQL does not
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    # ── Connection Pool Tuning (for 1000 concurrent users) ──
    # pool_size: base persistent connections kept alive
    # max_overflow: extra connections allowed under peak load
    # pool_timeout: max seconds to wait for a free connection
    # pool_recycle: recycle connections every hour to prevent stale
    # pool_pre_ping: verify connection is alive before use
    **({} if settings.DATABASE_URL.startswith("sqlite") else {
        "pool_size":     20,
        "max_overflow":  40,
        "pool_timeout":  30,
        "pool_recycle":  3600,
        "pool_pre_ping": True,
    })
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

