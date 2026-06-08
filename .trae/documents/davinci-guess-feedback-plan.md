# DaVinci 猜对/猜错反馈方案

## Summary

当前 DaVinci 在玩家或对手猜测对方手牌后没有任何前端视觉反馈：牌只是悄悄变成 `isRevealed: true`，玩家根本看不到"刚刚被猜的是哪张牌"、"猜的是什么数字"、"猜对还是猜错"。本次任务仅在前端补上反馈，使每一次猜测的结果一眼可见。

具体反馈方式：

1. **猜对**：被猜的牌做"翻牌 + 绿色高亮 + 抖动"动画 + ✓ 浮层 toast，告诉玩家"你猜对了 / 对手猜中了你"。
2. **猜错**：被猜的牌做"摇晃 + 红色一瞬高亮"动画 + ✗ 浮层 toast 显示"猜测值 X，正确值 Y"。

由于后端目前并未推送独立的"猜测事件"消息，方案以**前端基于状态变化推断**为主：监听 `cardData` 的对手/自己手牌中是否出现新的 `isRevealed: true` 牌、以及 `playerHand` 的 aside 牌是否消失（猜错归位 = 自己刚被猜错），结合 `currentPlayer` 即可识别"猜对/猜错"两种事件。

## Current State Analysis

### 1. WebSocket 消息 / 数据流

