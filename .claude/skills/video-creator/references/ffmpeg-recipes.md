# FFmpeg Recipes — AnimeGen Studio 后期处理参考手册

> 所有命令通过 Docker 容器执行：`docker compose exec backend ffmpeg ...`
> 项目根目录: `D:/claude/video_product/`

---

## Docker 执行包装模式

Windows 主机没有 FFmpeg，所有操作必须通过 Docker 容器执行。

### 基本模式：文件进出容器

```bash
# 1. 复制输入文件到容器
docker cp "<local_input>" anime-video-gen-backend-1:/tmp/input.mp4

# 2. 在容器内执行 FFmpeg
docker compose exec backend ffmpeg [options] -i /tmp/input.mp4 /tmp/output.mp4

# 3. 复制结果文件回主机
docker cp anime-video-gen-backend-1:/tmp/output.mp4 "<local_output>"

# 4. 清理容器内临时文件
docker compose exec backend rm -f /tmp/input.mp4 /tmp/output.mp4
```

### 多文件输入模式

```bash
# 复制多个文件进容器
docker cp "file1.mp4" anime-video-gen-backend-1:/tmp/file1.mp4
docker cp "file2.mp4" anime-video-gen-backend-1:/tmp/file2.mp4

# 执行需要多个输入的命令
docker compose exec backend ffmpeg -i /tmp/file1.mp4 -i /tmp/file2.mp4 [options] /tmp/output.mp4

# 复制结果出来
docker cp anime-video-gen-backend-1:/tmp/output.mp4 "<local_output>"
```

---

## 探测 — ffprobe

### 获取视频时长

```bash
docker compose exec backend ffprobe \
  -v error \
  -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  /tmp/input.mp4
```

### 获取完整信息（编码、分辨率、帧率、音轨）

```bash
docker compose exec backend ffprobe \
  -v error \
  -show_entries stream=codec_name,width,height,r_frame_rate,codec_type \
  -show_entries format=duration,size,bit_rate \
  -of json \
  /tmp/input.mp4
```

### 检测是否有音轨

```bash
docker compose exec backend ffprobe \
  -v error \
  -select_streams a \
  -show_entries stream=index \
  -of csv=p=0 \
  /tmp/input.mp4
# 有输出 = 有音轨，无输出 = 无音轨
```

---

## 裁剪 — Trim / Cut

### 按时间裁剪

```bash
# 从 00:05 开始，截取 10 秒
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -ss 00:00:05 -t 10 \
  -c:v libx264 -pix_fmt yuv420p -c:a aac \
  -y /tmp/trimmed.mp4
```

### 精确裁剪（无关键帧问题）

```bash
# -ss 在 -i 之后 = 精确但较慢
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -ss 00:00:05 -to 00:00:15 \
  -c:v libx264 -pix_fmt yuv420p -c:a aac \
  -y /tmp/trimmed.mp4
```

---

## 拼接 — Concat

### 简单拼接（同编码）

```bash
# 先创建文件列表
docker compose exec backend bash -c "cat > /tmp/concat.txt << 'EOF'
file '/tmp/clip1.mp4'
file '/tmp/clip2.mp4'
file '/tmp/clip3.mp4'
EOF"

docker compose exec backend ffmpeg \
  -f concat -safe 0 \
  -i /tmp/concat.txt \
  -c copy \
  -y /tmp/merged.mp4
```

### 带转场的拼接（Crossfade）

这是项目中已验证的完整模式，来自 `generation_tasks.py`。

#### 双视频 crossfade

```bash
docker compose exec backend ffmpeg \
  -i /tmp/clip1.mp4 -i /tmp/clip2.mp4 \
  -filter_complex "\
    [0:v][1:v]xfade=transition=fade:duration=0.5:offset=OFFSET[vout];\
    [0:a][1:a]acrossfade=d=0.5:c1=tri:c2=tri[aout]" \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 \
  -c:a aac -b:a 128k \
  -y /tmp/merged.mp4
```

> **OFFSET 计算**: `clip1_duration - fade_duration`
> 例如 clip1 = 5s, fade = 0.5s → offset = 4.5

#### 三视频 crossfade

```bash
docker compose exec backend ffmpeg \
  -i /tmp/clip1.mp4 -i /tmp/clip2.mp4 -i /tmp/clip3.mp4 \
  -filter_complex "\
    [0:v][1:v]xfade=transition=fade:duration=0.5:offset=OFF1[v1];\
    [0:a][1:a]acrossfade=d=0.5:c1=tri:c2=tri[a1];\
    [v1][2:v]xfade=transition=fade:duration=0.5:offset=OFF2[vout];\
    [a1][2:a]acrossfade=d=0.5:c1=tri:c2=tri[aout]" \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 \
  -c:a aac -b:a 128k \
  -y /tmp/merged.mp4
```

