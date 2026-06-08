# DaVinci 猜对猜错判定修正规划

## Summary

本次只修正 DaVinci 前端对“猜对 / 猜错”事件的推断规则，不扩展动画样式、不调整 Canvas 渲染、不修改 WebSocket 协议。

新的核心规则以你刚补充的业务语义为准：

1. 只在 `guessCard` 相关的前后两帧之间推断结果。
2. 如果当前猜测发起者是玩家自己，则检查 `cardData.opponents`：若某张牌的 `num` 从“无有效值”变为“有值”，视为玩家猜对；否则视为玩家没猜对。
3. 如果当前猜测发起者是对手，则检查 `cardData.self`：若某张牌出现“被翻开”的结果，视为对手猜对；否则视为对手没猜对。
4. 现有基于 `isRevealed:false -> true + aside/index` 的猜错判定规则不再作为主规则，避免把“抽到的牌归位”与“猜测结果”混淆。

## Current State Analysis

### 1. 现有数据结构

- `WsRoomSyncData` 定义在 [DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts)。
- 关键字段：
  - `roomData.currentPlayer`：当前行动人。
  - `roomData.gameStatus`：当前阶段，枚举值包含 `guessCard`。
  - `cardData.self`：自己的手牌视角。
  - `cardData.opponents`：对手手牌视角。
  - `Card.id`：稳定主键。
  - `Card.num`：牌面数字。
  - `Card.isRevealed`：是否已翻开。
  - `Card.index`：前端位置语义，当前仅用于渲染布局。

### 2. 当前实现的问题

- 当前判定逻辑位于 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx) 的 `useEffect` 中。
- 现逻辑只关注 `isRevealed` 从 `false -> true`，并结合上一帧 `index < 0`（aside）去区分“猜对 / 猜错”。
- 这个规则的问题在于：
  - 它把“牌是否在 aside / row”当作猜测结果来源，但 aside 只是布局状态，不是业务真相。
  - 它没有把“这是哪一方正在 guessCard”作为一等条件。
  - 它没有直接利用“对手牌 `num` 从未知到已知”这一更贴近业务语义的信号。

### 3. 当前实现可复用的部分

- `prevSyncRef` 已存在，可继续保存前一帧 `wsRoomSyncData`。
- `gameCanvasRef` 与 `gameMessage` 已接入，不需要为这次规则修正新增基础设施。
- `handleGuess` 仍然通过 `game_guess_card` 发起猜测，本次不需要改动发送协议。

## Proposed Changes

### 修改 1：重写 `Game/index.tsx` 中的猜测结果推断逻辑

定位：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

**Why**

- 让前端反馈与真实业务规则一致：谁在 `guessCard`，就检查谁的猜测目标在前后快照里是否出现“成功命中”的信号。

**What / How**

- 保留 `prevSyncRef`，但重写当前 `useEffect` 中的 diff 逻辑。
- 新逻辑只在“前一帧或当前帧与 `guessCard` 有关”时尝试判定，避免 `getCard`、`setCard`、`end` 等阶段误触发反馈。
- 引入两个明确判断步骤：

1. 判断“这次 guessCard 是谁发起的”
   - 使用 `prev.roomData.currentPlayer` 与 `prev.roomData.gameStatus` 作为主依据。
   - 当 `prev.roomData.gameStatus === 'guessCard'` 时：
     - 若 `prev.roomData.currentPlayer === userID`，说明上一动作是“玩家正在猜对手牌”。
     - 否则说明上一动作是“对手正在猜玩家牌”。
   - 若服务端阶段切换较快，也允许以 `current.roomData.gameStatus === 'guessCard'` 作为兜底辅助，但以 `prev` 为主，避免把结果帧误认成发起帧。

2. 根据发起方判断“是否猜对”
   - 场景 A：玩家发起猜测
     - 比较 `prev.cardData.opponents` 与 `current.cardData.opponents`。
     - 以 `Card.id` 建索引。
     - 找出是否存在某张对手牌满足“`num` 由不可见/不可用状态变为可见有效值”。
     - 若存在：
       - 视为玩家猜对。
       - 触发 `gameMessage.success(...)`。
       - 对该 tile 调 `flashTileFeedback(tile.id, true)`。
     - 若不存在：
       - 视为玩家没猜对。
       - 需要在自己的牌里再定位“哪张牌承受了猜错结果”，优先从 `self` 中寻找本次新变更的牌用于 toast / feedback。
       - 触发 `gameMessage.error(...)`，Canvas 不做正确命中动画。

   - 场景 B：对手发起猜测
     - 比较 `prev.cardData.self` 与 `current.cardData.self`。
     - 由于自己手牌前后都带真实 `num`，不能用 `num` 是否出现来判定。
     - 此处按你的规则，检查“我的某张牌是否在结果帧被翻开”，即 `isRevealed` 是否发生命中变化。
     - 若存在 `isRevealed: false -> true`：
       - 视为对手猜对。
       - 触发 `gameMessage.warning(...)`。
       - 对该 tile 调 `flashTileFeedback(tile.id, true)`。
     - 若不存在：
       - 视为对手没猜对。
       - 需要在 `opponents` 中寻找本次被翻开的那张牌，作为反馈对象与文案来源。
       - 触发 `gameMessage.info(...)`。

