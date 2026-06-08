# Acquire 历史对局 / 个人主页 / 回放 前端对接方案

## Summary

后端在 acquire 项目中新增了 4 个 `/history/*` 接口（列表、单局详情含时间轴、单步快照、胜率统计）。本计划在前端的 acquire 游戏列表页（`GameBoard`）右上角的用户菜单 **hover 时多加一个"个人主页"入口**：

1. 点击"个人主页" → 弹窗展示：总场次 / 胜率 / 平均得分 / 历史对局列表。
2. 点击列表里的某一局 → 进入"回放"弹窗：
   * 调 `GET /history/game/:id` 拿 `events[]` 渲染时间轴（每个 dot 标 `cmdType`）。
   * 点击某个 dot → 调 `GET /history/game/:id/snapshot?seq=N` 拿 `ROOM_SYNC` 同形结构。
   * 把 `Snapshot` 适配成 `WsRoomSyncData` 后，**复用** [Board](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/Board/index.tsx) / [CompanyInfo](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/CompanyInfo/index.tsx) / [PlayerAssets](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/PlayerAssets/index.tsx) 的展示态来渲染棋盘 / 公司 / 玩家手牌。
   * "查看终局"快捷按钮：`seq = events.length - 1`（或直接 `999999` 让后端 clamp）。

## Current State Analysis

### 现有 HTTP 基础设施
- [apiClient.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/api/apiClient.ts)：基于 `axios` 的封装，已开 `withCredentials: true`，统一拦截 `status_code === 200` 解包 `data`，401 时尝试 `refreshToken`。
- 接口风格 `Result<T>`，详见 [http.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/http.d.ts)。
- 现有 `room` 域接口集中在 [api/room.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/api/room.ts)。
- 请求 hooks 集中在 [src/hooks/request/](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/request)（基于 `ahooks` 的 `useRequest`），如 [useProfile.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/request/useProfile.ts)、[useRoomList.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/request/useRoomList.ts)。
- baseURL 来自 `import.meta.env.VITE_API_BASE_URL`，开发环境为 `/`，由 vite proxy 转发 `/room`、`/auth` 到后端，[vite.config.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/vite.config.ts) 当前 **未代理 `/history`**，需补上。

### 现有 UI 入口
- [GameBoard/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/index.tsx) 是游戏房间列表页，顶部由 [Header](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/Header/index.tsx) 渲染。
- `Header` 已经有一个 `<Dropdown trigger={['hover']}>`，菜单里已经有 `Profile` 和 `退出登录` 两项 —— 把"个人主页"加到这里最自然，**hover 头像即可看到**，与用户需求"游戏列表页 hover 的时候加一个个人主页的选项"完全一致。

### 现有对局渲染组件（用于回放复用）
- [Board](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/Board/index.tsx)：接收 `tilesData / wsRoomSyncData`，支持外部 `placeTile / setHoveredTile`。在回放态我们传一个 no-op 即可。
- [CompanyInfo](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/CompanyInfo/index.tsx) / [PlayerAssets](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/PlayerAssets/index.tsx)：接收 `WsRoomSyncData` + `userID`。
- 现有数据类型：[AcquireRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/AcquireRoom.d.ts) 中的 `WsRoomSyncData / RoomData / PlayerData`，与后端 `Snapshot` 文档结构一致（`companyInfo / currentPlayer / gameStatus / tiles / players + playersData + result`）。

### 关键差异（回放数据 vs 对局数据）
| 字段 | 实时 `WsRoomSyncData` | `Snapshot` |
| --- | --- | --- |
| `playerId`（当前观看者自己） | 有 | 无（回放时取登录用户） |
| `playerData`（**当前**用户手牌/钱/股） | 有 | 没有，`playersData[playerID]` 是 **所有玩家** 的视角 |
| `tempData` | 有 | 无（回放时无合并临时态弹窗，传空对象即可） |
| `result` | 仅终局存在 | 每一步都有（中途也是估值） |

适配策略：写一个 `snapshotToWsRoomSyncData(snapshot, viewerID)` 工具，从 `playersData[viewerID]` 取手牌/钱/股，构造一个仅用于展示的 `WsRoomSyncData`，喂给现有展示组件。

## Proposed Changes

### 1. 类型：`src/types/history.d.ts`（新建）

按用户文档"公共 TypeScript 类型"一节落地，**字段命名完全 camelCase 与后端 json tag 对齐**。涉及：`GameID / GameStatus / CmdType / PlayerResult / PlayerResultMap / GamePlayer / Game / EventMeta / Snapshot / CompanyState / Tile / PlayerStateLike / GameStateLike / Stats`。

