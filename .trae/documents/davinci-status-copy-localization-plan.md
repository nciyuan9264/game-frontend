# 达芬奇密码状态文案中文化与 setCard 引导优化计划

## Summary

当前达芬奇密码游戏中，顶部状态栏直接展示后端枚举值，例如 `getCard`、`guessCard`、`setCard`。其中 `setCard` 对玩家最不友好：实际交互上，`setCard` 阶段既可以点击对手未公开牌继续猜，也可以点击自己手牌间的“放回”插槽结束当前主动权，但顶部只显示 `setCard`，玩家会误以为此阶段只能放回，或者不知道还能继续猜。

本次计划目标：

* 将英文游戏状态枚举映射为中文状态名称。

* 对 `setCard` 给出明确的中文主文案：强调它不是单纯“放回牌”，而是“猜对后的选择行动”。

* 复用 topbar 当前已有第二行信息区域展示“最近动作或当前操作提示”，避免第一行状态 chip 和第二行信息重复。

* 同步优化猜牌弹窗的英文标题/说明/取消按钮，避免界面中仍混杂 `Make Your Guess`、`Cancel`。

* 不修改后端协议、不修改 `GameCanvas` 的实际交互逻辑、不改变回合规则。

## Current State Analysis

### 1. 顶部状态栏直接展示英文枚举

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

当前顶部状态栏渲染位置：

```tsx
<p className={styles.statusText}>{wsRoomSyncData?.roomData.gameStatus}</p>
```

这会把后端状态原样显示给玩家：

* `waiting`

* `getCard`

* `guessCard`

* `setCard`

* `end`

问题：

* 玩家看到的是技术枚举，不是游戏语言。

* `setCard` 不说明“可以继续猜牌”，和实际交互不一致。

* `getCard`、`guessCard` 也缺少“点中间牌池 / 点对手暗牌”的操作引导。

### 2. setCard 阶段确实有“双操作”

文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

对手未公开牌在以下条件下可点击：

```ts
const canClick = isPlayerTurn && (gameStatus === 'guessCard' || gameStatus === 'setCard') && !tile.isRevealed;
```

该逻辑分别出现在对手已排列牌和对手新抽牌的渲染区域。因此 `setCard` 阶段玩家仍能继续点对手牌发起猜测。

同时，`setCard` 阶段会渲染“放回”插槽：

```ts
if (isPlayerTurn && gameStatus === 'setCard') {
  ...
  text: '放\n回'
}
```

因此实际规则是：

* `setCard` = 猜对后的决策阶段。

* 玩家可以继续猜对手暗牌。

* 玩家也可以把新抽到的牌放回自己的序列，结束当前主动权。

### 3. topbar 当前已有第二行信息区域

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

当前 header 结构已经是两层：

* 第一行 `.headerRight`：规则按钮、玩家/AI 状态、当前 `gameStatus`、牌池数量、重开按钮。

* 第二行 `AnimatePresence` 内的 `.lastActionPanel`：当 `lastGuessView` 存在时，显示最近一次猜牌动作。

现有第二行结构：

```ts
{lastGuessView && (
  <motion.div className={styles.lastActionPanel}>
    <span className={styles.lastActionBadge}>{lastGuessView.badgeText}</span>
    <span className={styles.lastActionText}>{lastGuessView.text}</span>
  </motion.div>
)}
```

因此不能简单把第一行状态 chip 改成双行长提示：

* 第一行和第二行都会变成“说明型区域”，视觉层级重复。

* 最近动作回答“刚刚发生了什么”，当前提示回答“现在能做什么”，两者需要合并调度，而不是并排重复。

* `setCard` 的提示应复用第二行位置，或者合并进最近猜对动作文案。

### 4. 当前规则弹窗已经提到猜对可继续，但局中即时提示不足

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

规则弹窗中已有：

```ts
'猜对：目标牌公开，并且你可以继续掌握主动。'
```

但问题发生在局中即时认知：

