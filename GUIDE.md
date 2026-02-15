# 使用指南

## 快速启动

### 前提条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 20.0+
- （可选）Node.js 20+ / Python 3.11+（本地开发）

### Docker 一键启动（推荐）

```bash
cd anime-video-gen
cp .env.example .env    # 首次需要，按需修改
docker compose up -d
docker compose ps       # 查看服务状态
```

### 服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端页面 | http://localhost | Nginx 反向代理 |
| 前端直连 | http://localhost:5173 | Vite 开发服务器 |
| 后端 API | http://localhost:8000 | FastAPI |
| API 文档 | http://localhost:8000/docs | Swagger UI |
| MinIO 控制台 | http://localhost:9001 | 对象存储管理 |

### 停止服务

```bash
docker compose down          # 停止（数据保留）
docker compose down -v       # 停止并清除数据
```

### 本地开发模式

只启动基础设施，前后端本地运行：

```bash
# 基础服务
docker compose up -d postgres redis minio

# 后端（终端 1）
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Celery Worker（终端 2）
cd backend && source .venv/bin/activate
celery -A app.celery_app worker --loglevel=info --concurrency=4

# 前端（终端 3）
cd frontend
npm install
npm run dev
```

---

## 使用指南

### 注册与登录

1. 访问 `http://localhost`（Docker）或 `http://localhost:5173`（本地）
2. 点击 **Sign Up** 注册，填写用户名/邮箱/密码
3. 注册成功自动跳转 Dashboard，系统通过 JWT Token 维持会话

### 配置 API Key

侧边栏 → **模型设置 (Settings)**，填写至少一个 Provider 的 API Key：

| Provider | 获取方式 | 支持功能 |
|----------|----------|----------|
| Kling AI | [klingai.com](https://klingai.com) | 图片转视频、文字转视频 |
| 即梦 Jimeng | [jimeng.jianying.com](https://jimeng.jianying.com) | 文字转视频 (Seedance) |
| Vidu | [vidu.com](https://vidu.com) | 文字转视频 |
| CogVideoX | [zhipuai.cn](https://open.bigmodel.cn) | 文字转视频（带音频） |
| ComfyUI | 本地部署，无需 Key | 视频转二次元（需 GPU） |

API Key 以 AES-256 加密存储。

### 生成视频

进入 **Create** 页面，选择 Tab：

- **Image to Video** — 上传参考图 + 动态描述
- **Text to Video** — 文字描述 + 风格/Provider/时长/宽高比
- **Video to Anime** — 上传真人视频 + 选择二次元风格

风格预设：Ghibli（吉卜力）/ Shonen（少年漫）/ Seinen（青年漫）/ Cyberpunk Anime / Chibi（Q版）

提交后任务进入右侧 Job Queue，状态通过 WebSocket 实时更新。

### 故事工作室

进入 **Studio** 页面：

1. 创建故事（标题 + 描述）
2. 左栏添加角色（名称、描述、参考图）
3. 中间时间线添加场景，编写 Prompt 并关联角色
4. 逐个生成或 **Generate All** 批量生成
5. 全部完成后 **Merge** 拼接为完整视频
6. 下载成片

### 视频画廊

进入 **Gallery** 页面：搜索、按类型筛选（Img2Vid / Txt2Vid / Vid2Anime / Story）、播放、下载、删除。

### 语言切换

支持中文/英文，通过侧边栏底部（桌面）或顶部导航栏（移动端）切换，选择保存在 localStorage。

---

## 测试指南

### E2E 测试（Playwright）

```bash
cd tests/e2e
npm install
npx playwright install

npm test              # 运行所有测试
npm run test:ui       # UI 模式
npm run test:debug    # 调试模式
npm run test:report   # 查看报告
```

### API 测试

访问 Swagger UI：`http://localhost:8000/docs`

核心端点验证：

| 端点 | 方法 | 预期 |
|------|------|------|
| `/health` | GET | `{"status":"ok"}` |
| `/api/v1/auth/register` | POST | 返回 token |
| `/api/v1/auth/login` | POST | 返回 token |
| `/api/v1/generate/text-to-video` | POST | 返回 job_id |
| `/api/v1/gallery` | GET | 视频列表 |
| `/api/v1/stories` | GET | 故事列表 |

### 测试数据

```
Email: test@example.com
Password: Test123456!
```

---

## 常见问题

### Docker Desktop 无法启动
1. 检查 WSL2：`wsl --status`
2. 确认 BIOS 虚拟化（VT-x/AMD-V）已开启
3. 重启 Docker Desktop

### 前端连不上后端
1. 确认 `.env` 中 `VITE_API_URL` 指向后端地址（含 `/api/v1` 后缀）
2. 检查后端健康：`curl http://localhost:8000/health`
3. 检查 CORS 配置

### 任务一直 Queued
1. 检查 Celery Worker：`docker ps | grep celery`
2. 检查 Redis：`docker ps | grep redis`
3. 查看日志：`docker compose logs celery-worker`

### Docker HMR 不生效
Windows Docker volume mount 不支持 Vite HMR，修改前端代码后需 `docker compose restart frontend`。
后端代码修改后需 `docker compose restart celery-worker`。

### 端口冲突
Vite 会自动切换到 5174、5175 等端口，查看终端输出。

### ComfyUI 无法使用
需本地 GPU 环境。无 GPU 请使用 Kling / 即梦 / Vidu / CogVideoX 等云端 Provider。
