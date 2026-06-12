# Splendor 游戏页面布局修复计划

## Summary

修复 Splendor 游戏页（`src/view/Splendor/components/Game`）的四处布局问题，使各区域在所有屏幕尺寸下都能合理填充外层容器、对齐规整，而不是全部挤在一起。本次仅改样式 / 少量 JSX 包裹结构，不改动游戏逻辑。

## Current State Analysis

* 整体结构 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/index.tsx#L107-L177)：竖向 flex，依次为 `topBar` → `board`(牌桌+对手) → `gemSelectArea`(宝石池) → `assetsArea`(自己资产)。

* 牌桌 [CardBoard](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/CardBoard/index.tsx)：

  * `.nobleRow` 贵族行：`flex-wrap` + `gap`，**左对齐**（问题1：应居中）。

  * `.cardRows` 费用卡：`flex:1` 但内部三行固定尺寸卡片堆在顶部，未填满中间空间；`.cards` 左对齐（问题2：应充满中间）。

* 宝石池 [GemSelect](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/GemSelect/index.tsx)：`.gemSelector` 为单行 `slots | pool | actions`，移动端 actions 换行后 `justify-content: center`（问题4：按钮应整行右对齐，与右侧宝石纵向对齐）。

* 自己资产 [UserData](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/UserData/index.tsx)：`.userData` 内 `scoreBox | cardGemSection | reserveSection`，窄屏 `flex-wrap` 后各元素挤在一起（问题3：底部应适配外层宽度均匀分布）。

## Decisions（已与用户确认）

* 问题4：采用「按钮整行右对齐」——拿取/取消/跳过 三个按钮独占一行，整行靠右，使最右按钮落在宝石池右侧（金色宝石）下方。

* 适配范围：**所有尺寸**（同时调整桌面端基础样式与 `@media (max-width: 768px)` 移动端样式）。

## Proposed Changes

### 1. 贵族卡居中

文件：[CardBoard/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/CardBoard/index.module.less#L20-L26)

* `.nobleRow` 增加 `justify-content: center;`（保留现有 `flex-wrap`/`gap`/底部分隔线）。

### 2. 中间费用卡充满中间部分

文件：同上 `.cardRows` / `.cardRow` / `.cards`

* `.cardRows`：在保留 `flex:1` 的基础上增加 `justify-content: space-around;`（或 `space-between`），让 3 个等级行在垂直方向均匀分布、撑满中间剩余空间。

* `.cardRow`：保持当前 `align-items: center`，无需大改；确保行能水平居中其卡片组。

* `.cards`：增加 `flex: 1;` + `justify-content: center;`，使每行卡片在等级标签右侧水平居中铺开。

* 说明：卡片本身尺寸保持不变（沿用 `NormalCard` 的 md 尺寸），仅通过分布让其填满中间区域、不再堆在顶部。

### 3. 底部资产区适配外层大小

文件：[UserData/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/UserData/index.module.less)

* `.userData`：桌面端将 `gap` 调整为合理值，并让中间区域可伸展；为 `.cardGemSection` 增加 `flex: 1;` + `justify-content: space-between;`（或 `space-around;`），使各颜色列在可用宽度内均匀展开，而非靠左堆叠。

* 移动端 `@media`：将 `.userData` 的 `flex-wrap` 行为优化为各子区块均匀分布（`justify-content: space-between;`），避免 scoreBox / cardGemSection / reserveSection 挤在一起；必要时让 `cardGemSection` 占满整行并均匀分布。

* `.reserveSection` 保持靠右（`margin-left: auto` 桌面端；移动端取消 auto 后随分布对齐）。

### 4. 宝石区按钮整行右对齐

文件（JSX）：[GemSelect/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/GemSelect/index.tsx#L51-L118)

* 将 `slots` 与 `pool` 包裹进一个新的容器 `div.gemRow`，使 `actions` 成为其同级的第二行。
  文件（样式）：[GemSelect/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/GemSelect/index.module.less)

* `.gemSelector`：改为 `flex-direction: column;`（保留 `gap`）。

* 新增 `.gemRow`：`display:flex; align-items:center; gap:16px;`（承接原 `gemSelector` 的横向布局，内部 `slots | pool`，`pool` 继续 `flex:1`）。

* `.actions`：增加 `width: 100%;` + `justify-content: flex-end;`，实现整行靠右，最右按钮对齐到宝石池右侧。

* 移动端 `@media`：`.actions` 由 `justify-content: center` 改为 `flex-end`，与桌面端一致。

### 5. 发展卡（费用卡）卡面优化

文件（JSX）：[NormalCard/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/Card/NormalCard/index.tsx#L21-L33)

* **去掉右上角 bonus 宝石**：删除 `topRow` 中的 `<GemToken ... className={styles.bonusGem} />`。

* **分数移到右上角**：`points` 原在左上角（左对齐）。改为右上角——将 `topRow` 改为右对齐（`justify-content: flex-end`），分数显示在右上。

文件（样式）：[NormalCard/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/Card/NormalCard/index.module.less)

* `.topRow`：改为 `justify-content: flex-end;`（分数靠右上），移除 `.bonusGem` 相关样式（已无引用）。

* **修复左下角费用溢出卡片**：当前 `.costList` 为竖向堆叠，最多 5 个 `CostBadge`（md 1.5rem + gap），在 7rem 高卡内会溢出被裁剪。修复方案：

  * 缩小卡内 CostBadge 间距 `gap`（如 0.12rem）并减小 `padding`；

  * 给 `.costList` 限制为不超过卡片高度，badge 适当缩小（在 NormalCard 内通过更紧凑的尺寸或调整 CostBadge md 尺寸），确保 5 个徽章完整显示在左下角不溢出。

  * 移动端（md 卡 3.8×5.4rem）同样需保证不溢出，相应再缩小间距/尺寸。

* 说明：保持费用徽章竖向排列在左下角，仅压缩尺寸/间距使其完整可见。

## Assumptions

* 容器内对齐与分布为主；发展卡内部为解决溢出可适度缩小费用徽章尺寸/间距。

* 不改动任何游戏逻辑、消息发送、状态。

* 「纵向对齐」按用户确认理解为按钮整行右对齐（最右按钮落在金色宝石下方），不做逐按钮与逐宝石列的精确像素对齐。

* 去掉 bonus 宝石后，卡面颜色（按 bonus 取的渐变背景）仍能体现该卡的 bonus 颜色，故不影响辨识。

## Verification

1. `pnpm dev`（或项目对应启动命令）启动前端，进入 Splendor 游戏页。
2. 桌面宽屏 + 窄屏（≤768px，约 380px，截图场景）分别检查：

   * 贵族卡水平居中；

   * 三行费用卡在中间区域垂直均匀分布、水平居中铺开，不再堆顶部；

   * 底部资产区（分数 / 卡牌宝石计数 / 预留位）均匀分布、不再挤在一起；

   * 宝石区拿取/取消/跳过 按钮整行靠右，对齐到右侧宝石下方。

   * 发展卡右上角无 bonus 宝石、分数显示在右上角；左下角费用徽章（最多 5 个）完整可见、不溢出卡片。
3. 确认无 TypeScript / lint 报错（`GetDiagnostics`）。

