import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.deps import get_current_user
from app.models.user import User
from app.services.minio_service import upload_file

router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB

EXTENSION_MAP = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}


@router.post("")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> dict:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB",
        )

    extension = EXTENSION_MAP.get(file.content_type, "")
    object_name = f"uploads/{current_user.id}/{uuid.uuid4().hex}{extension}"

    url = upload_file(
        data=contents,
        object_name=object_name,
        content_type=file.content_type or "application/octet-stream",
    )

    return {
        "url": url,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(contents),
    }
