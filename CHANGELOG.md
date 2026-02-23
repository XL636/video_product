# 更新日志

本项目的所有重要变更都将记录在此文件中。

格式遵循 [Keep a Changelog](https://keepachangelog.com/)，
本项目遵循 [语义化版本控制](https://semver.org/)。

## [0.7.1] - 2026-02-23

### 修复
- **AI 创意总监错误处理**：LLM 调用失败时返回友好中文错误提示，不再 500 崩溃
  - API Key 无效 → 502 "智谱 API Key 无效或已过期"
  - API Key 未配置 → 400 "请在 Settings 页面添加 CogVideo API Key"
  - 频率超限 → 502 "请稍后重试"
- **默认 Provider 修正**：`CreateSessionRequest.provider` 默认值从 `cogvideo` → `jimeng`
- **前端 fallback Provider 修正**：确认生成时 fallback 从 `cogvideo` → `jimeng`
- **Nginx DNS 解析崩溃**：改用 Docker 内置 resolver + 变量代理，避免 upstream 启动顺序问题
- **数据库缺表**：`creative_sessions` 表未创建，导致 AI 创意总监创建会话时 500 崩溃
- **Playwright 配置**：修复 `testDir` 嵌套路径导致测试找不到的问题

### 新增
- `tests/e2e/ai-creator.spec.ts` — AI 创意总监 E2E 测试（4 用例）

### 改动文件
- `backend/app/api/v1/creative.py` — 默认 provider + 错误处理 + 函数重命名
- `backend/app/services/creative/llm_client.py` — LLM 调用错误捕获
- `frontend/src/pages/AICreatorPage.tsx` — fallback provider 修正
- `nginx/nginx.conf` — resolver + 变量化 upstream
- `tests/e2e/playwright.config.ts` — testDir 修复
- `tests/e2e/ai-creator.spec.ts` — 新增

## [0.7.0] - 2026-02-23

### 新增功能
- **AI 创意总监 3-Agent 流水线**：将单一 AI 拆分为 3 个专业 Agent 链式协作
  - Agent 1 (Creative Consultant): 创意顾问，与用户对话 1-3 轮澄清角色/风格/故事，输出 concept brief
  - Agent 2 (Storyboard Director): 分镜师，运用专业镜头语言（景别/运镜/构图/灯光/动漫技法/转场）生成分镜脚本
  - Agent 3 (Prompt Engineer): 针对 Seedance 1.5 模型优化每个场景 prompt（50-120 词，三要素齐全）
- Agent prompt 注入全面创意知识库
  - 6 种景别、8 种运镜、5 种构图、7 种灯光、7 种动漫技法
  - Seedance 1.5 模型偏好/避免事项/最佳 prompt 结构

### 变更
- 全局默认 provider 从 `kling` 改为 `jimeng` (Seedance 1.5)
- `ConfirmRequest.provider` 默认值从 `cogvideo` 改为 `jimeng`
- `CreateSessionRequest.provider` 验证放开为所有 provider
- 流水线温度策略：Agent 1 (0.7 创意) → Agent 2 (0.5 结构化) → Agent 3 (0.3 精确)

### 改动文件
- `backend/app/services/creative/agents/consultant.py` — 新增
- `backend/app/services/creative/agents/storyboarder.py` — 新增
- `backend/app/services/creative/agents/prompt_engineer.py` — 新增
- `backend/app/services/creative/director.py` — 重写为 3-Agent 编排器
- `backend/app/api/v1/creative.py` — provider 验证和默认值调整
- `frontend/src/stores/settingsStore.ts` — defaultProvider → jimeng
- `backend/app/services/generation/hailuo.py` — Seedance 2.0 升级预留

## [0.6.1] - 2026-02-17

### 修复
- 修复链式生成 `session.expire_all()` 错误：该方法为同步方法，移除错误的 `await`
- 修复链式生成场景间 API 速率限制：场景之间添加 5 秒延迟
- 修复 CogVideoX 429 频率限制处理：添加指数退避重试（30s / 60s / 120s），并记录响应体用于排查
- 修复合并视频 Windows 播放器无法打开（错误 0xC00D36C4）：像素格式从 `yuv444p` 改为 `yuv420p`

### 测试
- Playwright E2E 端到端验证：Jimeng (Seedance 1.5 Pro) 连贯模式 4 场景完整流程
  - Scene 1 (txt2vid) → 提取末帧 → Scene 2 (img2vid) → 提取末帧 → Scene 3 → Scene 4
  - 4 场景链式生成总用时 ~5.7 分钟
  - crossfade 合并输出 18.75 秒视频（1280x720, H.264 yuv420p, AAC 音频, 8.5 MB）
  - 验证了失败场景自动回退 txt2vid 机制

### 改动文件
- `backend/app/services/generation/cogvideo.py` — 429 指数退避重试 + 响应体日志
- `backend/app/tasks/generation_tasks.py` — expire_all 修复 + 场景延迟 + yuv420p 像素格式

## [0.6.0] - 2026-02-17

### 新增功能
- **故事视频连贯性改进**：三阶段全面提升故事模式视频质量
- 前端工作室页面接通后端 Stories API
  - 页面加载时自动创建/恢复后端 Story，角色和场景实时同步到后端
  - 角色增删调用 `POST/DELETE /stories/{id}/characters`
  - 场景增删调用 `POST/DELETE /stories/{id}/scenes`，编辑后自动同步（onBlur）
  - "全部生成" 调用 `POST /stories/{id}/generate`，触发后端 prompt 增强
  - WebSocket 实时更新场景状态徽章
- 新增 **生成模式切换**（快速模式 / 连贯模式）
  - 快速模式：并行生成所有场景，速度快但视觉不连贯
  - 连贯模式：链式 I2V 生成，提取上一场景末帧作为下一场景参考图，实现视觉连续性
- 连贯模式链式生成（I2V 串联）
  - `_extract_last_frame`：ffmpeg 提取视频倒数 0.5 秒处的帧作为 PNG
  - `_process_story_generation_chained`：串行处理场景，自动切换 img2vid 模式
  - 失败场景自动回退 txt2vid，不中断后续场景
  - Prompt 增强感知 I2V 模式：首场景添加 "establishing shot"，后续场景添加 "maintain character appearance and color palette"
- 场景合并添加 **crossfade 转场过渡**
  - `_merge_videos_with_transitions`：ffmpeg xfade + acrossfade 滤镜，默认 0.5 秒交叉淡入淡出
  - 自动检测无音轨片段并补充静音轨（`_ensure_audio`）
  - xfade 失败时自动回退到 concat 简单拼接

### 变更
- `StoryGenerationRequest` schema 新增 `generation_mode` 字段（`fast` | `coherent`）
- `generate_story` 端点根据模式分发：fast 并行 / coherent 链式
- `enhance_story_scene_prompt` 新增 `is_chained` 参数，连贯模式下添加 I2V 连贯提示
- `Scene` 类型新增 `video_url` 字段和 `GenerationMode` 类型
- 场景合并从简单 concat 升级为 xfade 转场（带 fallback）
- 新增中英文翻译：生成模式、快速模式、连贯模式等

### 改动文件
- `frontend/src/pages/StudioPage.tsx` — 接通 Stories API、生成模式切换 UI
- `frontend/src/types/index.ts` — Scene 类型补充 video_url、GenerationMode
- `frontend/src/i18n/en.ts` / `zh-CN.ts` — 新增 studio 翻译
- `backend/app/schemas/generation.py` — StoryGenerationRequest 增加 generation_mode
- `backend/app/api/v1/stories.py` — generate 端点支持 fast/coherent 分发
- `backend/app/tasks/generation_tasks.py` — 链式生成、帧提取、转场合并
- `backend/app/services/generation/prompt_enhancer.py` — I2V 连贯 prompt 增强

## [0.5.1] - 2026-02-16

### 新增功能
- 项目级 MCP Server（`mcp-server/server.py`），让 Claude Code 可直接调用后端 API
  - 15 个 MCP 工具覆盖：认证、视频生成、任务管理、画廊、文件上传、API Key 管理、故事工作流
  - 基于 FastMCP + httpx，通过 stdio 与 Claude Code 通信
  - 自动 JWT token 管理，登录后后续请求自动携带认证
- 前端新增 5 个视频时长选项（TextToVideo / ImageToVideo 表单）
- E2E 测试计划文档（TEST_PLAN.md，67 个测试用例）

### 修复
- 修复即梦 Jimeng img2vid base64 图片编码问题（`hailuo.py`）
- CogVideoX duration 映射优化（`cogvideo.py`）

### 变更
- 新增 `.claude/mcp.json` 注册 animegen MCP Server
- 新增中英文时长翻译（`zh-CN.ts` / `en.ts`）

## [0.5.0] - 2026-02-15

### 新增功能
- CogVideoX 文生视频启用音频生成 (`with_audio: True`)
- 提示词增强按钮支持双语（中文/英文）和风格感知关键词
  - 5 种风格预设各有独立的中英文关键词集
  - 根据当前语言设置自动选择对应语言
  - 自动跳过已存在的关键词，避免重复
- 故事工作室添加服务提供商选择器，支持选择不同 AI 模型

### 修复
- 修复 CogVideoX 图生视频 400 报错：图片 URL 格式从列表改为字符串，本地 MinIO 图片转 base64 传输
- 修复 CogVideoX poll_job 错误处理：400 响应不再抛异常，改为返回具体错误信息
- 修复故事工作室场景生成失败（405 Method Not Allowed）：API 端点从 `POST /jobs` 改为 `POST /generate/text-to-video`
- 修复前端 Docker 容器启动失败（`npm: not found`）：Dockerfile 添加 dev 构建阶段，docker-compose 指定 `target: dev`
- 修复前端 API 请求全部 404：`.env` 中 `VITE_API_URL` 补全 `/api/v1` 路径前缀

### 变更
- 前端 Dockerfile 重构为三阶段构建（dev / build / prod）
- docker-compose 前端服务指定 `target: dev` 用于开发环境
- 提示词增强按钮从随机英文关键词改为风格匹配的双语关键词

## [0.4.0] - 2026-02-14

### 新增功能
- 新增即梦 Jimeng (ByteDance Seedance) 视频生成 Provider
- 新增 Vidu (生数科技) 视频生成 Provider
- 升级 Kling 模型版本从 kling-v1 到 kling-v1-6

### 变更
- 移除 Hailuo Provider，替换为 Jimeng 和 Vidu
- 将导航栏"设置"重命名为"模型设置" (Settings → Model Settings)
- 更新前端所有 Provider 下拉选项
- 更新 API schemas 支持新 Provider 列表

## [0.3.0] - 2026-02-14

### 新增功能
- 前端添加完整的中文/英文语言支持
- 创建 useLanguage hook 管理语言状态，默认显示中文
- 在 Sidebar 侧边栏添加语言切换按钮（桌面端）
- 在移动端顶部导航栏添加语言切换按钮
- 在登录页和注册页右上角添加语言切换器
- 语言切换后自动重新加载页面应用新语言
- 导航菜单项使用翻译文本（仪表板、创建、工作室、画廊、设置）

### 变更
- 默认语言设置为中文（zh-CN）
- 语言状态保存在 localStorage

## [0.2.0] - 2026-02-14

### 新增功能
- 初始化全栈架构项目结构
- FastAPI 后端：async SQLAlchemy、Celery 任务队列、JWT 认证
- React 18 + TypeScript + Vite 前端 + shadcn/ui 组件
- Docker Compose 配置（PostgreSQL、Redis、MinIO、Nginx）
- 视频生成 Provider 抽象层（Kling AI、Hailuo、ComfyUI）
- 5 种动漫风格预设（ghibli、shonen、seinen、cyberpunk_anime、chibi）
- 核心页面：Dashboard、Create、Studio、Gallery、Settings、Auth
- WebSocket 实时任务状态更新
- AES-256 加密 API Key 存储
- MinIO S3 兼容对象存储集成

### Phase 1 功能
- 用户注册和认证系统
- 文件上传接口 + MinIO 集成
- 任务列表和状态追踪 API
- Phase 1 Playwright E2E 测试套件（8 个测试）

### Phase 2 功能
- Kling AI Provider 实现（图片转视频、文字转视频）
- Hailuo Provider 实现（文字转视频）
- WebSocket 实时任务状态更新
- Create 页面 3 个 Tab（图片转视频、文字转视频、视频转二次元）
- 任务队列组件 + 实时进度显示

### Phase 3 功能
- ComfyUI Provider + Wan2.1 视频转二次元
- Stories API 完整 CRUD 操作
- Story Studio 页面：角色管理 + 场景时间线
- 场景时间线 + 拖拽排序
- 故事多任务编排
- FFmpeg 场景拼接功能
- Gallery 页面：筛选、搜索、下载
- Story 合并 API 端点

### Phase 4 功能
- Prompt 自动增强（动漫关键词注入）
- 使用 FFmpeg 自动生成缩略图
- Settings 页面 + 加密 API Key 存储
- 移动端响应式布局 + 汉堡菜单
- Story 模型合并视频追踪字段

### API 端点
- `/api/v1/auth/*` - 用户认证
- `/api/v1/generate/*` - 视频生成
- `/api/v1/jobs/*` - 任务管理
- `/api/v1/gallery/*` - 视频画廊
- `/api/v1/stories/*` - 故事管理
- `/api/v1/settings/api-keys/*` - API Key 管理
- `/api/v1/upload` - 文件上传
- `/api/v1/ws/jobs/{user_id}` - WebSocket 更新

### 修复
- 前端生成端点 API 调用路径
- WebSocket 消息格式兼容性（前后端统一）
- Settings 页面 API Key 保存/删除端点
- Gallery 页面 API 路径
- 生成请求 API 响应处理
- GalleryPage 响应式内边距和对话框宽度
- Stories API 拼写修正

### 变更
- GalleryPage 对话框现在使用 `w-[95vw]` 以优化移动端视频查看
- 筛选栏布局移动端优化（flex-col 移动，flex-row sm+）

### 文档
- Phase 1 完成报告（`docs/phase1-completed.md`）
- Phase 2 完成报告（`docs/phase2-completed.md`）
- Phase 3 完成报告（`docs/phase3-completed.md`）
- Phase 4 完成报告（`docs/phase4-completed.md`）
- 测试指南（`docs/testing-guide.md`）
- 后续计划（`docs/NEXT_STEPS.md`）
- 测试报告模板（`tests/e2e/test-report.md`）

### Agent Teams
- 创建 `anime-video-team` 协作开发团队
- DHH (fullstack-dhh) Agent 完成核心开发任务
- James Bach (qa-bach) Agent 完成 Phase 1 E2E 测试
- Don Norman (product-norman) Agent 完成 Phase 2-4 功能验证

## [0.1.0] - 2026-02-14

### 修复
- 修复 `backend/app/models/story.py` 中 `Character` 导入错误
- 修复 `backend/app/api/v1/stories.py` 模型导入路径
- 修复数据库表缺失问题（使用 SQLAlchemy create_all() 初始化）
- 修复 Passlib/Bcrypt 兼容性问题（改用直接 bcrypt 库）
- 修复 Fernet 加密密钥验证问题（添加密钥生成和验证逻辑）

### 测试
- Phase 1 E2E 测试完成（6/7 通过，85.7%）
- 健康检查 `/health` ✅
- API 文档 `/docs` ✅
- 用户注册/登录 ✅
- 用户资料获取 ✅
- API Key 加密存储 ✅

### 验证
- Docker 服务全部运行正常（postgres、redis、minio、backend、celery-worker）
- 后端 API 健康检查正常返回 `{"status":"ok"}`
- 所有 Phase 1-4 功能代码完成度 100%

### 文档
- 项目完成报告（`PROJECT_COMPLETION_REPORT.md`）
- 最终总结（`FINAL_SUMMARY.md`）
