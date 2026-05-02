import asyncio
import os
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.event import Event
from app.models.table import EventTable
from app.models.photo import Photo
from app.models.session import Session
from datetime import date
import uuid

async def create_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        event_id = uuid.uuid4()
        event = Event(
            id=event_id,
            name="អាពាហ៍ពិពាហ៍ វឌ្ឍនៈ (Multi-Session)",
            date=date(2026, 5, 2),
            venue="Sokha Hotel",
            slug="vathanak-wedding-ms",
            accent_color="#C9A96E",
            status="published",
            is_multi_session=True,
            table_count=10,
            table_naming="numeric",
            features={
                "face_scan": True,
                "qr_access": True,
                "table_browse": True,
                "download": True,
                "show_suggested": True
            }
        )
        db.add(event)
        
        # Add Sessions
        sess1_id = uuid.uuid4()
        sess2_id = uuid.uuid4()
        sess3_id = uuid.uuid4()
        db.add_all([
            Session(id=sess1_id, event_id=event_id, name="ហែរជំនួន", order=1, icon="🎁"),
            Session(id=sess2_id, event_id=event_id, name="កាត់សក់", order=2, icon="✂️"),
            Session(id=sess3_id, event_id=event_id, name="ទទួលភ្ញៀវ", order=3, icon="🥂")
        ])

        # Add tables
        tbl1_id = uuid.uuid4()
        tbl2_id = uuid.uuid4()
        db.add_all([
            EventTable(id=tbl1_id, event_id=event_id, table_number=1, name="Table 1", photo_count=5),
            EventTable(id=tbl2_id, event_id=event_id, table_number=2, name="Table 2", photo_count=5)
        ])
        
        # Add mock photos to sessions
        photos = []
        for i in range(15):
            table_id = tbl1_id if i < 5 else tbl2_id
            
            # distribute photos across sessions
            session_id = sess1_id
            if i >= 5 and i < 10:
                session_id = sess2_id
            elif i >= 10:
                session_id = sess3_id
                
            photos.append(Photo(
                id=uuid.uuid4(),
                event_id=event_id,
                session_id=session_id,
                filename=f"DSC_000{i}.jpg",
                url_thumb=f"https://picsum.photos/seed/{i+200}/400/500",
                url_preview=f"https://picsum.photos/seed/{i+200}/1200/1500",
                url_original=f"https://picsum.photos/seed/{i+200}/3000/3750",
                table_id=table_id,
                status="published"
            ))
        db.add_all(photos)
        
        await db.commit()
        print(f"{event_id}")

if __name__ == "__main__":
    asyncio.run(create_event())
