# 移动端与 PC 交互分离计划

## Summary

目标是把 DOM 按钮、Match 房间卡片、Acquire 棋盘内棋子按钮统一升级为符合主流产品交互规范的状态体系，并按真实输入能力区分 PC 与移动端。PC 端保留 hover，但调整为更克制、可预期的颜色/阴影/位移；移动端禁用持久 hover，改用明确的 tap/active 反馈和常驻操作提示。达芬奇密码牌面是 Canvas 交互，本次不改。

## Current State Analysis

* `src/components/Button/index.module.less` 是通用按钮样式，房间列表“创建房间”、房间卡片“进入房间”、Match Header“添加人机/开始游戏/准备”、Acquire 游戏内 TopBar 多个 DOM 按钮都复用它；当前 hover 会上浮并加重阴影，主按钮 hover 仍偏绿且用户反馈“绿色按钮白色 hover 很奇怪”，需要重新定义完整状态。

* `src/view/GameBoard/components/Header/index.tsx` 的头像 Dropdown 固定 `trigger={['hover']}`，移动端没有自然 hover，需要切到点击触发。

* `src/view/Acquire/components/Match/components/PlayerCard/index.tsx` 与 `src/view/DaVinci/components/Match/components/PlayerCard/index.tsx` 通过整张 `article onClick={handleClick}` 处理“添加 AI/移除玩家”，但提示依赖 `.hover-content`，移动端点击后会出现 hover 残留。

* `src/view/Acquire/components/Match/components/PlayerCard/index.module.less` 与 DaVinci 对应 Less 在 `.seat-card-operable:hover` 下切换添加/移除视觉，这正是移动端房间卡片不应出现的 hover 效果。

* `src/view/Acquire/components/Game/components/Board/index.tsx` 的 2D 棋盘格是原生 `button`，通过 `onMouseEnter/onMouseLeave` 设置 `hoveredTile`，并用内联背景突出可放置棋子；移动端点击可放置棋子时不应产生鼠标 hover 语义。

* `src/view/Acquire/components/Game/components/PlayerAssets/index.tsx` 的玩家资产栏棋子是可点击 `span`，同样使用 `onMouseEnter/onMouseOut/onClick`；`index.module.less` 中 `.player-assets__tile:hover` 对移动端未隔离。

* `src/view/Acquire/components/Game/components/PlayerAssets3D/index.tsx` 的 3D 版本资产栏棋子是 `.tileCard`，也使用 `onMouseEnter/onMouseLeave/onClick`，其 Less 中 `.tileClickable:hover` 与 `.stockCard:hover` 未做设备区分。

* 项目没有现成 `useIsMobile` 或 `useMediaQuery` Hook；已有 `classnames` 依赖，已有 Less 媒体查询使用习惯。

## Proposed Changes

### 1. 新增交互能力 Hook

文件：`src/hooks/useInteractionMode.ts`

* 新增 `useInteractionMode()`，内部使用 `window.matchMedia('(hover: hover) and (pointer: fine)')` 判断当前是否为 PC/鼠标类精细指针环境。

* 返回 `{ isFinePointer, dropdownTrigger }`，其中 `dropdownTrigger` 在 PC 为 `['hover']`，在移动端/粗指针环境为 `['click']`。

* 初始值对 `window` 做安全判断，挂载后监听 media query `change`，支持平板外接鼠标等输入能力变化。

* 后续 JSX 中所有 `onMouseEnter/onMouseLeave` 只在 `isFinePointer` 为 true 时执行，避免移动端制造“伪 hover”状态。

### 2. 重做通用 Button 状态体系

文件：`src/components/Button/index.module.less`

* 定义统一状态层级：默认态、hover 态、active/pressed 态、focus-visible 态、disabled 态，所有状态都要有清晰但不过度的视觉差异。

* 默认态：保留圆角胶囊、边框和深色背景，但补齐 `touch-action: manipulation`、`-webkit-tap-highlight-color: transparent`，降低移动端点击噪音。

