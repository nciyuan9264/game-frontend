# 修复 DaVinci `Game` 组件因 `cardData` 为 `undefined` 导致的运行时报错

## Summary

进入 `/game/davinci/match?roomID=xxx` 时控制台抛出：

```
Uncaught TypeError: Cannot read properties of undefined (reading 'self')
    at Game (index.tsx:134:42)
```

根因是 [Game/index.tsx#L134-L135](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L134-L135) 在访问 `wsRoomSyncData?.cardData.self` / `wsRoomSyncData?.cardData.opponents` 时，只对 `wsRoomSyncData` 做了可选链，没有对 `cardData` 做可选链。当后端推送的 `ROOM_SYNC` 消息中 `cardData` 为 `undefined`（如刚进入房间、`waiting` 状态尚未发牌时），就会触发该错误。

## Current State Analysis

* 类型定义 [DaVinicRoom.d.ts#L74-L81](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts#L74-L81) 中 `WsRoomSyncData.cardData` 为必填字段（`CardData`），但实际后端在等待阶段可能没有该字段，TypeScript 类型与运行时数据不一致。

* 父组件 [DaVinci/index.tsx#L74-L83](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx#L74-L83) 收到 `ROOM_SYNC` 后直接将 `wsRoomSyncData` 设到 state，并条件渲染 `<Game>`。一旦 `cardData` 缺失就会让子组件崩溃。

* 子组件 [Game/index.tsx#L37-L38](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L37-L38) 在 `handleTileClick` 中已经使用了 `wsRoomSyncData?.cardData.opponents ?? []` 形式的访问，同样存在隐患（虽然只有点击时才触发），需要一并修复以保持一致性。

* `boardCards` 在 [Game/index.tsx#L37](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L37) / [#L116](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L116) / [#L136](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L136) 中已经使用 `wsRoomSyncData?.roomData.boardCards ?? {}`，`roomData` 实际推送时一般都存在，本次不动。

## Proposed Changes

### 1. [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

**Why**：消除访问 `wsRoomSyncData.cardData.self/opponents` 时未对 `cardData` 做可选链导致的 `TypeError`。

**What/How**：

* 第 38 行 `handleTileClick` 内：

  * 将 `wsRoomSyncData?.cardData.opponents ?? []` 改为 `wsRoomSyncData?.cardData?.opponents ?? []`。

* 第 134\~135 行 `<GameCanvas>` props：

  * 将 `(wsRoomSyncData?.cardData.self) ?? []` 改为 `(wsRoomSyncData?.cardData?.self) ?? []`。

  * 将 `(wsRoomSyncData?.cardData.opponents) ?? []` 改为 `(wsRoomSyncData?.cardData?.opponents) ?? []`。

仅修改三处可选链，不引入新逻辑/不调整组件结构。

### 2. [src/types/DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts)

**Why**：使类型与实际后端推送一致，避免后续代码再次错以为 `cardData` 必定存在而忘记可选链。

**What/How**：

* 将 `WsRoomSyncData.cardData: CardData` 改为 `WsRoomSyncData.cardData?: CardData`（仅加一个 `?`）。

> 注：本次不修改 `Match` 流程、不修改 `useWebSocket`、不动后端协议，最小化变更范围。

## Assumptions & Decisions

* 仅在 `cardData` 未就绪时返回空数组，让 `GameCanvas` 渲染空棋盘，与 `gameStatus === 'waiting'` 等状态自然兼容；不新增 loading 占位，避免越界改动。

* 不替换 `wsRoomSyncData?.roomData.boardCards` 的写法（实测 `roomData` 总是存在），以保持改动最小。如未来出现类似空指针，再单独修复。

* 不删除 `Game` 组件中已注释掉的 `useEffect`、未使用的 `_wsRef`、`_gev`、`_setGev` 等，本次问题之外不顺手清理。

## Verification Steps

1. 启动前端 `pnpm dev`（或既有的开发命令），打开 `/game/davinci/match?roomID=0602_123705`。
2. 在 `waiting` 状态（即 `cardData` 缺失阶段）页面应正常渲染棋盘头部与空 Canvas，控制台不再出现 `Cannot read properties of undefined (reading 'self')`。
3. 进入 `getCard` / `setCard` / `guessCard` 状态后，自己与对手的牌应正常出现并可点击。
4. `pnpm tsc --noEmit`（或工程已有的类型检查命令）通过，类型不报错。

