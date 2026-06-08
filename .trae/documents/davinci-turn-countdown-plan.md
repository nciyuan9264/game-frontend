# 达芬奇密码右上角倒计时替换计划

## Summary

达芬奇密码当前右上角 `.headerInfo` 展示的是中间牌池剩余牌数：

```tsx
<span className={styles.infoLabel}>Pool</span>
<span className={styles.infoCount}>{boardCards.length}</span>
<span className={styles.infoUnit}>Tiles</span>
```

这个信息对玩家当前决策帮助不大。计划将它替换成回合倒计时，倒计时数据来自 `roomData.turnDeadline`，实现逻辑复用 Acquire 当前已有的 `TurnCountdown` 组件，和 Acquire 保持一致。

目标：

* 右上角不再展示牌池数量。

* 右上角展示当前回合/阶段剩余时间。

* 倒计时使用 `roomData.turnDeadline`，解析与刷新逻辑和 Acquire 一致。

* 倒计时视觉适配达芬奇当前暗色霓虹/玻璃态 topbar 风格。

* 不修改后端协议、不影响当前 `getCard / guessCard / setCard` 交互逻辑。

## Current State Analysis

### 1. 达芬奇右上角当前展示牌池数量

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

当前 header 第一行结构：

* 左侧：规则按钮 `.ruleTrigger`。

* 中间/右侧：桌面端 `Player VS AI Alpha`。

* 右侧：当前中文状态 chip `.headerStatus`。

* 右上角信息块 `.headerInfo`：展示 `Pool {boardCards.length} Tiles`。

* 最右：重开按钮。

当前右上角牌池数量代码：

```tsx
{!winner && (
  <div className={styles.headerInfo}>
    <span className={styles.infoLabel}>Pool</span>
    <span className={styles.infoCount}>{(Object.values(wsRoomSyncData?.roomData.boardCards ?? {}) || []).length}</span>
    <span className={styles.infoUnit}>Tiles</span>
  </div>
)}
```

问题：

* 用户反馈“剩余牌数没啥用”。

* 当前达芬奇已优化了状态提示和规则按钮，右上角更适合展示对玩家有即时行动价值的倒计时。

### 2. 达芬奇 RoomData 类型目前没有 turnDeadline

文件：[DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts)

当前 `RoomData`：

```ts
interface RoomData {
  currentPlayer: string;
  gameStatus: GameStatus;
  players: Record<string, PlayerInfo>;
  boardCards: Record<string, Card>;
  lastData?: LastAction | null;
}
```

但用户说明 `roomData` 里已有 `turnDeadline`。因此前端类型需要补齐：

```ts
/** 当前阶段结束时间（ISO 字符串） */
turnDeadline?: string;
```

可选同步补齐 `turnTimeoutMs?: number`，但本次只需要 `turnDeadline`。

### 3. Acquire 已有完全可复用的倒计时逻辑

文件：[TurnCountdown/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TurnCountdown/index.tsx)

Acquire 倒计时逻辑：

* `deadline?: string`，缺失时不渲染。

* `new Date(deadline).getTime()` 解析 ISO 字符串。

* 每 `250ms` 计算 `Math.max(0, deadlineTs - Date.now())`。

* 剩余时间到 `0` 后清理 interval。

* 支持：

  * `bare`：去掉完整 chip 外壳，便于嵌入其它容器。

  * `secondsOnly`：只展示秒数，例如 `28s`。

* `sec <= 10` 时进入 `urgent` 急迫态。

Acquire 2D 使用方式：

文件：[TopBar/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.tsx)

```tsx
{data?.roomData.gameStatus && data.roomData.gameStatus !== GameStatus.END && (
  <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
)}
```

Acquire 3D 使用方式：

文件：[TopBar3D/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar3D/index.tsx)

```tsx
<TurnCountdown deadline={data.roomData.turnDeadline} />
```

本次达芬奇应采用和 Acquire 2D 一样的轻量嵌入模式：`bare secondsOnly`。

