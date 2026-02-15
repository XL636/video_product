from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User, UserApiKey
from app.schemas.settings import ApiKeyCreate, ApiKeyListResponse, ApiKeyResponse
from app.security import encrypt_api_key

router = APIRouter()

ALL_PROVIDERS = ["kling", "jimeng", "vidu", "cogvideo", "comfyui"]


@router.get("/api-keys", response_model=ApiKeyListResponse)
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyListResponse:
    result = await db.execute(
        select(UserApiKey).where(UserApiKey.user_id == current_user.id)
    )
    existing_keys = {key.provider: key for key in result.scalars().all()}

    keys: list[ApiKeyResponse] = []
    for provider in ALL_PROVIDERS:
        if provider in existing_keys:
            keys.append(ApiKeyResponse(
                provider=provider,
                configured=True,
                created_at=existing_keys[provider].created_at,
            ))
        else:
            keys.append(ApiKeyResponse(
                provider=provider,
                configured=False,
                created_at=None,
            ))

    return ApiKeyListResponse(keys=keys)


@router.post("/api-keys", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def save_api_key(
    request: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyResponse:
    # Delete existing key for this provider if any
    await db.execute(
        delete(UserApiKey).where(
            UserApiKey.user_id == current_user.id,
            UserApiKey.provider == request.provider,
        )
    )

    encrypted = encrypt_api_key(request.api_key)
    api_key_record = UserApiKey(
        user_id=current_user.id,
        provider=request.provider,
        encrypted_key=encrypted,
    )
    db.add(api_key_record)
    await db.flush()

    return ApiKeyResponse(
        provider=api_key_record.provider,
        configured=True,
        created_at=api_key_record.created_at,
    )


@router.delete("/api-keys/{provider}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if provider not in ALL_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown provider: {provider}",
        )

    result = await db.execute(
        select(UserApiKey).where(
            UserApiKey.user_id == current_user.id,
            UserApiKey.provider == provider,
        )
    )
    key = result.scalar_one_or_none()
    if key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No API key found for provider: {provider}",
        )

    await db.delete(key)
