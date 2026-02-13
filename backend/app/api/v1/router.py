from fastapi import APIRouter

from app.api.v1 import auth, gallery, generation, jobs, settings, stories, upload, websocket

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(generation.router, prefix="/generate", tags=["generation"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(gallery.router, prefix="/gallery", tags=["gallery"])
api_router.include_router(stories.router, prefix="/stories", tags=["stories"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(websocket.router, tags=["websocket"])
