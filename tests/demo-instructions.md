# Anime Video Generator - 演示说明

**日期**: 2026-02-14

---

## 项目已启动！

### 服务状态
| 服务 | 地址 | 状态 |
|------|------|------|
| 前端 | http://localhost:5173 | ✅ Running |
| 后端 | http://localhost:8000 | ✅ Running |
| Docker | 5 个服务 | ✅ Running |

---

## 使用方法

### 方法一：直接在浏览器中使用

1. 打开浏览器访问: http://localhost:5173

2. **注册账号**:
   - 填写用户名（如: demo_user）
   - 填写邮箱（如: demo@example.com）
   - 设置密码（如: Demo123456!）
   - 点击 "Create account" 按钮

3. **登录系统**:
   - 使用注册的邮箱和密码登录

4. **体验各功能页面**:
   - Create 页面 - 4 种视频生成模式
   - Studio 页面 - 角色和场景管理
   - Gallery 页面 - 视频浏览和管理
   - Settings 页面 - API Key 配置

---

## 功能介绍

### 1. Create 页面 - 视频生成

| 功能 | 说明 |
|------|------|
| Image to Video | 上传图片生成动漫视频 |
| Text to Video | 输入文字描述生成视频 |
| Video to Anime | 真实视频转二次元风格 |
| Story Mode | 进入故事工作室 |

### 2. Studio 页面 - 故事工作室

| 功能 | 说明 |
|------|------|
| 角色管理 | 添加/编辑/删除角色图片和描述 |
| 场景时间线 | 添加/排序/编辑场景 |
| Prompt 输入 | 为每个场景输入描述 |
| 角色关联 | 为场景选择角色 |
| 批量生成 | 一键生成所有场景 |
| 视频合并 | 合并场景为完整故事视频 |

### 3. Gallery 页面 - 视频画廊

| 功能 | 说明 |
|------|------|
| 视频网格 | 卡片式展示所有视频 |
| 类型筛选 | 按视频类型过滤 |
| 搜索功能 | 关键词搜索视频 |
| 播放器 | 在线播放视频 |
| 下载 | 下载生成的视频 |
| 删除 | 移除不需要的视频 |

### 4. Settings 页面 - 设置

| 功能 | 说明 |
|------|------|
| API Keys | 配置 Kling AI / Hailuo / ComfyUI |
| 默认设置 | 选择默认 Provider 和风格预设 |
| 加密存储 | API Keys 使用 AES-256 加密 |

---

## 技术亮点

- ✅ React 18 + TypeScript
- ✅ FastAPI + SQLAlchemy (async)
- ✅ WebSocket 实时状态更新
- ✅ Celery 异步任务处理
- ✅ MinIO S3 兼容对象存储
- ✅ ShadCN UI 组件库
- ✅ 响应式设计（移动端适配）

---

## 测试账号信息

如需测试视频生成功能，请申请以下 API Keys 并在 Settings 页面配置：

- **Kling AI**: https://api.klingai.com
- **Hailuo AI**: https://hailuoai.com
- **ComfyUI**: 本地运行或云服务

---

项目已完成！请在浏览器中打开 http://localhost:5173 体验。
