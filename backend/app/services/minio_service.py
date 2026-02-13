import io
import uuid
from datetime import timedelta

from minio import Minio
from minio.error import S3Error

from app.config import settings

_client: Minio | None = None


def get_minio_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
    return _client


def ensure_bucket_exists() -> None:
    client = get_minio_client()
    bucket = settings.MINIO_BUCKET
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)


def upload_file(
    data: bytes,
    object_name: str | None = None,
    content_type: str = "application/octet-stream",
    extension: str = "",
) -> str:
    """Upload bytes to MinIO and return the object URL."""
    client = get_minio_client()
    bucket = settings.MINIO_BUCKET

    if object_name is None:
        object_name = f"{uuid.uuid4().hex}{extension}"

    client.put_object(
        bucket,
        object_name,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )

    return f"http://{settings.MINIO_ENDPOINT}/{bucket}/{object_name}"


def upload_file_stream(
    data_stream: io.BytesIO,
    length: int,
    object_name: str,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload a stream to MinIO and return the object URL."""
    client = get_minio_client()
    bucket = settings.MINIO_BUCKET

    client.put_object(
        bucket,
        object_name,
        data_stream,
        length=length,
        content_type=content_type,
    )

    return f"http://{settings.MINIO_ENDPOINT}/{bucket}/{object_name}"


def get_presigned_url(object_name: str, expires: timedelta = timedelta(hours=1)) -> str:
    """Get a presigned URL for downloading an object."""
    client = get_minio_client()
    return client.presigned_get_object(
        settings.MINIO_BUCKET,
        object_name,
        expires=expires,
    )


def delete_object(object_name: str) -> None:
    """Delete an object from MinIO."""
    client = get_minio_client()
    client.remove_object(settings.MINIO_BUCKET, object_name)


def download_object(object_name: str) -> bytes:
    """Download an object from MinIO and return as bytes."""
    client = get_minio_client()
    response = None
    try:
        response = client.get_object(settings.MINIO_BUCKET, object_name)
        return response.read()
    finally:
        if response is not None:
            response.close()
            response.release_conn()