### 4. Acquire 类型中 turnDeadline 的定义

文件：[AcquireRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/AcquireRoom.d.ts)

Acquire 类型：

```ts
/** 当前阶段结束时间（ISO 字符串） */
turnDeadline?: string;
/** 当前阶段计划时长，单位毫秒 */
turnTimeoutMs?: number;
```

达芬奇可以照此补齐 `turnDeadline?: string`，保证类型和后端字段一致。

## Proposed Changes

### 1. 补齐达芬奇 RoomData 类型

文件：[DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts)

What:

* 在 `RoomData` 中新增：

```ts
/** 当前阶段结束时间（ISO 字符串） */
turnDeadline?: string;
```

Why:

* 用户确认 `roomData` 已有 `turnDeadline`。

* `Game/index.tsx` 需要类型安全地读取 `wsRoomSyncData?.roomData.turnDeadline`。

* 和 Acquire 的类型表达保持一致。

How:

* 只补字段，不改 `WsRoomSyncData` 结构。

* 不强制新增 `turnTimeoutMs`，因为本次实现不使用。

### 2. 在达芬奇 Game 中引入 Acquire 的 TurnCountdown

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

* 新增 import：

```ts
import TurnCountdown from '@/view/Acquire/components/Game/components/TurnCountdown';
```

Why:

* 用户明确说“去看看 acquire 的逻辑，两个一样的”。

* 直接复用 `TurnCountdown` 可保证解析、刷新频率、`urgent` 急迫态与 Acquire 一致。

* 避免在达芬奇中复制一份倒计时代码导致后续两边行为漂移。

How:

* 使用项目已有 `@/` alias，与当前 `@/types/DaVinicRoom` import 风格一致。

* 本次不抽公共组件，避免扩大改动面；若后续多个游戏都需要倒计时，可再将 `TurnCountdown` 迁移到 `src/components/TurnCountdown`。

### 3. 替换右上角 Pool/Tiles 信息块为倒计时

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

将当前 `.headerInfo` 内容从牌池数量：

```tsx
<span className={styles.infoLabel}>Pool</span>
<span className={styles.infoCount}>{boardCards.length}</span>
<span className={styles.infoUnit}>Tiles</span>
```

改为倒计时：

```tsx
<div className={`${styles.headerInfo} ${styles.turnTimer}`}>
  <span className={styles.infoLabel}>Time</span>
  {wsRoomSyncData?.roomData.gameStatus && wsRoomSyncData.roomData.gameStatus !== 'end' && wsRoomSyncData.roomData.turnDeadline ? (
    <TurnCountdown
      bare
      secondsOnly
      deadline={wsRoomSyncData.roomData.turnDeadline}
      className={styles.turnCountdown}
    />
  ) : (
    <span className={styles.infoCount}>--</span>
  )}
</div>
```

Why:

* 右上角仍然是一个 compact 信息 chip，不改变 topbar 布局。

* `gameStatus === 'end'` 时不继续显示倒计时，和 Acquire `gameStatus !== END` 逻辑一致。

* `turnDeadline` 缺失或非法时显示 `--`，避免右上角出现空 chip。

How:

* 保留 `!winner` 条件，游戏结束后不显示该 chip。

* 使用 `bare secondsOnly`，和 Acquire 2D topbar 一致。

* 不再计算 `Object.values(boardCards).length`，减少无用 UI 数据。

### 4. 增加达芬奇倒计时适配样式

