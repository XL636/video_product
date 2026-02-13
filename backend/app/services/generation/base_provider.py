from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum


class JobType(str, Enum):
    IMG2VID = "img2vid"
    TXT2VID = "txt2vid"
    VID2ANIME = "vid2anime"
    STORY = "story"


@dataclass
class GenerationRequest:
    job_type: JobType
    prompt: str
    style_preset: str = "ghibli"
    input_file_url: str | None = None
    style_strength: float = 0.7
    negative_prompt: str = ""
    duration: int = 5
    aspect_ratio: str = "16:9"
    subject_reference_url: str | None = None


@dataclass
class GenerationResult:
    status: str  # processing, completed, failed
    provider_job_id: str
    video_url: str | None = None
    error: str | None = None
    progress: int = 0


class BaseVideoProvider(ABC):
    ANIME_STYLE_PRESETS: dict[str, str] = {
        "ghibli": "studio ghibli style, watercolor, soft lighting, whimsical, miyazaki inspired",
        "shonen": "shonen anime style, dynamic action, bold lines, vibrant colors, dramatic lighting",
        "seinen": "seinen anime style, detailed, mature, realistic proportions, atmospheric",
        "cyberpunk_anime": "cyberpunk anime style, neon lights, futuristic, ghost in the shell inspired",
        "chibi": "chibi anime style, cute, super deformed, big eyes, kawaii",
    }

    @abstractmethod
    async def submit_job(self, request: GenerationRequest) -> str:
        """Submit generation job, return provider_job_id."""
        ...

    @abstractmethod
    async def poll_job(self, provider_job_id: str) -> GenerationResult:
        """Poll job status."""
        ...

    def _build_anime_prompt(self, prompt: str, style_preset: str) -> str:
        style_prefix = self.ANIME_STYLE_PRESETS.get(
            style_preset, self.ANIME_STYLE_PRESETS["ghibli"]
        )
        return f"{style_prefix}, {prompt}"
