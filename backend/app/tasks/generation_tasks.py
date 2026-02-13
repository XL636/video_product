import asyncio
import io
import logging
import os
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone
from typing import Sequence

import httpx
import redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.celery_app import celery_app
from app.config import settings
from app.models.job import Job
from app.models.story import Scene, Story
from app.models.user import UserApiKey
from app.models.video import Video
from app.security import decrypt_api_key
from app.services.generation.base_provider import GenerationRequest, JobType
from app.services.generation.factory import get_provider
from app.services.minio_service import download_object, upload_file

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 5
MAX_POLL_DURATION_SECONDS = 600  # 10 minutes


def _get_redis_client() -> redis.Redis:
    return redis.Redis.from_url(settings.REDIS_URL)


def _publish_job_update(user_id: str, job_id: str, status: str, progress: int = 0, **extra: object) -> None:
    """Publish a job status update to Redis for WebSocket relay."""
    import json
    r = _get_redis_client()
    message = json.dumps({
        "job_id": job_id,
        "status": status,
        "progress": progress,
        **extra,
    })
    r.publish(f"job_updates:{user_id}", message)


def _run_async(coro):
    """Run an async coroutine in a sync context (Celery worker)."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _get_async_session() -> AsyncSession:
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return factory()


async def _get_user_api_key(session: AsyncSession, user_id: uuid.UUID, provider: str) -> str:
    result = await session.execute(
        select(UserApiKey).where(
            UserApiKey.user_id == user_id,
            UserApiKey.provider == provider,
        )
    )
    api_key_record = result.scalar_one_or_none()
    if api_key_record is None:
        raise ValueError(f"No API key configured for provider: {provider}")
    return decrypt_api_key(api_key_record.encrypted_key)


async def _download_video(video_url: str) -> bytes:
    """Download video from provider URL."""
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        response = await client.get(video_url)
        response.raise_for_status()
        return response.content


def _generate_thumbnail_sync(video_bytes: bytes) -> bytes:
    """Generate thumbnail from video bytes using FFmpeg (sync)."""
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as video_file:
            video_file.write(video_bytes)
            video_path = video_file.name

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as thumb_file:
            thumb_path = thumb_file.name

        # Run ffmpeg to extract first frame at 1 second position
        subprocess.run(
            [
                "ffmpeg",
                "-i", video_path,
                "-ss", "00:00:01",
                "-vframes", "1",
                "-vf", "scale=320:-1",
                "-y",
                thumb_path
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True
        )

        with open(thumb_path, "rb") as f:
            thumbnail_bytes = f.read()

        return thumbnail_bytes
    except (subprocess.CalledProcessError, FileNotFoundError, IOError) as e:
        logger.warning("Failed to generate thumbnail: %s", e)
        return b""
    finally:
        # Clean up temp files
        if "video_path" in locals() and os.path.exists(video_path):
            os.unlink(video_path)
        if "thumb_path" in locals() and os.path.exists(thumb_path):
            os.unlink(thumb_path)


async def _process_generation(job_id: str) -> None:
    session = await _get_async_session()
    try:
        result = await session.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
        job = result.scalar_one_or_none()
        if job is None:
            logger.error("Job %s not found", job_id)
            return

        user_id_str = str(job.user_id)

        # Update status to submitted
        job.status = "submitted"
        job.updated_at = datetime.now(timezone.utc)
        await session.commit()
        _publish_job_update(user_id_str, job_id, "submitted", progress=5)

        # Get API key (ComfyUI may not need one)
        api_key = ""
        if job.provider != "comfyui":
            api_key = await _get_user_api_key(session, job.user_id, job.provider)

        # Create provider and generation request
        provider = get_provider(job.provider, api_key)

        gen_request = GenerationRequest(
            job_type=JobType(job.job_type),
            prompt=job.prompt or "",
            style_preset=job.style_preset or "ghibli",
            input_file_url=job.input_file_url,
            style_strength=job.metadata_json.get("style_strength", 0.7) if job.metadata_json else 0.7,
            negative_prompt=job.metadata_json.get("negative_prompt", "") if job.metadata_json else "",
            duration=job.metadata_json.get("duration", 5) if job.metadata_json else 5,
            aspect_ratio=job.metadata_json.get("aspect_ratio", "16:9") if job.metadata_json else "16:9",
            subject_reference_url=job.metadata_json.get("subject_reference_url") if job.metadata_json else None,
        )

        # Submit job to provider
        provider_job_id = await provider.submit_job(gen_request)
        job.provider_job_id = provider_job_id
        job.status = "processing"
        job.updated_at = datetime.now(timezone.utc)
        await session.commit()
        _publish_job_update(user_id_str, job_id, "processing", progress=10)

        # Poll for completion
        elapsed = 0
        while elapsed < MAX_POLL_DURATION_SECONDS:
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
            elapsed += POLL_INTERVAL_SECONDS

            gen_result = await provider.poll_job(provider_job_id)

            if gen_result.status == "completed" and gen_result.video_url:
                # Download video from provider
                video_bytes = await _download_video(gen_result.video_url)

                # Upload to MinIO
                object_name = f"videos/{job.user_id}/{uuid.uuid4().hex}.mp4"
                minio_url = upload_file(
                    video_bytes,
                    object_name=object_name,
                    content_type="video/mp4",
                )

                # Generate thumbnail from video
                thumbnail_url = None
                thumbnail_bytes = _generate_thumbnail_sync(video_bytes)
                if thumbnail_bytes:
                    thumb_object_name = f"thumbnails/{job.user_id}/{uuid.uuid4().hex}.jpg"
                    thumbnail_url = upload_file(
                        thumbnail_bytes,
                        object_name=thumb_object_name,
                        content_type="image/jpeg",
                    )

                # Update job
                job.status = "completed"
                job.output_video_url = minio_url
                job.thumbnail_url = thumbnail_url
                job.progress = 100
                job.updated_at = datetime.now(timezone.utc)

                # Create Video record
                video = Video(
                    user_id=job.user_id,
                    job_id=job.id,
                    title=job.prompt[:100] if job.prompt else "Generated Video",
                    url=minio_url,
                    thumbnail_url=thumbnail_url,
                    duration=gen_request.duration,
                    file_size=len(video_bytes),
                )
                session.add(video)
                await session.commit()

                _publish_job_update(
                    user_id_str, job_id, "completed",
                    progress=100, video_url=minio_url, thumbnail_url=thumbnail_url,
                )
                logger.info("Job %s completed successfully", job_id)
                return

            elif gen_result.status == "failed":
                job.status = "failed"
                job.error_message = gen_result.error or "Generation failed"
                job.updated_at = datetime.now(timezone.utc)
                await session.commit()

                _publish_job_update(
                    user_id_str, job_id, "failed",
                    error=gen_result.error or "Generation failed",
                )
                logger.error("Job %s failed: %s", job_id, gen_result.error)
                return

            else:
                # Still processing, update progress
                job.progress = gen_result.progress
                job.updated_at = datetime.now(timezone.utc)
                await session.commit()
                _publish_job_update(
                    user_id_str, job_id, "processing",
                    progress=gen_result.progress,
                )

        # Timed out
        job.status = "failed"
        job.error_message = "Generation timed out after 10 minutes"
        job.updated_at = datetime.now(timezone.utc)
        await session.commit()
        _publish_job_update(user_id_str, job_id, "failed", error="Generation timed out")
        logger.error("Job %s timed out", job_id)

    except Exception as exc:
        logger.exception("Error processing job %s", job_id)
        try:
            result = await session.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
            job = result.scalar_one_or_none()
            if job:
                job.status = "failed"
                job.error_message = str(exc)[:1000]
                job.updated_at = datetime.now(timezone.utc)
                await session.commit()
                _publish_job_update(str(job.user_id), job_id, "failed", error=str(exc)[:500])
        except Exception:
            logger.exception("Failed to update job %s status after error", job_id)
    finally:
        await session.close()


@celery_app.task(name="app.tasks.generation_tasks.process_generation", bind=True, max_retries=2)
def process_generation(self, job_id: str) -> None:
    """Celery task to process a video generation job."""
    try:
        _run_async(_process_generation(job_id))
    except Exception as exc:
        logger.exception("Celery task failed for job %s", job_id)
        raise self.retry(exc=exc, countdown=10)


@celery_app.task(name="app.tasks.generation_tasks.process_story_generation", bind=True, max_retries=1)
def process_story_generation(self, job_id: str, scene_job_ids: list[str]) -> None:
    """Celery task to process story generation (multiple scenes sequentially)."""
    try:
        for scene_job_id in scene_job_ids:
            _run_async(_process_generation(scene_job_id))
    except Exception as exc:
        logger.exception("Story generation task failed for job %s", job_id)
        raise self.retry(exc=exc, countdown=10)


def _extract_minio_object_name(url: str) -> str:
    """Extract object name from MinIO URL."""
    # URL format: http://endpoint/bucket/object_name
    parts = url.split("/")
    return "/".join(parts[3:]) if len(parts) >= 4 else ""


def _merge_videos_sync(video_paths: Sequence[str], output_path: str) -> bool:
    """Merge videos using FFmpeg concat demuxer."""
    try:
        # Create concat list file
        concat_file = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
        for path in video_paths:
            concat_file.write(f"file '{path}'\n")
        concat_file.close()

        # Run ffmpeg to concatenate videos
        result = subprocess.run(
            [
                "ffmpeg",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file.name,
                "-c", "copy",
                "-y",
                output_path
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        os.unlink(concat_file.name)

        if result.returncode != 0:
            logger.error("FFmpeg concat failed: %s", result.stderr.decode())
            return False

        return True
    except (subprocess.CalledProcessError, FileNotFoundError, IOError) as e:
        logger.error("Failed to merge videos: %s", e)
        return False


async def _merge_story_scenes(story_id: str) -> None:
    """Merge all completed scene videos into a single video."""
    session = await _get_async_session()
    temp_dir = None

    try:
        # Get story and scenes
        result = await session.execute(
            select(Story).where(Story.id == uuid.UUID(story_id))
        )
        story = result.scalar_one_or_none()
        if story is None:
            logger.error("Story %s not found", story_id)
            return

        user_id_str = str(story.user_id)

        # Update status to merging
        story.merged_status = "merging"
        story.updated_at = datetime.now(timezone.utc)
        await session.commit()

        # Get all completed scenes with videos
        scenes_result = await session.execute(
            select(Scene)
            .join(Job, Scene.job_id == Job.id)
            .join(Video, Job.video)
            .where(
                Scene.story_id == story.id,
                Job.status == "completed",
                Video.url.isnot(None)
            )
            .order_by(Scene.order_index)
        )
        scenes = scenes_result.scalars().all()

        if not scenes:
            logger.warning("No completed scenes found for story %s", story_id)
            story.merged_status = "failed"
            story.updated_at = datetime.now(timezone.utc)
            await session.commit()
            return

        # Download all videos to temp directory
        temp_dir = tempfile.mkdtemp()
        video_paths = []

        for idx, scene in enumerate(scenes):
            if not scene.job or not scene.job.video:
                continue

            video_url = scene.job.video.url
            object_name = _extract_minio_object_name(video_url)
            video_bytes = download_object(object_name)

            temp_video_path = os.path.join(temp_dir, f"scene_{idx:03d}.mp4")
            with open(temp_video_path, "wb") as f:
                f.write(video_bytes)
            video_paths.append(temp_video_path)

        # Merge videos using FFmpeg
        output_path = os.path.join(temp_dir, "merged.mp4")
        success = _merge_videos_sync(video_paths, output_path)

        if not success:
            story.merged_status = "failed"
            story.updated_at = datetime.now(timezone.utc)
            await session.commit()
            return

        # Upload merged video to MinIO
        with open(output_path, "rb") as f:
            merged_bytes = f.read()

        merged_object_name = f"merged_videos/{story.user_id}/{story_id}/{uuid.uuid4().hex}.mp4"
        merged_url = upload_file(
            merged_bytes,
            object_name=merged_object_name,
            content_type="video/mp4",
        )

        # Update story
        story.merged_video_url = merged_url
        story.merged_status = "completed"
        story.updated_at = datetime.now(timezone.utc)
        await session.commit()

        logger.info("Story %s merged successfully", story_id)

    except Exception as exc:
        logger.exception("Error merging story %s", story_id)
        try:
            story = await session.get(Story, uuid.UUID(story_id))
            if story:
                story.merged_status = "failed"
                story.updated_at = datetime.now(timezone.utc)
                await session.commit()
        except Exception:
            logger.exception("Failed to update story %s status after error", story_id)
    finally:
        # Clean up temp directory
        if temp_dir and os.path.exists(temp_dir):
            for file in os.listdir(temp_dir):
                os.unlink(os.path.join(temp_dir, file))
            os.rmdir(temp_dir)
        await session.close()


@celery_app.task(name="app.tasks.generation_tasks.merge_story", bind=True, max_retries=1)
def merge_story(self, story_id: str) -> None:
    """Celery task to merge all scenes of a story into a single video."""
    try:
        _run_async(_merge_story_scenes(story_id))
    except Exception as exc:
        logger.exception("Celery merge task failed for story %s", story_id)
        raise self.retry(exc=exc, countdown=10)
