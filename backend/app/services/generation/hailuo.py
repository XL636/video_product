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

JIMENG_API_BASE = "https://ark.cn-beijing.volces.com/api/v3"

# 火山方舟 Seedance 模型 ID
# TODO: upgrade to seedance-2.0 when available
SEEDANCE_MODEL_T2V = "doubao-seedance-1-5-pro-251215"
SEEDANCE_MODEL_I2V = "doubao-seedance-1-5-pro-251215"


class JimengProvider(BaseVideoProvider):
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def submit_job(self, request: GenerationRequest) -> str:
        enhanced_prompt = self._build_anime_prompt(request.prompt, request.style_preset)

        if request.job_type in (JobType.TXT2VID, JobType.STORY):
            payload = self._build_txt2vid_payload(request, enhanced_prompt)
        elif request.job_type == JobType.IMG2VID:
            payload = await self._build_img2vid_payload(request, enhanced_prompt)
        elif request.job_type == JobType.VID2ANIME:
            payload = await self._build_vid2anime_payload(request, enhanced_prompt)
        else:
            raise ValueError(f"Unsupported job type for Jimeng: {request.job_type}")

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{JIMENG_API_BASE}/contents/generations/tasks",
                json=payload,
                headers=self.headers,
            )
            if response.status_code >= 400:
                logger.error("Jimeng API error %s: %s", response.status_code, response.text)
            response.raise_for_status()
            data = response.json()

            task_id = data.get("id")
            if not task_id:
                task_id = data.get("data", {}).get("id")
            if not task_id:
                raise RuntimeError(f"Jimeng API did not return an id: {data}")

            return task_id

    async def poll_job(self, provider_job_id: str) -> GenerationResult:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{JIMENG_API_BASE}/contents/generations/tasks/{provider_job_id}",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()

        status = data.get("status", "unknown")

        if status == "succeeded":
            video_url = None
            content = data.get("content", {})
            if isinstance(content, dict):
                video_url = content.get("video_url")
            elif isinstance(content, list) and content:
                video_url = content[0].get("video_url") or content[0].get("url")
            if not video_url:
                video_url = data.get("video_url")
            return GenerationResult(
                status="completed",
                provider_job_id=provider_job_id,
                video_url=video_url,
                progress=100,
            )
        elif status in ("failed", "expired"):
            error_msg = data.get("error", {}).get("message", "Generation failed")
            return GenerationResult(
                status="failed",
                provider_job_id=provider_job_id,
                error=error_msg,
            )
        else:
            # queued, running, submitted
            progress = 30 if status == "queued" else 60
            return GenerationResult(
                status="processing",
                provider_job_id=provider_job_id,
                progress=progress,
            )

    def _append_video_params(self, prompt: str, request: GenerationRequest) -> str:
        """Append inline video parameters to the prompt text."""
        ratio = request.aspect_ratio or "16:9"
        dur = request.duration or 5
        return f"{prompt} --ratio {ratio} --dur {dur} --watermark false"

    def _build_txt2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        text = self._append_video_params(enhanced_prompt, request)
        return {
            "model": SEEDANCE_MODEL_T2V,
            "content": [{"type": "text", "text": text}],
        }

    async def _build_img2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        text = self._append_video_params(enhanced_prompt, request)
        image_url = request.input_file_url
        if image_url:
            image_url = await self._fetch_image_as_base64(image_url)
        return {
            "model": SEEDANCE_MODEL_I2V,
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": text},
            ],
        }

    async def _build_vid2anime_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        text = self._append_video_params(enhanced_prompt, request)
        image_url = request.input_file_url
        if image_url:
            image_url = await self._fetch_image_as_base64(image_url)
        return {
            "model": SEEDANCE_MODEL_I2V,
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": text},
            ],
        }

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


VIDU_API_BASE = "https://api.vidu.com/ent/v1"


class ViduProvider(BaseVideoProvider):
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Token {api_key}",
            "Content-Type": "application/json",
        }

    async def submit_job(self, request: GenerationRequest) -> str:
        enhanced_prompt = self._build_anime_prompt(request.prompt, request.style_preset)

        async with httpx.AsyncClient(timeout=60) as client:
            if request.job_type in (JobType.TXT2VID, JobType.STORY):
                payload = self._build_txt2vid_payload(request, enhanced_prompt)
            elif request.job_type == JobType.IMG2VID:
                payload = self._build_img2vid_payload(request, enhanced_prompt)
            elif request.job_type == JobType.VID2ANIME:
                payload = self._build_vid2anime_payload(request, enhanced_prompt)
            else:
                raise ValueError(f"Unsupported job type for Vidu: {request.job_type}")

            response = await client.post(
                f"{VIDU_API_BASE}/tasks",
                json=payload,
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()

            task_id = data.get("task_id")
            if not task_id:
                task_id = data.get("id")
            if not task_id:
                raise RuntimeError(f"Vidu API did not return a task_id: {data}")

            return task_id

    async def poll_job(self, provider_job_id: str) -> GenerationResult:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{VIDU_API_BASE}/tasks/{provider_job_id}",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()

        status = data.get("status", "unknown")

        if status == "success":
            video_url = None
            creations = data.get("creations", [])
            if creations and isinstance(creations, list):
                video_url = creations[0].get("url")
            if not video_url:
                video_url = data.get("video_url")
            return GenerationResult(
                status="completed",
                provider_job_id=provider_job_id,
                video_url=video_url,
                progress=100,
            )
        elif status == "fail":
            error_msg = data.get("err_msg", "Generation failed")
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
        return {
            "type": "text2video",
            "model": "vidu2.0",
            "style": "anime",
            "input": {"prompt": enhanced_prompt},
        }

    def _build_img2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        return {
            "type": "img2video",
            "model": "vidu2.0",
            "style": "anime",
            "input": {
                "prompt": enhanced_prompt,
                "image_url": request.input_file_url,
            },
        }

    def _build_vid2anime_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        return {
            "type": "img2video",
            "model": "vidu2.0",
            "style": "anime",
            "input": {
                "prompt": enhanced_prompt,
                "image_url": request.input_file_url,
            },
        }