入口 [DaVinci/index.tsx#L32-L60](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx#L32-L60)：

* `MATCH_SYNC` / `ROOM_SYNC` 类型分别更新 `wsMatchSyncData`、`wsRoomSyncData` 状态。

* 已支持 `audio` 类型消息，调用 `playAudio`（[DaVinci/index.tsx#L43-L49](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx#L43-L49)）。

后端用 `ROOM_SYNC` 推送整局快照，类型 [WsRoomSyncData](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts#L74-L81) 包含：

* `roomData.currentPlayer` —— 当前回合玩家。

* `cardData.self` / `cardData.opponents` —— 双方手牌（含 `isRevealed` / `index`）。

### 2. 猜测交互链路

[Game/index.tsx#L36-L71](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L36-L71)：

* 玩家点击对手手牌 → `handleTileClick` 弹出 `showGuessModal`。

* 选择数字 → `handleGuess` 发 `game_guess_card`（[#L61-L71](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L61-L71)）。

* 后端处理后通过 `ROOM_SYNC` 把更新后的 `cardData` 推回；猜对则**对手对应牌的** **`isRevealed = true`**，玩家继续；猜错则**玩家自己的新牌（aside）回归 row 并** **`isRevealed = true`**。

### 3. PIXI 渲染层

[GameCanvas/index.tsx#L206-L214](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L206-L214) 在 tile 为 `isRevealed` 时只是把 body 重绘为绿色描边——没有任何动画反馈。

### 4. 已有基础设施

* **音频**：`useAudio`（[hooks/useAudio.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/useAudio.ts)）从 `/music/{type}.mp3` 加载并播放；后端可下发 `audio` 类型消息触发对应音效；当前无"猜对/猜错"音效素材，本次方案不依赖音频，可在后续迭代追加。

* **GSAP**：已在 GameCanvas 内大量使用。

* **antd** **`message`**：[DaVinci/index.tsx#L7](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx#L7)、[#L35](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx#L35) 已引入，可用作 toast。

* **Framer-motion (motion/react)**：[Game/index.tsx#L2](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L2) 已引入，可用作浮层动画。

### 5. 推断"猜对/猜错"事件

通过比较 `guessCard` 前后的两次 `wsRoomSyncData.cardData`：

* **玩家发起猜测**：如果上一帧是玩家回合且 `gameStatus === 'guessCard'`，则比较 `opponents`。

  * 若对手某张牌的 `num` 从“不可见/无值”变为“可见/有值” → "玩家猜对了对手"。

  * 否则 → "玩家没猜对"。

* **对手发起猜测**：如果上一帧是对手回合且 `gameStatus === 'guessCard'`，则比较 `self`。

  * 若自己某张牌的 `isRevealed` 从 `false` 变为 `true` → "对手猜对了玩家"。

  * 否则 → "对手没猜对"。

> 注意：`index` / aside / row 只是前端布局状态，不再作为猜对猜错的主判定条件；当前 `Game/index.tsx` 通过 `useRef<WsRoomSyncData | undefined>` 保存 prev 快照做 diff。

## Proposed Changes

只改前端三处（按"必要 → 可选"排序）。改动尽量小、不动后端协议。

### 修改 1：`Game/index.tsx` 新增"猜测事件 diff"逻辑 —— 必要

定位：[components/Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)。

**Why**：建立单一真实来源，识别每次 `ROOM_SYNC` 中"刚被翻开"的牌，作为反馈事件源头。

**What/How**：

1. 引入 `useRef<WsRoomSyncData | undefined>` 保存 prev 快照、以及 `useState<{ tileId: string; correct: boolean; byOpponent: boolean; guessed?: number; actual?: number } | null>(null)` 作为最近一次反馈事件。
2. 新增 `useEffect`，依赖 `wsRoomSyncData`：

   * 比较 prev 和 current 的 `cardData.self` / `cardData.opponents`，找出 "isRevealed 从 false → true" 的牌；

   * 结合 `roomData.currentPlayer` 是不是自己（注意：服务端 `setCard/guessCard` 阶段 `currentPlayer` 通常仍是猜测发起者）判断 `byOpponent`；

   * 如果是 opponents 中变了 → `correct = true; byOpponent = false`（玩家猜中对手）；

   * 如果是 self 中变了 → 进一步检查该牌"上一次是否在 aside（`index < 0`）"：是则 `correct = false; byOpponent = false`（玩家猜错被翻开自己的牌） —— 但实际上 `currentPlayer` 是对手时则 `byOpponent = true`（对手猜中了我）；

   * 同样镜像处理 opponents 的 aside → row + isRevealed（对手猜错）。

   * 触发反馈：①调 `message.success/error` 显示 toast；②调 `gameCanvasRef.current?.flashTileFeedback(tileId, correct)`（见修改 2 暴露的方法）；③更新 `lastFeedbackEvent` 状态。
3. 把 `useRef.current` 更新为最新 `wsRoomSyncData`。

文案（中文）：

* 猜对（自己猜中对手）：`message.success('猜对了！')`

* 猜错（自己猜错）：`message.error('猜错了！')`

* 对手猜中自己：`message.warning('对手猜中了你的 ${actual}')`

* 对手猜错：`message.info('对手猜错了')`

`actual` 直接读 `tile.num`（猜对/翻开的牌后端必然回传真实值；非 -1 则显示数字，-1 显示 `JOKER`）。

### 修改 2：`GameCanvas` 暴露反馈动画方法 + 新增 `flashTileFeedback` —— 必要

定位：[components/Game/components/GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)。

**Why**：反馈动画需要触达具体 tile container，写在 PIXI 内部最直接。

**What/How**：

1. 用 `forwardRef` 包装 `GameCanvas`，并通过 `useImperativeHandle` 暴露：

   ```ts
   {
     flashTileFeedback: (tileId: string, correct: boolean) => void;
   }
   ```
2. 实现 `flashTileFeedback`：

   * 通过 `tilesMap.current.get(tileId)` 拿到 container；找不到则忽略。

   * **猜对**：

     * 在 container 上叠加一个绿色高亮 `Graphics`（圆角矩形，比 tile 略大），`alpha: 0` → `0.7` → `0`，约 0.8s。

     * 同时 `gsap.fromTo(container.scale, { x:1, y:1 }, { x:1.25, y:1.25, yoyo: true, repeat: 1, duration: 0.25 })` 做"放大-回弹"。

   * **猜错**：

     * 叠加红色高亮，同上时长。

     * 用 `gsap.to(container, { x: '+=8', duration: 0.05, repeat: 5, yoyo: true })` 做左右抖动；记得用相对坐标或动画结束 `set` 回原坐标，避免影响后续 `renderGame` 的位置。

   * 高亮 `Graphics` 设 `name: 'feedbackOverlay'`，动画结束后从 container 移除，避免污染下次 `updateTileGraphic`（`updateTileGraphic` 只移除已知 name 的子节点，不会清理本节点；但下次 `needsRecreate` 触发时无害）。
3. 修复抖动后位置漂移：用 `const baseX = container.x` 缓存起点，动画做完 `gsap.set(container, { x: baseX })`。
4. 父组件传入 ref：

   ```ts
   const gameCanvasRef = useRef<{ flashTileFeedback: (...) => void }>(null);
   ...
   <GameCanvas ref={gameCanvasRef} ... />
   ```

> 不修改 `updateTileGraphic` 内部"isRevealed 绿色描边"的逻辑，使绿色描边作为"已永久翻开"的视觉沉淀；本次 flash 只是事件性的瞬时反馈。

### 修改 3：（可选）轻量浮层文案 —— 不必要

`message.success/error` 已经够直观，不再单独做 motion 浮层，避免引入新的 z-index 与样式。

### 不在本次改动范围

* 不引入新音效素材（保留后续接入）；不调整后端协议（不要求服务端推送新事件）。

* 不改动游戏胜负判定 / setCard / getCard 逻辑、不改动既有动画路径修复。

* 不增加其他游戏（Splendor/Acquire）相关代码。

* 不增加新的 `react-spring` / 浮层 lib 依赖。

* 不引入 `forwardRef` 之外的状态管理改造。

## Assumptions & Decisions

1. 用 `cardData` diff 推断猜测结果，无需后端新协议。代价是：① 必须保留 prev 快照；② 若一次 SYNC 同时变更多张牌（理论上不会发生），仅取首张做反馈。可接受。
2. "对手猜测自己" 仅依赖 `self` 中的 `isRevealed:false → true` 变化；不依赖 `currentPlayer` 是否自己（因为后端 `currentPlayer` 在 guess 期间通常仍是猜测发起者）。
3. 反馈尺度：①绿/红高亮 + 缩放/抖动 + toast，足够清晰；不堆砌粒子等过度效果，避免与既有动画冲突。
4. `gameCanvasRef.current?.flashTileFeedback` 用 `try/catch` 兜底，PIXI 未初始化或 tile 已被销毁时静默跳过。
5. 对 prev 快照的引用使用 `useRef`，避免因 state 化引发的额外 render。
6. 文案用中文与既有 `message.error('你已被移出房间')`（[DaVinci/index.tsx#L38](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx#L38)）一致。

## Verification Steps

1. 进入 DaVinci 房间，开始一局。
2. 玩家猜对对手某张牌：

   * 期望：被猜中的牌先做绿色高亮闪一下 + 短暂放大回弹 + 顶部 toast `猜对了！`；之后保留绿色描边（既有 `isRevealed` 视觉）。
3. 玩家猜错：

   * 期望：自己的 aside 牌归位插入 row 后，立即对该牌做红色高亮 + 抖动 + toast `猜错了！这张是 X`；牌位置在抖动后正确归位（无残留偏移）。
4. 对手猜中玩家：

   * 期望：自己被翻开的牌做绿色高亮 + 缩放 + toast `对手猜中了你的 X`。
5. 对手猜错：

   * 期望：对手的 aside 牌归位 row 时做红色抖动 + toast `对手猜错了`。
6. 重复多次确认：① 反馈不会卡死；② 抖动后无位置漂移；③ 动画与已有 `pool → aside → row` 路径不冲突；④ `lint` / `tsc` 无新增错误。