> **Offset 计算（链式）**:
> - OFF1 = dur1 - 0.5
> - OFF2 = OFF1 + dur2 - 0.5

#### N 视频通用 offset 计算

```
offsets = []
cumulative = durations[0]
for i in range(1, N):
    offset = max(0, cumulative - fade_duration)
    offsets.append(offset)
    cumulative = offset + durations[i]
```

### 可用转场效果

`xfade` 支持的 transition 值（常用）：
- `fade` — 渐变（默认推荐）
- `wipeleft` / `wiperight` / `wipeup` / `wipedown`
- `slideleft` / `slideright` / `slideup` / `slidedown`
- `dissolve` — 溶解
- `smoothleft` / `smoothright`

---

## 静音轨补充 — Ensure Audio

许多 AI 生成的视频没有音轨，crossfade 需要音轨存在。

```bash
# 检测 → 如无音轨则添加静音轨
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
  -t DURATION \
  -c:v copy -c:a aac -shortest \
  -y /tmp/with_audio.mp4
```

> **DURATION**: 使用 ffprobe 获取的视频时长

---

## 字幕 — Subtitles

### 烧录 SRT 字幕

```bash
# 先把 .srt 文件复制进容器
docker cp "subtitles.srt" anime-video-gen-backend-1:/tmp/subtitles.srt

docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -vf "subtitles=/tmp/subtitles.srt:force_style='FontSize=24,FontName=Noto Sans CJK SC,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2'" \
  -c:v libx264 -pix_fmt yuv420p -c:a copy \
  -y /tmp/subtitled.mp4
```

### SRT 格式模板

```srt
1
00:00:00,000 --> 00:00:03,000
第一句字幕 / First subtitle

2
00:00:03,500 --> 00:00:07,000
第二句字幕 / Second subtitle
```

### 烧录纯文字字幕（无 SRT 文件）

```bash
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -vf "drawtext=text='Your Text Here':fontsize=28:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-th-40" \
  -c:v libx264 -pix_fmt yuv420p -c:a copy \
  -y /tmp/subtitled.mp4
```

---

## 水印 — Watermark

### 图片水印（右下角）

```bash
docker cp "logo.png" anime-video-gen-backend-1:/tmp/logo.png

docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 -i /tmp/logo.png \
  -filter_complex "overlay=W-w-10:H-h-10" \
  -c:v libx264 -pix_fmt yuv420p -c:a copy \
  -y /tmp/watermarked.mp4
```

### 水印位置参考

| 位置 | overlay 参数 |
|------|-------------|
| 左上 | `overlay=10:10` |
| 右上 | `overlay=W-w-10:10` |
| 左下 | `overlay=10:H-h-10` |
| 右下 | `overlay=W-w-10:H-h-10` |
| 居中 | `overlay=(W-w)/2:(H-h)/2` |

### 文字水印

```bash
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -vf "drawtext=text='AnimeGen Studio':fontsize=16:fontcolor=white@0.5:x=W-tw-10:y=H-th-10" \
  -c:v libx264 -pix_fmt yuv420p -c:a copy \
  -y /tmp/watermarked.mp4
```

---

## 背景音乐 — Audio Mix

### 添加背景音乐（保留原声）

```bash
docker cp "bgm.mp3" anime-video-gen-backend-1:/tmp/bgm.mp3

docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 -i /tmp/bgm.mp3 \
  -filter_complex "[1:a]volume=0.3[bgm];[0:a][bgm]amix=inputs=2:duration=first[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy -c:a aac -b:a 128k \
  -shortest \
  -y /tmp/with_bgm.mp4
```

### 替换音轨（纯音乐）

```bash
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 -i /tmp/bgm.mp3 \
  -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 128k \
  -shortest \
  -y /tmp/replaced_audio.mp4
```

### 给无声视频添加音乐

```bash
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 -i /tmp/bgm.mp3 \
  -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 128k \
  -shortest \
  -y /tmp/with_music.mp4
```

---

## 格式转换 — Convert

### MP4 → WebM

```bash
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus \
  -y /tmp/output.webm
```

### MP4 → MOV

```bash
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -c:v copy -c:a copy \
  -y /tmp/output.mov
```

### WebM / MOV → MP4

```bash
docker compose exec backend ffmpeg \
  -i /tmp/input.webm \
  -c:v libx264 -pix_fmt yuv420p -c:a aac \
  -y /tmp/output.mp4
```

