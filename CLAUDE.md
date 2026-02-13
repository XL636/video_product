# CLAUDE.md - AI Assistant Guidelines

## Project Overview

Anime Video Generator - full-stack app for AI-powered anime video generation.

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (async), Celery, PostgreSQL, Redis, MinIO
- **Frontend**: TypeScript, React 18, Vite, ShadCN UI, TailwindCSS, TanStack Query
- **Infrastructure**: Docker Compose, Nginx reverse proxy

## Code Conventions

### Backend (Python)
- Use `async`/`await` throughout; all DB operations are async via SQLAlchemy AsyncSession
- Pydantic v2 schemas for request/response validation
- Follow existing patterns in `app/api/` for new endpoints
- Celery tasks go in `app/tasks/`; keep them idempotent
- Use dependency injection via FastAPI `Depends()`
- All secrets accessed via `app.core.config.settings`

### Frontend (TypeScript)
- Functional components only; use hooks for state
- TanStack Query for server state; avoid raw useEffect for data fetching
- ShadCN UI components; do not install alternative UI libraries
- API calls go through `src/services/api.ts`
- Use `cn()` utility for conditional classnames

### General
- Never commit secrets or API keys
- Keep Docker Compose services healthy; add healthchecks to new services
- Use environment variables for all configuration; never hardcode URLs or credentials
- Write clear commit messages: `type(scope): description`

## Key Paths

- Backend entry: `backend/app/main.py`
- Frontend entry: `frontend/src/main.tsx`
- Docker config: `docker-compose.yml`
- Nginx config: `nginx/nginx.conf`
- ComfyUI workflows: `comfyui-workflows/`

## Testing

- Backend: `pytest` with `httpx.AsyncClient`
- Frontend: `vitest` + React Testing Library
- Run backend tests: `cd backend && pytest`
- Run frontend tests: `cd frontend && npm test`
