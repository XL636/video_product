# 使用指南

## 目录

- [环境准备](#环境准备)
- [启动服务](#启动服务)
- [注册与登录](#注册与登录)
- [配置 API Key](#配置-api-key)
- [生成视频](#生成视频)
- [故事工作室](#故事工作室)
- [视频画廊](#视频画廊)
- [语言切换](#语言切换)
- [API 端点参考](#api-端点参考)
- [常见问题](#常见问题)

---

## 环境准备

| 组件 | 最低要求 |
|------|----------|
| Docker Desktop | 20.0+ |
| Node.js（本地开发） | 20+ |
| Python（本地开发） | 3.11+ |

### 1. 复制环境变量

```bash
cd anime-video-gen
cp .env.example .env
```

编辑 `.env`，按需修改数据库密码、MinIO 密钥等。默认值可直接用于本地开发。

### 2. 启动服务

**Docker 方式（推荐）：**

```bash
docker compose up -d
```

启动后的服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| Nginx | 80 | 反向代理入口 |
| Frontend (Vite) | 5173 | 前端开发服务器 |
| Backend (FastAPI) | 8000 | 后端 API |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 / 消息队列 |
| MinIO | 9000 / 9001 | 对象存储 / 管理控制台 |
| Celery Worker | - | 异步任务处理 |

**本地方式（不使用 Docker 运行前后端）：**

```bash
# 后端
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端（另一个终端）
cd frontend
npm install
npm run dev
```

> 本地方式仍需 Docker 运行 PostgreSQL、Redis、MinIO。

### 3. 验证服务

```bash
# 后端健康检查
curl http://localhost:8000/health
# 预期: {"status":"ok"}

# API 文档
# 浏览器打开 http://localhost:8000/docs
```

---

## 注册与登录

1. 打开浏览器访问 `http://localhost:5173`（本地开发）或 `http://localhost`（Docker）
2. 点击 **Sign Up** 进入注册页
3. 填写用户名、邮箱、密码，点击 **Create Account**
4. 注册成功后自动跳转到 Dashboard

登录时使用邮箱 + 密码，系统通过 JWT Token 维持会话。

---

## 配置 API Key

视频生成依赖外部 AI 服务，使用前需要配置至少一个 Provider 的 API Key。

1. 点击侧边栏 **Settings（模型设置）**
2. 在对应 Provider 的输入框中填写 API Key
3. 点击 **Save** 保存

| Provider | 获取方式 | 支持功能 |
|----------|----------|----------|
| Kling AI | [klingai.com](https://klingai.com) 申请 | 图片转视频、文字转视频 |
| 即梦 Jimeng | [jimeng.jianying.com](https://jimeng.jianying.com) 申请 | 文字转视频 (Seedance) |
| Vidu | [vidu.com](https://vidu.com) 申请 | 文字转视频 |
| ComfyUI | 本地部署，无需 Key | 视频转二次元（需 GPU） |

API Key 使用 AES-256 加密存储在数据库中，不以明文保存。

---

## 生成视频

进入 **Create** 页面，顶部有 4 个 Tab：

### Image to Video（图片转视频）

1. 上传一张参考图片（拖拽或点击上传区域）
2. 输入动态描述（如"角色缓缓转头，樱花飘落"）
3. 选择风格预设和 Provider
4. 点击 **Generate**

### Text to Video（文字转视频）

1. 在文本框中输入场景描述
2. 选择风格预设（吉卜力、少年漫、青年漫、赛博朋克、Q版）
3. 选择 Provider、时长（5s/10s）、宽高比
4. 点击 **Generate**

### Video to Anime（视频转二次元）

1. 上传一段真人视频
2. 选择二次元风格
3. 调节风格强度
4. 点击 **Generate**（需要 ComfyUI + GPU 环境）

### 风格预设

| 预设 | 效果 |
|------|------|
| Ghibli（吉卜力） | 水彩质感、柔和光影、治愈系 |
| Shonen（少年漫） | 动态构图、热血感、爆发式运镜 |
| Seinen（青年漫） | 写实细节、成熟氛围、深度阴影 |
| Cyberpunk Anime | 霓虹色调、未来感、全息投影 |
| Chibi（Q版） | 大头身、可爱夸张、萌系 |

### 任务队列

提交后，任务会出现在页面右侧的 Job Queue 中：
- **Queued** → 排队中
- **Processing** → 生成中（显示进度条）
- **Completed** → 完成，可点击查看/下载
- **Failed** → 失败，显示错误信息

任务状态通过 WebSocket 实时更新，无需手动刷新。

---

## 故事工作室

进入 **Studio** 页面，可以创建包含多个场景的故事视频。

### 基本流程

1. **创建故事**：输入标题和描述
2. **添加角色**：填写角色名称、描述，上传参考图（左侧面板）
3. **编排场景**：点击 Add Scene，为每个场景编写 Prompt 并关联角色（中间时间线）
4. **生成场景**：逐个生成或点击 **Generate All** 批量生成
5. **合并视频**：所有场景完成后，点击 **Merge** 将场景拼接为完整视频
6. **下载成片**：合并完成后可下载最终视频

### 场景状态

| 状态 | 说明 |
|------|------|
| Draft | 草稿，尚未生成 |
| Queued | 已提交，等待处理 |
| Processing | 生成中 |
| Completed | 已完成 |
| Failed | 失败 |

---

## 视频画廊

进入 **Gallery** 页面，查看所有已生成的视频。

- **搜索**：顶部搜索框按标题关键词过滤
- **筛选**：按类型筛选（全部 / Img2Vid / Txt2Vid / Vid2Anime / Story）
- **播放**：点击缩略图打开播放器
- **下载**：点击下载按钮保存到本地
- **删除**：点击删除按钮移除视频记录和文件

---

## 语言切换

项目支持中文和英文界面：

- **桌面端**：侧边栏底部的语言切换按钮
- **移动端**：顶部导航栏的语言切换按钮
- **登录/注册页**：右上角语言切换器

语言选择保存在 localStorage，下次访问自动使用上次的语言。

---

## API 端点参考

基础路径：`http://localhost:8000`

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| GET | `/api/v1/auth/me` | 获取当前用户信息 |

### 视频生成

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/generate/image-to-video` | 图片转视频 |
| POST | `/api/v1/generate/text-to-video` | 文字转视频 |
| POST | `/api/v1/generate/video-to-anime` | 视频转二次元 |

### 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/jobs` | 获取任务列表 |
| GET | `/api/v1/jobs/{job_id}` | 获取任务详情 |
| DELETE | `/api/v1/jobs/{job_id}` | 删除任务 |

### 画廊

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/gallery` | 视频列表（支持分页/筛选/搜索） |
| GET | `/api/v1/gallery/{video_id}` | 视频详情 |
| DELETE | `/api/v1/gallery/{video_id}` | 删除视频 |

### 故事

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/stories` | 故事列表 |
| POST | `/api/v1/stories` | 创建故事 |
| POST | `/api/v1/stories/{id}/characters` | 添加角色 |
| POST | `/api/v1/stories/{id}/scenes` | 添加场景 |
| POST | `/api/v1/stories/{id}/generate` | 生成故事视频 |
| POST | `/api/v1/stories/{id}/merge` | 合并场景视频 |

### 设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/settings/api-keys` | 获取 API Key 配置状态 |
| POST | `/api/v1/settings/api-keys` | 保存 API Key |
| DELETE | `/api/v1/settings/api-keys/{provider}` | 删除 API Key |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/upload` | 文件上传 |
| GET | `/health` | 健康检查 |
| WebSocket | `/api/v1/ws/jobs/{user_id}` | 任务状态实时推送 |

完整交互式 API 文档：`http://localhost:8000/docs`

---

## 常见问题

### Docker Desktop 无法启动

1. 检查 WSL2 是否安装：`wsl --status`
2. 重启 Docker Desktop 应用
3. 检查系统虚拟化是否开启（BIOS 中 VT-x/AMD-V）

### 后端启动报错

1. 检查 PostgreSQL 是否运行：`docker ps | grep postgres`
2. 检查 `.env` 文件中的数据库连接配置
3. 查看日志：`docker compose logs backend`

### 前端无法连接后端

1. 确认后端运行：`curl http://localhost:8000/health`
2. 检查 CORS 配置
3. 检查 `VITE_API_URL` 环境变量

### 视频生成任务一直 Queued

1. 检查 Celery Worker：`docker ps | grep celery`
2. 检查 Redis：`docker ps | grep redis`
3. 查看 Worker 日志：`docker compose logs celery-worker`

### ComfyUI 无法使用

ComfyUI Provider 需要本地 GPU 环境。如果没有 GPU，请使用 Kling AI 或即梦/Vidu 等云端 Provider。
