# Acquire 与 DaVinci 音效增强计划

## Summary

为 Acquire（收购）和 DaVinci（达芬奇密码）两个游戏补充音效。采用**纯前端本地触发**方案：在前端交互处和状态变化处直接调用 `playAudio()`，不依赖后端改动。音频文件（mp3）由用户后续提供，本计划负责把所有触发点接好，并扩展 `AudioTypeEnum` 与资源映射。

## Current State Analysis

### 音效机制

音效统一由 [useAudio.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/useAudio.ts) 管理：

* `AudioTypeEnum` 枚举音效类型，`audioTypes` 数组列出所有需预加载的类型。

* `initAudioMap()` 把每个类型映射到 `/music/${type}.mp3` 的 `HTMLAudioElement` 并预加载。

* `useAudio()` 返回 `playAudio(type)`，每次从头播放，失败仅 `console.warn`（不会抛错）。

触发有两条路径：

1. **后端 WS 推送**：`Acquire/index.tsx`、`DaVinci/index.tsx`、`Splendor/index.tsx` 都在 `onMessage` 中处理 `newData.type === 'audio'`，调用 `playAudio(newData.message)`。
2. **前端本地直接调用**：例如 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.tsx#L49-L53) 在轮到自己时播 `YourTurn`，在 onSelect 创建公司时播 `CreateCompany`。

### 现有音频资源（public/music/）

`your-turn`、`create-company`、`buy-stock`、`get-noble-card`、`quickily`、`quickily1`、`quickily2`（共 7 个）。

### 现状问题

* **Acquire**：只接了 `YourTurn`（轮到自己）和 `CreateCompany`（创建公司）两处本地音效。下棋、买股、并购、破产清算、游戏结束等关键操作均无音效。

* **DaVinci**：前端**完全没有本地音效**，只被动播后端推送（实际后端未推）。抽牌、猜牌（对/错）、放回、游戏胜负都无音效。

* `AudioTypeEnum` 里残留 `quickily/1/2`、`get-noble-card`（Splendor 用）等，与新需求无关，保留不动。

## 决策记录（Assumptions & Decisions）

1. **纯前端本地触发**（已与用户确认）：只在前端交互/状态变化处调用 `playAudio`，不改后端。
2. **音频文件由用户提供**（已与用户确认）：本计划只新增 `AudioTypeEnum` 枚举项并加入 `audioTypes` 预加载列表，对应的 `public/music/<name>.mp3` 文件由用户补充。在文件缺失时 `playAudio` 仅 warn，不影响功能。
3. **猜牌对错音效用 DaVinci 已有的视觉反馈时机**：复用 [GameCanvas index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L224-L242) 中检测 `lastData` 变化、调用 `flashTileFeedback` 的 effect，在同一处按 `payload.correct` 播放对应音效，保证音画同步且不会重复触发。
4. **不引入背景音乐（BGM）**：本次只做操作音效，避免范围扩大。
5. **去重原则**：所有「状态变化型」音效都基于 `useEffect` + 关键值依赖触发，避免组件重渲染导致重复播放。

## Proposed Changes

### 1. 扩展音效类型与资源映射

文件：[src/hooks/useAudio.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/useAudio.ts)

在 `AudioTypeEnum` 中新增以下枚举项，并全部加入 `audioTypes` 预加载数组：

| 枚举项            | 值（对应 mp3 文件名）   | 用途               |
| -------------- | --------------- | ---------------- |
| `PlaceTile`    | `place-tile`    | Acquire：确认放置板块   |
| `MergeCompany` | `merge-company` | Acquire：公司并购触发   |
| `Settlement`   | `settlement`    | Acquire：破产清算/结算  |
| `GameWin`      | `game-win`      | 通用：自己获胜/游戏结算自己第一 |
| `GameLose`     | `game-lose`     | 通用：游戏结束且未获胜      |
| `DrawCard`     | `draw-card`     | DaVinci：从牌池抽牌    |
| `GuessCorrect` | `guess-correct` | DaVinci：猜对       |
| `GuessWrong`   | `guess-wrong`   | DaVinci：猜错       |
| `SetCard`      | `set-card`      | DaVinci：放回新牌结束回合 |

