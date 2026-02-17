---
name: video-creator
description: >
  AnimeGen Studio 视频创作技能。三大模式：
  (1) 一键故事视频 — 触发词：一键视频、故事视频、story video、make a video、做个视频
  (2) 视频后期处理 — 触发词：剪辑、加字幕、加水印、合并视频、转格式、压缩、提取帧、gif
  (3) 全流程创作 — 触发词：全流程创作、full pipeline、完整视频制作
argument-hint: "[视频描述/文件路径/full pipeline]"
---

# Video Creator — AnimeGen Studio 全能视频创作技能

## Prerequisites

在开始之前，确认以下环境就绪：

1. **Docker 服务运行中**：
   ```bash
   docker compose ps   # 确认 backend, celery-worker, postgres, redis, minio 全部 healthy
   ```
2. **MCP Server 已连接**：可以调用 `mcp__animegen__*` 系列工具
3. **用户已登录**：如未登录，先调用 `login` 或 `register`
4. **Provider API Key 已配置**：调用 `list_api_keys` 检查。用户当前有 cogvideo 密钥

---

## Mode Detection — 模式自动判断

根据用户输入内容选择工作模式：

| 模式 | 触发条件 | 示例 |
|------|----------|------|
| **Story Mode** | 包含叙事性描述、故事概念，或触发词 | "一键视频：一个女孩在樱花树下奔跑" / "make a story video about a cat adventure" |
| **Post-processing Mode** | 提到现有文件 + 后期操作，或触发词 | "把这个视频压缩一下" / "给 output/video.mp4 加字幕" / "转成 gif" |
| **Full Pipeline Mode** | 明确要求全流程，或触发词 | "全流程创作一个完整的短片" / "full pipeline: cyberpunk chase scene" |

**判断优先级**: Full Pipeline > Post-processing（有明确文件路径时）> Story Mode（默认）

---

## Mode 1: Story Video — 一键故事视频

### 流程概览

```
用户构思 → 参数收集 → 场景分解(storyboard) → 用户审批 →
创建故事 → 添加角色 → 添加场景 → AI 生成 → 轮询等待 →
合并视频 → 下载到本地
```

### Step 1: 收集参数

向用户确认以下信息（有默认值的可跳过）：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `provider` | `cogvideo` | AI 提供商（kling / jimeng / vidu / cogvideo / comfyui）|
| `style_preset` | `ghibli` | 风格（ghibli / shonen / seinen / cyberpunk_anime / chibi）|
| `duration` | `5` | 每个场景时长（秒，1-15）|
| `aspect_ratio` | `16:9` | 画面比例（16:9 / 9:16 / 1:1）|
| `scene_count` | `3-4` | 场景数量（建议 3-6）|
| `generation_mode` | `coherent` | 生成模式（fast = 并行 / coherent = 链式衔接）|

### Step 2: 场景分解（Storyboard）

根据用户的文字构思，创作 storyboard。**所有 prompt 必须为英文**（中文输入自动翻译）。

参考 `references/story-decomposition-guide.md` 中的模板进行场景分解。

**输出格式**（展示给用户审批）：

```
📖 故事板 / Storyboard
━━━━━━━━━━━━━━━━━━━━━

🎬 标题: [Story Title]
🎨 风格: [style_preset] | 🤖 Provider: [provider]

场景 1/N — [场景标题]
  Prompt: [English visual description, 1-2 sentences]
  镜头: [camera movement / shot type]

场景 2/N — [场景标题]
  Prompt: [English visual description]
  镜头: [camera movement]

...

⏱ 预计时长: ~[N × duration]秒
💰 API 调用: [N] 次生成 + 1 次合并
```

**重要**: 必须等用户确认 storyboard 后才能继续。用户可能要求修改某个场景的描述。

### Step 3: 创建故事并生成

用户确认后，按顺序调用 MCP 工具：