> 备注：后端 `Snapshot.roomData.tiles[id].belong` 可能是 `""` / `"Blank"` / 公司名，与现有 `TileData.belong: CompanyKey` 兼容（前端把空串当 Blank 处理过）。

### 2. API 调用：`src/api/history.ts`（新建）

复用 [apiClient.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/api/apiClient.ts)（已支持 `withCredentials` + `Result<T>` 解包），4 个函数：

```ts
listMyGames(params?: { limit?: number; offset?: number }): Promise<{ games: Game[] }>
getGameDetail(id: GameID): Promise<{ game: Game; players: GamePlayer[]; events: EventMeta[] }>
getSnapshot(id: GameID, seq: number): Promise<Snapshot>
getMyStats(): Promise<Stats>
```

URL 一律使用 `/history/...` 相对路径，与现有 `room`/`auth` 一致走 vite proxy。

### 3. Vite 代理：`vite.config.ts`（修改）

在 `server.proxy` 里**追加 `/history` 转发到 `http://localhost:8000`**，与现有 `/room` 共用一份 Cookie header（开发态）。生产环境本就同源，不影响。

### 4. 请求 hooks（新建，单文件汇总即可）

新建 `src/hooks/request/useHistory.ts`，导出三个 hook，沿用 `ahooks` 的 `useRequest` 风格（与 `useProfile` 一致）：

* `useMyGames(params)` —— 列表，懒触发（`manual: true`），暴露 `runListMyGames / games / loading`。
* `useMyStats()` —— 统计，同上。
* `useGameDetail()` / `useSnapshot()` —— 由回放弹窗 **按需** 调用（`useRequest({ manual: true })`）。

> 也可以直接在组件里用 `useRequest`，不强求拆 hook；为保持目录一致性，统一汇总到 `useHistory.ts`。

### 5. UI 入口：`Header` 新增"个人主页"菜单项

修改 [Header/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/Header/index.tsx)：

* 在已有 `Dropdown` 的 `menu.items` 数组**最前面**插入 `key: 'history'`、`icon: <HistoryOutlined />`、`label: '个人主页'`。
* `Header` 维护一个 `historyVisible` state，点击该菜单项 → `setHistoryVisible(true)`。
* 渲染 `<ProfileModal visible={historyVisible} onClose={...} />` 在 `Header` 同级。

### 6. 个人主页弹窗：`ProfileModal`（新建）

路径：`src/view/GameBoard/components/ProfileModal/index.tsx` + `index.module.less`。

* 复用 [components/Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx)（动画 + 遮罩 + 居中容器）。
* 弹窗打开时 **并行** 调 `getMyStats()` 和 `listMyGames({ limit: 20, offset: 0 })`。
* 顶部统计区：总场次 `totalGames` / 胜场 `wins` / 胜率 `(winRate * 100).toFixed(1) + '%'` / 平均得分 `avgScore`。
* 列表区：每一行展示 `roomID / 开始时间（startedAt 格式化）/ 时长（durationSeconds）/ 胜利者（winnerPlayerID 经 backendName2FrontendName 处理）/ 我的最终得分 / 是否获胜`。
* 行点击 → 调用父组件传入的 `onReplay(gameId)` 打开 `ReplayModal`。
* 加载/空态/错误态分支用 [LoadingBlock](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/LoadingBlock/index.tsx) 做骨架。

### 7. 回放弹窗：`ReplayModal`（新建）

路径：`src/view/GameBoard/components/ReplayModal/index.tsx` + `index.module.less`。

数据流：
1. 打开时 `getGameDetail(id)` → 拿 `game / players / events`，存到本地 state。
2. 维护 `step: number` 状态（默认 `-1`，即初始状态）。
3. `step` 变化 → `getSnapshot(id, step)` → 存 `snapshot`。
4. 把 `snapshot` 经 `snapshotToWsRoomSyncData(snapshot, viewerID)` 适配后，传给现有展示组件。

UI 区域：
- **顶部**：游戏 ID / 开始时间 / 玩家列表（高亮胜者）。
- **中部 / 棋盘区**：复用 `<Board tilesData={...} wsRoomSyncData={fakeRoomData} placeTile={noop} setHoveredTile={noop} />`（必要时给 Board 加个 `readonly?: boolean`，但更稳的做法是构造的 `fakeRoomData.gameStatus !== SET_Tile`，则 `shouldBlink` 自然为 false，不会触发任何点击逻辑）。
- **右侧**：复用 `<CompanyInfo>` 与 `<PlayerAssets>`（仅展示），`setBuyStockModalVisible / setMergeCompanyModalVisible / setHoveredTile / placeTile / sendMessage` 一律传 noop。
- **底部时间轴**：横向滚动，每个 dot 显示 `seq + 1`，鼠标 hover 显示 `playerID + cmdType`，当前 step 高亮。
   - 提供「初始」「上一步」「下一步」「跳到终局」按钮。
   - 跳到终局：`setStep(events.length - 1)`。

