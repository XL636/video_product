import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.job import Job
from app.models.story import Scene, Story
from app.models.user import User, UserApiKey
from app.schemas.generation import (
    GenerationResponse,
    ImageToVideoRequest,
    StoryGenerationRequest,
    TextToVideoRequest,
    VideoToAnimeRequest,
)
from app.services.generation.prompt_enhancer import enhance_prompt, enhance_story_scene_prompt, get_negative_prompt
from app.tasks.generation_tasks import process_generation, process_story_generation

router = APIRouter()


async def _validate_provider_key(
    db: AsyncSession, user_id: uuid.UUID, provider: str
) -> None:
    """Ensure the user has an API key for the given provider (except comfyui)."""
    if provider == "comfyui":
        return
    result = await db.execute(
        select(UserApiKey).where(
            UserApiKey.user_id == user_id,
            UserApiKey.provider == provider,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No API key configured for provider: {provider}. "
                   f"Please add your key in Settings.",
        )


@router.post("/image-to-video", response_model=GenerationResponse)
async def image_to_video(
    request: ImageToVideoRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    await _validate_provider_key(db, current_user.id, request.provider)

    enhanced_prompt = enhance_prompt(request.prompt, request.style_preset, "img2vid")
    negative = get_negative_prompt(request.negative_prompt)

    job = Job(
        user_id=current_user.id,
        job_type="img2vid",
        provider=request.provider,
        status="queued",
        prompt=enhanced_prompt,
        style_preset=request.style_preset,
        input_file_url=request.file_url,
        metadata_json={
            "original_prompt": request.prompt,
            "negative_prompt": negative,
            "duration": request.duration,
            "aspect_ratio": request.aspect_ratio,
            "subject_reference_url": request.subject_reference_url,
        },
    )
    db.add(job)
    await db.flush()

    process_generation.delay(str(job.id))

    return GenerationResponse(
        job_id=job.id,
        status="queued",
        message="Image-to-video generation job queued",
    )


@router.post("/text-to-video", response_model=GenerationResponse)
async def text_to_video(
    request: TextToVideoRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    await _validate_provider_key(db, current_user.id, request.provider)

    enhanced_prompt = enhance_prompt(request.prompt, request.style_preset, "txt2vid")
    negative = get_negative_prompt(request.negative_prompt)

    job = Job(
        user_id=current_user.id,
        job_type="txt2vid",
        provider=request.provider,
        status="queued",
        prompt=enhanced_prompt,
        style_preset=request.style_preset,
        metadata_json={
            "original_prompt": request.prompt,
            "negative_prompt": negative,
            "duration": request.duration,
            "aspect_ratio": request.aspect_ratio,
        },
    )
    db.add(job)
    await db.flush()

    process_generation.delay(str(job.id))

    return GenerationResponse(
        job_id=job.id,
        status="queued",
        message="Text-to-video generation job queued",
    )


@router.post("/video-to-anime", response_model=GenerationResponse)
async def video_to_anime(
    request: VideoToAnimeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    await _validate_provider_key(db, current_user.id, request.provider)

    enhanced_prompt = enhance_prompt("", request.style_preset, "vid2anime")

    job = Job(
        user_id=current_user.id,
        job_type="vid2anime",
        provider=request.provider,
        status="queued",
        prompt=enhanced_prompt,
        style_preset=request.style_preset,
        input_file_url=request.file_url,
        metadata_json={
            "style_strength": request.style_strength,
        },
    )
    db.add(job)
    await db.flush()

    process_generation.delay(str(job.id))

    return GenerationResponse(
        job_id=job.id,
        status="queued",
        message="Video-to-anime conversion job queued",
    )


@router.post("/story", response_model=GenerationResponse)
async def generate_story(
    request: StoryGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    await _validate_provider_key(db, current_user.id, request.provider)

    # Fetch story with scenes
    result = await db.execute(
        select(Story).where(
            Story.id == request.story_id,
            Story.user_id == current_user.id,
        )
    )
    story = result.scalar_one_or_none()
    if story is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found",
        )

    # Fetch scenes ordered
    result = await db.execute(
        select(Scene).where(Scene.story_id == story.id).order_by(Scene.order_index)
    )
    scenes = result.scalars().all()

    if not scenes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Story has no scenes",
        )

    # Create parent story job
    parent_job = Job(
        user_id=current_user.id,
        job_type="story",
        provider=request.provider,
        status="queued",
        prompt=story.title,
        style_preset=request.style_preset,
        metadata_json={
            "story_id": str(story.id),
            "scene_count": len(scenes),
        },
    )
    db.add(parent_job)
    await db.flush()

    # Create individual jobs for each scene
    scene_job_ids: list[str] = []
    total_scenes = len(scenes)

    for idx, scene in enumerate(scenes):
        # Get character info if available
        char_name = None
        char_desc = None
        if scene.character:
            char_name = scene.character.name
            char_desc = scene.character.description

        enhanced = enhance_story_scene_prompt(
            scene.prompt,
            char_name,
            char_desc,
            request.style_preset,
            idx,
            total_scenes,
        )

        scene_job = Job(
            user_id=current_user.id,
            job_type="story",
            provider=request.provider,
            status="queued",
            prompt=enhanced,
            style_preset=request.style_preset,
            metadata_json={
                "story_id": str(story.id),
                "scene_id": str(scene.id),
                "scene_index": idx,
                "original_prompt": scene.prompt,
                "duration": 5,
                "aspect_ratio": "16:9",
            },
        )
        db.add(scene_job)
        await db.flush()

        scene.job_id = scene_job.id
        scene.status = "queued"
        scene_job_ids.append(str(scene_job.id))

    await db.flush()

    process_story_generation.delay(str(parent_job.id), scene_job_ids)

    return GenerationResponse(
        job_id=parent_job.id,
        status="queued",
        message=f"Story generation queued with {len(scenes)} scenes",
    )