---

## 压缩 — Compress

### 标准压缩（CRF 控制）

```bash
# CRF 越大越小体积（18=高质量, 23=平衡, 28=小体积, 35=低质量）
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -c:v libx264 -pix_fmt yuv420p -crf 28 -preset medium \
  -c:a aac -b:a 96k \
  -y /tmp/compressed.mp4
```

### 目标码率压缩

```bash
# 目标 1Mbps 视频（2-pass 更精确但单 pass 够用）
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -c:v libx264 -pix_fmt yuv420p -b:v 1M -maxrate 1.5M -bufsize 2M \
  -c:a aac -b:a 96k \
  -y /tmp/compressed.mp4
```

### 降低分辨率

```bash
# 缩小到 720p（保持比例）
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -vf "scale=-2:720" \
  -c:v libx264 -pix_fmt yuv420p -crf 23 \
  -c:a copy \
  -y /tmp/720p.mp4
```

---

## 帧提取 — Frame Extraction

### 提取单帧（截图）

```bash
# 在第 2 秒位置提取一帧
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -ss 00:00:02 -vframes 1 \
  -y /tmp/frame.png

docker cp anime-video-gen-backend-1:/tmp/frame.png "<local_path>"
```

### 提取末尾帧

```bash
# 提取最后 0.5 秒处的帧（项目已验证模式）
docker compose exec backend ffmpeg \
  -sseof -0.5 \
  -i /tmp/input.mp4 \
  -vframes 1 -f image2 \
  -y /tmp/last_frame.png
```

### 提取序列帧

```bash
# 每秒提取 1 帧
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -vf "fps=1" \
  /tmp/frames/frame_%04d.png
```

### 提取缩略图

```bash
# 在 1 秒位置提取 320px 宽缩略图（项目已验证模式）
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -ss 00:00:01 -vframes 1 \
  -vf "scale=320:-1" \
  -y /tmp/thumbnail.jpg
```

---

## GIF — 动图提取

### 高质量 GIF（调色板优化）

```bash
# Step 1: 生成调色板
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -vf "fps=10,scale=480:-1:flags=lanczos,palettegen" \
  -y /tmp/palette.png

# Step 2: 用调色板生成 GIF
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 -i /tmp/palette.png \
  -filter_complex "fps=10,scale=480:-1:flags=lanczos[v];[v][1:v]paletteuse" \
  -y /tmp/output.gif
```

### 快速 GIF（较低质量）

```bash
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -vf "fps=8,scale=320:-1" \
  -y /tmp/output.gif
```

### 截取片段转 GIF

```bash
# 从第 2 秒开始，截取 3 秒做 GIF
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -ss 2 -t 3 \
  -vf "fps=10,scale=480:-1:flags=lanczos,palettegen" \
  -y /tmp/palette.png

docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 -i /tmp/palette.png \
  -ss 2 -t 3 \
  -filter_complex "fps=10,scale=480:-1:flags=lanczos[v];[v][1:v]paletteuse" \
  -y /tmp/output.gif
```

---

## 调速 — Speed Change

### 加速

```bash
# 2 倍速
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac \
  -y /tmp/fast.mp4
```

### 减速

```bash
# 0.5 倍速（慢动作）
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -filter_complex "[0:v]setpts=2.0*PTS[v];[0:a]atempo=0.5[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac \
  -y /tmp/slow.mp4
```

---

## 旋转与翻转 — Rotate / Flip

```bash
# 顺时针旋转 90°
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -vf "transpose=1" \
  -c:v libx264 -pix_fmt yuv420p -c:a copy \
  -y /tmp/rotated.mp4

# 水平翻转
docker compose exec backend ffmpeg \
  -i /tmp/input.mp4 \
  -vf "hflip" \
  -c:v libx264 -pix_fmt yuv420p -c:a copy \
  -y /tmp/flipped.mp4
```

---

## 常见问题速查

| 问题 | 解决方案 |
|------|----------|
| `No such container` | 检查容器名: `docker compose ps`，可能是 `anime-video-gen-backend-1` |
| `No such file` | 确认已 `docker cp` 到容器内 |
| `acrossfade` 失败 | 输入视频无音轨，需先用 `anullsrc` 添加静音轨 |
| xfade offset 错误 | offset 不能大于第一个视频时长，检查计算 |
| 字幕乱码 | 确保 SRT 文件为 UTF-8 编码 |
| 输出视频无法播放 | 添加 `-pix_fmt yuv420p` 确保兼容性 |
| GIF 体积过大 | 降低 fps（8-10）、缩小 scale、缩短时长 |