```python
# 1. 创建故事
story = create_story(title="...", description="...")
story_id = story["id"]

# 2. 添加角色（如有）
char = add_character(story_id, name="...", description="...")
character_id = char["id"]

# 3. 逐个添加场景
for scene in storyboard:
    add_scene(story_id, prompt=scene["prompt"], character_id=character_id)

# 4. 发起生成
result = generate_story(story_id, provider="cogvideo", style_preset="ghibli")
# result 包含 job_id 和各场景的 scene_job_ids
```

### Step 4: 轮询等待

遵循下方 **Job Polling Protocol** 等待所有场景生成完成。

### Step 5: 合并与下载

```python
# 5. 合并场景
merge_result = merge_story(story_id)
# merge 也是异步的，需要轮询

# 6. 查询最终结果
story_detail = get_story(story_id)
merged_video_url = story_detail["merged_video_url"]

# 7. 下载到本地
# merged_video_url 是 MinIO URL（http://localhost:9000/...）
# 用 curl 或 docker cp 下载到 output/ 目录
```

**下载到本地的方法**：
```bash
# 方法 A: 直接 curl（MinIO 公开桶）
curl -o "D:/claude/video_product/anime-video-gen/output/story_final.mp4" "<merged_video_url>"

# 方法 B: 通过 Docker
docker compose exec backend python -c "
from app.services.minio_service import download_object
data = download_object('<object_name>')
with open('/tmp/merged.mp4', 'wb') as f:
    f.write(data)
" && docker cp anime-video-gen-backend-1:/tmp/merged.mp4 "D:/claude/video_product/anime-video-gen/output/story_final.mp4"
```

---

## Mode 2: Post-processing — 视频后期处理

### 概述

所有 FFmpeg 操作通过 Docker 容器执行（Windows 主机无 FFmpeg）。

**执行模式**:
```bash
# 将文件复制进容器 → 执行 FFmpeg → 复制结果出来
docker cp "<local_path>" anime-video-gen-backend-1:/tmp/input.mp4
docker compose exec backend ffmpeg [options] -i /tmp/input.mp4 /tmp/output.mp4
docker cp anime-video-gen-backend-1:/tmp/output.mp4 "<local_output_path>"
```

**非破坏性原则**: 每步操作输出新文件，绝不覆盖原始文件。

### 操作目录

| 操作 | 触发词 | 参考命令 |
|------|--------|----------|
| 裁剪 | 剪辑、裁剪、trim、cut | 见 ffmpeg-recipes.md §裁剪 |
| 拼接 | 拼接、合并、concat、merge | 见 ffmpeg-recipes.md §拼接 |
| 字幕 | 加字幕、subtitle、srt | 见 ffmpeg-recipes.md §字幕 |
| 水印 | 加水印、watermark、logo | 见 ffmpeg-recipes.md §水印 |
| 背景音乐 | 加音乐、bgm、background music | 见 ffmpeg-recipes.md §音乐 |
| 格式转换 | 转格式、convert、转 mp4/webm | 见 ffmpeg-recipes.md §格式转换 |
| 压缩 | 压缩、compress、减小体积 | 见 ffmpeg-recipes.md §压缩 |
| 提取帧 | 提取帧、截图、extract frame | 见 ffmpeg-recipes.md §帧提取 |
| GIF | 转 gif、做 gif、gif | 见 ffmpeg-recipes.md §GIF |
| 视频信息 | 视频信息、info、duration | 见 ffmpeg-recipes.md §探测 |

### 后期处理流程

1. **确认输入文件**: 检查文件路径是否存在（本地或 MinIO URL）
2. **检测视频信息**: 用 ffprobe 获取时长、分辨率、编码、是否有音轨
3. **确认操作**: 向用户确认即将执行的操作和参数
4. **执行**: 通过 Docker 执行 FFmpeg 命令
5. **验证**: 检查输出文件是否生成、大小是否合理
6. **报告**: 告知用户输出文件路径和基本信息

### 多步管道

用户可以链式请求多个操作。按顺序执行，每步的输出作为下一步的输入：

