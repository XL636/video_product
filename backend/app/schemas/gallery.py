import uuid
from datetime import datetime

from pydantic import BaseModel


class VideoResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    job_id: uuid.UUID | None = None
    title: str
    url: str
    thumbnail_url: str | None = None
    duration: float | None = None
    width: int | None = None
    height: int | None = None
    file_size: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class GalleryListResponse(BaseModel):
    items: list[VideoResponse]
    total: int
    page: int
    page_size: int
