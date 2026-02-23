# 开发进度

## 总览

| 指标 | 状态 |
|------|------|
| 当前阶段 | Phase 8 已完成，进入优化阶段 |
| 已完成 Phase | 8 / 8 |
| 待办任务 | 5 个（T-01 ~ T-05） |
| Backlog | 7 个想法 |
| 最近完成 | AI 创意总监 Bug 修复 (v0.7.1) |
| 最后更新 | 2026-02-23 |

> 任务明细见 [TASKS.md](TASKS.md)，版本变更见 [CHANGELOG.md](CHANGELOG.md)

---

## Phase 1: 基础框架 ✅
**完成日期**: 2026-02-13

- Docker Compose 环境（PostgreSQL 16 + Redis 7 + MinIO + Nginx）
- 数据库 schema（users, api_keys, jobs, videos, characters, stories, scenes）+ Alembic 迁移
- FastAPI 后端 + JWT (HS256) 认证
- React 18 + TypeScript + Vite + ShadCN UI 前端脚手架
- 文件上传接口 + 前端 DropZone
- 7 个核心页面路由（Dashboard / Create / Studio / Gallery / Settings / Login / Register）
- Phase 1 Playwright E2E 测试框架（10 个用例）

## Phase 2: 核心生成功能 ✅
**完成日期**: 2026-02-13

- Celery worker + Redis broker 异步任务架构
- Provider 抽象层（BaseVideoProvider → submit_job / poll_job）
- Kling AI Provider（图片转视频 + 文字转视频，支持 5s/10s、多宽高比）
- Hailuo Provider（文字转视频，自动 prompt 优化）
- WebSocket 实时任务状态推送（自动重连 + 心跳检测）
- Create 页面 4 Tab（Image2Video / Text2Video / Video2Anime / Story Mode）
- Job Queue 组件（排队 → 处理中 → 完成/失败，实时进度条）
- 5 种动漫风格预设（ghibli / shonen / seinen / cyberpunk_anime / chibi）

## Phase 3: 高级功能 ✅
**完成日期**: 2026-02-13

- ComfyUI + Wan2.1 Provider（视频转二次元风格）
- Stories API 完整 CRUD（故事 / 角色 / 场景）
- Story Studio 页面（左栏角色管理 + 中间场景时间线）
- 场景状态管理（draft → queued → processing → completed/failed）
- FFmpeg 场景拼接（concat demuxer 合并多场景视频）
- Gallery 页面（关键词搜索 + 类型筛选 + 分页 + 视频播放器 + 下载/删除）

## Phase 4: 打磨 ✅
**完成日期**: 2026-02-13

- Prompt 自动增强（风格关键词注入 + 故事场景上下文 + 负向提示词）
- FFmpeg 缩略图自动生成（从视频首帧提取）
- Settings 页面（API Key Fernet 加密存储 + 默认 Provider/风格设置）
- 移动端响应式适配（侧边栏汉堡菜单 + Gallery 自适应网格 + 触摸优化）

## Phase 5: 扩展 Provider ✅
**完成日期**: 2026-02-14 ~ 2026-02-15

- 新增即梦 Jimeng (Seedance)、Vidu、CogVideoX Provider
- 升级 Kling 模型版本至 kling-v1-6
- 移除 Hailuo Provider
- 中英文双语界面（useLanguage hook + localStorage 持久化）
- CogVideoX 文生视频音频生成（with_audio: True）
- Prompt 增强按钮支持双语和风格感知关键词
- 故事工作室添加 Provider 选择器

## Phase 6: MCP 集成与优化 ✅
**完成日期**: 2026-02-16

- 修复即梦 Jimeng img2vid base64 图片编码问题
- CogVideoX duration 映射优化
- 新增 5 个时长选项（前端 TextToVideo / ImageToVideo 表单）
- 中英文时长翻译
- E2E 测试计划 67 个用例（TEST_PLAN.md）
- 项目级 MCP Server（`mcp-server/server.py`）：15 个工具覆盖全部核心 API

## Phase 7: 故事视频连贯性 ✅
**完成日期**: 2026-02-17

### v0.6.0 — 三阶段连贯性改进

**阶段1：前端接通 Stories API**
- 工作室页面加载时自动创建/恢复后端 Story，角色和场景实时同步到后端
- 角色增删调用 `POST/DELETE /stories/{id}/characters`
- 场景增删调用 `POST/DELETE /stories/{id}/scenes`，编辑后自动同步（onBlur）
- "全部生成" 调用 `POST /stories/{id}/generate`，触发后端 prompt 增强
- WebSocket 实时更新场景状态徽章
- 新增生成模式切换 UI（快速模式 / 连贯模式）

