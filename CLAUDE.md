# CLAUDE.md - AI Assistant Guidelines

## AI Config

```yaml
auto_commit: false
auto_push: false
commit_format: "type(scope): description"
update_progress: true
update_changelog: true
update_tasks: true
```

## Project Overview

**AnimeGen Studio** — AI 驱动的动漫视频生成全栈应用。用户输入创意想法，AI 创意总监通过 3-Agent 流水线（创意顾问 → 分镜师 → Prompt 工程师）生成专业分镜脚本，一键生成动漫视频。

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (async), Celery, PostgreSQL, Redis, MinIO
- **Frontend**: TypeScript, React 18, Vite, ShadCN UI, TailwindCSS, TanStack Query
- **AI/LLM**: ZhiPu GLM-4-Flash (创意对话), Seedance 1.5 (视频生成)
- **Infrastructure**: Docker Compose, Nginx reverse proxy, FFmpeg

## Architecture

### 3-Agent Creative Pipeline

```
用户输入想法
    ↓
[Agent 1: Creative Consultant] — temperature 0.7
  对话 1-3 轮，输出 concept_brief JSON
    ↓ (自动触发)
[Agent 2: Storyboard Director] — temperature 0.5
  专业镜头语言（景别/运镜/构图/灯光/动漫技法）
    ↓ (自动触发)
[Agent 3: Prompt Engineer] — temperature 0.3
  Seedance 1.5 模型 prompt 优化
    ↓
用户看到最终分镜脚本
```

### Video Providers

| Provider | 用途 | 默认 |
|----------|------|------|
| jimeng (Seedance 1.5) | txt2vid / img2vid | ✅ 默认 |
| cogvideo | txt2vid (带音频) | LLM 对话用同一 API key |
| kling | txt2vid / img2vid | — |
| vidu | txt2vid | — |
| comfyui | vid2anime | — |

## Key Paths

```
video_product/
├── backend/app/
│   ├── api/v1/              # API 路由 (router.py, creative.py, ...)
│   ├── models/              # SQLAlchemy 数据模型
│   ├── schemas/             # Pydantic 请求/响应
│   ├── services/
│   │   ├── creative/        # AI 创意总监
│   │   │   ├── director.py  # 3-Agent 流水线编排器
│   │   │   ├── llm_client.py # ZhiPu GLM 统一调用
│   │   │   └── agents/      # Agent Prompt 定义
│   │   │       ├── consultant.py      # Agent 1: 创意顾问
│   │   │       ├── storyboarder.py    # Agent 2: 分镜师
│   │   │       └── prompt_engineer.py # Agent 3: Prompt 工程师
│   │   └── generation/      # 视频生成 Provider
│   │       ├── hailuo.py    # Jimeng (Seedance 1.5, 默认)
│   │       ├── cogvideo.py  # CogVideoX (带音频)
│   │       ├── kling.py     # Kling
│   │       ├── vidu.py      # Vidu
│   │       └── comfyui.py   # ComfyUI (vid2anime)
│   ├── tasks/               # Celery 异步任务
│   └── core/                # 配置 & 安全
├── frontend/src/
│   ├── components/          # UI 组件
│   ├── pages/               # 路由页面
│   ├── hooks/               # 自定义 Hooks (useLanguage 等)
│   ├── stores/              # Zustand 状态管理
│   ├── i18n/                # 国际化 (en.ts, zh-CN.ts)
│   └── lib/                 # API 客户端 (api.ts)
├── mcp-server/server.py     # 项目级 MCP Server (19 tools)
├── nginx/                   # 反向代理配置
├── comfyui-workflows/       # ComfyUI 工作流
├── tests/e2e/               # Playwright E2E 测试
└── devlogs/                 # 开发日志
```

### Key Entry Points
- **Backend Entry**: `backend/app/main.py`
- **API Routes**: `backend/app/api/v1/router.py` (prefix: `/api/v1`)
- **Frontend Entry**: `frontend/src/main.tsx`
- **API Client**: `frontend/src/lib/api.ts` (baseURL from `VITE_API_URL`)
- **Settings Store**: `frontend/src/stores/settingsStore.ts` (defaultProvider: jimeng)
- **Docker**: `docker-compose.yml`

## Code Conventions

### Backend (Python)
- Use `async`/`await` throughout; all DB operations are async via SQLAlchemy AsyncSession
- Pydantic v2 schemas for request/response validation
- Follow existing patterns in `app/api/` for new endpoints
- Celery tasks go in `app/tasks/`; keep them idempotent
- Use dependency injection via FastAPI `Depends()`
- All secrets accessed via `app.core.config.settings`
- Agent prompts 放在 `app/services/creative/agents/` 下，每个 agent 一个文件
- LLM 调用统一通过 `llm_client.chat_completion()`，支持 model/temperature 参数

### Frontend (TypeScript)
- Functional components only; use hooks for state
- TanStack Query for server state; avoid raw useEffect for data fetching
- ShadCN UI components; do not install alternative UI libraries
- API calls go through `src/lib/api.ts`
- Use `cn()` utility for conditional classnames
- Style presets: `'ghibli' | 'shonen' | 'seinen' | 'cyberpunk_anime' | 'chibi'`

### General
- Never commit secrets or API keys
- Keep Docker Compose services healthy; add healthchecks to new services
- Use environment variables for all configuration; never hardcode URLs or credentials
- Commit messages: `type(scope): description`

## Git Rules

- **Commit 粒度**：一个功能/修复 = 一个 commit，不混合无关改动
- **Message 格式**：`type(scope): description`
  - type: `feat | fix | refactor | chore | docs | test | style | perf | ci`
  - scope: `backend | frontend | docker | mcp | creative | story | ...`
  - 示例：`feat(creative): add 3-agent pipeline`、`fix(frontend): sidebar responsive layout`
- **禁止操作**：
  - `git push --force` 到 main
  - `git reset --hard` 未经确认
  - 提交含密钥的文件（.env、credentials）

## Workflow Rules

- 修改 Agent prompt 后需重启 backend + celery-worker
- Docker on Windows: Vite HMR 不工作，代码修改后需 `docker compose restart frontend`
- `VITE_API_URL` 必须包含 `/api/v1` 后缀
- `.env` 已 gitignore；模板见 `.env.example`

## 任务完成后必须更新的文件

每完成一个功能/修复/改动后，**必须依次更新以下文件**，不可跳过：

| 顺序 | 文件 | 更新内容 |
|------|------|----------|
| 1 | `TASKS.md` | 勾选已完成的 task，或新增 task 到待办/backlog |
| 2 | `PROGRESS.md` | 记录本次完成的步骤和进度快照 |
| 3 | `CHANGELOG.md` | 按 Keep a Changelog 格式记录版本变更（新增/变更/修复/改动文件） |
| 4 | `CLAUDE.md` | 如涉及架构/路径/约定变化，同步更新对应章节 |
| 5 | `MEMORY.md` | 如有新的稳定模式/关键路径/重要发现，更新 auto-memory |

## Testing

- Backend: `pytest` with `httpx.AsyncClient`
- Frontend: `vitest` + React Testing Library
- E2E: Playwright (67 test cases in TEST_PLAN.md)
- Run backend tests: `cd backend && pytest`
- Run frontend tests: `cd frontend && npm test`
