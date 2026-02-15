import base64
import logging

import httpx

from app.services.generation.base_provider import (
    BaseVideoProvider,
    GenerationRequest,
    GenerationResult,
    JobType,
)

logger = logging.getLogger(__name__)

ZHIPU_API_BASE = "https://open.bigmodel.cn/api/paas/v4"


class CogVideoProvider(BaseVideoProvider):
    """ZhipuAI CogVideoX-3 video generation provider."""

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def submit_job(self, request: GenerationRequest) -> str:
        enhanced_prompt = self._build_anime_prompt(request.prompt, request.style_preset)

        if request.job_type == JobType.IMG2VID:
            payload = await self._build_img2vid_payload(request, enhanced_prompt)
        elif request.job_type in (JobType.TXT2VID, JobType.STORY):
            payload = self._build_txt2vid_payload(request, enhanced_prompt)
        elif request.job_type == JobType.VID2ANIME:
            payload = await self._build_img2vid_payload(request, enhanced_prompt)
        else:
            raise ValueError(f"Unsupported job type for CogVideo: {request.job_type}")

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{ZHIPU_API_BASE}/videos/generations",
                json=payload,
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()

        task_id = data.get("id")
        if not task_id:
            raise RuntimeError(f"ZhipuAI API did not return an id: {data}")

        return task_id

    async def poll_job(self, provider_job_id: str) -> GenerationResult:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{ZHIPU_API_BASE}/async-result/{provider_job_id}",
                headers=self.headers,
            )
            if response.status_code >= 400:
                try:
                    err_data = response.json()
                    err_msg = err_data.get("message") or err_data.get("error", {}).get("message", str(err_data))
                except Exception:
                    err_msg = response.text
                return GenerationResult(
                    status="failed",
                    provider_job_id=provider_job_id,
                    error=f"ZhipuAI API error ({response.status_code}): {err_msg}",
                )
            data = response.json()

        task_status = data.get("task_status", "PROCESSING")

        if task_status == "SUCCESS":
            video_url = None
            video_result = data.get("video_result", [])
            if isinstance(video_result, list) and video_result:
                video_url = video_result[0].get("url")
            elif isinstance(video_result, dict):
                video_url = video_result.get("url")
            return GenerationResult(
                status="completed",
                provider_job_id=provider_job_id,
                video_url=video_url,
                progress=100,
            )
        elif task_status == "FAIL":
            error_msg = data.get("message", "Video generation failed")
            return GenerationResult(
                status="failed",
                provider_job_id=provider_job_id,
                error=error_msg,
            )
        else:
            return GenerationResult(
                status="processing",
                provider_job_id=provider_job_id,
                progress=50,
            )

    def _build_txt2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        payload: dict = {
            "model": "cogvideox-3",
            "prompt": enhanced_prompt,
            "quality": "quality",
            "with_audio": True,
            "size": self._map_size(request.aspect_ratio),
            "fps": 30,
            "duration": request.duration if request.duration in (5, 10) else 5,
        }
        return payload

    async def _build_img2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        payload: dict = {
            "model": "cogvideox-3",
            "prompt": enhanced_prompt,
            "quality": "quality",
            "with_audio": True,
            "size": self._map_size(request.aspect_ratio),
            "fps": 30,
            "duration": request.duration if request.duration in (5, 10) else 5,
        }
        if request.input_file_url:
            image_data = await self._fetch_image_as_base64(request.input_file_url)
            payload["image_url"] = image_data
        return payload

    @staticmethod
    async def _fetch_image_as_base64(url: str) -> str:
        """Download image from URL and return as base64 data URI."""
        from app.config import settings

        # Replace public MinIO endpoint with internal Docker endpoint
        public_base = settings.minio_public_url_base
        internal_base = f"http://{settings.MINIO_ENDPOINT}"
        fetch_url = url.replace(public_base, internal_base)

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(fetch_url)
            resp.raise_for_status()
        content_type = resp.headers.get("content-type", "image/jpeg")
        b64 = base64.b64encode(resp.content).decode()
        return f"data:{content_type};base64,{b64}"

    @staticmethod
    def _map_size(aspect_ratio: str) -> str:
        """Map aspect ratio string to CogVideoX size parameter."""
        mapping = {
            "16:9": "1280x720",
            "9:16": "720x1280",
            "1:1": "1024x1024",
        }
        return mapping.get(aspect_ratio, "1280x720")
