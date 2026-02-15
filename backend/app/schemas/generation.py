import uuid

from pydantic import BaseModel, Field


class ImageToVideoRequest(BaseModel):
    file_url: str
    prompt: str = Field(default="", max_length=2000)
    style_preset: str = Field(default="ghibli", max_length=50)
    provider: str = Field(default="kling", pattern=r"^(kling|jimeng|vidu|cogvideo|comfyui)$")
    duration: int = Field(default=5, ge=1, le=15)
    aspect_ratio: str = Field(default="16:9")
    negative_prompt: str = Field(default="", max_length=1000)
    subject_reference_url: str | None = None


class TextToVideoRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    style_preset: str = Field(default="ghibli", max_length=50)
    provider: str = Field(default="kling", pattern=r"^(kling|jimeng|vidu|cogvideo|comfyui)$")
    duration: int = Field(default=5, ge=1, le=15)
    aspect_ratio: str = Field(default="16:9")
    negative_prompt: str = Field(default="", max_length=1000)


class VideoToAnimeRequest(BaseModel):
    file_url: str
    style_strength: float = Field(default=0.7, ge=0.0, le=1.0)
    style_preset: str = Field(default="ghibli", max_length=50)
    provider: str = Field(default="comfyui", pattern=r"^(kling|jimeng|vidu|cogvideo|comfyui)$")


class StoryGenerationRequest(BaseModel):
    story_id: uuid.UUID
    provider: str = Field(default="kling", pattern=r"^(kling|jimeng|vidu|cogvideo|comfyui)$")
    style_preset: str = Field(default="ghibli", max_length=50)


class GenerationResponse(BaseModel):
    job_id: uuid.UUID
    status: str
    message: str