* 玩家通常不会每次打开规则弹窗。

* 第一行状态 chip 如果只显示 `setCard` 或“放回牌”，会让玩家误解。

* 第二行当前只在有最近猜牌动作时展示历史信息，没有稳定承担“现在能做什么”的提示职责。

### 5. 样式结构适合复用第二行 panel

文件：[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

当前 `.headerStatus` 与 `.statusText` 是单行 pill，适合只放短状态：

* `.headerStatus` 已经使用半透明玻璃态背景。

* `.statusDot` 展示当前行动方。

* `.statusText` 展示状态文本。

当前 `.lastActionPanel` 是第二行玻璃态信息条，适合承载较长提示：

* 已有 `.lastActionBadge` 和 `.lastActionText`。

* 移动端已有压缩样式。

* 位置正好在第一行下方，不需要再新增第三块信息。

因此计划调整为：

* 第一行 `.headerStatus` 只显示中文短标签，例如“选择行动”。

* 第二行复用 `.lastActionPanel`，显示最近动作或当前操作提示。

* 当最近动作是“自己猜对”且当前状态是 `setCard` 时，将最近动作文本增强为“猜对了，可继续猜或点击‘放回’结束回合”，避免再显示一条重复提示。

## Proposed Changes

### 1. 新增状态中文映射函数，只输出短标签

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

* 新增 `getGameStatusLabel(status, isPlayerTurn)` 或等价辅助函数。

* 输入：

  * `status?: WsRoomSyncData['roomData']['gameStatus']`

  * `isPlayerTurn: boolean`

* 输出：

  * 中文短状态标签。

建议映射：

```ts
const getGameStatusLabel = (
  status: WsRoomSyncData['roomData']['gameStatus'] | undefined,
  isPlayerTurn: boolean
) => {
  if (!status) return '同步中';

  switch (status) {
    case 'waiting':
      return '等待中';
    case 'getCard':
      return isPlayerTurn ? '抽取新牌' : '对手抽牌';
    case 'guessCard':
      return isPlayerTurn ? '猜测密码' : '对手猜牌';
    case 'setCard':
      return isPlayerTurn ? '选择行动' : '对手选择';
    case 'end':
      return '游戏结束';
    case 'match':
      return '准备阶段';
    default:
      return isPlayerTurn ? '你的回合' : '对手回合';
  }
};
```

Why:

* 将技术枚举从 UI 中隔离出去，避免直接暴露后端状态名。

* 第一行状态保持短、稳、可扫读。

* 避免第一行和第二行都展示长说明，解决 topbar 信息重复。

How:

* 在组件顶部常量区新增函数，不新增文件。

* 在 `Game` 组件内用 `useMemo` 计算：

```ts
const statusLabel = useMemo(
  () => getGameStatusLabel(wsRoomSyncData?.roomData.gameStatus, Boolean(isPlayerTurn)),
  [wsRoomSyncData?.roomData.gameStatus, isPlayerTurn]
);
```

### 2. 改造顶部状态 chip：只显示中文短标签

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

将当前单行状态：

```tsx
<p className={styles.statusText}>{wsRoomSyncData?.roomData.gameStatus}</p>
```

改为：

```tsx
<p className={styles.statusText}>{statusLabel}</p>
```

Why:

* 第一行只做状态概览，不承担解释任务。

* `setCard` 不再显示为技术词，而是显示“选择行动”。

* 避免与 topbar 第二行的最近动作 / 操作提示重复。

How:

* 保持 `.statusDot` 仍在左侧。

* 不改变 `headerInfo`、重开按钮、规则按钮布局。

### 3. 复用第二行 panel 展示“最近动作或当前提示”

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

* 新增 `actionPromptView`，用于生成当前操作提示。

* 继续保留 `lastGuessView` 的最近动作能力。

* 新增合并视图 `topbarMessageView`：

  * 优先展示最近猜牌动作。

  * 当最近动作是“自己猜对”且当前状态是 `setCard` 时，将最近动作文本追加下一步提示。

  * 当没有最近动作可展示时，展示当前状态操作提示。

建议逻辑：

```ts
const actionPromptView = useMemo(() => {
  const status = wsRoomSyncData?.roomData.gameStatus;
  if (!isPlayerTurn) return null;

  switch (status) {
    case 'getCard':
      return { key: 'prompt:getCard', badgeText: '提示', text: '点击中间牌池抽一张牌', tone: 'info' };
    case 'guessCard':
      return { key: 'prompt:guessCard', badgeText: '提示', text: '点击对手未公开的牌进行猜测', tone: 'info' };
    case 'setCard':
      return { key: 'prompt:setCard', badgeText: '可继续', text: '继续猜对手暗牌，或点击“放回”结束回合', tone: 'correct' };
    default:
      return null;
  }
}, [isPlayerTurn, wsRoomSyncData?.roomData.gameStatus]);
```

`lastGuessView` 增强：

* 现有 `lastGuessView` 返回 `{ key, correct, text, badgeText }`。

* 增加 `tone` 或沿用 `correct`。

* 如果 `payload.correct && isActorSelf && wsRoomSyncData?.roomData.gameStatus === 'setCard'`：

  * 文案从 `你猜...猜对了` 增强为 `你猜...猜对了，可继续猜或点击“放回”结束回合`。

最终渲染：

```ts
const topbarMessageView = lastGuessView ?? actionPromptView;
```

Why:

* topbar 第二行只保留一个信息条，不增加额外行。

* 最近动作仍是优先信息；关键 `setCard` 场景把“猜对结果”和“下一步选择”合成一句。

* 没有最近动作时，也能用同一位置给出当前阶段提示。

How:

* 将 header 中 `lastGuessView && (...)` 改成 `topbarMessageView && (...)`。

* className 根据 `tone` 选择：

  * `correct`：沿用绿色。

  * `wrong`：沿用红色。

  * `info`：新增中性/蓝绿色样式，或复用普通 `.lastActionPanel`。

* 不新增第三行，不在 `.headerStatus` 内加长提示。

### 4. 优化第二行 panel 样式，避免信息重复和视觉噪音

文件：[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

What:

* `.headerStatus` 保持单行 chip，不改成双行。

* `.statusText` 只需适配中文短文案，保持 `white-space: nowrap`。

* `.lastActionPanel` 继续作为第二行唯一信息条。

* 新增可选 `.lastActionPanelInfo` 或 `.lastActionPanelPrompt`，用于“提示”类中性色。

* `.lastActionText` 保持省略号，避免长提示撑爆 topbar。

移动端注意：

* 第一行状态 chip 不变高。

* 第二行 panel 已有移动端压缩样式，只需确保文案过长时省略。

* 横屏低高度下继续使用现有 `.lastActionText { font-size: 11px; }`，必要时补充 `.lastActionPanel` 更紧凑 padding。

Why:

* 让提示信息足够清楚，又不把 topbar 变成三行或双重说明。

* 与当前玻璃态 chip 风格一致。

### 5. 将猜牌弹窗英文改为中文

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

当前猜牌弹窗仍为英文：

```tsx
<h2 className={styles.modalTitle}>Make Your Guess</h2>
<p className={styles.modalDesc}>What is the value of this {selectedGuessTile?.color} tile?</p>
...
Cancel
```

改为中文：

```tsx
<h2 className={styles.modalTitle}>猜测密码牌</h2>
<p className={styles.modalDesc}>
  选择你认为这张{selectedGuessTile?.color ? '白牌' : '黑牌'}的数字
</p>
...
取消
```

Why:

* 用户明确提出“英文游戏状态对应成中文”，猜牌弹窗也属于核心游戏文案。

* 当前 `selectedGuessTile?.color` 直接输出 `0/1` 或数字语义，不适合给玩家看。

How:

* 使用现有 `tile.color ? '白牌' : '黑牌'` 语义。

* 不改按钮数值网格，仍展示 `0-11` 和 `JOKER (-)`。

### 6. 同步更新规则弹窗中的 setCard 说明

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

当前规则说明：

```ts
'猜完后，新抽到的牌会进入放回阶段；普通数字会提示唯一正确位置，JOKER 可以选择任意位置。'
'猜对：目标牌公开，并且你可以继续掌握主动。'
```

建议改成更明确：

```ts
'猜对后会进入“选择行动”：你可以继续猜对手暗牌，也可以点击“放回”把新牌放入自己的序列。'
'猜错后会失去主动权，按提示处理自己刚抽到的牌后轮到对手。'
```

Why:

* 规则弹窗与顶部状态提示保持一致。

* 解决“setCard 还能继续 guess”这个认知断点。

How:

* 只修改规则文案数组，不改弹窗结构和样式。

## Assumptions & Decisions

* 决策：不改变后端状态枚举，前端只做 UI 映射。

* 决策：`setCard` 中文主状态不翻译成“放回牌”，而翻译成“选择行动”。原因是它实际包含“继续猜”和“放回”两个选择。

* 决策：`guessCard` 翻译为“猜测密码”，`getCard` 翻译为“抽取新牌”，`waiting` 翻译为“等待中”，`end` 翻译为“游戏结束”。

* 决策：第一行状态 chip 只显示短状态，不增加第二行提示。

* 决策：复用 topbar 现有第二行 `.lastActionPanel` 作为唯一说明型信息条，展示“最近动作或当前操作提示”。

* 决策：如果最近动作和当前提示同时存在，优先展示最近动作；但在“自己猜对且当前为 `setCard`”时，将下一步提示合并进最近动作文案。

* 决策：对手回合第一行显示对手视角短状态；第二行默认不额外提示，避免信息过多。

* 决策：保留顶部 `Pool / Tiles` 暂不中文化。用户本次问题聚焦游戏状态；如需全量中文化，可后续统一处理。

* 决策：不修改 `GameCanvas` 中 `setCard` 阶段的点击逻辑，因现有逻辑已经支持继续猜和放回。

* 假设：猜对后服务端确实把状态置为 `setCard`，并且此时继续猜牌是合法动作；当前前端点击条件已经体现这一点。

## Verification Steps

1. 静态验证：

   * 使用 `GetDiagnostics` 检查 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx) 和 [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)。

   * 运行 `node ./node_modules/typescript/bin/tsc --noEmit`，避免受当前路径 `:` 和全局 Vite 影响。

2. 状态文案验证：

   * `getCard` 且自己回合：第一行显示“抽取新牌”；第二行在没有最近动作时提示“点击中间牌池抽一张牌”。

   * `guessCard` 且自己回合：第一行显示“猜测密码”；第二行在没有最近动作时提示“点击对手未公开的牌进行猜测”。

   * `setCard` 且自己回合：第一行显示“选择行动”；第二行显示“继续猜对手暗牌，或点击‘放回’结束回合”，或在最近猜对动作后合并显示该下一步提示。

   * 对手回合：显示“对手抽牌 / 对手猜牌 / 对手选择”等文案。

   * `end`：显示“游戏结束”。

3. setCard 交互回归：

   * 猜对后进入 `setCard`。

   * 确认仍能点击对手未公开牌继续猜。

   * 确认仍能点击自己手牌间“放回”插槽放回新牌。

   * 确认 topbar 不出现第三行信息，不出现第一行和第二行重复说明同一个操作。

4. 弹窗文案验证：

   * 点击对手暗牌打开猜牌弹窗。

   * 标题、说明、取消按钮均为中文。

   * 说明能正确显示“黑牌/白牌”，不再显示 `0/1`。

5. 响应式验证：

   * 移动端窄屏顶部状态不挤掉规则按钮、牌池数量和重开按钮。

   * 横屏低高度下第二行 panel 不遮挡对手牌区域。