```
原始视频 → 裁剪 → 加字幕 → 加水印 → 压缩 → 最终输出
  input.mp4  trimmed.mp4  subtitled.mp4  watermarked.mp4  final.mp4
```

---

## Mode 3: Full Pipeline — 全流程创作

### 流程

```
概念构思 → 剧本创作 → Storyboard → AI 生成（Mode 1）→
后期处理（Mode 2）→ 最终交付
```

### Step 1: 概念与剧本

与用户对话，明确：
- 主题 / 类型（日常、动作、奇幻、科幻、浪漫…）
- 目标时长（短片 15-30s / 中片 30-60s）
- 情绪 / 基调
- 角色设定

基于此创作简短剧本（中文 + 英文场景描述）。

### Step 2: AI 生成

进入 Story Mode 流程（上方 Mode 1），完成从 storyboard 到合并视频。

### Step 3: 后期处理

合并完成后，询问用户是否需要：
- [ ] 添加字幕（可基于剧本自动生成 SRT）
- [ ] 添加背景音乐
- [ ] 添加水印 / 片头片尾
- [ ] 压缩输出
- [ ] 转换格式

使用 Mode 2 的 Post-processing 流程处理。

### Step 4: 交付

最终视频保存到 `output/` 目录，提供：
- 文件路径
- 视频信息（时长、分辨率、文件大小）
- 生成过程摘要

---

## Job Polling Protocol — 任务轮询协议

所有 AI 生成（单视频 / 故事 / 合并）都是异步的。使用以下协议轮询：

### 参数

| 参数 | 值 |
|------|-----|
| 轮询间隔 | **15 秒** |
| 最大轮询次数 | **40 次**（= 10 分钟超时）|
| 使用工具 | `check_job(job_id)` |

### 状态流转

```
queued → submitted → processing → completed ✅
                                → failed ❌
```

### 轮询逻辑

```python
import time

poll_count = 0
MAX_POLLS = 40
INTERVAL = 15

while poll_count < MAX_POLLS:
    result = check_job(job_id)
    status = result["status"]
    progress = result.get("progress", 0)

    if status == "completed":
        # 成功！获取 output_video_url
        break
    elif status == "failed":
        # 失败，获取 error_message
        break
    else:
        # 汇报进度
        poll_count += 1
        # 等待 15 秒（用 Bash sleep）
        time.sleep(15)

if poll_count >= MAX_POLLS:
    # 超时处理
```

### 进度汇报

每 **3 次轮询**（~45 秒）向用户汇报一次进度：

```
⏳ 生成中... [██████░░░░] 60% (已等待 1m30s / 最长 10m)
```

对于故事模式，汇报每个场景的状态：
```
📖 故事生成进度:
  场景 1/4: ✅ 完成
  场景 2/4: 🔄 生成中 (45%)
  场景 3/4: ⏳ 等待中
  场景 4/4: ⏳ 等待中
```

---

## Error Handling — 错误处理

### MCP 连接错误

```
症状: MCP 工具调用失败 / 连接拒绝
原因: Docker 服务未启动 或 MCP Server 未运行
恢复:
  1. docker compose ps — 检查服务状态
  2. docker compose up -d — 启动服务
  3. 等待 10 秒后重试
```

### 生成失败

```
症状: job status = "failed", error_message 非空
常见原因:
  - API Key 无效或额度不足 → 检查 list_api_keys，提示用户更新
  - Provider 服务异常 → 建议切换 provider 重试
  - Prompt 不合规 → 调整 prompt 内容后重试
恢复:
  - 单视频: 修改参数后重新调用 generate_text_to_video
  - 故事模式: 查看哪个场景失败，只重新生成该场景
```

### FFmpeg 错误

```
症状: docker compose exec 返回非零退出码
常见原因:
  - 输入文件不存在或格式不支持 → 检查文件路径和编码
  - 滤镜参数错误 → 检查 filter_complex 语法
  - 容器磁盘空间不足 → docker system prune
恢复:
  - 检查 stderr 输出定位具体错误
  - 尝试简化命令（去掉复杂滤镜）
  - 用 ffprobe 先检测输入文件信息
```

