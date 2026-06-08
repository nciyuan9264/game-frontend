# DaVinci lastData 前端适配方案

## Summary

后端将在 DaVinci 的 `ROOM_SYNC.roomData` 中新增 `lastData`，用于公开最近一次合法猜牌动作：

```json
{
  "action": "guess_card",
  "playerID": "执行猜牌的人",
  "payload": {
    "targetCardID": "被猜的牌 ID",
    "targetPlayerID": "被猜的人",
    "guessNum": 5,
    "correct": true
  }
}
```

前端适配目标：

1. 去掉当前 `Game/index.tsx` 里基于 `cardData` 前后 diff 和 `pendingGuessRef` 推断猜对/猜错的逻辑，改为完全信任后端 `lastData`。
2. 在棋盘上明确定位“被猜的是哪张牌”：收到新的 `guess_card` 后，对 `targetCardID` 对应牌做瞬时动画；猜对绿色高亮，猜错红色高亮和轻微抖动。
3. 在画布内增加一条“最近猜牌动作”信息条，展示“谁猜了谁的哪张牌、猜的是几、猜对/猜错”；该信息条直接由 `roomData.lastData` 渲染，因此重连后也能看到最近一次公开动作。
4. 保持隐藏信息边界：猜错时只展示 `guessNum`，不展示目标牌真实 `num`；猜对时因为牌已翻开，可通过现有 `cardData` 自然显示真实牌面。

## Current State Analysis

### 数据流

入口位于 [DaVinci/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx)：

* `useWebSocket` 收到消息后直接 `JSON.parse(msg.data)`。

* `MATCH_SYNC` 更新 `wsMatchSyncData`。

* `ROOM_SYNC` 更新 `wsRoomSyncData`，并将其传给 `Game`。

* 因此新增的 `roomData.lastData` 只需要补类型和消费逻辑，不需要改 WebSocket 入口。

### 类型定义

当前 [DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts) 中：

* `RoomData` 包含 `currentPlayer`、`gameStatus`、`players`、`boardCards`。

* `WsRoomSyncData` 包含 `playerId`、`ownerID`、`roomData`、`cardData`、`type`、`message`。

* 还没有 `lastData`、`LastAction`、`GuessCardLastPayload` 类型。

### 现有猜牌反馈

当前 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx) 的核心逻辑：

* `prevSyncRef` 保存上一帧 `ROOM_SYNC`。

* `pendingGuessRef` 记录玩家刚刚猜的牌 ID。

* `useEffect` 基于 `cardData.self` / `cardData.opponents` 的变化推断结果。

* 玩家自己猜牌时，通过当前对手牌是否出现 `num` 判断猜对/猜错。

* 对手猜牌时，通过自己手牌是否新翻开判断猜中，否则提示对手猜错。

这套逻辑应该移除，因为后端已经把“猜牌动作及结果”作为公开事实写入 `lastData`。继续保留会导致：

* 猜错的目标牌无法准确定位，只能知道“猜错了”。

* 重连后无法基于本地 diff 复原最近动作。

* 猜对/猜错判定分散在前后端两边，后续协议变化容易不一致。

### 现有画布能力

[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx) 已暴露：

```ts
flashTileFeedback: (tileId: string, correct: boolean) => void;
```

但当前实现只处理 `correct === true`：

* 猜对：绿色高亮 + 放大回弹。

* 猜错：无画布反馈，仅依赖 toast。

本次需要补齐 `correct === false` 的红色反馈，因为后端 `lastData.payload.targetCardID` 已经能准确告诉前端猜错时目标牌是哪一张。

### 展示空间

[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less) 已有：

* 固定顶部 `header`。

* 中央 `.board` 容器，内部承载 PIXI 画布。

* 固定底部 `footer`。

* 样式整体是暗色、玻璃态 chip、绿色主强调色。

推荐把“最近猜牌动作”放在 `.board` 内部顶部居中或左上区域，而不是只用 toast：

* toast 适合实时提示，但重连玩家看不到历史。

* `lastData` 是房间状态，适合持久在线展示。

* 放在 `.board` 内不会干扰顶部回合信息，也能和被高亮的目标牌形成空间关联。

## Proposed Changes

### 1. 补充 DaVinci lastData 类型

文件：[DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts)

What:

* 新增 `GuessCardLastPayload`：

```ts
interface GuessCardLastPayload {
  targetCardID: string;
  targetPlayerID: string;
  guessNum: number;
  correct: boolean;
}
```

* 新增 `LastAction`：

```ts
interface LastAction {
  action: 'guess_card' | string;
  playerID: string;
  payload?: GuessCardLastPayload;
}
```

* 在 `RoomData` 中增加：

