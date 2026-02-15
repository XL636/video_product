# Tasks

> 按顺序执行，完成后勾选。

## Phase 1: 基础框架 ✅
- [x] Docker Compose 环境（Postgres + Redis + MinIO + Nginx）
- [x] 数据库 schema + Alembic 迁移配置
- [x] FastAPI 基础 + JWT 认证
- [x] React 脚手架 + 路由 + Tailwind + shadcn/ui
- [x] 文件上传接口 + 前端 DropZone
- [x] Phase 1 Playwright 验收测试框架

## Phase 2: 核心生成功能 ✅
- [x] Celery worker + Redis broker 配置验证
- [x] Kling AI Provider 实现（图片转视频 + 文字转视频）
- [x] Hailuo Provider 实现（文字转视频）
- [x] WebSocket 实时状态推送
- [x] 前端 Create 页面联调（图片→视频、文字→视频、视频→二次元）
- [x] Job 状态卡片（实时进度）

## Phase 3: 高级功能 ✅
- [x] ComfyUI Provider（Wan2.1 视频转二次元）
- [x] Story Studio 页面（角色管理 + 场景时间线）
- [x] ffmpeg 场景拼接（剧情模式最终视频）
- [x] Gallery 页面联调（筛选/搜索/下载）

## Phase 4: 打磨 ✅
- [x] Prompt 自动增强（anime 关键词注入）
- [x] 缩略图自动生成
- [x] Settings 页面联调（加密 API Key 存储）
- [x] 移动端响应式适配

## Phase 5: 扩展 Provider ✅
- [x] 即梦 Jimeng (Seedance) Provider
- [x] Vidu Provider
- [x] CogVideoX Provider（带音频生成）
- [x] Kling 模型升级至 kling-v1-6
- [x] 中英文双语界面
- [x] Prompt 增强双语 + 风格感知
- [x] Studio 页面 Provider 选择器

---

## 待办

### 优先级 1：测试验证
- [ ] 完整 E2E 测试验证（Phase 1-4 Playwright 测试）
- [ ] 手动功能验证（注册/登录/上传/生成/Gallery/Studio）
- [ ] 移动端测试（320px / 375px / 768px）

### 优先级 2：短期优化
- [ ] 视频播放器优化（倍速/全屏/进度拖动）
- [ ] Job Queue 增强（重试/批量删除/筛选）
- [ ] 图片懒加载 + 列表虚拟滚动
- [ ] 申请并配置真实 API Key（Kling / 即梦 / Vidu）

### 优先级 3：中期规划
- [ ] 用户配额管理（免费额度 + 付费套餐）
- [ ] 社区分享（公开模板库 + 用户作品展示）
- [ ] 更多风格预设（3D / 手绘 / 水墨）
- [ ] 单元测试覆盖率 > 80%
- [ ] 生产环境部署
