# AnimeGen Studio

全栈 AI 驱动的动漫视频生成平台。上传参考图片、配置风格参数，通过多种 AI 后端生成动漫风格短视频。

A full-stack AI-powered anime video generation platform. Upload reference images, configure style parameters, and generate anime-style short videos via multiple AI backends.

## AI Creative Director

内置 3-Agent 创意流水线，用户只需输入创意想法，AI 自动完成从概念到分镜到视频 prompt 的全流程：

1. **Creative Consultant** — 与用户对话澄清需求，输出 concept brief
2. **Storyboard Director** — 运用专业镜头语言生成分镜脚本
3. **Prompt Engineer** — 针对 Seedance 1.5 模型优化每个场景 prompt

## 技术架构 / Architecture

| 层级 | 技术栈 |
|------|--------|
| 前端 Frontend | React 18 + TypeScript + Vite + ShadCN UI + TailwindCSS |
| 后端 Backend | FastAPI + SQLAlchemy (async) + Celery |
| AI/LLM | ZhiPu GLM-4-Flash (创意对话) + Seedance 1.5 (视频生成, 默认) |
| 数据库 Database | PostgreSQL 16 |
| 缓存/队列 Cache/Queue | Redis 7 |
| 对象存储 Storage | MinIO (S3-compatible) |
| 反向代理 Proxy | Nginx |
| 视频生成 Generation | Jimeng (Seedance 1.5, 默认), Kling, Vidu, CogVideoX, ComfyUI (WAN 2.0) |

## 快速启动 / Quick Start

### 前提条件 / Prerequisites

- Docker & Docker Compose
- （可选 / Optional）Node.js 20+, Python 3.11+

### 启动 / Setup

```bash
git clone https://github.com/XL636/video_product.git && cd video_product

cp .env.example .env       # 配置环境变量 / Configure env vars
docker compose up -d       # 启动所有服务 / Start all services

# 访问 / Open: http://localhost
```

### 本地开发 / Local Development

```bash
# 后端 / Backend
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 前端 / Frontend
cd frontend
npm install
npm run dev
```

> 本地开发仍需 Docker 运行 PostgreSQL、Redis、MinIO。
> Local dev still requires Docker for PostgreSQL, Redis, MinIO.

## 项目结构 / Project Structure

```
video_product/
├── backend/              # FastAPI 后端
│   └── app/
│       ├── api/          # API 路由
│       ├── models/       # SQLAlchemy 数据模型
│       ├── schemas/      # Pydantic 请求/响应
│       ├── services/
│       │   ├── creative/         # AI 创意总监
│       │   │   ├── director.py   # 3-Agent 流水线编排器
│       │   │   ├── llm_client.py # ZhiPu GLM 统一调用
│       │   │   └── agents/       # Agent Prompt 定义
│       │   │       ├── consultant.py      # 创意顾问
│       │   │       ├── storyboarder.py    # 分镜师
│       │   │       └── prompt_engineer.py # Prompt 工程师
│       │   └── generation/       # 视频生成 Provider
│       └── tasks/        # Celery 异步任务
├── frontend/             # React + Vite 前端
│   └── src/
│       ├── components/   # UI 组件
│       ├── pages/        # 路由页面
│       ├── hooks/        # 自定义 Hooks
│       ├── stores/       # Zustand 状态管理
│       └── i18n/         # 国际化 (中/英)
├── mcp-server/           # 项目级 MCP Server (19 tools)
├── nginx/                # 反向代理配置
├── comfyui-workflows/    # ComfyUI 工作流
├── tests/e2e/            # Playwright E2E 测试
├── devlogs/              # 开发日志
├── GUIDE.md              # 使用指南
├── PROGRESS.md           # 开发进度
├── CHANGELOG.md          # 版本历史
└── TASKS.md              # 任务追踪
```

## 环境变量 / Environment Variables

参见 `.env.example`。视频生成 API Key 在 Settings 页面按用户配置，无需写在 `.env` 中。

See `.env.example`. Video generation API keys are configured per-user in the Settings page.

## 文档 / Documentation

- [使用指南 / Guide](GUIDE.md) — 启动、使用、测试、常见问题
- [开发进度 / Progress](PROGRESS.md) — Phase 1-8 完成情况
- [更新日志 / Changelog](CHANGELOG.md) — 版本变更记录
- [任务追踪 / Tasks](TASKS.md) — 开发任务清单

## License

MIT
