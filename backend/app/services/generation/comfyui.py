import json
import uuid

import httpx

from app.config import settings
from app.services.generation.base_provider import (
    BaseVideoProvider,
    GenerationRequest,
    GenerationResult,
    JobType,
)


class ComfyUIProvider(BaseVideoProvider):
    def __init__(self, api_key: str = "") -> None:
        self.base_url = settings.COMFYUI_URL
        self.client_id = uuid.uuid4().hex

    async def submit_job(self, request: GenerationRequest) -> str:
        enhanced_prompt = self._build_anime_prompt(request.prompt, request.style_preset)
        workflow = self._build_workflow(request, enhanced_prompt)

        payload = {
            "prompt": workflow,
            "client_id": self.client_id,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.base_url}/prompt",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            prompt_id = data.get("prompt_id")
            if not prompt_id:
                raise RuntimeError(f"ComfyUI did not return a prompt_id: {data}")

            return prompt_id

    async def poll_job(self, provider_job_id: str) -> GenerationResult:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self.base_url}/history/{provider_job_id}",
            )
            response.raise_for_status()
            data = response.json()

        if provider_job_id not in data:
            return GenerationResult(
                status="processing",
                provider_job_id=provider_job_id,
                progress=30,
            )

        history = data[provider_job_id]
        status_info = history.get("status", {})
        completed = status_info.get("completed", False)
        status_msg = status_info.get("status_str", "")

        if completed or status_msg == "success":
            outputs = history.get("outputs", {})
            video_url = self._extract_video_url(outputs)
            return GenerationResult(
                status="completed",
                provider_job_id=provider_job_id,
                video_url=video_url,
                progress=100,
            )
        elif status_msg == "error":
            messages = history.get("status", {}).get("messages", [])
            error_text = "; ".join(
                str(m) for m in messages if m
            ) or "ComfyUI workflow failed"
            return GenerationResult(
                status="failed",
                provider_job_id=provider_job_id,
                error=error_text,
            )
        else:
            return GenerationResult(
                status="processing",
                provider_job_id=provider_job_id,
                progress=50,
            )

    def _extract_video_url(self, outputs: dict) -> str | None:
        """Walk ComfyUI outputs to find the generated video file."""
        for node_id, node_output in outputs.items():
            if "videos" in node_output:
                videos = node_output["videos"]
                if videos:
                    video = videos[0]
                    filename = video.get("filename", "")
                    subfolder = video.get("subfolder", "")
                    vtype = video.get("type", "output")
                    return (
                        f"{self.base_url}/view?"
                        f"filename={filename}&subfolder={subfolder}&type={vtype}"
                    )
            if "gifs" in node_output:
                gifs = node_output["gifs"]
                if gifs:
                    gif = gifs[0]
                    filename = gif.get("filename", "")
                    subfolder = gif.get("subfolder", "")
                    return (
                        f"{self.base_url}/view?"
                        f"filename={filename}&subfolder={subfolder}&type=output"
                    )
        return None

    def _build_workflow(self, request: GenerationRequest, enhanced_prompt: str) -> dict:
        """Build a Wan2.1 AnimateDiff-style workflow for ComfyUI."""
        negative_prompt = request.negative_prompt or (
            "low quality, blurry, distorted, deformed, ugly, bad anatomy, "
            "watermark, text, logo, signature"
        )

        width, height = self._parse_aspect_ratio(request.aspect_ratio)
        steps = 20
        cfg_scale = 7.0

        workflow: dict = {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": "wan2.1_anime.safetensors",
                },
            },
            "2": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": enhanced_prompt,
                    "clip": ["1", 1],
                },
            },
            "3": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative_prompt,
                    "clip": ["1", 1],
                },
            },
            "4": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": request.duration * 8,
                },
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["1", 0],
                    "positive": ["2", 0],
                    "negative": ["3", 0],
                    "latent_image": ["4", 0],
                    "seed": -1,
                    "steps": steps,
                    "cfg": cfg_scale,
                    "sampler_name": "euler_ancestral",
                    "scheduler": "normal",
                    "denoise": 1.0 if request.job_type == JobType.TXT2VID else request.style_strength,
                },
            },
            "6": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["5", 0],
                    "vae": ["1", 2],
                },
            },
            "7": {
                "class_type": "VHS_VideoCombine",
                "inputs": {
                    "images": ["6", 0],
                    "frame_rate": 8,
                    "loop_count": 0,
                    "filename_prefix": "anime_gen",
                    "format": "video/h264-mp4",
                    "pingpong": False,
                    "save_output": True,
                },
            },
        }

        if request.input_file_url and request.job_type in (JobType.IMG2VID, JobType.VID2ANIME):
            workflow["10"] = {
                "class_type": "LoadImage",
                "inputs": {
                    "image": request.input_file_url,
                },
            }
            workflow["11"] = {
                "class_type": "VAEEncode",
                "inputs": {
                    "pixels": ["10", 0],
                    "vae": ["1", 2],
                },
            }
            workflow["5"]["inputs"]["latent_image"] = ["11", 0]
            del workflow["4"]

        return workflow

    def _parse_aspect_ratio(self, aspect_ratio: str) -> tuple[int, int]:
        ratios = {
            "16:9": (1024, 576),
            "9:16": (576, 1024),
            "1:1": (768, 768),
            "4:3": (896, 672),
            "3:4": (672, 896),
        }
        return ratios.get(aspect_ratio, (1024, 576))
