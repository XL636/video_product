import httpx

from app.services.generation.base_provider import (
    BaseVideoProvider,
    GenerationRequest,
    GenerationResult,
    JobType,
)

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
            payload = self._build_img2vid_payload(request, enhanced_prompt)
        elif request.job_type in (JobType.TXT2VID, JobType.STORY):
            payload = self._build_txt2vid_payload(request, enhanced_prompt)
        elif request.job_type == JobType.VID2ANIME:
            payload = self._build_img2vid_payload(request, enhanced_prompt)
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
            response.raise_for_status()
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
            "with_audio": False,
            "size": self._map_size(request.aspect_ratio),
            "fps": 30,
            "duration": request.duration if request.duration in (5, 10) else 5,
        }
        return payload

    def _build_img2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        payload: dict = {
            "model": "cogvideox-3",
            "prompt": enhanced_prompt,
            "quality": "quality",
            "with_audio": False,
            "size": self._map_size(request.aspect_ratio),
            "fps": 30,
            "duration": request.duration if request.duration in (5, 10) else 5,
        }
        if request.input_file_url:
            payload["image_url"] = [request.input_file_url]
        return payload

    @staticmethod
    def _map_size(aspect_ratio: str) -> str:
        """Map aspect ratio string to CogVideoX size parameter."""
        mapping = {
            "16:9": "1280x720",
            "9:16": "720x1280",
            "1:1": "1024x1024",
        }
        return mapping.get(aspect_ratio, "1280x720")
