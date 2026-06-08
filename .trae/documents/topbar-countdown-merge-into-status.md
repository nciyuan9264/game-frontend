# TopBar 倒计时融入状态条 + 上一个放置的地块归位最右

## Summary

当前 [TopBar/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.tsx#L184-L192) 把 `TurnCountdown` 放在 `top-bar__footer` 里，并通过 `margin-left: auto` 占据最右位置，把"上一个放置的地块"挤到中间。期望：

1. **倒计时融入 `top-bar__status`**：把 `<TurnCountdown>` 移到 `.top-bar__status` 内部，紧贴主状态文字下方，去掉它原来的 chip 圆角/边框/底色/padding，与状态条作为一个整体呈现。
2. **`last_tile_key` 重新放在 footer 最右**：footer 仅剩两块（左：房间/玩家ID；右：上一个放置的地块），用 `justify-content: space-between` 自然贴边。

## Current State Analysis

### 当前 [TopBar/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.tsx) 布局
```tsx
<div top-bar__header>
  <div top-bar__left> ... </div>
  <div top-bar__status>
    <Button content={currentStatus} customType="primary" />
  </div>
  <div top-bar__right> ... </div>
</div>
<div top-bar__footer>
  <div>房间 ... 玩家ID ...</div>
  {last_tile_key && <div>上一个放置的地块：{last_tile_key}</div>}
  {gameStatus !== END && <div className=top-bar__countdown><TurnCountdown ../></div>}
</div>
```

### 关键样式 [TopBar/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.module.less#L94-L107)
- `.top-bar__status`：`position: absolute; left: 50%; transform: translateX(-50%); display: flex; align-items: center; padding: 1rem 1.5rem`。注意它是绝对定位水平居中，本身有 padding。
- `.top-bar__footer`：`display: flex; justify-content: space-between; padding: 0 .6rem 0 3.4rem`。
- `.top-bar__countdown`：`margin-left: auto`（强制贴最右，挤掉中间的 last_tile）。

### 当前 [TurnCountdown/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TurnCountdown/index.module.less#L3-L36)
- `.countdown` 默认是 chip 风格：`padding: 0.2rem 0.7rem; border: 1px solid ...; border-radius: 999px; background: @color-accent-teal-soft; min-width: 4.6rem; height: 1.6rem`。
- `.urgent` 状态会切换红色 + 脉冲。
- 通过 `className` prop 已接受外部覆盖类名。

### 不在改动范围
- [TopBar3D/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar3D/index.tsx#L217-L221) 也用了 TurnCountdown，但结构不同（独立的 `centerSection`），保持现状不动。
- 我们给 TurnCountdown 新增的"无外壳"样式是**通过新增 className，原 chip 样式不动**，所以 3D / Replay 任何复用都无回归。

## Proposed Changes

### 1. [TurnCountdown/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TurnCountdown/index.module.less)：新增 `.bare` 变体

在文件末尾新增：

```less
.bare {
  padding: 0;
  height: auto;
  min-width: 0;
  border: none;
  background: transparent;
  border-radius: 0;
  font-size: 0.85rem;
  font-weight: 500;
  // urgent 时颜色仍由 .urgent 控制（color, animation 都生效），但去掉背景
  &.urgent {
    background: transparent;
    border: none;
    // animation/color 继承
  }
}

@media (max-width: 600px) {
  .bare {
    font-size: 0.75rem;
  }
}
```

> `.urgent` 与 `.bare` 同时挂在 root 元素，保证两者都生效；`.bare.urgent` 覆盖 chip 的 background/border 即可。color 与 animation 继承自 `.urgent`。

### 2. [TurnCountdown/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TurnCountdown/index.tsx)：新增 `bare?: boolean` prop

在 props 加 `bare?: boolean`；className 列表里增加 `bare ? styles.bare : ''`。默认 false 不影响现有调用。

### 3. [TopBar/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.tsx)：把倒计时搬入 `top-bar__status`

```tsx
<div className={styles['top-bar__status']}>
  <Button content={currentStatus} customType='primary' style={...} />
  {data?.roomData.gameStatus && data.roomData.gameStatus !== GameStatus.END && (
    <TurnCountdown bare deadline={data.roomData.turnDeadline} />
  )}
</div>
```

footer 仅保留：

```tsx
<div className={styles['top-bar__footer']}>
  <div><HomeOutlined /> 房间 {roomID}  <UserOutlined /> 玩家ID {backendName2FrontendName(userID)}</div>
  {data?.tempData.last_tile_key && <div>上一个放置的地块：{data?.tempData.last_tile_key}</div>}
</div>
```

删除 footer 内 `.top-bar__countdown` 包装的 TurnCountdown 渲染。

### 4. [TopBar/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.module.less)

- 把 `.top-bar__status` 改为 `flex-direction: column`，`align-items: center`；`padding` 适度收缩（如 `padding: 0.4rem 1.2rem`，从 `1rem 1.5rem`）以避免因加了第二行而比之前高太多。
  - 注意它仍是 `position: absolute; left:50%; transform: translateX(-50%)`，列布局后子元素水平居中。
- 删除（或保留为不再被使用）`.top-bar__countdown` 规则；为了最小改动可直接保留——但既然 footer 不再用它，**直接删除该规则**，避免残留死代码。
- `.top-bar__footer` 的 `justify-content: space-between` 保留，删除 countdown 后两段自然贴左右两端。

> Mobile 媒体查询里 `.top-bar` 高度变 `unset`、`.top-bar__left` 隐藏 等已有逻辑保持不变。`.top-bar__status` 因 column 布局，移动端会自动两行高度，可接受。

## Assumptions & Decisions

1. **不动 TopBar3D**：TopBar3D 自有结构，且本期需求只针对 2D 编辑页；TurnCountdown 新增的 `bare` prop 完全可选、默认 false，旧调用零回归。
2. **不持久化 currentStatus 高度**：status 变两行后视觉上高度增加，与状态条强调"当前阶段"的目标一致，无需额外固定高度。
3. **删除 `.top-bar__countdown` 类**：不再使用、避免死代码；项目内只有 [TopBar/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.tsx) 这一处引用。
4. **bare 视觉风格**：颜色仍用 `@color-accent-teal`（默认）/`@color-danger-dark`（urgent），与 chip 一致；只去掉 chip 外壳。font-size 从 0.9rem 降到 0.85rem 让它视觉上"次要于"主状态。

## Verification

1. PC ≥ 600px：`top-bar__status` 中部居中显示 "你的回合" + 下方一行 `00:30`（青绿色），不再有 chip 边框。footer 左侧"房间 X 玩家ID Y"，右侧（贴最右）"上一个放置的地块：3D"。
2. 倒计时 ≤ 10s 时仍变红 + 脉冲；动画继承 `.urgent` keyframes。
3. 当 `gameStatus === END` 或没 deadline 时不渲染倒计时；`status` 仅显示主状态按钮，行为同前。
4. mobile（≤ 600px）：footer 也只两段贴边显示；`status` 列布局两行。
5. TopBar3D 进入 3D 视图，倒计时仍是原 chip 样式（说明 `bare` 未影响默认调用）。
6. `tsc --noEmit` 通过。

## 变更文件清单

修改：
- [src/view/Acquire/components/Game/components/TurnCountdown/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TurnCountdown/index.tsx) —— 新增可选 `bare` prop。
- [src/view/Acquire/components/Game/components/TurnCountdown/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TurnCountdown/index.module.less) —— 新增 `.bare` 样式。
- [src/view/Acquire/components/Game/components/TopBar/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.tsx) —— 把 TurnCountdown 移入 status；footer 删除 countdown 块。
- [src/view/Acquire/components/Game/components/TopBar/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.module.less) —— `.top-bar__status` 改 column；删除 `.top-bar__countdown`。

不动：
- TopBar3D / 其它使用 TurnCountdown 的地方（默认 chip 样式不变）。