**阶段2：连贯模式 — 链式 I2V 生成**
- 快速模式：并行生成所有场景，速度快但视觉不连贯
- 连贯模式：链式 I2V 生成，提取上一场景末帧作为下一场景参考图
- `_extract_last_frame`：ffmpeg 提取视频倒数 0.5 秒处的帧作为 PNG
- `_process_story_generation_chained`：串行处理场景，自动切换 img2vid 模式
- 失败场景自动回退 txt2vid，不中断后续场景
- Prompt 增强感知 I2V 模式：首场景 establishing shot，后续场景 maintain appearance

**阶段3：Crossfade 转场合并**
- `_merge_videos_with_transitions`：ffmpeg xfade + acrossfade 滤镜
- 默认 0.5 秒交叉淡入淡出
- 自动检测无音轨片段并补充静音轨（`_ensure_audio`）
- xfade 失败时自动回退到 concat 简单拼接

### v0.6.1 — Bug 修复

- 修复链式生成 `session.expire_all()` 错误：移除错误的 `await`（同步方法）
- 修复链式生成场景间 API 速率限制：场景之间添加 5 秒延迟
- 修复 CogVideoX 429 频率限制处理：添加指数退避重试（30s / 60s / 120s）+ 响应体日志
- 修复合并视频 Windows 播放器无法打开（0xC00D36C4）：像素格式 yuv444p → yuv420p

### E2E 验证

Playwright + Jimeng (Seedance 1.5 Pro) 连贯模式 4 场景完整流程：
- Scene 1 (txt2vid) → 提取末帧 → Scene 2 (img2vid) → 提取末帧 → Scene 3 → Scene 4
- 4 场景链式生成总用时 ~5.7 分钟
- crossfade 合并输出 18.75 秒视频（1280x720, H.264 yuv420p, AAC 音频, 8.5 MB）
- 验证了失败场景自动回退 txt2vid 机制

### 已知问题
- WebSocket 连接失败导致前端场景状态徽章不更新（后端数据正常）
- StudioPage 偶发重定向到 Gallery（原因待查）

## Phase 8: AI 创意总监多 Agent 流水线 ✅
**完成日期**: 2026-02-23

### v0.7.0 — 3-Agent 创意流水线

**架构升级：单一 AI → 3-Agent 流水线**
- Agent 1 (Creative Consultant): 创意顾问，对话 1-3 轮澄清需求，输出 concept brief JSON (temperature 0.7)
- Agent 2 (Storyboard Director): 分镜师，专业镜头语言（景别/运镜/构图/灯光/动漫技法/转场），生成 storyboard (temperature 0.5)
- Agent 3 (Prompt Engineer): Prompt 工程师，针对 Seedance 1.5 模型特性优化 prompt（50-120 词、三要素齐全）(temperature 0.3)
- 用户体验不变：只和 Agent 1 对话，后端自动串联 Agent 2 → Agent 3
- API 接口不变，前端无需修改

**默认 Provider 切换**
- 全局默认从 kling → jimeng (Seedance 1.5)
- ConfirmRequest 默认从 cogvideo → jimeng
- CreateSessionRequest provider 验证放开为所有 provider

### v0.7.1 — AI 创意总监 Bug 修复
**完成日期**: 2026-02-23

Playwright E2E 测试发现并修复 5 个问题：
- `creative_sessions` 数据库表缺失（模型有但未迁移）→ 手动 CREATE TABLE 补建
- LLM 调用（ZhiPu GLM）失败时返回 500 Internal Server Error → 改为友好中文错误提示（401→"Key 无效"、429→"频率超限"）
- `CreateSessionRequest.provider` 默认值 `cogvideo` → `jimeng`
- 前端确认生成 fallback provider `cogvideo` → `jimeng`
- Nginx 启动时 upstream DNS 解析失败导致容器崩溃 → 改用 Docker DNS resolver + 变量化代理
- 新增 `tests/e2e/ai-creator.spec.ts`（4 个测试用例，全部通过）

---

## 阻塞项

| 编号 | 问题 | 影响 | 状态 |
|------|------|------|------|
| B-01 | WebSocket 偶发断连导致前端状态不更新 | Studio 场景状态徽章不实时 | 待排查 |
| B-02 | StudioPage 偶发重定向到 Gallery | Studio 页面偶尔无法停留 | 待排查 |
| B-03 | 真实 API Key 未配置 | 无法端到端验证生成流程 | 待申请 |
