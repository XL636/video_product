from datetime import datetime

from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    provider: str = Field(..., pattern=r"^(kling|jimeng|vidu|cogvideo|comfyui)$")
    api_key: str = Field(..., min_length=1, max_length=500)


class ApiKeyResponse(BaseModel):
    provider: str
    configured: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ApiKeyListResponse(BaseModel):
    keys: list[ApiKeyResponse]