```ts
lastData?: LastAction | null;
```

Why:

* 与后端 `roomData.lastData` 字段对齐。

* 让 `Game` 可以类型安全地读取 `playerID`、`payload.targetCardID`、`payload.guessNum`、`payload.correct`。

兼容处理：

* `payload` 标成可选，避免后端联调早期出现 `null`、缺字段或非 `guess_card` 动作时前端报错。

* 前端只消费 `lastData?.action === 'guess_card'` 且 payload 字段完整的情况。

### 2. 用 lastData 替代本地 diff 推断

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

删除/替换：

* 删除 `prevSyncRef`。

* 删除 `pendingGuessRef`。

* 删除“通过 guessCard 前后 cardData diff 识别猜对/猜错事件”的 `useEffect`。

* `handleGuess` 中不再写 `pendingGuessRef.current`，只负责发送 `game_guess_card` 并关闭弹窗。

新增：

* 新增 `lastActionKeyRef`，用于避免同一个 `lastData` 在每次 `ROOM_SYNC` 或 React 重渲染时重复 toast / 重复动画。

* 新增 `getGuessAction(lastData)` 辅助函数，校验并提取合法 `guess_card` payload。

* 新增 `useEffect`，依赖 `wsRoomSyncData?.roomData.lastData`：

```ts
const action = getGuessAction(wsRoomSyncData?.roomData.lastData);
if (!action) return;

const actionKey = [
  action.playerID,
  action.payload.targetCardID,
  action.payload.targetPlayerID,
  action.payload.guessNum,
  action.payload.correct ? '1' : '0',
].join(':');

if (lastActionKeyRef.current === actionKey) return;
lastActionKeyRef.current = actionKey;

gameCanvasRef.current?.flashTileFeedback(
  action.payload.targetCardID,
  action.payload.correct
);
```

toast 规则：

* 自己猜对：`gameMessage.success('猜对了！你可以选择继续猜或放回牌组')`

* 自己猜错：`gameMessage.error('猜错了')`

* 对手猜对：`gameMessage.warning('对手猜中了你的 ${guessNumText}')`

* 对手猜错：`gameMessage.info('对手猜你的 ${targetLabel} 为 ${guessNumText}，猜错了')`

注意：

* `guessNumText` 来自 `payload.guessNum`，`-1` 显示为 `JOKER`。

* 对手猜错时不得从 `cardData.self` 读取真实 `num` 展示，只展示猜测值。

* 对手猜对时展示 `guessNum` 即可，因为它等于真实牌面且已经公开。

Why:

* 服务端 `lastData` 成为猜牌反馈的单一事实来源。

* 猜错也可以准确定位 `targetCardID`，不再只能显示“猜错了”。

* 重连后 `lastData` 能直接渲染信息条；实时动画和 toast 通过 `lastActionKeyRef` 去重。

### 3. 新增“最近猜牌动作”信息条

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

位置：

* 放在 `.board` 内、`GameCanvas` 后或前均可，但需要绝对定位覆盖在画布上。

* 推荐在 `GameCanvas` 后渲染：

```tsx
{lastGuessView && (
  <motion.div className={styles.lastActionPanel} ...>
    ...
  </motion.div>
)}
```

信息结构：

* 左侧状态：`猜对` / `猜错`，用绿色 / 红色强调。

* 主文案：

  * 自己猜对：`你猜中了对手的白牌 #3`

  * 自己猜错：`你猜对手的黑牌 #2 为 7，猜错了`

  * 对手猜对：`对手猜中了你的白牌 #4`

  * 对手猜错：`对手猜你的黑牌 #1 为 JOKER，猜错了`

* 右侧猜测值：`猜 7` 或 `猜 JOKER`。

目标牌标签计算：

* 根据 `payload.targetPlayerID === userID` 判断目标牌在 `cardData.self` 还是 `cardData.opponents`。

* 用 `targetCardID` 在对应列表里找牌。

* `color` 现有语义是数字：当前渲染里 `tile.color ? 白牌 : 黑牌`，因此文案沿用：

  * `tile.color ? '白牌' : '黑牌'`

* 用排序后的手牌位置辅助定位：

  * 优先按 `index >= 0` 的 `index` 从小到大计算 `#${index + 1}`。

  * 如果 `index` 不存在或 `< 0`，用当前数组顺序 `findIndex + 1`。

* 找不到牌时降级为 `目标牌`，不要展示原始 card ID 给用户。

Why:

* “哪张牌”不能只靠 toast 文字表达，必须配合牌面位置和画布高亮。

* 信息条持久展示最近一次动作，满足重连玩家看到 `lastData` 的场景。

* 文案只展示公开信息，不泄露猜错目标牌真实数值。

