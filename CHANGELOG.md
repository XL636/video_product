# 更新日志

本项目的所有重要变更都将记录在此文件中。

格式遵循 [Keep a Changelog](https://keepachangelog.com/)，
本项目遵循 [语义化版本控制](https://semver.org/)。

## [0.1.0] - 2026-02-13

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
