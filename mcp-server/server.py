"""
AnimeGen Studio MCP Server

Exposes the AnimeGen Studio backend API as MCP tools,
allowing Claude Code to directly generate anime videos,
manage jobs, and orchestrate story workflows.

Usage:
    python mcp-server/server.py
"""

from __future__ import annotations

import base64
import json
import mimetypes
import os
from pathlib import Path

import httpx
from fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

API_BASE = os.getenv("ANIMEGEN_API_BASE", "http://localhost:8000/api/v1")
TIMEOUT = float(os.getenv("ANIMEGEN_TIMEOUT", "120"))

mcp = FastMCP(
    "AnimeGen Studio",
    instructions="AI anime video generation platform - text/image to video, story mode, gallery",
)

# ---------------------------------------------------------------------------
# Global auth state
# ---------------------------------------------------------------------------

_token: str | None = None


def _headers() -> dict[str, str]:
    h: dict[str, str] = {"Content-Type": "application/json"}
    if _token:
        h["Authorization"] = f"Bearer {_token}"
    return h


def _client() -> httpx.Client:
    return httpx.Client(base_url=API_BASE, timeout=TIMEOUT)


def _fmt(data: dict | list | str) -> str:
    """Format response data as readable JSON text."""
    if isinstance(data, str):
        return data
    return json.dumps(data, indent=2, ensure_ascii=False, default=str)


# ===========================================================================
# Auth Tools
# ===========================================================================


@mcp.tool()
def login(email: str, password: str) -> str:
    """Login to AnimeGen Studio and store the JWT token for subsequent requests.

    Args:
        email: User email address
        password: User password
    """
    global _token
    with _client() as c:
        r = c.post("/auth/login", json={"email": email, "password": password})
        r.raise_for_status()
        data = r.json()
        _token = data["access_token"]
        return _fmt({"status": "ok", "message": "Logged in successfully", "token_preview": _token[:20] + "..."})


@mcp.tool()
def register(email: str, username: str, password: str) -> str:
    """Register a new account on AnimeGen Studio.

    Args:
        email: Email address
        username: Display name (min 3 chars)
        password: Password (min 8 chars)
    """
    global _token
    with _client() as c:
        r = c.post("/auth/register", json={"email": email, "username": username, "password": password})
        r.raise_for_status()
        data = r.json()
        _token = data["access_token"]
        return _fmt({"status": "ok", "message": "Registered and logged in", "token_preview": _token[:20] + "..."})


@mcp.tool()
def get_me() -> str:
    """Get current user profile information. Requires prior login."""
    with _client() as c:
        r = c.get("/auth/me", headers=_headers())
        r.raise_for_status()
        return _fmt(r.json())


# ===========================================================================
# Generation Tools
# ===========================================================================


