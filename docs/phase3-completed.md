# Phase 3: 高级功能 - 完成报告

**状态**: ✅ 已完成
**完成日期**: 2026-02-13

---

## 已完成任务清单

- [x] ComfyUI + Wan2.1 Provider（真实视频→二次元风格）
- [x] Story Studio 页面（角色管理 + 场景时间线）
- [x] 多 Job 编排 + ffmpeg 场景拼接
- [x] Gallery 页面（筛选 / 搜索 / 下载）

---

## Stories API 实现

**文件**: `backend/app/api/v1/stories.py`

### 端点列表

| 路径 | 方法 | 描述 |
|------|------|------|
| `/api/v1/stories` | GET | 列出所有故事 |
| `/api/v1/stories/{story_id}` | GET | 获取故事详情（含场景和角色）|
| `/api/v1/stories` | POST | 创建新故事 |
| `/api/v1/stories/{story_id}/characters` | POST | 添加角色 |
| `/api/v1/stories/{story_id}/characters/{character_id}` | DELETE | 删除角色 |
| `/api/v1/stories/{story_id}/scenes` | POST | 添加场景 |
| `/api/v1/stories/{story_id}/scenes/{scene_id}` | PUT | 更新场景 |
| `/api/v1/stories/{story_id}/scenes/{scene_id}` | DELETE | 删除场景 |
| `/api/v1/stories/{story_id}/generate` | POST | 生成故事视频 |
| `/api/v1/stories/{story_id}/merge` | POST | 合并场景视频 |

---

## Story Studio 页面

**文件**: `frontend/src/pages/StudioPage.tsx`

### 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  左侧面板 - Characters    │  中间 - Scene Timeline      │
│  ┌────────────────────┐    │  ┌──────────────────────┐  │
│  │ Characters List    │    │  │ Scene 1             │  │
│  │ + Add Character   │    │  │ Prompt + Character   │  │
│  │                  │    │  │ [生成] [删除]       │  │
│  │ Character Card 1  │    │  ├──────────────────────┤  │
│  │ Character Card 2  │    │  │ Scene 2             │  │
│  │ ...              │    │  │ ...                 │  │
│  └────────────────────┘    │  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  [Add Scene]                     [Generate All] [Merge] │
└─────────────────────────────────────────────────────────────┘
```

### 功能说明

#### 角色管理
- 添加角色：名称、描述、参考图
- 角色列表：缩略图 + 名称 + 描述
- 删除角色

#### 场景时间线
- 添加场景：动态添加到时间线
- 编辑场景：提示词 + 角色选择
- 场景状态：draft → queued → processing → completed/failed
- 单个生成：为指定场景生成视频
- 批量生成：所有草稿场景一键生成

#### 视频合并
- 合并所有已完成的场景视频
- 状态追踪：not_started → merging → completed/failed
- 下载合并后的完整视频

---

## Gallery 页面

**文件**: `frontend/src/pages/GalleryPage.tsx`

### 筛选和搜索

| 功能 | 实现 |
|------|------|
| 关键词搜索 | 输入框实时过滤视频标题 |
| 类型筛选 | 全部 / Img2Vid / Txt2Vid / Vid2Anime / Story |
| 排序 | 按创建时间降序 |

### 视频卡片组件

**文件**: `frontend/src/components/gallery/VideoCard.tsx`

**操作**:
- ▶ 播放：点击缩略图打开视频播放器
- ⬇ 下载：下载视频文件
- 🔄 重新生成：重新使用相同参数生成
- 🗑 删除：删除视频记录

### 视频播放器

**对话框**: 全屏播放体验
- 自动播放
- 自适应宽高比
- 响应式对话框（移动端 `w-[95vw]`）

---

## ffmpeg 场景拼接

**文件**: `backend/app/tasks/generation_tasks.py`

### 合并流程

```python
async def _merge_story_scenes(story_id: str) -> None:
    1. 获取故事的所有已完成场景
    2. 下载各场景视频到临时目录
    3. 生成 concat 文件列表
    4. 使用 FFmpeg concat demuxer 合并
    5. 上传合并后的视频到 MinIO
    6. 更新故事状态为 completed
```

### FFmpeg 命令

```bash
ffmpeg -f concat -safe 0 -i filelist.txt -c:v copy -c:a copy output.mp4
```

### Story 模型新增字段

| 字段 | 类型 | 说明 |
|------|------|------|
| merged_video_url | string? | 合并后的视频 URL |
| merged_status | string | 合并状态: not_started/merging/completed/failed |

---

## ComfyUI Provider

**文件**: `backend/app/services/generation/comfyui.py`

**支持的 API**:
- POST `/prompt` - 提交 ComfyUI 工作流
- GET `/history/{prompt_id}` - 查询历史记录
- GET `/view` - 获取生成的图片/视频

**工作流配置**: `comfyui-workflows/wan2_video_style.json`

---

## Gallery API 端点

| 路径 | 方法 | 描述 |
|------|------|------|
| `/api/v1/gallery` | GET | 列出视频（支持分页/筛选/搜索）|
| `/api/v1/gallery/{video_id}` | GET | 获取视频详情 |
| `/api/v1/gallery/{video_id}` | DELETE | 删除视频（含 MinIO 文件）|

### 查询参数

| 参数 | 类型 | 描述 |
|------|------|------|
| page | int | 页码（默认 1）|
| page_size | int | 每页数量（默认 20，最大 100）|
| job_type | string | 按类型筛选 |
| search | string | 关键词搜索 |
| sort_by | string | 排序字段: created_at/title/file_size |
| sort_order | string | 排序方向: asc/desc |

---

## 数据模型更新

### Scene 模型

```python
class Scene(Base):
    id = Column(UUID, primary_key=True)
    story_id = Column(ForeignKey("stories.id"))
    order_index = Column(Integer)  # 场景顺序
    prompt = Column(Text)
    character_id = Column(ForeignKey("characters.id"))  # 关联角色
    job_id = Column(ForeignKey("jobs.id"))  # 生成任务
    status = Column(String)  # draft/queued/processing/completed/failed
```

### Story 模型

```python
class Story(Base):
    id = Column(UUID, primary_key=True)
    user_id = Column(ForeignKey("users.id"))
    title = Column(String)
    description = Column(Text)
    scenes = relationship("Scene", order_by="Scene.order_index")
    merged_video_url = Column(String)  # 新增
    merged_status = Column(String)  # 新增
```

---

## 已修复问题

1. ✅ Gallery API 路径修正 (`/videos` → `/gallery`)
2. ✅ VideoCard 响应式宽度
3. ✅ 移动端对话框适配
4. ✅ Stories API 拼写修正

---

## 待完成

- [ ] 运行 Phase 3 E2E 测试
- [ ] 场景拼接进度实时推送
- [ ] 视频缩略图自动生成（Phase 4）
