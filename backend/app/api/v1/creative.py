"""AI Creative Director — idea-to-storyboard conversation + generation trigger."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.character import Character
from app.models.creative_session import CreativeSession
from app.models.job import Job
from app.models.story import Scene, Story
from app.models.user import User, UserApiKey
from app.security import decrypt_api_key
from app.services.creative.director import creative_chat, extract_storyboard_json
from app.services.generation.prompt_enhancer import enhance_story_scene_prompt

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CreateSessionRequest(BaseModel):
    idea: str = Field(..., min_length=1, max_length=2000)
    provider: str = Field(default="jimeng", pattern=r"^(kling|jimeng|vidu|cogvideo|comfyui)$")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class StoryboardUpdateRequest(BaseModel):
    storyboard: dict


class ConfirmRequest(BaseModel):
    provider: str = Field(default="jimeng", pattern=r"^(kling|jimeng|vidu|cogvideo|comfyui)$")
    style_preset: str | None = None  # override storyboard style if desired


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_zhipu_key(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Retrieve and decrypt the user's ZhiPu API key (stored under cogvideo provider)."""
    result = await db.execute(
        select(UserApiKey).where(
            UserApiKey.user_id == user_id,
            UserApiKey.provider == "cogvideo",
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI 创意总监需要智谱 API Key（与 CogVideo 共用）。请在 Settings 页面添加 CogVideo API Key。",
        )
    return decrypt_api_key(record.encrypted_key)


async def _get_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> CreativeSession:
    result = await db.execute(
        select(CreativeSession).where(
            CreativeSession.id == session_id,
            CreativeSession.user_id == user_id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def _session_to_dict(s: CreativeSession) -> dict:
    return {
        "id": str(s.id),
        "status": s.status,
        "initial_idea": s.initial_idea,
        "conversation_history": s.conversation_history or [],
        "storyboard": s.storyboard_json,
        "story_id": str(s.story_id) if s.story_id else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_session(
    request: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a creative session with an initial idea, get first AI reply."""
    api_key = await _get_zhipu_key(db, current_user.id)

    # Call LLM for first round
    try:
        reply, storyboard = await creative_chat(api_key, [], request.idea)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    history = [
        {"role": "user", "content": request.idea},
        {"role": "assistant", "content": reply},
    ]

    session = CreativeSession(
        user_id=current_user.id,
        status="storyboard_ready" if storyboard else "chatting",
        initial_idea=request.idea,
        conversation_history=history,
        storyboard_json=storyboard,
    )
    db.add(session)
    await db.flush()

    result = _session_to_dict(session)
    result["last_reply"] = reply
    return result


@router.post("/sessions/{session_id}/chat")
async def chat(
    session_id: uuid.UUID,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Continue the creative conversation."""
    session = await _get_session(db, session_id, current_user.id)

    if session.status not in ("chatting", "storyboard_ready"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is in '{session.status}' state and cannot chat",
        )

    api_key = await _get_zhipu_key(db, current_user.id)
    history = session.conversation_history or []

    try:
        reply, storyboard = await creative_chat(api_key, history, request.message)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    # Append to history
    history.append({"role": "user", "content": request.message})
    history.append({"role": "assistant", "content": reply})
    session.conversation_history = history

    if storyboard:
        session.storyboard_json = storyboard
        session.status = "storyboard_ready"

    # Force SQLAlchemy to detect JSON mutation
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(session, "conversation_history")
    if storyboard:
        flag_modified(session, "storyboard_json")

    result = _session_to_dict(session)
    result["last_reply"] = reply
    return result


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session = await _get_session(db, session_id, current_user.id)
    return _session_to_dict(session)


@router.put("/sessions/{session_id}/storyboard")
async def update_storyboard(
    session_id: uuid.UUID,
    request: StoryboardUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Save user-edited storyboard."""
    session = await _get_session(db, session_id, current_user.id)

    if session.status not in ("chatting", "storyboard_ready"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update storyboard in current state",
        )

    session.storyboard_json = request.storyboard
    session.status = "storyboard_ready"

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(session, "storyboard_json")

    return _session_to_dict(session)


@router.post("/sessions/{session_id}/confirm")
async def confirm_and_generate(
    session_id: uuid.UUID,
    request: ConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Confirm storyboard and trigger video generation."""
    session = await _get_session(db, session_id, current_user.id)

    if session.status != "storyboard_ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Storyboard is not ready for confirmation",
        )

    storyboard = session.storyboard_json
    if not storyboard or not storyboard.get("scenes"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No scenes in storyboard",
        )

    # Validate provider key
    from app.api.v1.generation import _validate_provider_key
    await _validate_provider_key(db, current_user.id, request.provider)

    style = request.style_preset or storyboard.get("style_preset", "ghibli")
    scenes_data = storyboard["scenes"]
    characters_data = storyboard.get("characters", [])

    if len(scenes_data) == 1:
        # --- Single scene → txt2vid ---
        scene = scenes_data[0]
        from app.services.generation.prompt_enhancer import enhance_prompt
        enhanced = enhance_prompt(scene["prompt"], style, "txt2vid")

        job = Job(
            user_id=current_user.id,
            job_type="txt2vid",
            provider=request.provider,
            status="queued",
            prompt=enhanced,
            style_preset=style,
            metadata_json={
                "original_prompt": scene["prompt"],
                "duration": scene.get("duration", 5),
                "aspect_ratio": "16:9",
                "creative_session_id": str(session.id),
            },
        )
        db.add(job)
        await db.flush()

        from app.tasks.generation_tasks import process_generation
        process_generation.delay(str(job.id))

        session.status = "generating"
        return {
            "mode": "single",
            "job_id": str(job.id),
            "message": "Single scene generation started",
        }

    else:
        # --- Multiple scenes → Story pipeline ---
        story = Story(
            user_id=current_user.id,
            title=storyboard.get("title", "AI Creative"),
            description=storyboard.get("description", ""),
        )
        db.add(story)
        await db.flush()

        # Create characters and build name→id map
        char_map: dict[str, uuid.UUID] = {}
        for ch in characters_data:
            character = Character(
                user_id=current_user.id,
                name=ch["name"],
                description=ch.get("description", ""),
            )
            db.add(character)
            await db.flush()
            char_map[ch["name"]] = character.id

        # Create scenes and jobs
        generation_mode = storyboard.get("generation_mode", "coherent")
        is_coherent = generation_mode == "coherent"
        scene_job_ids: list[str] = []
        total = len(scenes_data)

        for idx, sd in enumerate(scenes_data):
            char_name = sd.get("character_name")
            char_id = char_map.get(char_name) if char_name else None
            char_desc = None
            if char_name:
                for ch in characters_data:
                    if ch["name"] == char_name:
                        char_desc = ch.get("description")
                        break

            enhanced = enhance_story_scene_prompt(
                sd["prompt"],
                char_name,
                char_desc,
                style,
                idx,
                total,
                is_chained=is_coherent,
            )

            scene = Scene(
                story_id=story.id,
                order_index=idx,
                prompt=sd["prompt"],
                character_id=char_id,
                status="queued",
            )
            db.add(scene)
            await db.flush()

            job = Job(
                user_id=current_user.id,
                job_type="story",
                provider=request.provider,
                status="queued",
                prompt=enhanced,
                style_preset=style,
                metadata_json={
                    "story_id": str(story.id),
                    "scene_id": str(scene.id),
                    "scene_index": idx,
                    "original_prompt": sd["prompt"],
                    "duration": sd.get("duration", 5),
                    "aspect_ratio": "16:9",
                    "generation_mode": generation_mode,
                    "creative_session_id": str(session.id),
                },
            )
            db.add(job)
            await db.flush()

            scene.job_id = job.id
            scene_job_ids.append(str(job.id))

        session.story_id = story.id
        session.status = "generating"

        if is_coherent:
            from app.tasks.generation_tasks import process_story_generation_chained
            process_story_generation_chained.delay(str(story.id), scene_job_ids)
        else:
            from app.tasks.generation_tasks import process_generation
            for jid in scene_job_ids:
                process_generation.delay(jid)

        return {
            "mode": "story",
            "story_id": str(story.id),
            "job_count": total,
            "generation_mode": generation_mode,
            "message": f"Story generation started with {total} scenes ({generation_mode} mode)",
        }
