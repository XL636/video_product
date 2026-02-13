import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: startup and shutdown events."""
    # Startup
    logger.info("Starting up anime-video-gen backend...")

    # Ensure MinIO bucket exists
    try:
        from app.services.minio_service import ensure_bucket_exists
        ensure_bucket_exists()
        logger.info("MinIO bucket verified/created: %s", settings.MINIO_BUCKET)
    except Exception as exc:
        logger.warning("Could not connect to MinIO on startup: %s", exc)

    yield

    # Shutdown
    logger.info("Shutting down anime-video-gen backend...")


app = FastAPI(
    title="Anime Video Generation API",
    description="Backend API for anime-style video generation platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}
