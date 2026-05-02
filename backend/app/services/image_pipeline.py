from PIL import Image
import io
import uuid
from app.services.storage_service import upload_to_r2

SIZES = {
    "thumb":    400,
    "preview":  1200,
    "original": None,   # keep as-is
}


async def process_and_upload(file_bytes: bytes, filename: str, event_id: str) -> dict:
    """Generate 3 image versions and upload to R2. Returns dict of CDN URLs."""
    base_id = str(uuid.uuid4())
    urls = {}

    for variant, max_width in SIZES.items():
        img = Image.open(io.BytesIO(file_bytes))
        img = img.convert("RGB")

        if max_width:
            ratio = max_width / img.width
            if ratio < 1:
                new_h = int(img.height * ratio)
                img = img.resize((max_width, new_h), Image.LANCZOS)

        quality = 85 if variant == "thumb" else 90
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        buf.seek(0)

        key = f"{event_id}/{variant}/{base_id}.jpg"
        url = await upload_to_r2(buf.read(), key, content_type="image/jpeg")
        urls[f"url_{variant}"] = url

    return urls
