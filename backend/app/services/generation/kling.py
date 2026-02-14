import httpx

from app.services.generation.base_provider import (
    BaseVideoProvider,
    GenerationRequest,
    GenerationResult,
    JobType,
)

KLING_API_BASE = "https://api.klingai.com/v1"


class KlingProvider(BaseVideoProvider):
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def submit_job(self, request: GenerationRequest) -> str:
        enhanced_prompt = self._build_anime_prompt(request.prompt, request.style_preset)

        async with httpx.AsyncClient(timeout=60) as client:
            if request.job_type == JobType.IMG2VID:
                payload = self._build_img2vid_payload(request, enhanced_prompt)
                response = await client.post(
                    f"{KLING_API_BASE}/videos/image2video",
                    json=payload,
                    headers=self.headers,
                )
            elif request.job_type in (JobType.TXT2VID, JobType.STORY):
                payload = self._build_txt2vid_payload(request, enhanced_prompt)
                response = await client.post(
                    f"{KLING_API_BASE}/videos/text2video",
                    json=payload,
                    headers=self.headers,
                )
            elif request.job_type == JobType.VID2ANIME:
                payload = self._build_vid2anime_payload(request, enhanced_prompt)
                response = await client.post(
                    f"{KLING_API_BASE}/videos/image2video",
                    json=payload,
                    headers=self.headers,
                )
            else:
                raise ValueError(f"Unsupported job type: {request.job_type}")

            response.raise_for_status()
            data = response.json()

            task_id = data.get("data", {}).get("task_id")
            if not task_id:
                raise RuntimeError(f"Kling API did not return a task_id: {data}")

            return task_id

    async def poll_job(self, provider_job_id: str) -> GenerationResult:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{KLING_API_BASE}/videos/{provider_job_id}",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()

        task_data = data.get("data", {})
        status = task_data.get("task_status", "unknown")

        if status == "succeed":
            videos = task_data.get("task_result", {}).get("videos", [])
            video_url = videos[0].get("url") if videos else None
            return GenerationResult(
                status="completed",
                provider_job_id=provider_job_id,
                video_url=video_url,
                progress=100,
            )
        elif status == "failed":
            error_msg = task_data.get("task_status_msg", "Generation failed")
            return GenerationResult(
                status="failed",
                provider_job_id=provider_job_id,
                error=error_msg,
            )
        else:
            progress = task_data.get("progress", 0)
            if isinstance(progress, str):
                progress = int(float(progress.rstrip("%"))) if progress else 0
            return GenerationResult(
                status="processing",
                provider_job_id=provider_job_id,
                progress=progress,
            )

    def _build_txt2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        payload: dict = {
            "prompt": enhanced_prompt,
            "duration": str(request.duration),
            "aspect_ratio": request.aspect_ratio,
            "model_name": "kling-v1-6",
        }
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt
        return payload

    def _build_img2vid_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        payload: dict = {
            "prompt": enhanced_prompt,
            "image": request.input_file_url,
            "duration": str(request.duration),
            "aspect_ratio": request.aspect_ratio,
            "model_name": "kling-v1-6",
        }
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt
        if request.subject_reference_url:
            payload["subject_reference"] = request.subject_reference_url
        return payload

    def _build_vid2anime_payload(
        self, request: GenerationRequest, enhanced_prompt: str
    ) -> dict:
        return {
            "prompt": enhanced_prompt,
            "image": request.input_file_url,
            "duration": str(request.duration),
            "aspect_ratio": request.aspect_ratio,
            "model_name": "kling-v1-6",
            "cfg_scale": request.style_strength,
        }
