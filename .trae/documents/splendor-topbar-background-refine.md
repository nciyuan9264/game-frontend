# Splendor 顶栏与游戏页背景质感优化方案

## Summary
参照 Acquire 游戏页（TopBar + Game 背景）的设计手法，对 Splendor 游戏页进行视觉优化：
1. 重构 Splendor 顶栏（topBar），采用 Acquire 的 **header + footer 双行结构**（品牌标题区 / 居中状态药丸 / 右侧动作区 + 底部信息行），提升信息层级与排版质感。
2. 优化 Splendor 游戏页背景与面板，**借鉴 Acquire 的设计手法而非颜色**：分层渐变（linear + radial）、`backdrop-filter` 毛玻璃、`inset` 内阴影、实线 + 虚线边框混用，让页面更有质感。

**关键约束**：保留 Splendor 现有的"深紫珠宝"配色（`#0a0612` / `#7c3aed` / `#a855f7` / 金色 `#f5c451`），不照抄 Acquire 的青绿色。只迁移"手法"。

## Current State Analysis

### Acquire 参考手法（来源文件）
- 顶栏 [Acquire TopBar tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.tsx)：结构为 `top-bar__header`（`__left` 品牌+返回 / `__status` 绝对居中状态药丸 / `__right` 动作按钮）+ `top-bar__footer`（房间号、玩家ID、辅助信息行）。
- 顶栏样式 [Acquire TopBar less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.module.less)：`__status` 用 `position:absolute; left:50%; translateX(-50%)` 居中；`__brand` 含 title / description / info-row（图标 + 文字）；footer 用 `@color-text-soft` 弱化色 + 图标。
- 背景手法 [Acquire Game less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.module.less#L11-L16)：`background-color` 打底 + 两个 `radial-gradient`（左上 / 右下角光晕）。
- 面板质感 [Acquire Board less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/Board/index.module.less#L18-L34)：`linear-gradient` 斜向渐变 + `backdrop-filter: blur saturate brightness contrast` 毛玻璃 + `box-shadow: inset 0 0 0 1px ...` 内描边 + `0 32px 70px` 大投影；并用伪元素 `::before { inset:.625rem; border:1px dashed ... }` 制造**虚线内框**（实线外框 + 虚线内框混用）。

### Splendor 现状（待改文件）
- 顶栏在 [Splendor Game tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/index.tsx#L107-L135) 内联实现，结构为单行 `topBar`（`left` ids / `middle` 状态文字 / `right` 倒计时）。无品牌标题、无 footer 信息行。
- 顶栏样式 [Splendor Game less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/index.module.less#L21-L100)：定义了 `@panel-bg: rgba(28,16,48,.72)`、`@panel-border: rgba(124,58,237,.32)`、`@gold`、`@accent`。`topBar` / `gemSelectArea` / `assetsArea` 都是纯色面板，**无渐变、无虚线、无内阴影**，质感偏平。
- 页面背景 [Splendor index less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/index.module.less#L8-L16)：已有 3 层 radial-gradient 紫色光晕（保留，作为基底）。
- 牌桌面板 [CardBoard less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/CardBoard/index.module.less#L4-L18)：纯色 `rgba(28,16,48,.72)` + 实线边框，无质感层次。

## Proposed Changes

### 1. 顶栏结构重构 — [Splendor Game tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/index.tsx)
**What**：将 `topBar` 由单行改为 Acquire 风格的 `header + footer` 双行结构。
**Why**：对齐 Acquire 的信息层级（品牌 / 居中状态 / 动作 / 底部信息），排版更专业。
**How**（仅改 JSX 与 className，逻辑不变）：
- `topBar` 内拆为：
  - `header`：
    - `left`：返回按钮（保留现有 `handleLeave`）+ `brand`（新增标题 `Splendor 线上珠宝桌` + 可选副标题/描述）。
    - `status`（居中药丸）：把现有 `statusContent()` 包进一个居中容器（绝对定位居中），保留 `yourTurn / waiting / ended` 文案与样式。
    - `right`：保留倒计时 `TurnCountdown` 与"结束清算"按钮。
  - `footer`：新增一行，左侧 `房间 {roomID}` + `玩家 {backendName2FrontendName(userID)}`（沿用 antd 图标 `HomeOutlined` / `UserOutlined`，已在 Acquire 使用，项目已依赖 `@ant-design/icons`），用弱化色显示。
- 移除原 `left` 里的 `ids` 块（房间/玩家移到 footer），或保留品牌区显示房间号——**决策见下方 Assumptions**。

### 2. 顶栏样式 — [Splendor Game less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/index.module.less)
**What**：为新结构补充样式，并给顶栏加渐变 + 内阴影质感。
**How**：
- `.topBar`：改为 `flex-direction: column; gap` 容纳 header + footer；`position: relative`（供 status 绝对居中）；背景由纯色改为 **斜向 linear-gradient + 顶部 radial 高光**（紫色系），叠加 `box-shadow: inset 0 0 0 1px rgba(124,58,237,.18)` 内描边 + 柔和外投影。
- `.header`：`display:flex; justify-content:space-between; align-items:center`。
- `.brand .title`：金色 `@gold`，字重 600，`letter-spacing:-0.02em`；`.brand .subtitle`：`@color-text-soft` 小字。
- `.status`：`position:absolute; left:50%; transform:translateX(-50%)`，做成"药丸"——圆角 + 半透明紫底 + 1px 边框；保留内部 `yourTurn` 脉冲动画。
- `.footer`：`display:flex; justify-content:space-between; font-size:.72rem; color:#b8a9d6`，图标用金色点缀。
- 移动端（`@media max-width:768px`）：隐藏/简化 brand 与 footer，status 改为静态居中，沿用现有断点策略。

### 3. 游戏页背景与面板质感 — [Splendor Game less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/index.module.less)
**What**：把 `gemSelectArea`、`assetsArea`、`board` 子面板由纯色升级为 Acquire 式的"分层渐变 + 毛玻璃 + 实线外框 + 虚线内框"。
**How**：
- 提取一个 LESS mixin（如 `.panel-surface()`）统一面板观感：
  - `background: radial-gradient(circle at 0% 0%, rgba(124,58,237,.16), transparent 60%), linear-gradient(135deg, rgba(40,24,72,.85), rgba(20,10,36,.92))`
  - `backdrop-filter: blur(18px) saturate(105%)`
  - `border: 1px solid @panel-border`（实线外框）
  - `box-shadow: inset 0 0 0 1px rgba(124,58,237,.12), 0 18px 40px rgba(0,0,0,.55)`（内描边 + 大投影）
- 给 `assetsArea` / `gemSelectArea` 增加伪元素 `::before { inset:.5rem; border:1px dashed rgba(245,196,81,.28); border-radius:inherit; pointer-events:none }` —— **金色虚线内框**，与实线外框形成"实线 + 虚线混用"质感（参考 Acquire Board `::before`）。
- `.gameRoot` 本身保留透明（页面背景由 `.splendor` 提供），无需重复打底。

### 4. 牌桌面板质感 — [CardBoard less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/CardBoard/index.module.less)
**What**：`.cardBoard` 应用与第 3 点一致的面板手法（渐变 + 毛玻璃 + 实线外框 + 可选虚线内框），保持与其余面板统一。
**Why**：牌桌是主视觉区，需与升级后的顶栏/资产区一致，避免割裂。
**How**：替换 `.cardBoard` 的纯色 `background` 为分层渐变 + `backdrop-filter` + `inset` 内描边；保留现有 `overflow/scrollbar` 处理。

### 5. （可选）页面基底背景微调 — [Splendor index less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/index.module.less)
**What**：现有 3 层紫色 radial-gradient 已不错；仅在质感不足时，叠加一条极淡的对角 `linear-gradient` 增加纵深。
**Why**：保持基底与面板的纵深呼应。**默认不大改**，避免过度设计。

## Assumptions & Decisions
- **配色**：完全沿用 Splendor 紫色珠宝主题（`@panel-bg` / `@panel-border` / `@gold` / `@accent`），不引入 Acquire 青绿。仅迁移"渐变/毛玻璃/内阴影/虚实线混用"等手法。
- **房间/玩家信息位置**：移到 footer 行（对齐 Acquire），品牌区只放标题，保持顶栏整洁。
- **品牌标题文案**：使用 `Splendor 线上珠宝桌`（与 Acquire `Acquire 线上棋盘` 对仗）。
- **图标依赖**：复用 `@ant-design/icons`（`HomeOutlined` / `UserOutlined` / 已用的 `LeftOutlined`），项目已依赖，无需新增包。
- **范围**：仅 Splendor 游戏页（Game 及其子面板 + 页面基底），不改 Match 大厅页、不改后端、不改交互逻辑。
- **虚线点缀色**：内框虚线用金色 `rgba(245,196,81,.28)` 呼应 Splendor 珠宝气质（Acquire 用青绿）。

## Verification
1. `npm run dev`（或项目对应启动命令）启动前端，进入一局 Splendor 游戏房间。
2. 顶栏检查：标题/状态药丸居中/右侧倒计时三段对齐；底部 footer 显示房间号与玩家；轮到自己时状态药丸脉冲动画正常。
3. 背景/面板检查：牌桌、宝石池、资产区均呈现分层渐变 + 毛玻璃 + 实线外框 + 金色虚线内框，质感统一、无颜色割裂。
4. 响应式：缩到 `≤768px` 检查移动端布局未破版（顶栏简化、面板堆叠正常）。
5. 回归：确认返回按钮、结束清算按钮、倒计时、选牌交互均未受样式改动影响。
6. 控制台无报错；与 Acquire 页对比，确认是"同手法、不同色系"的一致质感。