适配函数 `snapshotToWsRoomSyncData(snap, viewerID, ownerID?)`：
```ts
{
  playerId: viewerID,
  ownerID: ownerID ?? '',
  playerData: snap.playersData[viewerID] ?? { money: 0, stocks: {}, tiles: [] },
  roomData: {
    companyInfo: snap.roomData.companyInfo,
    currentPlayer: snap.roomData.currentPlayer,
    currentStep: '',
    gameStatus: snap.roomData.gameStatus,
    tiles: snap.roomData.tiles,
    players: snap.roomData.players,
  },
  tempData: { last_tile_key: '', mergeSettleData: {}, merge_main_company_temp: '', merge_selection_temp: { mainCompany: [], otherCompany: [] } } as any,
  type: 'ROOM_SYNC',
  result: snap.result,
}
```

> `viewerID` 取当前登录用户 `profile2BackendName(userProfile)`；如果该用户不在这局里（看别人的局，本期暂不做），就退化展示空手牌——本期产品诉求只看自己的对局，所以一定能命中。

性能：每次切 step 都会重发 HTTP，与后端文档建议一致；本期**不做** LRU 缓存（后续可加 `useMemo + Map<\`id:seq\`, Snapshot>`）。

### 8. 路由

不需要新增路由。所有交互都以**弹窗**形式覆盖在 `GameBoard` 列表页上（与产品需求"游戏列表页 hover 加个人主页"语义一致），保留页面顶层路由结构不变。

## Assumptions & Decisions

1. **入口位置**：放进 `Header` 的 hover Dropdown，作为新菜单项，而不是单独写一个外层 hover 触发器——避免与现有 antd Dropdown 重复实现 hover 状态机。文案为「个人主页」。
2. **弹窗 vs 路由**：用弹窗实现回放，避免新增路由 / 切换页面打断用户。回放弹窗在个人主页弹窗之上叠加（z-index 比父弹窗高一层）。
3. **复用组件**：通过 `Snapshot → WsRoomSyncData` 适配复用 Board/CompanyInfo/PlayerAssets，不新写一份只读棋盘。仅 2D 版（不接入 3D `Board3D`），降低首次落地复杂度。
4. **step 默认值**：`-1` 表示初始空棋盘（与后端文档一致），UI 显示为 `0 / N`，每点击一个 dot 显示 `(seq+1) / N`。
5. **vite proxy**：`/history` 必须通过本地代理转到 `:8000`，否则同源 cookie 不生效；生产同源不需要改。
6. **不做的事**：本期不实现「看其他玩家对局」「列表分页（先固定 20）」「LRU 缓存」「DaVinci 历史」。Acquire 优先。

## Verification

1. `pnpm dev` 启动后，登录态下打开 `/game/acquire`，hover 右上角头像出现"个人主页 / Profile / 退出登录"三个菜单项。
2. 点击"个人主页" → 弹窗弹出，看到总场次 / 胜率 / 平均得分；下方列表渲染最近 20 局，含开始时间 / 是否胜利等。
3. 点击列表中某一局 → 回放弹窗出现，时间轴有 N 个 dot；初始状态棋盘为空。
4. 点击「下一步」/「上一步」/「跳到终局」/某个 dot，棋盘 / 公司栏 / 玩家手牌正确更新；跳到终局时与后端 `finalResult` 一致。
5. Network 面板检查：`/history/games`、`/history/stats`、`/history/game/:id`、`/history/game/:id/snapshot?seq=N` 四个请求 200，`Cookie: access_token=...` 已发送。
6. 401 场景下 `apiClient` 的拦截器正常触发 `refreshToken`，与现有 `room` 接口表现一致。

## 变更文件清单

新建：
- `src/types/history.d.ts`
- `src/api/history.ts`
- `src/hooks/request/useHistory.ts`
- `src/view/GameBoard/components/ProfileModal/index.tsx` + `index.module.less`
- `src/view/GameBoard/components/ReplayModal/index.tsx` + `index.module.less`
- `src/view/GameBoard/components/ReplayModal/snapshotAdapter.ts`（`snapshotToWsRoomSyncData`）

修改：
- `src/view/GameBoard/components/Header/index.tsx`：菜单项 + 弹窗 state
- `src/view/GameBoard/index.tsx`：（可选）把 ProfileModal 提到这里以便 Replay 共享 state；如果完全在 Header 内闭环则不动
- `vite.config.ts`：补 `/history` proxy