> 注：`buy-stock`、`create-company`、`your-turn` 已存在，直接复用，不新增。

### 2. Acquire 音效接入

#### 2.1 确认放置板块 — `PlaceTile`

文件：[src/view/Acquire/components/Game/utils/useGameOperate.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/utils/useGameOperate.tsx#L13-L23)

在 `handleConfirm` 内、`sendMessage` 发送 `game_place_tile` 时播 `AudioTypeEnum.PlaceTile`。需在该 hook 内引入 `useAudio`。

#### 2.2 买股 — `BuyStock`

文件：[src/view/Acquire/components/Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.tsx#L163-L173)

在 `<BuyStock onSubmit={...}>` 回调里发送 `game_buy_stock` 时播 `AudioTypeEnum.BuyStock`（资源已存在）。

#### 2.3 并购选择/结算 — `MergeCompany`

文件：[src/view/Acquire/components/Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.tsx#L188-L200)

在 `<CompanyStockActionModal onOk={...}>` 发送 `game_merging_settle` 时播 `AudioTypeEnum.MergeCompany`。

#### 2.4 破产清算 — `Settlement`

文件：[src/view/Acquire/components/Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.tsx)

新增一个 `useEffect`，依赖 `wsRoomSyncData?.roomData.gameStatus`，当状态首次进入 `GameStatus.MergingSelection`（清算/合并结算阶段）时播 `AudioTypeEnum.Settlement`。用 `useRef` 记录上一次状态避免重复。

#### 2.5 游戏结束胜负 — `GameWin` / `GameLose`

文件：[src/view/Acquire/components/Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.tsx)

新增 `useEffect`，依赖 `gameEndModalVisible`。当其由 false→true 时，根据 `wsRoomSyncData.result` 判断当前 `userID` 是否第一名：第一播 `GameWin`，否则播 `GameLose`。用 `useRef` 防重复。

> result 结构在 [GameEnd/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/GameEnd/index.tsx) 中已用于渲染排名，实现时读取该结构确定名次。

### 3. DaVinci 音效接入

所有改动集中在 [src/view/DaVinci/components/Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)，需在该组件引入 `useAudio`。

#### 3.1 抽牌 — `DrawCard`

在 `handleTileClick` 命中牌池（`poolHit`）发送 `game_get_card` 时播 `AudioTypeEnum.DrawCard`。

#### 3.2 猜对/猜错 — `GuessCorrect` / `GuessWrong`

复用现有检测 `lastData` 变化的 effect（[index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L224-L242)）。在调用 `flashTileFeedback(payload.targetCardID, payload.correct)` 的同一位置，按 `payload.correct` 播 `GuessCorrect` / `GuessWrong`。该 effect 已有 `lastActionKeyRef` 去重，天然避免重复播放。

#### 3.3 放回新牌 — `SetCard`

在 `GameCanvas` 的 `onSelectInsertPosition` 回调里发送 `game_set_card` 时播 `AudioTypeEnum.SetCard`。

#### 3.4 游戏胜负 — `GameWin` / `GameLose`

复用现有 `winner` 的 effect（[index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L126-L128)）。在 `winner` 由 null→有值时，`winner === 'player'` 播 `GameWin`，否则播 `GameLose`。用 `useRef` 防重复。

## 需用户补充的音频文件

请在 `public/music/` 放入以下 mp3（缺失不影响运行，仅无声）：

* `place-tile.mp3`

* `merge-company.mp3`

* `settlement.mp3`

* `game-win.mp3`

* `game-lose.mp3`

* `draw-card.mp3`

* `guess-correct.mp3`

* `guess-wrong.mp3`

* `set-card.mp3`

## Verification

1. `npm run build`（或项目对应的 tsc/lint）通过，无类型错误。
2. 手动验证 Acquire：放板块、买股、并购、清算阶段、游戏结束分别触发对应音效（用占位文件或临时复用现有 mp3 验证调用是否发生，可在 `playAudio` 处打 log 确认）。
3. 手动验证 DaVinci：抽牌、猜对、猜错、放回、胜负分别触发。
4. 确认状态型音效（清算、结束、胜负）在一局内只播一次，不随重渲染重复。