文件：[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

What:

* 新增 `.turnTimer`：

  * 保持 `.headerInfo` 高度和玻璃态外观。

  * 稍微收紧 gap，适配 `Time + 28s`。

  * 用 `font-variant-numeric: tabular-nums` 减少数字跳动。

* 新增 `.turnCountdown`：

  * 覆盖 Acquire `bare` 的橙色样式，使其适配达芬奇暗色/绿色霓虹风格。

  * 保留 Acquire `urgent` 的红色急迫态，或允许 urgent 样式叠加。

建议样式：

```less
.turnTimer {
  min-width: 86px;
  justify-content: center;
  gap: 6px;
  font-variant-numeric: tabular-nums;
}

.turnCountdown {
  padding: 0;
  border: none;
  background: transparent;
  color: #d1fae5;
  font-size: 0.875rem;
  font-weight: 800;
}
```

如果 CSS Modules 的 class 叠加不足以覆盖 Acquire 的嵌套 `.urgent`，执行时再使用 `:global` 定向覆盖组合类，但优先不引入全局选择器。

Why:

* Acquire `bare` 默认是偏橙色 warning，达芬奇主色是绿色/紫色暗色霓虹。

* 右上角倒计时需要稳定、可读，不应因为数字宽度变化挤动 topbar。

How:

* 不改 Acquire 的 `TurnCountdown` 样式文件，避免影响 Acquire。

* 只在达芬奇 `index.module.less` 中通过传入 `className={styles.turnCountdown}` 做局部适配。

### 5. 移动端和横屏适配

文件：[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

What:

* 在现有移动端样式下确保 `.turnTimer` 不挤压规则按钮、状态 chip 和重开按钮。

* 在现有低高度横屏 media query 中压缩 `.turnTimer`：

```less
.turnTimer {
  min-width: 72px;
  padding: 0 9px;
}
.turnCountdown {
  font-size: 12px;
}
```

Why:

* 达芬奇 topbar 已有规则按钮、状态 chip、倒计时、重开按钮，移动端空间紧张。

* 倒计时应比原 `Pool/Tiles` 更短，不应增加布局压力。

How:

* 保持现有 `.headerInfo` 响应式基础。

* 只对 `.turnTimer` 做补充收缩。

## Assumptions & Decisions

* 决策：直接复用 Acquire 的 `TurnCountdown` 组件，不复制一份到达芬奇目录。

* 决策：使用 `bare secondsOnly`，和 Acquire 2D topbar 一致，显示如 `28s`。

* 决策：右上角 label 使用 `Time`，保持当前 topbar 里 `Pool / Tiles` 的英文短标签风格；不做全量中文化。

* 决策：`gameStatus === 'end'` 或没有 `turnDeadline` 时显示 `--`，避免空白 chip。

* 决策：不再展示牌池剩余数量；如果后续仍需查看，可考虑放到规则弹窗或 debug 面板，但不在本次范围内。

* 决策：类型只补 `turnDeadline?: string`，不补 `turnTimeoutMs`，因为当前达芬奇 UI 不需要阶段总时长。

* 假设：达芬奇后端传回的 `turnDeadline` 与 Acquire 一样是 ISO 字符串，可被 `new Date(deadline).getTime()` 解析。

* 假设：达芬奇 `gameStatus` 的结束态仍是 `'end'`。

## Verification Steps

1. 静态验证：

   * 使用 `GetDiagnostics` 检查 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)、[index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)、[DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts)。

   * 运行 `node ./node_modules/typescript/bin/tsc --noEmit`。

2. 功能验证：

   * 进入达芬奇游戏房间，确认右上角不再显示 `Pool / Tiles`。

   * 当 `roomData.turnDeadline` 存在且未结束时，右上角显示秒数倒计时，例如 `28s`。

   * 倒计时每秒递减，接近 `<= 10s` 时进入急迫态。

   * `gameStatus === 'end'` 或 `turnDeadline` 缺失时显示 `--`，不报错。

3. 布局验证：

   * 桌面端：规则按钮、状态 chip、倒计时、重开按钮都在一行，第二行提示条不受影响。

   * 移动端：倒计时不挤掉规则按钮和重开按钮。

   * 横屏低高度：倒计时 chip 高度和间距正常，不遮挡牌区。

4. 回归验证：

   * 抽牌、猜牌、放回、规则弹窗、最近动作第二行提示仍正常。

   * Acquire 现有倒计时表现不被本次达芬奇样式修改影响。

