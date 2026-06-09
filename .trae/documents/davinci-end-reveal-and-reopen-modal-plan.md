# 达芬奇密码 - 游戏结束揭示对手手牌 + 结束弹窗可关闭/重开

## Summary
游戏进入 `end` 状态后，后端会推送对手的全部手牌（`num` 填上真实值，但 `isRevealed` 保持原样）。需要前端做两件事：

1. **区分玩家之前没猜出来的对手牌**：在 `end` 状态下，对手牌中 `isRevealed === false` 的就是玩家没攻克的牌。给这些牌加**红色/警示描边**，与已猜中的牌（绿色描边）区分开。
2. **结束弹窗可关闭、可重开**：给游戏结束弹窗加关闭按钮；复用右上角的「重新开始」按钮——游戏未结束时隐藏，结束后才显示，点击它重新打开结束弹窗。

## Current State Analysis

- 游戏状态来自 `wsRoomSyncData.roomData.gameStatus`，`'end'` 表示结束。类型见 [DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts#L2)。
- 卡牌类型 `Card { id, color, num, isRevealed, index? }`，`isRevealed` 是「是否已被猜中/揭示」的唯一标志（[DaVinicRoom.d.ts#L76](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts#L76)）。
- 卡牌在 PIXI 画布中渲染，描边逻辑集中在 `updateTileGraphic`（[GameCanvas/index.tsx#L277-L348](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L277-L348)）：当 `tile.isRevealed` 为真时给 body 加绿色描边 `0x10b981`（L339-347）。该函数被 self / opponent / pool 三处复用，签名 `(container, tile, dims, clickable)`。
- 对手牌渲染在两段：已排好的牌 [L513-L554](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L513-L554)、新抽出的牌 [L555-L599](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L555-L599)。`gameStatus` 在 `renderGame` 作用域内可用。
- `winner` 派生自 `gameStatus === 'end'`（[Game/index.tsx#L119-L124](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L119-L124)）。
- 结束弹窗（Victory Modal）仅由 `winner` 控制开关，**没有关闭按钮**，只有 Play Again（[Game/index.tsx#L516-L560](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L516-L560)）。
- 右上角「重新开始」按钮（`RotateCcw` 图标）**始终显示**，onClick 是 `resetGame`（[Game/index.tsx#L327-L333](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L327-L333) / [resetGame L277-L282](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L277-L282)）。
- `index.tsx` 里的 `gameEndModalVisible` / `setGameEndModalVisible` 透传给 Game 后被别名为 `_gev` / `_setGev`，**未使用**（死代码）。

## Proposed Changes

### 1. GameCanvas：给「未猜中」的对手牌加红色描边
文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

- **修改 `updateTileGraphic` 签名**，新增一个可选参数表达描边样式，例如 `unrevealedReveal: boolean = false`（默认 false，保证 self/pool 调用不变）。
  - 在函数末尾的描边逻辑里：
    - 若 `tile.isRevealed` → 维持现有绿色描边 `0x10b981`（已猜中）。
    - 否则若 `unrevealedReveal` 为真 → 给 body 加**红色描边**（如 `0xef4444`，与文件内已用的反馈红一致，width 3），表示「游戏结束才揭示、玩家没猜出来的牌」。
  - 这两者互斥；其余情况不加描边。
- **仅在对手牌的两处调用点计算并传入** `unrevealedReveal`：
  - 已排好对手牌处（[L542](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L542) 与 [L545](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L545)）。
  - 新抽出对手牌处（[L585](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L585) 与 [L588](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L588)）。
  - 计算式：`const isUnguessedReveal = gameStatus === 'end' && !tile.isRevealed;`，作为新参数传入对手的 `updateTileGraphic` 调用（含 `needsRecreate` 分支里的那次和最终那次）。
- self（L671/L673）、pool（L767/L771）的调用保持不传该参数（用默认 false），不受影响。

> 说明：依据用户确认，`end` 时后端 `isRevealed` 保持原样、仅填充 `num`，因此 `gameStatus==='end' && !isRevealed` 能准确锁定「玩家之前没猜出来的牌」。游戏进行中 `gameStatus !== 'end'`，该红色描边不会出现。

### 2. Game：结束弹窗加关闭按钮 + 复用右上角按钮重开弹窗
文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

- **新增本地状态** `const [showEndModal, setShowEndModal] = useState(false);`（放在其它 useState 附近，约 L114-L117）。
- **同步打开逻辑**：新增 `useEffect`，依赖 `winner`：当 `winner` 变为非空时 `setShowEndModal(true)`；当 `winner` 变回 `null`（重开新局）时 `setShowEndModal(false)`。这样游戏一结束弹窗自动弹出，行为与现状一致。
- **右上角按钮改造**（[L327-L333](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L327-L333)）：
  - 用 `{winner && ( ... )}` 包裹，使其**仅在游戏结束后显示**。
  - `onClick` 从 `resetGame` 改为 `() => setShowEndModal(true)`（点击重新打开结束弹窗）。
  - 图标可保留 `RotateCcw` 或更贴近「打开结果」语义（保持 `RotateCcw` 即可，最小改动；不新增依赖）。
- **结束弹窗改造**（[L516-L560](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L516-L560)）：
  - 开关条件从 `{winner && (...)}` 改为 `{winner && showEndModal && (...)}`。
  - 在 `victoryCard` 内新增一个**关闭按钮**（右上角 X，可用已导入图标或纯文本/CSS），`onClick={() => setShowEndModal(false)}`。
  - `victoryBackdrop` 可选地加 `onClick={() => setShowEndModal(false)}` 实现点遮罩关闭（与 Rule 弹窗一致，见 [L458](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L458)）。
  - 「Play Again」按钮维持调用 `resetGame` 不变。
- **样式**：在 [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less) 中为新关闭按钮新增类（参考 Rule 弹窗关闭/`resetBtn` 既有样式），保持暗色主题观感。

> `index.tsx` 的 `gameEndModalVisible`/`setGameEndModalVisible` 透传保持现状（仍为未使用），本次不依赖也不清理，避免扩大改动范围。

## Assumptions & Decisions
- 后端在 `end` 时保持对手牌 `isRevealed` 原样、仅填真实 `num`（用户已确认）。
- 「未猜中」对手牌用红色描边 `0xef4444`（用户已确认警示描边方案），已猜中保持绿色 `0x10b981`。
- 红色描边只作用于对手牌，玩家自己的牌与牌池不变。
- 弹窗打开状态用 Game 内部新建的 `showEndModal`，不复用 `index.tsx` 的死代码 props，减少跨组件改动。
- 关闭按钮使用现有 `lucide-react` 已导入图标或简单 X，不新增依赖。

## Verification
1. `npx tsc --noEmit -p tsconfig.json` 通过（EXIT=0）。
2. 启动 dev server，进入达芬奇对局：
   - 游戏进行中：右上角按钮**不显示**；对手未公开牌无红色描边。
   - 游戏结束：弹窗自动弹出；对手牌中玩家**没猜中的**显示红色描边，**已猜中的**显示绿色描边。
   - 点击弹窗关闭按钮（及遮罩）→ 弹窗关闭，可看到棋盘与揭示后的对手牌。
   - 点击右上角按钮 → 结束弹窗重新打开。
   - 点击「Play Again」→ 触发 `game_restart_game`，新局开始后红色描边与按钮、弹窗状态复位。