@mcp.tool()
def generate_text_to_video(
    prompt: str,
    provider: str = "cogvideo",
    style_preset: str = "ghibli",
    duration: int = 5,
    aspect_ratio: str = "16:9",
    negative_prompt: str = "",
) -> str:
    """Generate an anime video from a text prompt.

    Args:
        prompt: Text description of the video to generate
        provider: AI provider - kling, jimeng, vidu, cogvideo, comfyui
        style_preset: Anime style - ghibli, shonen, seinen, cyberpunk_anime, chibi
        duration: Video duration in seconds (1-15)
        aspect_ratio: Aspect ratio (e.g. "16:9", "9:16", "1:1")
        negative_prompt: Things to avoid in the generation
    """
    with _client() as c:
        r = c.post(
            "/generate/text-to-video",
            headers=_headers(),
            json={
                "prompt": prompt,
                "provider": provider,
                "style_preset": style_preset,
                "duration": duration,
                "aspect_ratio": aspect_ratio,
                "negative_prompt": negative_prompt,
            },
        )
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def generate_image_to_video(
    file_url: str,
    prompt: str = "",
    provider: str = "cogvideo",
    style_preset: str = "ghibli",
    duration: int = 5,
    aspect_ratio: str = "16:9",
    negative_prompt: str = "",
    subject_reference_url: str | None = None,
) -> str:
    """Generate an anime video from an image.

    Args:
        file_url: URL of the source image (from upload_file or MinIO URL)
        prompt: Optional text guidance for the animation
        provider: AI provider - kling, jimeng, vidu, cogvideo, comfyui
        style_preset: Anime style - ghibli, shonen, seinen, cyberpunk_anime, chibi
        duration: Video duration in seconds (1-15)
        aspect_ratio: Aspect ratio (e.g. "16:9", "9:16", "1:1")
        negative_prompt: Things to avoid in the generation
        subject_reference_url: Optional reference image URL for subject consistency
    """
    body: dict = {
        "file_url": file_url,
        "prompt": prompt,
        "provider": provider,
        "style_preset": style_preset,
        "duration": duration,
        "aspect_ratio": aspect_ratio,
        "negative_prompt": negative_prompt,
    }
    if subject_reference_url:
        body["subject_reference_url"] = subject_reference_url

    with _client() as c:
        r = c.post("/generate/image-to-video", headers=_headers(), json=body)
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def generate_video_to_anime(
    file_url: str,
    style_preset: str = "ghibli",
    style_strength: float = 0.7,
    provider: str = "comfyui",
) -> str:
    """Convert a real video to anime style.

    Args:
        file_url: URL of the source video (from upload_file)
        style_preset: Anime style - ghibli, shonen, seinen, cyberpunk_anime, chibi
        style_strength: Style transfer strength (0.0 - 1.0)
        provider: AI provider - kling, jimeng, vidu, cogvideo, comfyui
    """
    with _client() as c:
        r = c.post(
            "/generate/video-to-anime",
            headers=_headers(),
            json={
                "file_url": file_url,
                "style_preset": style_preset,
                "style_strength": style_strength,
                "provider": provider,
            },
        )
        r.raise_for_status()
        return _fmt(r.json())


# ===========================================================================
# Job Tools
# ===========================================================================


@mcp.tool()
def check_job(job_id: str) -> str:
    """Check the status of a generation job.

    Args:
        job_id: UUID of the job to check
    """
    with _client() as c:
        r = c.get(f"/jobs/{job_id}", headers=_headers())
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def list_jobs(
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    job_type: str | None = None,
) -> str:
    """List generation jobs with optional filters.

    Args:
        page: Page number (default 1)
        page_size: Items per page (1-100, default 20)
        status: Filter by status - queued, submitted, processing, completed, failed
        job_type: Filter by type - txt2vid, img2vid, vid2anime, story
    """
    params: dict = {"page": page, "page_size": page_size}
    if status:
        params["status"] = status
    if job_type:
        params["job_type"] = job_type

    with _client() as c:
        r = c.get("/jobs", headers=_headers(), params=params)
        r.raise_for_status()
        return _fmt(r.json())


# ===========================================================================
# Gallery Tools
# ===========================================================================


