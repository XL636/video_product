# Anime Video Generator

A full-stack platform for generating anime-style videos using AI. Users upload reference images, configure style parameters, and generate short video clips via multiple AI backends (Kling, Jimeng, Vidu, ComfyUI with WAN 2.0).

## Architecture

- **Frontend**: React + TypeScript + Vite (ShadCN UI)
- **Backend**: FastAPI + SQLAlchemy (async) + Celery
- **Database**: PostgreSQL 16
- **Cache / Broker**: Redis 7
- **Object Storage**: MinIO (S3-compatible)
- **Reverse Proxy**: Nginx
- **Video Generation**: Kling API, Jimeng (Seedance) API, Vidu API, ComfyUI (WAN 2.0 workflows)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) Node.js 20+ and Python 3.11+ for local development

### Setup

```bash
# Clone the repo
git clone <repo-url> && cd anime-video-gen

# Copy environment file
cp .env.example .env

# Start all services
docker compose up -d

# Open in browser
open http://localhost
```

### Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
anime-video-gen/
  backend/           # FastAPI application
    app/
      api/           # Route handlers
      models/        # SQLAlchemy models
      schemas/       # Pydantic schemas
      services/      # Business logic & external API clients
      tasks/         # Celery task definitions
  frontend/          # React + Vite application
    src/
      components/    # UI components
      pages/         # Route pages
      hooks/         # Custom React hooks
      services/      # API client layer
  nginx/             # Reverse proxy config
  comfyui-workflows/ # ComfyUI workflow JSON files
  docker-compose.yml
```

## Environment Variables

See `.env.example` for all configurable values. API keys for video generation services are configured per-user in the Settings page.

## License

MIT
