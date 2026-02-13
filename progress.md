# 二次元视频生成平台 - 项目进度

> 项目名称：Anime Video Generator
> 启动日期：2026-02-13
> 当前阶段：**Phase 1-4 核心功能全部完成，等待测试验证** ✅

---

## 总览

| 阶段 | 状态 | 负责角色 | 说明 |
|------|------|---------|------|
| 规划 & 设计 | **已完成** | Team Lead | 技术选型、架构设计、流程编排 |
| Phase 1：基础框架 | **已完成** | Full Stack (DHH) | Docker/FastAPI/React 骨架 |
| Phase 2：核心生成 | **已完成** | Full Stack + UI (Duarte) | Kling/Hailuo 集成 + Create 页 |
| Phase 3：高级功能 | **已完成** | Full Stack (DHH) | Story Studio + ComfyUI + Gallery |
| Phase 4：打磨 | **已完成** | Product (Norman) + QA (Bach) | Settings + 响应式 + 缩略图 |

---

## 已完成项

### 2026-02-13 — 项目规划 + 实现 + 文档

- [x] 需求确认：Web 应用，4 大核心功能（图→视频、文→视频、视频→二次元、角色剧情）
- [x] 技术选型：React + FastAPI + Celery + PostgreSQL + Redis + MinIO
- [x] 视频生成方案：Kling AI + Hailuo + ComfyUI/Wan2.1 多 Provider 策略
- [x] 架构设计：Provider 抽象层 + Celery 异步轮询 + WebSocket 实时推送
- [x] 数据库设计：7 张核心表（users, api_keys, jobs, stories, characters, scenes, videos）
- [x] 页面规划：Dashboard / Create / Story Studio / Gallery / Settings
- [x] 团队角色分配：CTO / Full Stack / UI / Interaction / Product / QA
- [x] 可视化编排流程图：[FigJam](https://www.figma.com/online-whiteboard/create-diagram/9f55ddde-2f89-4601-8da9-8ea120f26df3)
- [x] Phase 1 基础框架完成（Docker + 后端 + 前端）
- [x] Phase 2 核心功能实现（Provider + WebSocket + Create 页面）
- [x] Phase 3 高级功能实现（Stories API + Studio 页面 + Gallery + ffmpeg 拼接）
- [x] Phase 4 完全完成（Settings + Prompt 增强 + 缩略图生成 + 移动端响应式）
- [x] Playwright E2E 测试框架搭建（Phase 1 验收）
- [x] API 调用修复与消息格式统一
- [x] CHANGELOG 自动更新
- [x] 项目文档编写（4 个 Phase 完成报告 + 测试指南 + 后续行动）

---

## Phase 1：基础框架

- [x] 使用 `project-init` skill 初始化项目结构
- [x] 创建 project_team 团队
- [x] Context7 查询框架文档（FastAPI / React / Tailwind / Celery）
- [x] Docker Compose 环境搭建（Postgres + Redis + MinIO + Nginx）
- [x] 数据库 schema + Alembic 迁移
- [x] FastAPI 骨架 + JWT 认证
- [x] React 脚手架 + 路由 + Tailwind + shadcn/ui
- [x] 文件上传接口 + 前端 DropZone 组件
- [x] Phase 1 Playwright 验收测试框架搭建

---

## Phase 2：核心生成功能

- [x] Celery worker + Redis broker 配置
- [x] Kling AI Provider（图片→视频 + 文字→视频）
- [x] Hailuo Provider（文字→视频）
- [x] WebSocket 实时状态推送
- [x] 前端 Create 页面（图片→视频 Tab + 文字→视频 Tab + 视频→二次元 Tab）
- [x] Job 状态卡片（实时进度显示）
- [ ] **Playwright 验收**：Tab 切换 / 生成触发 / 状态实时更新 / Gallery 展示

---

## Phase 3：高级功能

- [x] ComfyUI + Wan2.1 Provider（真实视频→二次元风格）
- [x] Story Studio 页面（角色管理 + 场景时间线）
- [x] 多 Job 编排 + ffmpeg 场景拼接
- [x] Gallery 页面（筛选 / 搜索 / 下载）
- [ ] **Playwright 验收**：角色添加 / 多场景生成 / 视频合并 / Gallery 功能

---

## Phase 4：打磨

- [x] Prompt 自动增强（二次元关键词注入）
- [x] 缩略图自动生成
- [x] Settings 页面（加密 API Key 存储）
- [x] 移动端响应式适配
- [ ] **Playwright 验收**：API Key 持久化 / Prompt 增强 / 移动端布局
- [ ] **Playwright 验收**：API Key 持久化 / Prompt 增强 / 移动端布局

---

## 项目激活角色（6 个）

> Agent 定义文件：`D:\claude\video_product\project-team\agents\`

---

### 1. CTO — Werner Vogels (`cto-vogels.md`)

- **职能**：公司 CTO，负责技术战略、系统架构、技术选型和工程文化建设
- **本项目职责**：全程架构决策
- **使用场景**：技术架构设计、技术选型决策、系统性能和可靠性评估、技术债务评估
- **核心原则**：
  - Everything Fails, All the Time — 为失败而设计，系统必须具备自愈能力
  - You Build It, You Run It — 谁写的代码谁负责到底，包括生产环境
  - API First / Service-Oriented — 所有功能通过 API 暴露，服务间只通过 API 通信
  - 去中心化架构 — 避免单点故障，最终一致性优于强一致性
- **决策框架**：
  - 技术选型：能否保持 3-5 年灵活性？运维成本？团队能否掌控？优先 boring technology
  - 架构设计：画数据流而非组件框图，问"当这个组件挂了会怎样？"，最小化爆炸半径
  - 独立开发者：Monolith first，用托管服务替代自建，监控从第一天就要有
- **输出格式**：明确技术约束 → 架构方案（附取舍分析）→ 关键风险点 → 技术选型建议 → 复杂度估算
- **文档目录**：`docs/cto/`

---

### 2. Full Stack — DHH (`fullstack-dhh.md`)

- **职能**：全栈技术主管，负责产品开发、技术实现、代码质量和开发效率
- **本项目职责**：Phase 1 / Phase 3 主力实现
- **使用场景**：写代码和实现功能、技术实现方案选择、代码审查和重构、开发工具和流程优化
- **核心原则**：
  - Convention over Configuration — 合理默认值，减少决策疲劳，配置是例外不是常态
  - Majestic Monolith — 单体架构是大多数应用最佳选择，微服务是大公司复杂性税
  - The One Person Framework — 一个人应该能高效构建完整产品，全链路掌控
  - Programmer Happiness — 代码应该优美可读，开发体验直接影响产品质量
- **代码原则**：清晰优于聪明 / 三次重复再抽象 / 删代码比写代码重要 / 没有测试等于没有功能
- **开发节奏**：小步提交频繁发布，每天有可展示进展，完成比完美更重要
- **输出格式**：理解业务需求 → 最简洁可行方案 → 具体代码实现 → 明确不需要什么 → 开发时间估算
- **文档目录**：`docs/fullstack/`

---

### 3. UI 设计 — Matias Duarte (`ui-duarte.md`)

- **职能**：UI 设计总监，负责视觉设计语言、界面规范和设计系统
- **本项目职责**：Phase 2 视觉设计
- **使用场景**：设计页面布局和视觉风格、建立或更新设计系统、配色和排版决策、动效和过渡设计
- **核心原则**：
  - Material Metaphor — UI 元素像真实材质有物理属性，光影和层级传达信息层次
  - Bold, Graphic, Intentional — Typography 优先，颜色大胆有目的性，留白是设计元素
  - Motion Provides Meaning — 动效不是装饰是信息传递，引导注意力减少认知负担
  - Adaptive Design — 一套设计语言适配所有屏幕，响应式不只是缩放而是重新编排
- **设计系统**：Typography Scale → 颜色系统 → 间距系统(4px/8px) → 原子组件 → Elevation 系统
- **审查标准**：视觉层级清晰？信息密度合适？色彩有语义？组件一致？无障碍性达标？
- **权衡**：一致性 > 创新 / 可读性 > 美观 / 功能清晰 > 视觉酷炫 / 少即是多
- **输出格式**：分析视觉问题 → 具体 UI 方案（配色/排版/间距）→ 组件级规范 → 响应式+无障碍 → 前端实现建议
- **文档目录**：`docs/ui/`

---

### 4. 交互设计 — Alan Cooper (`interaction-cooper.md`)

- **职能**：交互设计总监，负责用户流程设计、交互模式定义和 Persona 驱动的设计决策
- **本项目职责**：Phase 2 用户流程与交互
- **使用场景**：设计用户流程和导航、定义目标用户画像（Persona）、选择交互模式、从用户角度排序功能优先级
- **核心原则**：
  - Goal-Directed Design — 设计起点是用户目标(Goals)不是任务(Tasks)
  - Personas — 不为"所有人"设计，Primary Persona 只有一个，必须让这个人完全满意
  - The Inmates Are Running the Asylum — 程序员心智模型 ≠ 用户心智模型，实现模型必须隐藏
  - 交互礼仪 — 软件像体贴的人类助手，不打断不假设，尊重用户时间和注意力
- **流程设计**：定义 Persona 和场景 → 明确目标 → 设计最短路径 → 减少中间步骤 → 验证满意度
- **功能取舍**：不服务 Primary Persona 目标的功能砍掉 / 80%用户用20%功能把这20%做到极致
- **输出格式**：定义 Primary Persona → 明确目标和场景 → 具体交互流程 → 交互陷阱 → wireframe 级建议
- **文档目录**：`docs/interaction/`

---

### 5. 产品设计 — Don Norman (`product-norman.md`)

- **职能**：产品设计总监，负责产品定义、用户体验策略和设计原则把控
- **本项目职责**：Phase 4 UX 审查与优化
- **使用场景**：定义产品功能和体验、评估设计方案的可用性、分析用户困惑或流失、规划可用性测试
- **核心原则**：
  - 以人为本的设计 — 从理解人开始不是理解技术，人犯错是设计的问题
  - 可供性(Affordance) — 产品自己告诉用户它能做什么，需要说明书就是设计失败
  - 心智模型 — 设计师的概念模型必须与用户的心智模型匹配
  - 反馈与映射 — 每个操作都有即时明确反馈，控制与结果关系自然直观
  - 约束与容错 — 让正确操作容易做错误操作难做，出错时提供有意义的恢复路径
- **复杂功能**：渐进式披露 / 新手与专家路径分开 / 利用已有设计模式
- **输出格式**：识别用户群体和场景 → 认知层面问题分析 → 符合认知原则的建议 → 预测可用性问题 → 用户测试方案
- **文档目录**：`docs/product/`

---

### 6. QA — James Bach (`qa-bach.md`)

- **职能**：质量保证总监，负责测试策略、质量标准、风险评估和产品质量把控
- **本项目职责**：全程 Playwright 测试
- **使用场景**：制定测试策略、发布前质量检查、Bug 分析和分类、质量风险评估
- **核心原则**：
  - Testing ≠ Checking — Checking 验证已知预期(自动化)，Testing 探索未知发现意外(人类思考)
  - Exploratory Testing — 同时设计、执行和学习，带着问题和假设探索
  - Rapid Software Testing — 快速低成本获得质量信息，测试是提供信息不是"通过"
  - Context-Driven Testing — 没有"最佳实践"只有特定上下文中的好实践
  - Heuristics — SFDPOT(Structure/Function/Data/Platform/Operations/Time)、HICCUPPS 一致性检查
- **测试优先级**：高影响+高概率=必须测试 / 高影响+低概率=应该测试 / 低影响+低概率=可跳过
- **自动化策略**：必须(核心冒烟测试) / 值得(API集成测试) / 不要(UI布局细节)
- **测试金字塔**：单元测试(多) > 集成测试(适量) > E2E测试(少)
- **输出格式**：评估质量风险 → 针对性测试策略 → 探索性测试关注点 → 自动化范围建议 → 具体测试场景
- **文档目录**：`docs/qa/`

---

### 角色阶段分配

| 阶段 | 激活角色 |
|------|---------|
| 全程架构决策 | **CTO (Vogels)** |
| Phase 1 基础框架 | **Full Stack (DHH)** |
| Phase 2 UI 实现 | **UI (Duarte)** + **Interaction (Cooper)** |
| Phase 3 高级功能 | **Full Stack (DHH)** |
| Phase 4 打磨 | **Product (Norman)** |
| 全程测试 | **QA (Bach)** |

---

## 关键资源

| 资源 | 链接/路径 |
|------|----------|
| 项目计划 | `.claude/plans/sleepy-leaping-axolotl.md` |
| 编排流程图 | [FigJam](https://www.figma.com/online-whiteboard/create-diagram/9f55ddde-2f89-4601-8da9-8ea120f26df3) |
| 团队 Agent 定义 | `project-team/agents/` |
| 团队技能 | `project-team/skills/team/SKILL.md` |
| 团队主文档 | `project-team/CLAUDE.md` |

---

## 风险 & 注意事项

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Kling/Hailuo API Key 未申请 | Phase 2 无法测试真实生成 | 先用 Mock Provider 开发，拿到 Key 后切换 |
| 本地无 GPU | ComfyUI/Wan2.1 无法运行 | Phase 3 视频转二次元可延后，先做 API 方案 |
| API 费用 | 开发测试消耗 credits | 开发期用最短时长（3s）+ 最低分辨率（720p）|
