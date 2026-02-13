import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.job import Job
from app.models.user import User
from app.models.video import Video
from app.schemas.gallery import GalleryListResponse, VideoResponse

router = APIRouter()


@router.get("", response_model=GalleryListResponse)
async def list_gallery(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    job_type: str | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at", pattern=r"^(created_at|title|file_size)$"),
    sort_order: str = Query("desc", pattern=r"^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GalleryListResponse:
    base_query = select(Video).where(Video.user_id == current_user.id)
    count_query = select(func.count()).select_from(Video).where(Video.user_id == current_user.id)

    if job_type:
        base_query = base_query.join(Job, Video.job_id == Job.id).where(Job.job_type == job_type)
        count_query = count_query.join(Job, Video.job_id == Job.id).where(Job.job_type == job_type)

    if search:
        search_filter = Video.title.ilike(f"%{search}%")
        base_query = base_query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Sort
    sort_column = getattr(Video, sort_by)
    order = sort_column.desc() if sort_order == "desc" else sort_column.asc()

    offset = (page - 1) * page_size
    query = base_query.order_by(order).offset(offset).limit(page_size)
    result = await db.execute(query)
    videos = result.scalars().all()

    return GalleryListResponse(
        items=[VideoResponse.model_validate(v) for v in videos],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VideoResponse:
    result = await db.execute(
        select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    )
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    return VideoResponse.model_validate(video)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    )
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    # Attempt to delete the file from MinIO
    try:
        from app.services.minio_service import delete_object
        # Extract object name from URL
        url = video.url
        bucket_prefix = f"/{video.url.split('/')[-2]}/" if "/" in url else ""
        parts = url.split("/")
        if len(parts) >= 2:
            object_name = "/".join(parts[-3:]) if len(parts) >= 4 else parts[-1]
            # Actually extract path after bucket name
            from app.config import settings
            bucket = settings.MINIO_BUCKET
            idx = url.find(bucket)
            if idx != -1:
                object_name = url[idx + len(bucket) + 1:]
                delete_object(object_name)
    except Exception:
        pass  # Best effort deletion from storage

    await db.delete(video)