### 4. 补齐猜错画布反馈

文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

What:

* 保留现有 `flashTileFeedback(tileId, correct)` 对猜对的绿色高亮和回弹。

* 在 `correct === false` 时新增：

  * 红色/琥珀色高亮边框或遮罩，短暂闪烁。

  * 轻微左右抖动，动画结束恢复原始 `x` 坐标。

建议实现：

```ts
const color = correct ? 0x10b981 : 0xef4444;
const baseX = container.x;

const overlay = new PIXI.Graphics()
  .roundRect(-6, -6, dims.tileWidth + 12, dims.tileHeight + 12, dims.tileRadius + 6)
  .fill({ color, alpha: 0.65 });

...

if (!correct) {
  gsap.to(container, {
    x: baseX + 7,
    duration: 0.06,
    yoyo: true,
    repeat: 5,
    ease: 'power1.inOut',
    onComplete: () => {
      gsap.set(container, { x: baseX });
    },
  });
}
```

Why:

* 后端给了 `targetCardID` 后，猜错也能指出“对手刚才猜的是这张牌”。

* 红色反馈表示“猜测失败”，但不翻开牌、不展示真实数值。

### 5. 增加样式

文件：[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

新增样式建议：

* `.lastActionPanel`：绝对定位、顶部居中、玻璃态暗色底、圆角、细边框、轻阴影，`pointer-events: none`，避免挡住画布点击。

* `.lastActionPanelCorrect` / `.lastActionPanelWrong`：分别使用绿色 / 红色边框或状态点。

* `.lastActionBadge`：显示 `猜对` / `猜错`。

* `.lastActionText`：主文案，移动端可换行。

* `.lastActionGuess`：等宽字体显示 `猜 7` / `猜 JOKER`。

响应式：

* 桌面：信息条位于 `.board` 顶部中心，最大宽度约 `560px`。

* 移动端：左右 `12px`，宽度自适应，文字缩小。

* 横屏低高度：信息条更紧凑，避免遮挡顶部对手牌；必要时放到 `.board` 底部中心。

Why:

* 与当前暗色棋盘和 header chip 风格一致。

* 信息条是状态展示，不应挡住交互。

## Assumptions & Decisions

* `roomData.lastData` 是可空字段；新局/重开后为 `null`，前端不展示信息条。

* 只处理 `lastData.action === 'guess_card'`；未知 action 忽略，避免未来协议扩展破坏当前 UI。

* `payload` 在浏览器 `JSON.parse` 后按对象读取；如果后端早期返回字符串或缺字段，前端安全降级为不展示。

* 猜错时绝不展示目标牌真实 `num`，即使本地 `cardData.self` 里可能因为玩家视角能看到自己的牌，也不把它写进猜错文案。

* `targetCardID` 是定位目标牌的唯一依据；前端不再通过 `cardData` diff 判断结果。

* 实时 toast / 画布动画只对新的 `lastData` 触发一次；持久信息条始终由当前 `lastData` 渲染。

* 不新增独立 WebSocket 消息类型，不改 `game_guess_card` 请求格式。

* 本次不重构 DaVinci 整体布局、玩家命名体系或多人显示逻辑；当前 UI 文案按“你/对手”二人局表达。

## Verification Steps

1. 类型检查：

```bash
npm run build
```

1. 手动验证自己猜对：

* 点击对手未翻牌，选择正确数字。

* 预期：目标牌绿色高亮并翻开；toast 显示“猜对了”；信息条显示“你猜中了对手的 X牌 #N / 猜 N”。

1. 手动验证自己猜错：

* 点击对手未翻牌，选择错误数字。

* 预期：目标牌红色高亮/抖动但不翻开；toast 显示“猜错了”；信息条显示“你猜对手的 X牌 #N 为 Y，猜错了”；不展示真实数字。

1. 手动验证对手猜对：

* 让 AI/对手猜中自己的牌。

* 预期：自己的目标牌绿色高亮并翻开；toast 显示“对手猜中了你的 Y”；信息条定位到自己的对应牌。

1. 手动验证对手猜错：

* 让 AI/对手猜错自己的牌。

* 预期：自己的目标牌红色高亮/抖动；toast 和信息条只显示对手猜测的 `guessNum`，不显示真实数字。

1. 重连验证：

* 在任意一次合法猜牌后刷新页面或重连。

* 预期：信息条仍展示最近一次 `lastData`；不会重复弹出 toast 或重复播放高亮动画，除非后端推送了新的 `lastData`。

1. 重开验证：

* 点击重开或进入新局。

* 预期：后端 `LastData: nil` 后，前端信息条消失，不残留上一局猜牌动作。

