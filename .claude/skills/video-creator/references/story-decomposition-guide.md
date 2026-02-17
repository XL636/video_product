# Story Decomposition Guide — 场景分解与 Prompt 模板

> 用于将用户的文字构思拆分为 AI 可生成的视觉场景序列。
> 所有 scene prompt 必须使用英文；用户界面使用中英双语。

---

## 三幕结构 → 场景映射

将任意叙事拆分为三幕结构，每幕 1-2 个场景，总计 3-6 场景。

### 结构模板

| 幕 | 功能 | 场景数 | 典型内容 |
|-----|------|--------|----------|
| **Act 1 — 开场** | 建立世界观、角色登场 | 1-2 | 环境全景、角色亮相 |
| **Act 2 — 发展/冲突** | 推进剧情、制造张力 | 1-3 | 关键事件、对抗、转折 |
| **Act 3 — 高潮/结局** | 高潮时刻、情感收束 | 1-2 | 决定性场景、结局画面 |

### 场景数量建议

| 叙事复杂度 | 场景数 | 预计时长 (5s/场景) |
|------------|--------|-------------------|
| 简单意境（一句话） | 3 | ~15s |
| 短故事 | 4 | ~20s |
| 标准叙事 | 5 | ~25s |
| 复杂剧情 | 6 | ~30s |

---

## 按题材的 Prompt 模板

### 日常 / 治愈 (Slice of Life)

```
Scene 1 — 环境建立
"Wide establishing shot of a quiet Japanese countryside town at golden hour,
 traditional houses with tiled roofs, warm sunlight filtering through trees"

Scene 2 — 角色登场
"Medium shot of a young girl with short brown hair walking along a riverbank,
 carrying a school bag, gentle breeze blowing cherry blossom petals"

Scene 3 — 日常动作
"Close-up of the girl sitting under a large cherry tree, reading a book,
 dappled sunlight on her face, peaceful and serene atmosphere"

Scene 4 — 结局
"Wide shot of the girl standing up and walking towards the sunset,
 long shadow stretching behind her, birds flying in the orange sky"
```

### 动作 / 热血 (Action / Shonen)

```
Scene 1 — 对峙
"Dramatic wide shot of two warriors facing each other on a cliff edge,
 stormy sky with lightning, wind whipping their cloaks, intense atmosphere"

Scene 2 — 蓄力
"Close-up of the protagonist's eyes narrowing with determination,
 energy aura glowing around their fist, dynamic camera push-in"

Scene 3 — 爆发
"Dynamic action shot of the protagonist launching forward with incredible speed,
 motion blur, debris flying, impact shockwave visible in the air"

Scene 4 — 决胜
"Wide overhead shot of the protagonist standing victorious,
 defeated opponent on the ground, dust settling, dramatic backlighting"
```

### 奇幻 / 冒险 (Fantasy)

```
Scene 1 — 奇幻世界
"Sweeping aerial shot of a floating island kingdom above the clouds,
 crystal spires catching rainbow light, waterfalls flowing into the void below"

Scene 2 — 旅途
"Medium tracking shot of a cloaked traveler riding a dragon through a mountain pass,
 ancient ruins visible on the peaks, mystical fog swirling around"

Scene 3 — 发现
"Low angle shot of the traveler discovering a glowing ancient artifact in a cave,
 magical runes illuminating the chamber walls, sense of awe and wonder"

Scene 4 — 转变
"Wide cinematic shot of magical energy erupting from the artifact into the sky,
 the entire landscape transforming with blooming flowers and light"
```

### 科幻 / 赛博朋克 (Sci-Fi / Cyberpunk)

```
Scene 1 — 城市
"Bird's eye view of a neon-lit cyberpunk megacity at night, flying cars,
 holographic advertisements, rain-slicked streets reflecting neon colors"

Scene 2 — 角色
"Medium shot of a hacker with cybernetic implants typing on holographic screens,
 data streams flowing around them, dark room lit only by screens"

Scene 3 — 追逐
"Dynamic tracking shot through narrow alleyways, character running from drones,
 neon signs flashing, steam vents creating atmospheric haze"

Scene 4 — 对抗
"Wide dramatic shot of the character facing a massive corporate tower,
 digital barrier shattering like glass, data particles floating in the air"
```

