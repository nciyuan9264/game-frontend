# Splendor 游戏结算页重设计

## Summary

参考 Acquire 的结算页（[Acquire GameEnd](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/GameEnd/index.tsx)）的结构与交互（自定义 Modal、header/content/footer 三段式、奖牌排名、motion 动画、再来一局 + 关闭按钮、房主权限提示），为 Splendor 重做一个**契合其深紫珠宝主题**的结算页，替换当前简陋的 antd Modal 实现。

## Current State Analysis

- 当前 Splendor 结算页 [GameEnd/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/GameEnd/index.tsx) 使用 antd `Modal`，仅一行 flex 展示「普通牌/贵族牌/总分」，视觉简单，与游戏内深紫珠宝主题（[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/index.module.less) 中 `@panel-bg: rgba(28,16,48,0.72)`、`@gold:#f5c451`、`@accent:#a855f7`）脱节。
- Acquire 参考实现使用项目自带的轻量 [Modal 组件](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx)（motion 弹入 + 遮罩），三段式布局，`rankColors` 金银铜，奖牌 emoji，逐项分数，`motion.div layout` 排名动画，`motion.button` 悬停/点击微交互，房主才显示「再来一局」并二次确认。
- Splendor 数据结构（[SplendorRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/SplendorRoom.d.ts)）：`playerData[id]` 含 `score`、`normalCard[]`、`nobleCard[]`（每张 `points`）、`reserveCard[]`、`gem`。结算可展示：总分、贵族分（nobleCard.points 之和）、发展卡分（score - 贵族分）、发展卡数量、贵族卡数量。
- 现有可复用工具：
  - [isOwner(data, userID)](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/utils/game.ts#L58-L61) 判断房主。
  - `GemColor` / `cardColors` / `getCardCountByColor` 取色与折扣计数。
  - [GemToken](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/Card/GemToken/index.tsx) 纯 CSS 宝石。
  - [useConfirmDialog](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/ConfirmDialog/useConfirmDialog.ts) 重启二次确认。
- 调用方 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/index.tsx#L168-L174) 已传入 `data / visible / setGameEndModalVisible / sendMessage / userID`，props 接口保持不变，无需改调用方。
- 排序逻辑沿用当前实现：先按 `score` 降序，分数相同按贵族分降序。

## Proposed Changes

### 1. 重写 [GameEnd/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/GameEnd/index.tsx)

**What**：用项目自带 [Modal 组件](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx)（替换 antd Modal）+ motion，按 Acquire 三段式（header / content / footer）重构，但采用 Splendor 深紫珠宝视觉。

**How**：
- 保持 `GameEndProps` 接口不变（`visible / setGameEndModalVisible / data / sendMessage / userID`）。
- `import Modal from '@/components/Modal'`，移除 antd `Modal`、`Button` 依赖（footer 用 `motion.button` + 本组件样式，与 Acquire 一致）。
- 排名计算保留现有 `ranked` + `getNobleScore` 逻辑。
- 顶部冠军高亮区（header 下方）：展示第一名玩家名 + 🏆 + 总分，作为视觉焦点（Splendor 主题特色，区别于 Acquire）。
- header：`👑 游戏结算` 标题 + 副标题「最终荣耀排名」。
- content：
  - hint 提示条：房主「确认玩家无异议后可点击再来一局」/ 非房主「请等待房主开启下一局」。
  - rankList：每个玩家一张 `motion.div`（`layout` + spring），含：
    - 名次奖牌（🥇🥈🥉 / 第 N 名）+ 玩家名（`backendName2FrontendName`）。
    - 分项指标：发展卡分、贵族分、发展卡数量、贵族卡数量（用小标签/胶囊展示）。
    - 右侧大号「总分」。
    - 第一名加金色描边/光晕高亮。
  - 入场 stagger：每个 rankItem 用 `initial/animate` + `transition.delay = index * 0.08` 逐条揭示。
- footer：`关闭弹窗`（默认）+ 房主额外 `再来一局`（primary，金色），点击走 `confirm` 二次确认后 `sendMessage({type:'game_restart_game'})`。两个按钮用 `motion.button` 加 `whileHover/whileTap`。
- 用 `isOwner(data, userID)` 取代当前未导入的房主判断（当前文件已用 `isOwner`，沿用）。

### 2. 重写 [GameEnd/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/components/GameEnd/index.module.less)

**What**：从仅 30 行的简单样式，扩展为契合 Splendor 深紫珠宝主题的完整三段式样式。

**How**：
- 主题变量（与 game 主题一致）：深紫面板 `rgba(28,16,48,0.72)`、紫边 `rgba(124,58,237,0.32)`、金 `#f5c451`、紫 `#a855f7`、文字 `#ede9f7`。
- 由于 [Modal 组件](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.module.less) 容器底色为白色 `#fff`，需在 `.root`/各段落用深色背景覆盖（设置外层容器 `background` + `border-radius:24px` 覆盖白底，或包裹一层深色 wrapper）。采用包裹深色 wrapper 方案，保证圆角与 Modal 一致。
- header：金色标题、半透明副标题、底部紫色分隔线。
- 冠军高亮区：金色渐变背景 + 光晕 `box-shadow`，居中大字。
- hint：半透明紫色胶囊条。
- rankList / rankItem：深色半透明卡片、紫色描边、阴影；第一名金色边框 + 金色光晕。分项指标用小胶囊（半透明底）。总分大号金色。
- footer：紫色分隔线上方；默认按钮描边透明深色，primary 按钮金色渐变深色文字。
- 响应式（`max-width: 768px`）：缩小字号/内距，分项指标可换行。

## Assumptions & Decisions

- **沿用项目自带 Modal**（`@/components/Modal`）而非 antd，与 Acquire 参考保持一致，并获得 motion 弹入动画。`maskClosable` 行为通过 `onClose={() => setGameEndModalVisible(false)}` 实现。
- **不改后端协议**：重启仍发送 `{type:'game_restart_game'}`，与现状一致。
- **不改调用方** [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/components/Game/index.tsx)，props 接口不变。
- **分项展示口径**：发展卡分 = `score - 贵族分`；贵族分 = `nobleCard.points` 之和；另展示发展卡张数 `normalCard.length` 与贵族卡张数 `nobleCard.length`，丰富信息（Splendor 特色）。
- **主题方向**：延续游戏内深紫 + 金色珠宝奢华风，而非照搬 Acquire 的浅色 emoji 风，做到"参考结构、契合自身主题"。

## Verification

1. `npm run dev`（或项目既有启动脚本）启动前端。
2. 进入 Splendor 对局，打到游戏结束（或用已结束房间），点击顶栏「结束清算」打开结算弹窗。
3. 验证：
   - 弹窗深紫珠宝主题、motion 弹入正常；
   - 排名按总分降序、平分按贵族分降序；奖牌 🥇🥈🥉 与名次正确；第一名金色高亮；
   - 分项（发展卡分/贵族分/卡数）数值与玩家实际一致；
   - 房主可见「再来一局」，点击弹二次确认，确认后房间重启；非房主无此按钮且 hint 文案正确；
   - 「关闭弹窗」可关闭，点击遮罩可关闭；
   - 移动端（≤768px）布局不溢出、可读。
4. `npm run lint` / tsc 无新增报错（无未使用导入）。