* PC hover：用 `@media (hover: hover) and (pointer: fine)` 包裹，默认按钮只轻微提亮背景/边框并 `translateY(-1px)`；主按钮 hover 改为同色系加深/增亮，不再出现突兀的白色 hover，阴影只轻微增强。

* active/pressed：所有可点击按钮按下时 `translateY(0)` 或 `scale(0.98)`，阴影收敛，表达“按下去”的物理反馈；移动端依赖 `:active`，不依赖 hover。

* focus-visible：保留明显焦点环，颜色使用 `@color-accent-teal`，不与 hover 混用。

* disabled：禁止 hover/active 变形，降低透明度和阴影，避免误导可点击。

* 影响范围：房间列表创建房间、进入房间、Match 添加人机/开始游戏/准备、Acquire 游戏内 TopBar 操作按钮、重放页等所有复用 `Button` 的 DOM 按钮。

### 3. 房间列表头像菜单移动端改点击触发

文件：`src/view/GameBoard/components/Header/index.tsx`

* 引入 `useInteractionMode`。

* 将 `Dropdown` 的 `trigger={['hover']}` 替换为 `trigger={dropdownTrigger}`。

* PC 端仍 hover 展开；移动端点击头像展开菜单。

文件：`src/view/GameBoard/components/Header/index.module.less`

* Dropdown 菜单项 hover 样式包进 `@media (hover: hover) and (pointer: fine)`。

* 菜单项补充 `:active` 或 AntD active 状态样式，移动端点击时有即时反馈。

### 4. Match 玩家卡片移动端常驻提示

文件：

* `src/view/Acquire/components/Match/components/PlayerCard/index.tsx`

* `src/view/DaVinci/components/Match/components/PlayerCard/index.tsx`

具体实现：

* 引入 `classnames`，用 classnames 组合 `seat-card`、`seat-card-empty`、`seat-card-operable`、`seat-card-disabled`。

* 增加 `actionHintText`，`isRemove` 时为 `点击移除玩家`，否则为 `点击添加人机`。

* 在 `article` 内新增 `tap-hint`，仅对 `canOperate` 渲染，内容含添加/移除图标和提示文案。

* `tap-hint` 设置 `pointer-events: none`，整张卡片仍通过现有 `handleClick` 添加 AI 或弹出移除确认。

* 保留现有 `.hover-content`，仅作为 PC hover 替换内容。

### 5. Match 玩家卡片按设备拆分视觉

文件：

* `src/view/Acquire/components/Match/components/PlayerCard/index.module.less`

* `src/view/DaVinci/components/Match/components/PlayerCard/index.module.less`

具体实现：

* PC hover 规则全部放入 `@media (hover: hover) and (pointer: fine)`：
  `.seat-card-operable:not(.seat-card-empty):not(.seat-card-add-locked):hover`、`.seat-card-operable.seat-card-empty:hover`、`.seat-card-operable.seat-card-add-locked:hover`、`.seat-card-disabled:hover`。

* PC 添加 AI hover：使用青绿色同色系，避免过亮大面积绿色；通过边框、头像背景、文案切换表达“添加”。

* PC 移除玩家 hover：使用低透明红色背景和红色边框，不把整卡变成强警告块，避免误触感过重。

* 移动端 `@media (hover: none), (pointer: coarse)`：不显示 `.hover-content`，不隐藏 `.default-content`，不触发整卡 hover 变色。

* 移动端 `.tap-hint` 常驻显示为右下角或信息区下方的小胶囊：添加 AI 用青绿色描边/浅底，移除玩家用红色描边/浅底。

* `:active` 提供短暂按下反馈，例如 `transform: scale(0.99)`、边框轻微加亮，不保留 hover。

### 6. Acquire 2D 棋盘格按钮适配

文件：

* `src/view/Acquire/components/Game/components/Board/index.tsx`

* `src/view/Acquire/components/Game/components/Board/index.module.less`

具体实现：

* 引入 `useInteractionMode`，仅在 `isFinePointer && shouldBlink` 时执行 `setHoveredTile(id)` 和清除 hover。

* 移动端点击棋盘格只执行 `placeTile(id)`，不主动设置 `hoveredTile`，避免点击后棋盘长期显示鼠标 hover 高亮。