---

## 摄影语言词汇表

### 镜头类型 (Shot Types)

| 英文术语 | 中文 | 描述 | 适用场景 |
|----------|------|------|----------|
| `extreme wide shot` | 大远景 | 展示整个环境 | 世界观建立 |
| `wide shot` / `establishing shot` | 远景/建立镜头 | 环境与人物关系 | 场景开头 |
| `full shot` | 全身镜头 | 人物全身 | 角色登场 |
| `medium shot` | 中景 | 腰部以上 | 对话、日常动作 |
| `medium close-up` | 中近景 | 胸部以上 | 表情与动作并重 |
| `close-up` | 特写 | 面部/手部 | 情感表达 |
| `extreme close-up` | 大特写 | 眼睛/细节 | 强烈情感 |

### 镜头运动 (Camera Movement)

| 英文术语 | 中文 | 效果 |
|----------|------|------|
| `static shot` | 固定镜头 | 稳定、庄重 |
| `pan left/right` | 水平摇 | 环境展示 |
| `tilt up/down` | 垂直摇 | 揭示高度 |
| `tracking shot` | 跟踪镜头 | 跟随角色移动 |
| `dolly in/out` | 推拉镜头 | 靠近/远离 |
| `push-in` | 推进 | 增强紧张感 |
| `pull-back` / `reveal` | 拉开揭示 | 展示全貌 |
| `aerial shot` / `bird's eye` | 航拍/鸟瞰 | 宏大场景 |
| `low angle` | 仰角 | 人物显得强大 |
| `high angle` | 俯角 | 人物显得渺小 |
| `Dutch angle` | 倾斜镜头 | 不安感 |
| `crane shot` | 吊臂镜头 | 升降过渡 |

### 光影描述 (Lighting)

| 英文表述 | 中文 | 氛围 |
|----------|------|------|
| `golden hour lighting` | 黄金时段光 | 温暖、治愈 |
| `dramatic backlighting` | 逆光 | 戏剧感 |
| `soft diffused light` | 柔和漫射光 | 梦幻 |
| `neon lighting` | 霓虹灯光 | 赛博朋克 |
| `moonlight` | 月光 | 神秘、浪漫 |
| `dappled sunlight` | 斑驳阳光 | 森林/树下 |
| `rim lighting` | 轮廓光 | 突出人物 |
| `volumetric light` / `god rays` | 体积光 | 神圣、壮观 |

---

## 角色描述模板

为确保 AI 生成的角色在多个场景间保持一致性，需要使用固定的角色描述模板。

### 基础模板

```
[gender] [age_range] [body_type] with [hair_color] [hair_style] hair,
[eye_color] eyes, wearing [outfit_description],
[distinguishing_features]
```

### 示例

```
A young girl with long dark blue hair tied in a ponytail,
amber eyes, wearing a white school uniform with a red ribbon,
carrying a brown leather satchel
```

```
A tall muscular man with spiky silver hair and a scar across his left eye,
wearing a long black coat over combat gear,
wielding a glowing blue energy sword
```

### 一致性要点

1. **每个场景都重复角色核心描述**（发色、服装、特征物品）
2. **使用具体的颜色词**而非模糊描述（"dark blue" 而非 "dark"）
3. **提及标志性配件**（帽子、武器、饰品）
4. **避免用代词替代描述**（每次都写 "the girl with blue hair" 而非 "she"）

---

## 中文叙事术语 → 英文视觉描述翻译指南

