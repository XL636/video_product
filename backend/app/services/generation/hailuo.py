import httpx

from app.services.generation.base_provider import (
    BaseVideoProvider,
    GenerationRequest,
    GenerationResult,
    JobType,
)

JIMENG_API_BASE = "https://ark.cn-beijing.volces.com/api/v3"


class JimengProvider(BaseVideoProvider):
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
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
                raise ValueError(f"Unsupported job type for Jimeng: {request.job_type}")

            response = await client.post(
                f"{JIMENG_API_BASE}/videos/generations",
                json=payload,
                headers=self.headers,
            )
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
                f"{JIMENG_API_BASE}/videos/generations/{provider_job_id}",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()

        status = data.get("status", "unknown")

        if status == "completed":
            video_url = None
            content = data.get("content", [])
            if content and isinstance(content, list):
                video_url = content[0].get("url")
            if not video_url:
                video_url = data.get("video_url")
            return GenerationResult(
                status="completed",
                provider_job_id=provider_job_id,
                video_url=video_url,
                progress=100,
            )
        elif status == "failed":
            error_msg = data.get("error", {}).get("message", "Generation failed")
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
            "model": "seedance-1.0-lite",
            "content": [{"type": "text", "text": enhanced_prompt}],
        }

    def _build_img2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        return {
            "model": "seedance-1.0-lite-i2v",
            "content": [
                {"type": "image_url", "image_url": {"url": request.input_file_url}},
                {"type": "text", "text": enhanced_prompt},
            ],
        }

    def _build_vid2anime_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        return {
            "model": "seedance-1.0-lite-i2v",
            "content": [
                {"type": "image_url", "image_url": {"url": request.input_file_url}},
                {"type": "text", "text": enhanced_prompt},
            ],
        }


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
