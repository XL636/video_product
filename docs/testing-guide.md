# 测试指南 - Anime Video Generator

**更新日期**: 2026-02-13

---

## 环境要求

| 组件 | 要求 | 当前状态 |
|------|------|----------|
| Docker | 20.0+ | ✅ 已安装 |
| Docker Desktop | 运行中 | ⚠️ 需要启动 |
| Python | 3.11+ | ✅ 3.14.3 |
| Node.js | 20+ | ✅ v24.13.0 |

---

## 启动服务

### 方式一：Docker Compose（推荐）

```bash
cd D:\claude\video_product\anime-video-gen

# 1. 确保环境变量已配置
cp .env.example .env

# 2. 启动所有服务
docker compose up -d

# 3. 查看日志
docker compose logs -f

# 4. 停止服务
docker compose down
```

**启动的服务**:
- postgres: 数据库 (端口 5432)
- redis: 缓存/消息队列 (端口 6379)
- minio: 对象存储 (端口 9000)
- backend: FastAPI 后端 (端口 8000)
- celery-worker: Celery 任务处理器
- frontend: Vite 开发服务器 (端口 5173)
- nginx: 反向代理 (端口 80)

### 方式二：本地开发

**后端**:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**前端**:
```bash
cd frontend
npm install
npm run dev
```

---

## E2E 测试

### 安装依赖

```bash
cd tests/e2e
npm install
npx playwright install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 使用 UI 模式运行
npm run test:ui

# 调试模式
npm run test:debug

# 查看测试报告
npm run test:report
```

### 测试文件

| 文件 | 描述 | 测试数量 |
|------|------|----------|
| `phase1.spec.ts` | Phase 1 基础功能测试 | 10 |

---

## 手动测试检查清单

### Phase 1: 基础框架

- [ ] 打开首页，正确重定向到登录页
- [ ] 注册新用户成功
- [ ] 登录成功，获取 JWT token
- [ ] 登录后访问受保护路由
- [ ] 登出成功，token 清除
- [ ] 文件上传功能正常
- [ ] 后端健康检查 `/health` 返回 200

### Phase 2: 核心生成功能

- [ ] Image to Video Tab 可用
- [ ] Text to Video Tab 可用
- [ ] Video to Anime Tab 可用
- [ ] 上传图片后显示预览
- [ ] 选择风格预设生效
- [ ] 提交任务后出现在 Job Queue
- [ ] 任务状态实时更新
- [ ] 进度条正确显示
- [ ] WebSocket 连接正常

### Phase 3: 高级功能

#### Story Studio
- [ ] 添加角色成功
- [ ] 角色图片显示正确
- [ ] 删除角色成功
- [ ] 添加场景成功
- [ ] 场景顺序正确
- [ ] 为场景选择角色
- [ ] 生成单个场景
- [ ] 批量生成所有场景
- [ ] 场景合并功能可用
- [ ] 合并后的视频可下载

#### Gallery
- [ ] 视频列表正确显示
- [ ] 视频缩略图显示
- [ ] 搜索功能正常
- [ ] 类型筛选正常
- [ ] 视频播放器工作正常
- [ ] 下载功能正常
- [ ] 删除功能正常

### Phase 4: 打磨

- [ ] Prompt 增强关键词注入正确
- [ ] 负向提示词生效
- [ ] 缩略图自动生成
- [ ] API Key 加密存储
- [ ] Settings 页面配置生效
- [ ] 默认设置保存到 localStorage

### 移动端测试

- [ ] 320px 宽度显示正常
- [ ] 375px 宽度显示正常
- [ ] 768px 宽度显示正常
- [ ] 触摸操作流畅
- [ ] 侧边栏汉堡菜单工作
- [ ] Studio 页面垂直布局正常

---

## API 测试

### 使用 Swagger UI

访问: `http://localhost:8000/docs`

### 核心端点测试

| 端点 | 方法 | 预期结果 |
|------|------|----------|
| `/health` | GET | `{"status": "ok"}` |
| `/api/v1/auth/register` | POST | 创建用户并返回 token |
| `/api/v1/auth/login` | POST | 返回 token |
| `/api/v1/generate/image-to-video` | POST | 返回 job_id |
| `/api/v1/generate/text-to-video` | POST | 返回 job_id |
| `/api/v1/gallery` | GET | 返回视频列表 |
| `/api/v1/stories` | GET | 返回故事列表 |
| `/api/v1/settings/api-keys` | GET | 返回 API Key 状态 |

---

## 常见问题

### Docker Desktop 无法启动

1. 检查 WSL2 是否安装: `wsl --status`
2. 检查 Docker 服务状态
3. 重启 Docker Desktop

### 后端启动失败

1. 检查 PostgreSQL 是否启动: `docker ps | grep postgres`
2. 检查环境变量是否正确: 查看 `.env` 文件
3. 查看后端日志: `docker compose logs backend`

### 前端无法连接后端

1. 检查后端是否启动: `curl http://localhost:8000/health`
2. 检查 CORS 配置
3. 检查前端 `.env` 中的 `VITE_API_URL`

### Celery 任务不执行

1. 检查 Redis 是否启动: `docker ps | grep redis`
2. 检查 Celery worker 是否启动: `docker ps | grep celery`
3. 查看 Celery 日志: `docker compose logs celery-worker`

---

## 测试数据

### 测试用户

```
Email: test@example.com
Password: Test123456!
```

### 测试图片

上传目录: `tests/fixtures/images/`

| 文件名 | 用途 |
|--------|------|
| test-portrait.png | 人像测试 |
| test-landscape.jpg | 风景测试 |
| test-anime-character.png | 二次元角色 |

---

## 性能基准

| 指标 | 目标值 |
|--------|--------|
| 首页加载时间 | < 2s |
| 页面切换时间 | < 500ms |
| API 响应时间 | < 200ms |
| 视频上传速度 | > 5MB/s |
| WebSocket 连接时间 | < 500ms |