| 中文叙事概念 | 英文视觉 prompt |
|-------------|----------------|
| 樱花纷飞 | cherry blossom petals falling and swirling in the wind |
| 夕阳西下 | golden sunset with orange and pink sky, long shadows |
| 雨中漫步 | walking in gentle rain, reflections on wet pavement, umbrella |
| 星空下 | under a vast starry night sky, Milky Way visible |
| 古风建筑 | traditional East Asian architecture, curved roofs, paper lanterns |
| 校园回忆 | Japanese school building, cherry trees, warm afternoon light |
| 战斗爆发 | dynamic combat with energy blasts, motion blur, debris flying |
| 命运对决 | two figures facing each other, dramatic wind, intense eye contact |
| 温馨时刻 | warm cozy interior, soft lighting, characters smiling gently |
| 离别场景 | character walking away on a long road, other watching from behind |
| 觉醒力量 | energy aura erupting around character, eyes glowing, hair floating |
| 回忆闪回 | soft focus, slightly desaturated colors, dreamy vignette effect |
| 奇幻世界 | fantastical landscape with floating islands, crystal formations, aurora |
| 机甲战斗 | giant mecha robot in combat stance, city skyline, dynamic pose |

---

## Coherent 模式下场景衔接要点

当使用 `generation_mode: coherent`（链式 I2V）时，后续场景使用前一场景的最后一帧作为输入。

### 衔接原则

1. **颜色连续性**: 相邻场景的色调不要跳变太大（如从暖色调突然变冷色调）
2. **角色位置**: 上一场景结束时角色的位置应与下一场景开头一致
3. **环境过渡**: 如果切换场景，使用「角色走出画面」→「新场景建立镜头」的方式
4. **光线一致**: 同一时间段内的场景应保持光线一致

### Coherent 模式 Prompt 补充词

- 场景 1（首场景）: 加上 `opening scene, establishing shot`
- 后续场景: 加上 `continuation from previous scene, maintain character appearance and color palette`

> 注意: 后端的 `enhance_story_scene_prompt` 会自动添加这些标签，
> 但在 storyboard 阶段规划时，应当考虑视觉连续性。

### 避免的情况

- 场景间人物服装突然改变
- 从白天突然跳到夜晚（除非剧情需要）
- 背景风格在场景间剧烈变化
- 角色面向方向不连贯（如上一场景向右走，下一场景突然向左）

---

## Storyboard 审批格式模板

展示给用户确认时使用此格式：

```
📖 故事板 / Storyboard
━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 标题: [中文标题] / [English Title]
🎨 风格: [style_preset]
🤖 Provider: [provider]
🔗 模式: [fast/coherent]

━━━━━━━━━━━━━━━━━━━━━━━━━

场景 1/N — [中文场景标题]
  📝 Prompt: [English visual description, 1-2 sentences]
  🎥 镜头: [shot type + camera movement]
  ⏱ 时长: [duration]s

场景 2/N — [中文场景标题]
  📝 Prompt: [English visual description]
  🎥 镜头: [shot type + camera movement]
  ⏱ 时长: [duration]s

[... 更多场景 ...]

━━━━━━━━━━━━━━━━━━━━━━━━━

📊 总计:
  • 场景数: N
  • 预计总时长: ~[N × duration]s (含 crossfade)
  • API 调用: N 次生成 + 1 次合并
  • 生成模式: [fast: 并行 / coherent: 链式衔接]

请确认是否开始生成？(可修改任意场景的描述)
```

---

## Prompt 质量检查清单

在提交场景 prompt 之前，确认每个 prompt 满足：

- [ ] **全英文** — 不包含中文字符
- [ ] **具体画面** — 描述可视化的场景（谁、在哪、做什么）
- [ ] **包含镜头语言** — 至少一个 shot type 或 camera movement
- [ ] **包含光影/氛围** — 至少一个光影或情绪关键词
- [ ] **角色描述一致** — 如果有角色，使用固定的外观描述
- [ ] **不包含后端自动添加的标签** — 不要写 "masterpiece, best quality"（后端自动添加）
- [ ] **不包含风格前缀** — 不要写 "studio ghibli style"（后端根据 style_preset 自动添加）
- [ ] **长度适中** — 1-3 句话（过长可能降低生成质量）
