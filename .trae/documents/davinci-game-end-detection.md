# DaVinci 游戏结束判定逻辑梳理与接入方案

## Summary

用户的问题：**「游戏结束的判定在哪里？是不是根据房间状态是不是 `end` 判断的？」**

调研结论一句话：

> **当前 DaVinci 模块里根本没有"游戏结束"的判定逻辑。** 后端协议里 `GameStatus` 包含 `'end'` 这个枚举值，但前端在 `view/DaVinci/**` 内没有任何代码读取/响应 `gameStatus === 'end'`。胜利弹窗是写好的"死代码"，永远不会被触发。

下面给出基于代码的论证 + 一个最小接入方案（用户确认后再执行）。

## Current State Analysis

### 1. 类型里 `'end'` 是合法状态

[DaVinicRoom.d.ts#L1-L2](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts#L1-L2)

```ts
export type GameStatus = 'match' | 'waiting' | 'getCard' | 'guessCard' | 'setCard' | 'end';
```

`RoomData.gameStatus` 也是这个 `GameStatus` 类型，所以后端可以推 `gameStatus === 'end'`。

### 2. `Game` 组件里有写好的胜利弹窗，但 `winner` 永远是 `null`

[Game/index.tsx#L20](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L20)：

```ts
const [winner] = useState<'player' | 'opponent' | null>(null);
```

注意只解构了 `winner`，**没有 `setWinner`**。原本应该负责赋值的 `useEffect` 全部被注释掉了：

[Game/index.tsx#L22-L28](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L22-L28)

```ts
// useEffect(() => {
//   const gameWinner = checkWinner(gameState);
//   if (gameWinner && !winner) {
//     setWinner(gameWinner);
//   }
// }, [gameState]);
```

所以 [Game/index.tsx#L207](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L207) 的 `{winner && (...)}` 这块"Victory Modal" UI 永远不会出现。

### 3. 父组件预留了 `gameEndModalVisible`，但**只声明、不赋值**

[DaVinci/index.tsx#L24](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx#L24)：

```ts
const [gameEndModalVisible, setGameEndModalVisible] = useState(false);
```

[DaVinci/index.tsx#L80-L81](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx#L80-L81) 只是把它作为 prop 透传给 `Game`：

```tsx
gameEndModalVisible={gameEndModalVisible}
setGameEndModalVisible={setGameEndModalVisible}
```

而 `Game` 组件里直接把这两个 prop 重命名为 `_gev` / `_setGev` 完全没用：

[Game/index.tsx#L17](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L17)

```ts
({ ..., gameEndModalVisible: _gev, setGameEndModalVisible: _setGev }: IGameProps)
```

整个 DaVinci 子树搜索 `setGameEndModalVisible(` / `gameStatus === 'end'` / `GameStatus.END`，都没有任何**赋值/分支**调用：

```
src/view/DaVinci/components/Game/index.tsx       声明 gameEndModalVisible，但仅作为未使用 prop
src/view/DaVinci/index.tsx                       声明 useState、传 prop，没有 setter 调用
```

### 4. 对照同仓的 Acquire / Splendor，确认"应当怎么做"

- Acquire 是**确实**用 `gameStatus === 'end'` 判断的：[Acquire/index.tsx#L80-L84](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/index.tsx#L80-L84)
  ```ts
  if (roomData.roomData.gameStatus === GameStatus.END) {
    setGameEndModalVisible(true);
  } else {
    setGameEndModalVisible(false);
  }
  ```
- Splendor 也是同样模式：[Splendor/index.tsx#L63-L65](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/index.tsx#L63-L65)
  ```ts
  if (data.roomData.roomInfo.roomStatus === SplendorGameStatus.END) {
    setGameEndModalVisible(true);
  }
  ```

也就是说，**这套架构里"结束的判定"标准做法就是看 `gameStatus === 'end'`**，DaVinci 缺的只是这一行。

### 5. 结束的"输赢"信息当前缺失

后端在 `gameStatus === 'end'` 时是否会附带"谁赢"的字段，在 [DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts) 当前类型里**没有体现**（`RoomData` 只有 `currentPlayer / gameStatus / players / boardCards`）。这是回答用户的另一面：即使要判定结束，输赢需要后端再补一个字段（或前端用"对方所有 `Card.isRevealed === true` 即胜利"自行推断）。

### 6. 参考：`isRevealed` 才是当前 UI 上唯一的"胜负相关信号"

[GameCanvas/index.tsx#L206](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L206) 等位置使用 `tile.isRevealed` 来高亮已经被翻开的牌。所以一个简单的本地"赢家推断"是：

- 自己的牌全部 `isRevealed === true` → opponent 赢。
- 对方的牌全部 `isRevealed === true` → player 赢。

但目前没有任何地方做这个推断。

## 直接回答用户的问题

> **是根据房间状态是不是 `end` 判断的吗？**

- 类型上 `'end'` 是合法的 `gameStatus`。
- 但 **DaVinci 前端目前完全没有基于 `gameStatus === 'end'` 的分支**——它既没在父组件 `setGameEndModalVisible(true)`，也没在 `Game` 组件里推断 `winner`。
- 因此当前**根本没有"结束判定"被执行**；`'end'` 走到前端只会让 Header 上显示一行 `gameStatus` 文本（[Game/index.tsx#L108](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L108)），不会弹任何"游戏结束"窗。
- 同仓的 Acquire / Splendor 用 `gameStatus === END` 触发结束弹窗，DaVinci 当前是缺这块逻辑。

## Proposed Changes（如果要把结束判定真正接上，最小改动）

> 仅做"接入"，不做胜利者判定（因为输赢字段后端尚未约定）。如果这版只想做"游戏一旦结束就弹一个简单的 Game Over 弹窗"，按下面来。

### 方案 A：在父组件 [DaVinci/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx) 中，在 `ROOM_SYNC` 回调里加一行（与 Acquire 对齐）

**Why**：和已有 `gameEndModalVisible` state、Acquire/Splendor 的写法保持一致。

**What/How**（[DaVinci/index.tsx#L55-L59](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx#L55-L59) 处补一段）：

```ts
if (newData.type === 'ROOM_SYNC') {
  setWsMatchSyncData(undefined);
  const roomData: WsRoomSyncData = newData as WsRoomSyncData;
  setWsRoomSyncData(roomData);
  if (roomData.roomData.gameStatus === 'end') {
    setGameEndModalVisible(true);
  } else {
    setGameEndModalVisible(false);
  }
}
```

### 方案 B：在 `Game` 组件 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx) 内根据 `gameStatus === 'end'` 控制现有 Victory Modal

**Why**：`Game` 内已经写好了 Victory Modal UI（[Game/index.tsx#L207-L249](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L207-L249)），最能"少写代码、直接复用 UI"。

**What/How**：

1. 把 `const [winner] = useState(null)` 改成 `useMemo`：
   ```ts
   const winner: 'player' | 'opponent' | null = useMemo(() => {
     if (wsRoomSyncData?.roomData.gameStatus !== 'end') return null;
     // 简单推断：对方所有牌 isRevealed === true → player 胜，否则 opponent 胜
     const oppAll = (wsRoomSyncData?.cardData?.opponents ?? []);
     if (oppAll.length > 0 && oppAll.every(c => c.isRevealed)) return 'player';
     return 'opponent';
   }, [wsRoomSyncData]);
   ```
2. 移除参数解构里的 `gameEndModalVisible: _gev, setGameEndModalVisible: _setGev`（已是死代码）。

> 备选：A、B 二选一，或同时做。**推荐 A**，理由：与本仓另两套游戏完全一致、最小心智负担。B 改动稍大且引入了"输赢推断"，需要后端确认是否准确。

### Assumptions & Decisions

- 假设后端在游戏结束时会推 `gameStatus === 'end'` 的 `ROOM_SYNC`（与 Acquire/Splendor 协议一致）。**若后端事实上不会推 `'end'`**，本方案需要先让后端补齐协议再做前端接入。
- 暂不引入"输赢者"字段：`Card[]` 里的 `isRevealed` 是当前唯一可用信号；如需更严格的胜负展示，需要后端补一个 `winnerID` 字段。
- 不动 [GameCanvas](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)；它对 `gameStatus === 'end'` 不做特殊处理（`canClick` 自然为 false，符合预期）。
- 不创建新文件；只在已有的 [DaVinci/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx) 或 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx) 内修改。

## Verification Steps

1. 触发一局完整对局直至后端推 `gameStatus === 'end'`：
   - 方案 A：观察是否有 Antd / 现有的 GameEnd 弹窗（实际 `DaVinci/index.tsx` 现在并没有挂 `<GameEnd />`，仅 `setGameEndModalVisible`，所以方案 A 单独还看不到弹窗，需要补一个简单 modal 或复用 Acquire/Splendor 的 `GameEnd` 组件）。
   - 方案 B：观察 [Game/index.tsx#L207-L249](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L207-L249) 的 Victory Modal 是否弹出，且 Header / 状态栏（依赖 `!winner`）正确隐藏。
2. 主动让 `gameStatus` 不是 `end`，确认弹窗不出现、Header 状态正常显示。
3. `pnpm tsc --noEmit` 通过。

> ⚠️ 这份计划本质上是为用户的疑问提供一份「答疑+可执行接入方案」。如果用户只想得到"答案"——答案就是：**"`'end'` 在类型里有，但前端目前没有任何地方根据它做判定，所以你看到的'结束判定'其实并不存在"**。是否落地实施由用户决定。
