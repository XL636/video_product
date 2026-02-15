# Anime Video Generator (动漫视频生成器)

全栈 AI 驱动的动漫视频生成平台。用户上传参考图片、配置风格参数，通过多种 AI 后端（Kling、即梦 Jimeng、Vidu、ComfyUI + WAN 2.0）生成短视频。

## 技术架构

- **前端**: React 18 + TypeScript + Vite + ShadCN UI + TailwindCSS
- **后端**: FastAPI + SQLAlchemy (async) + Celery
- **数据库**: PostgreSQL 16
- **缓存/消息队列**: Redis 7
- **对象存储**: MinIO (S3 兼容)
- **反向代理**: Nginx
- **视频生成**: Kling API、即梦 Jimeng (Seedance) API、Vidu API、ComfyUI (WAN 2.0)

## 快速启动

### 前提条件

- Docker 和 Docker Compose
- （可选）Node.js 20+ 和 Python 3.11+（本地开发）

### Docker 启动（推荐）

```bash
# 克隆仓库
git clone <repo-url> && cd anime-video-gen

# 配置环境变量
cp .env.example .env

# 启动所有服务
docker compose up -d

# 浏览器访问
open http://localhost
```

### 本地开发

**后端：**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**前端：**
```bash
cd frontend
npm install
npm run dev
```

## 项目结构

```
anime-video-gen/
  backend/           # FastAPI 后端
    app/
      api/           # API 路由
      models/        # SQLAlchemy 数据模型
      schemas/       # Pydantic 请求/响应模型
      services/      # 业务逻辑 & AI Provider 客户端
      tasks/         # Celery 异步任务
  frontend/          # React + Vite 前端
    src/
      components/    # UI 组件
      pages/         # 路由页面
      hooks/         # 自定义 React Hooks
      stores/        # Zustand 状态管理
  nginx/             # 反向代理配置
  comfyui-workflows/ # ComfyUI 工作流 JSON
  docs/              # 项目文档
  docker-compose.yml
```

## 环境变量

参见 `.env.example` 查看所有可配置项。视频生成服务的 API Key 在 Settings 页面按用户配置。

## 详细文档

- [使用指南](docs/USAGE.md) - 完整的使用说明
- [测试指南](docs/testing-guide.md) - 测试环境搭建与运行
- [后续规划](docs/NEXT_STEPS.md) - 短期/中期/长期计划
- [更新日志](CHANGELOG.md) - 版本更新记录

## License

MIT
