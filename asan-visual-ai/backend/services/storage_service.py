"""MinIO / S3-compatible file storage service."""
from __future__ import annotations

import io
import uuid

from minio import Minio
from minio.error import S3Error

from config import get_settings

settings = get_settings()

_client: Minio | None = None


def get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        # Ensure bucket exists
        try:
            if not _client.bucket_exists(settings.minio_bucket):
                _client.make_bucket(settings.minio_bucket)
        except S3Error:
            pass
    return _client


def upload_bytes(data: bytes, content_type: str = "image/jpeg") -> str:
    """Upload raw bytes and return the object key (UUID-based)."""
    key = f"{uuid.uuid4().hex}"
    client = get_client()
    client.put_object(
        settings.minio_bucket,
        key,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return key


def download_bytes(key: str) -> bytes:
    """Download object by key and return raw bytes."""
    client = get_client()
    response = client.get_object(settings.minio_bucket, key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def presigned_url(key: str, expires_seconds: int = 3600) -> str:
    """Generate a presigned GET URL."""
    from datetime import timedelta
    client = get_client()
    return client.presigned_get_object(
        settings.minio_bucket, key, expires=timedelta(seconds=expires_seconds)
    )
