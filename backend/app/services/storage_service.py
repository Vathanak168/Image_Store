import os
import boto3
from app.core.config import settings

_s3_client = None
_LOCAL_MODE = settings.R2_ENDPOINT == "local"
_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


def _get_s3():
    """Lazy-initialize the S3/R2 client (skipped in local mode)."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY,
            aws_secret_access_key=settings.R2_SECRET_KEY,
        )
    return _s3_client


async def upload_to_r2(file_bytes: bytes, key: str, content_type: str) -> str:
    if _LOCAL_MODE:
        # Save to local disk
        path = os.path.join(_UPLOAD_DIR, key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(file_bytes)
        return f"{settings.CDN_BASE_URL}/{key}"

    _get_s3().put_object(
        Bucket=settings.R2_BUCKET,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
        CacheControl="public, max-age=31536000",
    )
    return f"{settings.CDN_BASE_URL}/{key}"


async def generate_signed_download_url(key: str, expires: int = 3600) -> str:
    if _LOCAL_MODE:
        return f"{settings.CDN_BASE_URL}/{key}"

    return _get_s3().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.R2_BUCKET, "Key": key},
        ExpiresIn=expires,
    )
