import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import Character, Scene, Story
from app.models.user import User
from app.schemas.generation import StoryGenerationRequest
from app.tasks.generation_tasks import merge_story, process_story_generation

router = APIRouter()


@router.get("", response_model=list[dict])
async def list_stories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(Story).where(Story.user_id == current_user.id).order_by(Story.created_at.desc())
    )
    stories = result.scalars().all()

    output = []
    for story in stories:
        scenes_result = await db.execute(
            select(Scene).where(Scene.story_id == story.id).order_by(Scene.order_index)
        )
        scenes = scenes_result.scalars().all()

        story_data = {
            "id": str(story.id),
            "title": story.title,
            "description": story.description,
            "created_at": story.created_at.isoformat() if story.created_at else None,
            "updated_at": story.updated_at.isoformat() if story.updated_at else None,
            "scenes": [
                {
                    "id": str(scene.id),
                    "order_index": scene.order_index,
                    "prompt": scene.prompt,
                    "character_id": str(scene.character_id) if scene.character_id else None,
                    "status": scene.status,
                    "job_id": str(scene.job_id) if scene.job_id else None,
                }
                for scene in scenes
            ],
        }
        output.append(story_data)

    return output


@router.get("/{story_id}", response_model=dict)
async def get_story(
    story_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Story).where(Story.id == story_id, Story.user_id == current_user.id)
    )
    story = result.scalar_one_or_none()
    if story is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found",
        )

    # Get scenes with character data
    scenes_result = await db.execute(
        select(Scene)
        .where(Scene.story_id == story.id)
        .order_by(Scene.order_index)
    )
    scenes = scenes_result.scalars().all()

    # Get all characters for this user
    chars_result = await db.execute(
        select(Character).where(Character.user_id == current_user.id)
    )
    characters = chars_result.scalars().all()

    return {
        "id": str(story.id),
        "title": story.title,
        "description": story.description,
        "created_at": story.created_at.isoformat() if story.created_at else None,
        "updated_at": story.updated_at.isoformat() if story.updated_at else None,
        "scenes": [
            {
                "id": str(scene.id),
                "order_index": scene.order_index,
                "prompt": scene.prompt,
                "character_id": str(scene.character_id) if scene.character_id else None,
                "character": {
                    "id": str(scene.character.id),
                    "name": scene.character.name,
                    "description": scene.character.description,
                    "reference_image_url": scene.character.reference_image_url,
                }
                if scene.character
                else None,
                "status": scene.status,
                "job_id": str(scene.job_id) if scene.job_id else None,
            }
            for scene in scenes
        ],
        "characters": [
            {
                "id": str(char.id),
                "name": char.name,
                "description": char.description,
                "reference_image_url": char.reference_image_url,
                "created_at": char.created_at.isoformat() if char.created_at else None,
            }
            for char in characters
        ],
    }


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_story(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    story = Story(
        user_id=current_user.id,
        title=data.get("title", "Untitled Story"),
        description=data.get("description", ""),
    )
    db.add(story)
    await db.flush()

    return {
        "id": str(story.id),
        "title": story.title,
        "description": story.description,
    }


@router.post("/{story_id}/characters", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_character(
    story_id: uuid.UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Verify story ownership
    result = await db.execute(
        select(Story).where(Story.id == story_id, Story.user_id == current_user.id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found",
        )

    character = Character(
        user_id=current_user.id,
        name=data.get("name", ""),
        description=data.get("description", ""),
        reference_image_url=data.get("reference_image_url"),
    )
    db.add(character)
    await db.flush()

    return {
        "id": str(character.id),
        "name": character.name,
        "description": character.description,
        "reference_image_url": character.reference_image_url,
    }


@router.delete("/{story_id}/characters/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    story_id: uuid.UUID,
    character_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    # Verify story ownership and character ownership
    result = await db.execute(
        select(Character).where(
            Character.id == character_id,
            Character.user_id == current_user.id,
        )
    )
    character = result.scalar_one_or_none()
    if character is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found",
        )

    await db.delete(character)


@router.post("/{story_id}/scenes", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_scene(
    story_id: uuid.UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Verify story ownership
    result = await db.execute(
        select(Story).where(Story.id == story_id, Story.user_id == current_user.id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found",
        )

    # Get current max order_index
    count_result = await db.execute(
        select(Scene).where(Scene.story_id == story_id)
    )
    order_index = len(count_result.scalars().all())

    scene = Scene(
        story_id=story_id,
        order_index=order_index,
        prompt=data.get("prompt", ""),
        character_id=uuid.UUID(data["character_id"]) if data.get("character_id") else None,
        status="draft",
    )
    db.add(scene)
    await db.flush()

    return {
        "id": str(scene.id),
        "order_index": scene.order_index,
        "prompt": scene.prompt,
        "character_id": str(scene.character_id) if scene.character_id else None,
        "status": scene.status,
    }


@router.put("/{story_id}/scenes/{scene_id}", status_code=status.HTTP_200_OK)
async def update_scene(
    story_id: uuid.UUID,
    scene_id: uuid.UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Verify scene belongs to story owned by user
    result = await db.execute(
        select(Scene)
        .join(Story, Scene.story_id == Story.id)
        .where(
            Scene.id == scene_id,
            Scene.story_id == story_id,
            Story.user_id == current_user.id,
        )
    )
    scene = result.scalar_one_or_none()
    if scene is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )

    # Update fields
    if "prompt" in data:
        scene.prompt = data["prompt"]
    if "character_id" in data:
        scene.character_id = uuid.UUID(data["character_id"]) if data["character_id"] else None
    if "status" in data:
        scene.status = data["status"]
    if "job_id" in data:
        scene.job_id = uuid.UUID(data["job_id"]) if data["job_id"] else None

    await db.commit()

    return {
        "id": str(scene.id),
        "order_index": scene.order_index,
        "prompt": scene.prompt,
        "character_id": str(scene.character_id) if scene.character_id else None,
        "status": scene.status,
        "job_id": str(scene.job_id) if scene.job_id else None,
    }


@router.delete("/{story_id}/scenes/{scene_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scene(
    story_id: uuid.UUID,
    scene_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    # Verify scene belongs to story owned by user
    result = await db.execute(
        select(Scene)
        .join(Story, Scene.story_id == Story.id)
        .where(
            Scene.id == scene_id,
            Scene.story_id == story_id,
            Story.user_id == current_user.id,
        )
    )
    scene = result.scalar_one_or_none()
    if scene is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )

    await db.delete(scene)


@router.post("/{story_id}/generate", response_model=dict)
async def generate_story(
    story_id: uuid.UUID,
    request: StoryGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.api.v1.generation import _validate_provider_key
    from app.schemas.generation import GenerationResponse

    await _validate_provider_key(db, current_user.id, request.provider)

    # Fetch story with scenes
    result = await db.execute(
        select(Story).where(
            Story.id == story_id,
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
    parent_job_id = str(uuid.uuid4())

    # Create individual jobs for each scene
    scene_job_ids: list[str] = []
    total_scenes = len(scenes)

    for idx, scene in enumerate(scenes):
        from app.tasks.generation_tasks import process_generation

        # Get character info if available
        char_name = None
        char_desc = None
        if scene.character:
            char_name = scene.character.name
            char_desc = scene.character.description

        from app.services.generation.prompt_enhancer import enhance_story_scene_prompt

        enhanced = enhance_story_scene_prompt(
            scene.prompt,
            char_name,
            char_desc,
            request.style_preset,
            idx,
            total_scenes,
        )

        # Create job record for this scene
        from app.models.job import Job

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

        # Update scene with job reference
        scene.job_id = scene_job.id
        scene.status = "queued"
        scene_job_ids.append(str(scene_job.id))

    await db.commit()

    # Trigger generation for all scenes
    for scene_job_id in scene_job_ids:
        process_generation.delay(scene_job_id)

    return {
        "story_id": str(story.id),
        "job_count": len(scenes),
        "message": f"Started generation for {len(scenes)} scenes",
    }


@router.post("/{story_id}/merge", response_model=dict)
async def merge_story_videos(
    story_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Merge all completed scene videos into a single video."""
    from app.models.job import Job

    # Verify story ownership
    result = await db.execute(
        select(Story).where(
            Story.id == story_id,
            Story.user_id == current_user.id,
        )
    )
    story = result.scalar_one_or_none()
    if story is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found",
        )

    # Check if merge is already in progress
    if story.merged_status == "merging":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Merge already in progress",
        )

    # Count completed scenes
    scenes_result = await db.execute(
        select(Scene)
        .join(Job, Scene.job_id == Job.id)
        .where(
            Scene.story_id == story.id,
            Job.status == "completed",
        )
    )
    completed_count = len(scenes_result.scalars().all())

    if completed_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No completed scenes to merge",
        )

    # Reset merge status
    story.merged_status = "not_started"
    story.merged_video_url = None
    await db.commit()

    # Trigger merge task
    merge_story.delay(str(story_id))

    return {
        "story_id": str(story.id),
        "scene_count": completed_count,
        "status": "merging",
        "message": f"Started merging {completed_count} scenes",
    }
