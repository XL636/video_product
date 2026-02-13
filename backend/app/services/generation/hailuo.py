import httpx

from app.services.generation.base_provider import (
    BaseVideoProvider,
    GenerationRequest,
    GenerationResult,
    JobType,
)

HAILUO_API_BASE = "https://api.minimaxi.chat/v1"


class HailuoProvider(BaseVideoProvider):
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def submit_job(self, request: GenerationRequest) -> str:
        enhanced_prompt = self._build_anime_prompt(request.prompt, request.style_preset)

        async with httpx.AsyncClient(timeout=60) as client:
            if request.job_type == JobType.TXT2VID or request.job_type == JobType.STORY:
                payload = self._build_txt2vid_payload(request, enhanced_prompt)
                response = await client.post(
                    f"{HAILUO_API_BASE}/video_generation",
                    json=payload,
                    headers=self.headers,
                )
            elif request.job_type == JobType.IMG2VID:
                payload = self._build_img2vid_payload(request, enhanced_prompt)
                response = await client.post(
                    f"{HAILUO_API_BASE}/video_generation",
                    json=payload,
                    headers=self.headers,
                )
            elif request.job_type == JobType.VID2ANIME:
                payload = self._build_vid2anime_payload(request, enhanced_prompt)
                response = await client.post(
                    f"{HAILUO_API_BASE}/video_generation",
                    json=payload,
                    headers=self.headers,
                )
            else:
                raise ValueError(f"Unsupported job type for Hailuo: {request.job_type}")

            response.raise_for_status()
            data = response.json()

            task_id = data.get("task_id")
            if not task_id:
                task_id = data.get("data", {}).get("task_id")
            if not task_id:
                raise RuntimeError(f"Hailuo API did not return a task_id: {data}")

            return task_id

    async def poll_job(self, provider_job_id: str) -> GenerationResult:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{HAILUO_API_BASE}/query/video_generation",
                params={"task_id": provider_job_id},
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()

        status = data.get("status", "unknown")

        if status == "Success":
            file_id = data.get("file_id")
            video_url = None
            if file_id:
                video_url = f"{HAILUO_API_BASE}/files/retrieve?file_id={file_id}"
            else:
                video_url = data.get("video_url")
            return GenerationResult(
                status="completed",
                provider_job_id=provider_job_id,
                video_url=video_url,
                progress=100,
            )
        elif status in ("Fail", "Failed"):
            error_msg = data.get("base_resp", {}).get("status_msg", "Generation failed")
            return GenerationResult(
                status="failed",
                provider_job_id=provider_job_id,
                error=error_msg,
            )
        else:
            progress = 0
            if status == "Processing":
                progress = 50
            elif status == "Queueing":
                progress = 10
            return GenerationResult(
                status="processing",
                provider_job_id=provider_job_id,
                progress=progress,
            )

    def _build_txt2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        payload: dict = {
            "model": "video-01",
            "prompt": enhanced_prompt,
        }
        if request.negative_prompt:
            payload["prompt_optimizer"] = True
        return payload

    def _build_img2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        payload: dict = {
            "model": "video-01",
            "prompt": enhanced_prompt,
            "first_frame_image": request.input_file_url,
        }
        return payload

    def _build_vid2anime_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        payload: dict = {
            "model": "video-01",
            "prompt": enhanced_prompt,
            "first_frame_image": request.input_file_url,
        }
        return payload