### Docker 未运行

```
症状: "Cannot connect to Docker daemon"
恢复:
  1. 提示用户启动 Docker Desktop
  2. 等待 Docker 就绪后运行 docker compose up -d
  3. 等待所有服务 healthy 后重试
```

---

## Quick Reference — 快速参考

### Provider 对比

| Provider | 优势 | 时长上限 | 特点 |
|----------|------|----------|------|
| cogvideo | 性价比高，支持音频 | 5s | `with_audio: True`，适合短片 |
| kling | 高质量 | 10s | 动作场景优秀 |
| jimeng | 速度快 | 5s | 出图快，适合测试 |
| vidu | 写实风 | 8s | 人物写实度高 |
| comfyui | 本地部署 | 自定义 | 需要本地 ComfyUI |

### Style Presets

| 预设 | 风格描述 | 适合题材 |
|------|----------|----------|
| `ghibli` | 水彩、柔光、宫崎骏 | 日常、奇幻、温馨 |
| `shonen` | 动态线条、明亮色彩 | 热血、动作、冒险 |
| `seinen` | 写实比例、氛围感 | 悬疑、剧情、成熟 |
| `cyberpunk_anime` | 霓虹、未来感 | 科幻、赛博朋克 |
| `chibi` | Q 版、大眼睛、可爱 | 搞笑、轻松、萌系 |

### 输出格式默认值

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 视频编码 | H.264 (`libx264`) | Windows 兼容性最佳 |
| 像素格式 | `yuv420p` | 通用播放器兼容 |
| 音频编码 | AAC | 标准音频编码 |
| 音频码率 | 128k | 良好音质 |
| CRF | 23 | 平衡质量与体积 |
| Preset | fast | 编码速度优先 |

### Prompt 编写要点

**后端自动添加的内容（不要重复）**:
- 风格前缀（如 "studio ghibli style, watercolor, soft lighting..."）
- 质量标签（"masterpiece, best quality, highly detailed..."）
- 运动标签（"smooth animation, cinematic camera work..."）
- Negative prompt 默认值（low quality, blurry, 3d render...）

**你应该写的内容**:
- 具体的视觉场景描述（人物、动作、环境、光线）
- 摄影术语（establishing shot, close-up, tracking shot）
- 情绪 / 氛围关键词（serene, intense, melancholic）

### MCP 工具速查

| 工具 | 用途 |
|------|------|
| `login(email, password)` | 登录获取 JWT |
| `register(email, username, password)` | 注册新账号 |
| `get_me()` | 当前用户信息 |
| `generate_text_to_video(prompt, ...)` | 文本生成视频 |
| `generate_image_to_video(file_url, ...)` | 图片生成视频 |
| `generate_video_to_anime(file_url, ...)` | 真人视频转动漫 |
| `check_job(job_id)` | 查询任务状态 |
| `list_jobs(page, page_size, status, job_type)` | 任务列表 |
| `search_gallery(search, job_type, ...)` | 搜索图库 |
| `upload_file(file_path)` | 上传文件 |
| `list_api_keys()` | 查看 API Key 配置 |
| `save_api_key(provider, api_key)` | 保存 API Key |
| `create_story(title, description)` | 创建故事 |
| `add_character(story_id, name, description, ...)` | 添加角色 |
| `add_scene(story_id, prompt, character_id)` | 添加场景 |
| `generate_story(story_id, provider, style_preset)` | 生成故事视频 |
| `merge_story(story_id)` | 合并故事视频 |
| `list_stories()` | 故事列表 |
| `get_story(story_id)` | 故事详情 |

### 输出目录

所有最终文件保存到项目根目录下的 `output/` 文件夹：

```bash
mkdir -p "D:/claude/video_product/anime-video-gen/output"
```

文件命名规范：
- 故事视频: `output/story_[title]_[timestamp].mp4`
- 后期处理: `output/[operation]_[original_name]_[timestamp].mp4`
- 全流程: `output/pipeline_[title]_[timestamp].mp4`
