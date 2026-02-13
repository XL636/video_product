import uuid
from datetime import datetime

from pydantic import BaseModel


class JobResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    job_type: str
    provider: str
    status: str
    provider_job_id: str | None = None
    prompt: str | None = None
    style_preset: str | None = None
    input_file_url: str | None = None
    output_video_url: str | None = None
    thumbnail_url: str | None = None
    error_message: str | None = None
    progress: int = 0
    metadata_json: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    items: list[JobResponse]
    total: int
    page: int
    page_size: int
