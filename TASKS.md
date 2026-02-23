# Tasks

> **AnimeGen Studio** — AI 驱动的动漫视频生成平台。用户输入创意想法，3-Agent 流水线自动生成专业分镜脚本，一键生成动漫视频。

---

## 已完成阶段

| Phase | 名称 | 完成日期 | 核心交付 |
|-------|------|----------|----------|
| 1 | 基础框架 | 2026-02-13 | Docker Compose + FastAPI + React 脚手架 + JWT 认证 |
| 2 | 核心生成 | 2026-02-13 | Celery 异步 + Kling/Hailuo Provider + WebSocket 实时推送 |
| 3 | 高级功能 | 2026-02-13 | ComfyUI vid2anime + Story Studio + FFmpeg 场景拼接 |
| 4 | 打磨 | 2026-02-13 | Prompt 增强 + 缩略图 + Settings 加密存储 + 移动端适配 |
| 5 | 扩展 Provider | 2026-02-15 | Jimeng/Vidu/CogVideoX + 中英双语 + Kling v1-6 升级 |
| 6 | MCP 集成 | 2026-02-16 | Bug 修复 + MCP Server (19 tools) + E2E 测试计划 67 用例 |
| 7 | 故事连贯性 | 2026-02-17 | 链式 I2V 生成 + Crossfade 转场 + 末帧提取 |
| 8 | AI 创意总监 | 2026-02-23 | 3-Agent 流水线 (Consultant→Storyboarder→PromptEngineer) |

> 详细记录见 [PROGRESS.md](PROGRESS.md) 和 [CHANGELOG.md](CHANGELOG.md)

---

## 待办

### T-01: E2E 测试验证

**目标**：确保 Phase 1-8 全部功能可用，无回归。

- [ ] 运行 Phase 1-4 Playwright 测试套件，全部通过
- [ ] 手动验证：注册 → 登录 → 上传 → 生成 → Gallery → Studio 全流程
- [ ] 移动端测试（320px / 375px / 768px 断点）
- [ ] 3-Agent 创意对话 E2E 验证（concept brief → storyboard → final prompt）

**验收**：所有 E2E 测试通过，手动验证无阻塞性 Bug。

---

### T-02: 视频播放器优化

**目标**：提升视频浏览体验。

- [ ] 倍速播放（0.5x / 1x / 1.5x / 2x）
- [ ] 全屏模式
- [ ] 进度拖动 seek

**验收**：Gallery 页面视频播放器支持倍速/全屏/进度拖动。

---

### T-03: Job Queue 增强

**目标**：提升任务管理效率。

- [ ] 失败任务一键重试
- [ ] 批量删除已完成/失败任务
- [ ] 按状态/Provider 筛选

**验收**：Job Queue 支持重试、批量删除、筛选。

---

### T-04: 前端性能优化

**目标**：提升大量数据下的页面性能。

- [ ] Gallery 图片懒加载
- [ ] 列表虚拟滚动（>100 条数据不卡顿）

**验收**：Gallery 100+ 条数据下滚动流畅，无白屏。

---

### T-05: 真实 API Key 配置

**目标**：接入真实视频生成服务验证全流程。

- [ ] 申请 Kling / 即梦 / Vidu API Key
- [ ] 配置到 Settings 页面并验证生成成功

**验收**：至少 2 个 Provider 可成功生成视频。

---

## Backlog（想法池）

以下为中长期规划，优先级和可行性待评估：

- [ ] 用户配额管理（免费额度 + 付费套餐）
- [ ] 社区分享（公开模板库 + 用户作品展示）
- [ ] 更多风格预设（3D / 手绘 / 水墨）
- [ ] 单元测试覆盖率 > 80%
- [ ] 生产环境部署（域名 + HTTPS + CDN）
- [ ] Seedance 2.0 升级（模型已预留注释）
- [ ] WebSocket 连接稳定性优化（已知偶发断连问题）