@mcp.tool()
def search_gallery(
    search: str | None = None,
    job_type: str | None = None,
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> str:
    """Search and browse generated videos in the gallery.

    Args:
        search: Search keyword to filter by title
        job_type: Filter by type - txt2vid, img2vid, vid2anime, story
        page: Page number (default 1)
        page_size: Items per page (1-100, default 20)
        sort_by: Sort field - created_at, title, file_size
        sort_order: Sort direction - asc, desc
    """
    params: dict = {
        "page": page,
        "page_size": page_size,
        "sort_by": sort_by,
        "sort_order": sort_order,
    }
    if search:
        params["search"] = search
    if job_type:
        params["job_type"] = job_type

    with _client() as c:
        r = c.get("/gallery", headers=_headers(), params=params)
        r.raise_for_status()
        return _fmt(r.json())


# ===========================================================================
# Upload Tools
# ===========================================================================


@mcp.tool()
def upload_file(file_path: str) -> str:
    """Upload a local image or video file to the server.

    Supported formats: PNG, JPEG, WebP, GIF, MP4, WebM, MOV.
    Max file size: 100 MB.

    Args:
        file_path: Absolute path to the local file to upload
    """
    path = Path(file_path)
    if not path.exists():
        return _fmt({"error": f"File not found: {file_path}"})

    content_type, _ = mimetypes.guess_type(str(path))
    if content_type is None:
        content_type = "application/octet-stream"

    headers = {}
    if _token:
        headers["Authorization"] = f"Bearer {_token}"

    with _client() as c:
        with open(path, "rb") as f:
            r = c.post(
                "/upload",
                headers=headers,
                files={"file": (path.name, f, content_type)},
            )
            r.raise_for_status()
            return _fmt(r.json())


# ===========================================================================
# Settings / API Key Tools
# ===========================================================================


@mcp.tool()
def list_api_keys() -> str:
    """List configured AI provider API keys (shows provider name and configured status, not the actual keys)."""
    with _client() as c:
        r = c.get("/settings/api-keys", headers=_headers())
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def save_api_key(provider: str, api_key: str) -> str:
    """Save or update an API key for an AI provider.

    Args:
        provider: Provider name - kling, jimeng, vidu, cogvideo, comfyui
        api_key: The API key value
    """
    with _client() as c:
        r = c.post(
            "/settings/api-keys",
            headers=_headers(),
            json={"provider": provider, "api_key": api_key},
        )
        r.raise_for_status()
        return _fmt(r.json())


# ===========================================================================
# Story Tools
# ===========================================================================


@mcp.tool()
def list_stories() -> str:
    """List all stories for the current user."""
    with _client() as c:
        r = c.get("/stories", headers=_headers())
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def get_story(story_id: str) -> str:
    """Get detailed story info including scenes and characters.

    Args:
        story_id: UUID of the story
    """
    with _client() as c:
        r = c.get(f"/stories/{story_id}", headers=_headers())
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def create_story(title: str, description: str = "") -> str:
    """Create a new story.

    Args:
        title: Story title
        description: Optional story description / synopsis
    """
    with _client() as c:
        r = c.post(
            "/stories",
            headers=_headers(),
            json={"title": title, "description": description},
        )
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def add_character(
    story_id: str,
    name: str,
    description: str = "",
    reference_image_url: str | None = None,
) -> str:
    """Add a character to a story.

    Args:
        story_id: UUID of the story
        name: Character name
        description: Character description / appearance details
        reference_image_url: Optional reference image URL (from upload_file)
    """
    body: dict = {"name": name, "description": description}
    if reference_image_url:
        body["reference_image_url"] = reference_image_url

    with _client() as c:
        r = c.post(f"/stories/{story_id}/characters", headers=_headers(), json=body)
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def add_scene(
    story_id: str,
    prompt: str,
    character_id: str | None = None,
) -> str:
    """Add a scene to a story.

    Args:
        story_id: UUID of the story
        prompt: Scene description / what happens in this scene
        character_id: Optional UUID of the character in this scene
    """
    body: dict = {"prompt": prompt}
    if character_id:
        body["character_id"] = character_id

    with _client() as c:
        r = c.post(f"/stories/{story_id}/scenes", headers=_headers(), json=body)
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def generate_story(
    story_id: str,
    provider: str = "cogvideo",
    style_preset: str = "ghibli",
) -> str:
    """Generate videos for all scenes in a story.

    Args:
        story_id: UUID of the story
        provider: AI provider - kling, jimeng, vidu, cogvideo, comfyui
        style_preset: Anime style - ghibli, shonen, seinen, cyberpunk_anime, chibi
    """
    with _client() as c:
        r = c.post(
            f"/stories/{story_id}/generate",
            headers=_headers(),
            json={"story_id": story_id, "provider": provider, "style_preset": style_preset},
        )
        r.raise_for_status()
        return _fmt(r.json())


@mcp.tool()
def merge_story(story_id: str) -> str:
    """Merge all completed scene videos of a story into a single video.

    Args:
        story_id: UUID of the story
    """
    with _client() as c:
        r = c.post(f"/stories/{story_id}/merge", headers=_headers())
        r.raise_for_status()
        return _fmt(r.json())


# ===========================================================================
# Entry point
# ===========================================================================

if __name__ == "__main__":
    mcp.run()