* 保留 `button` 语义，给可操作格补充 `aria-label`，例如 `放置地块 ${id}`。

* 将可操作态视觉从纯内联样式逐步迁移到 class：新增 `board__cell--placeable`，用于 cursor、focus-visible、active 和可点击提示。

* PC hover 通过 `@media (hover: hover) and (pointer: fine)` 展示轻微抬升/青色边框/柔和光晕。

* 移动端 active 只短暂缩放或压低阴影，仍保留当前 blinking 提示作为“可放置”表达。

### 7. Acquire 资产栏棋子按钮适配

文件：

* `src/view/Acquire/components/Game/components/PlayerAssets/index.tsx`

* `src/view/Acquire/components/Game/components/PlayerAssets/index.module.less`

* `src/view/Acquire/components/Game/components/PlayerAssets3D/index.tsx`

* `src/view/Acquire/components/Game/components/PlayerAssets3D/index.module.less`

具体实现：

* 两个 JSX 文件引入 `useInteractionMode`。

* 计算 `canPlaceTile` 后，仅在 `isFinePointer && canPlaceTile` 时执行 `setHoveredTile(tileKey)` 和清除 hover。

* 对可点击棋子补充 `role="button"`、`tabIndex={canPlaceTile ? 0 : -1}`、`aria-label`，并支持 `Enter`/`Space` 键触发 `placeTile(tileKey)`，提升 DOM 按钮可访问性。

* 2D `.player-assets__tile:hover` 包入 PC hover 媒体查询；新增 `.player-assets__tile--clickable` 表示可操作，active 提供短暂压感反馈。

* 3D `.tileClickable:hover` 和 `.stockCard:hover` 包入 PC hover 媒体查询；`.tileClickable:active` 保留给触屏点击反馈。

* 移动端可放置棋子用常驻细边框/小光点或轻微呼吸边框表达“可点击”，不靠 hover 改背景；点击后不保留高亮。

### 8. 不涉及范围

* `src/view/DaVinci/components/Game/components/GameCanvas/index.tsx` 是 Canvas/Pixi 交互，不属于本次 DOM 按钮整改范围。

* 不改 websocket 消息、`useSeatAction`、`placeTile` 业务逻辑。

* 不抽公共 PlayerCard 或按钮组件结构，避免扩大风险；两套 Match PlayerCard 样式做同构修改。

## Assumptions & Decisions

* 以输入能力 `hover + pointer` 作为分流依据，优先于屏宽判断。

* PC hover 要符合“状态可见但不过度”的行业规范：同色系变化、轻微位移、阴影增强有限，避免白色闪烁和大面积强色覆盖。

* 移动端以 `:active`、常驻提示、可操作态边框表达交互，不用 hover 表达状态。

* Acquire 棋盘内棋子包括 2D 棋盘格、2D 玩家资产栏棋子、3D 玩家资产栏棋子；达芬奇 Canvas 牌区不改。

## Verification

* 运行 `npm run build`，确认 TypeScript 和 Vite 构建通过。

* 使用 VS Code diagnostics 检查新增 Hook、GameBoard Header、两份 Match PlayerCard、Acquire Board、两份 PlayerAssets 是否有类型或 lint 问题。

* PC 验证：通用按钮 hover/active/focus/disabled 状态自然；绿色主按钮 hover 不再出现突兀白色；头像菜单 hover 展开；Match 空位/有玩家卡片 hover 分别显示添加 AI/移除玩家；Acquire 棋盘格和资产栏棋子 hover 能联动高亮。

* 移动端验证：通用按钮点击只有短暂 pressed 反馈且不残留 hover；头像菜单点击展开；Match 卡片不出现 hover 覆盖态但显示“点击添加人机/点击移除玩家”；Acquire 棋盘格和资产栏棋子点击不保留 hover 高亮。

* 可访问性验证：键盘 Tab 可聚焦通用按钮与资产栏可点击棋子，Enter/Space 能触发资产栏棋子放置，focus-visible 清晰可见。