### 修改 2：抽出明确的 diff 辅助函数，避免混用多套规则

定位：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

**Why**

- 当前 effect 里直接写 `findNewlyRevealed`，语义过窄，后续容易再次把“翻牌结果”和“位置变化”混在一起。

**What / How**

- 抽出 3 个局部辅助函数，全部基于 `Card.id` 做 map diff：
  - `findNumNewlyKnown(prevList, curList)`：找出 `num` 从未知/无效到可用的牌。
  - `findNewlyRevealed(prevList, curList)`：找出 `isRevealed false -> true` 的牌。
  - `findGuessActor(prevSync, curSync, userID)`：确定本次结果归属于“玩家猜”还是“对手猜”。
- 明确约束：
  - `index` 不再作为猜对猜错的主判定条件。
  - `index` 仅在“猜错时需要定位哪张归位牌做提示”时作为辅助信息使用，如果确实需要。

### 修改 3：同步修正文案与事件映射

定位：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

**Why**

- 当前文案绑定的是旧规则，修正规则后需要让消息语义也一致。

**What / How**

- 建议按以下映射更新：
  - 玩家猜对：`猜对了！${actual}`
  - 玩家猜错：`猜错了`
  - 对手猜对：`对手猜中了你的 ${actual}`
  - 对手猜错：`对手猜错了`
- 若找不到明确的 `actual`，保留不带牌值的兜底文案，避免显示错误数字。
- 猜错场景继续不触发绿色命中动画，保持与现有 Canvas 反馈风格一致。

### 修改 4：更新旧计划文档中的错误规则说明

定位：[davinci-guess-feedback-plan.md](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/.trae/documents/davinci-guess-feedback-plan.md)

**Why**

- 旧文档第 54-71 行仍记录了基于 `isRevealed + aside/index` 的旧规则，已经与你最新确认的业务语义不一致。

**What / How**

- 将“推断猜对/猜错事件”章节替换为新的规则说明：
  - 玩家在 `guessCard` 后，检查 `opponents` 里是否出现 `num` 新变为可见。
  - 对手在 `guessCard` 后，检查 `self` 里是否出现 `isRevealed` 新变为 `true`。
  - “否则就是没猜对”写成主逻辑，不再把 aside 归位写成主判定条件。

## Assumptions & Decisions

- 决策 1：以 `prev.roomData.gameStatus/currentPlayer` 作为“谁刚刚发起了 guessCard”的主依据。
- 决策 2：对手牌的“猜对”信号优先使用 `num` 的可见性变化，而不是 `isRevealed`，因为这是你最新明确指定的业务规则。
- 决策 3：自己手牌的“对手猜对”仍使用 `isRevealed false -> true`，因为自己视角下 `num` 本来就一直存在。
- 决策 4：`index` / aside / row 不再承担主判定责任，只作为必要时定位反馈目标的辅助线索。
- 决策 5：如果一次同步里出现多张满足条件的牌，只处理第一张，保持与当前前端反馈单事件模型一致。

## Verification Steps

1. 玩家回合，阶段进入 `guessCard`，猜中对手一张牌。
   - 期望：`opponents` 中存在某张牌 `num` 从未知变为已知。
   - 前端提示“猜对了”，并对该牌触发正确反馈。

2. 玩家回合，阶段进入 `guessCard`，猜错。
   - 期望：`opponents` 中没有任何牌发生“`num` 新可见”。
   - 前端提示“猜错了”。

3. 对手回合，阶段进入 `guessCard`，对手猜中我的牌。
   - 期望：`self` 中存在某张牌 `isRevealed false -> true`。
   - 前端提示“对手猜中了你的 X”，并对该牌触发正确反馈。

4. 对手回合，阶段进入 `guessCard`，对手猜错。
   - 期望：`self` 中没有任何牌 `isRevealed false -> true`。
   - 前端提示“对手猜错了”。

5. 验证边界：
   - `getCard` / `setCard` 阶段不会误报猜对猜错。
   - 仅因 `index` 变化、aside 归位、row 重排不会单独触发猜测反馈。
   - 旧规则删除后，消息与反馈次数不重复。
