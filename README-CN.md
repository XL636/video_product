# Anime Video Generator - 项目文档

## 项目概述

**项目名称**: Anime Video Generator (动漫视频生成器)
**项目描述**: 全栈 AI 驱动的动漫视频生成平台

---

## 快速开始

### 1. 本地开发环境

```bash
# 克隆项目（如果还没）
git clone https://github.com/XL636/video_product.git
cd video_product

# 安装依赖
cd anime-video-gen/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd anime-video-gen/frontend
npm install

# 启动后端
cd backend
uvicorn app.main:app --host 0.0.0.0 --reload

# 启动前端
cd frontend
npm run dev
```

### 2. Docker 方式

```bash
# 启动 Docker Desktop
# 配置环境变量（复制 .env.example 到 .env）
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f backend
```

---

## 项目结构

```
anime-video-gen/
├── backend/              # FastAPI 后端
│   ├── app/
│   │   ├── api/v1/      # API 路由
│   │   ├── models/       # 数据库模型
│   │   ├── schemas/      # Pydantic 模型
│   │   ├── services/     # 业务逻辑
│   │   ├── tasks/        # Celery 任务
│   ├── main.py
│   └── requirements.txt
├── frontend/           # React 前端
│   └── src/
│       ├── locales/
│       │   └── zh-CN.ts      # 中文语言
│       ├── pages/           # 页面组件
│       ├── components/
│       ├── stores/          # 状态管理
│       └── services/       # API 客户端
└── nginx/             # 反向代理
└── docker-compose.yml  # Docker 编排
└── comfyui-workflows/  # ComfyUI 工作流
└── docs/             # 项目文档
```

---

## 功能模块

| 模块 | 描述 | 技术栈 |
|------|------|------|--------|
| 用户认证 | JWT 登录/注册 | FastAPI + Pydantic |
| 视频生成 | 图片/文字/视频转动漫 | Kling AI / Hailuo / ComfyUI |
| 故事工作室 | 角色管理 + 场景时间线 | SQLAlchemy + React |
| 视频画廊 | 筛选/搜索/下载 | FastAPI + React |
| 设置管理 | API Key 加密存储 | FastAPI + Zustand |
| 文件上传 | MinIO S3 存储 | FastAPI + React DropZone |

---

## 技术栈详情

### 前端
- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **UI 库**: ShadCN UI
- **状态管理**: Zustand
- **路由**: React Router DOM
- **样式**: TailwindCSS
- **HTTP 客户**: TanStack Query / Fetch API

### 后端
- **框架**: FastAPI
- **数据库**: PostgreSQL 16 (Async SQLAlchemy)
- **任务队列**: Celery + Redis
- **对象存储**: MinIO (S3 兼容)
- **认证**: JWT (python-jose)
- **数据验证**: Pydantic v2

---

## API 端点

### 认证 `/api/v1/auth`
- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `GET /me` - 获取当前用户信息

### 生成 `/api/v1/generate`
- `POST /image-to-video` - 图片转视频
- `POST /text-to-video` - 文字转视频
- `POST /video-to-anime` - 视频转动漫
- `POST /stories/{story_id}/generate` - 故事生成

### 任务 `/api/v1/jobs`
- `GET /jobs` - 获取任务列表
- `GET /jobs/{job_id}` - 获取任务详情
- `DELETE /jobs/{job_id}` - 删除任务

### 画廊 `/api/v1/gallery`
- `GET /gallery` - 获取视频列表
- `GET /gallery/{video_id}` - 获取视频详情
- `DELETE /gallery/{video_id}` - 删除视频

### 故事 `/api/v1/stories`
- `GET /stories` - 获取故事列表
- `POST /stories` - 创建故事
- `POST /stories/{story_id}/characters` - 添加角色
- `POST /stories/{story_id}/scenes` - 添加场景
- `POST /stories/{story_id}/merge` - 合并视频

### 设置 `/api/v1/settings`
- `GET /settings` - 获取设置
- `POST /settings/api-keys` - 保存 API Key
- `DELETE /settings/api-keys/{key_id}` - 删除 API Key

### 文件 `/api/v1/upload`
- `POST /upload` - 文件上传到 MinIO

### WebSocket `/api/v1/ws/jobs/{user_id}` - 任务状态实时更新

---

## 中文语言支持

项目已添加中文语言支持，文件位置：
`frontend/src/locales/zh-CN.ts`

主要配置包括：
- 应用标题和名称
- 导航菜单翻译
- 表单字段翻译
- 按钮文字翻译
- 状态消息翻译
- 视频类型翻译
- 动漫风格预设翻译

---

## 部署说明

### Docker 部署（推荐）
1. 确保安装 Docker Desktop
2. 复制 `.env.example` 为 `.env`
3. 运行 `docker compose up -d`
4. 访问 http://localhost

### 生产环境建议
- Render (推荐用于小型项目)
- Railway (Postgres 集成)
- Fly.io (全球部署)
- 自建服务器 + Nginx

---

## 开发注意事项

### 后端开发
- 所有数据库操作都是异步的
- 使用 Alembic 进行数据库迁移
- Celery 任务需要幂等性
- API Keys 使用 AES-256 加密存储

### 前端开发
- 使用 TypeScript 确保类型安全
- API 调用通过 `src/services/api.ts`
- 状态管理使用 Zustand store
- 响应式布局使用 Tailwind 类名

---

## 项目文档

- `PROJECT_COMPLETION_REPORT.md` - 项目完成报告
- `docs/testing-guide.md` - 测试指南
- `docs/NEXT_STEPS.md` - 后续规划
- `README.md` - 项目说明

---

## GitHub 仓库

https://github.com/XL636/video_product
