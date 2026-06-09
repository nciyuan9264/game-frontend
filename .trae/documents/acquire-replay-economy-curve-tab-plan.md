# Acquire 回放：批量快照 + 新增「经济曲线」Tab

## Summary

利用新增的批量接口 `GET /api/acquire/history/game/:id/snapshots`（一次返回全部回合/步的快照，`Snapshot` 结构与单步接口一致），改造 Acquire 回放：

1. 回放页改为**一次性拉取全部快照**并缓存到本地，步进切换直接读本地数组，不再每步请求 `/snapshot`。
2. 在时间轴组件（`ReplayTimeline`）内新增 Tab：

   * **「时间轴」**：保留现有步进 + dot 轨道功能。

   * **「经济曲线」**：用全部快照里每回合的 `result[player].total` 画多折线图（横轴=回合，纵轴=经济），数据直接从本地快照取，无需额外请求。

图表用**原生 SVG 手写折线图**（无新依赖），经济曲线横坐标按**回合**（`game_place_tile`）采样。

## Current State Analysis

### 回放数据链路（现状）

* [Replay/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/Replay/index.tsx)：

  * `useGameDetail` → `detail.events`（`EventMeta[]`）、`detail.players`（`GamePlayer[]`）。

  * `useSnapshot` → 每次 `step` 变化调 `getSnapshot(gameId, step, 'acquire')` 拉**单步**快照（[#L43-L47](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/Replay/index.tsx#L43-L47)）。← 本次将替换为批量本地查表。

  * `snapshotToWsRoomSyncData(snapshot, viewerID)` 适配为棋盘渲染数据。

* 单步 API：[getSnapshot](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/api/history.ts#L36-L45)。

* 经济数据：`Snapshot.result`（`Record<string,{money;stocks;total}>`，[history.d.ts#L84-L102](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/history.d.ts#L84-L102)），口径与 [ScoreModal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/Replay/components/ScoreModal/index.tsx) 一致。

### 约束

* **无图表库**（[package.json](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/package.json)），→ 手写 SVG。

* 新接口一次性返回全部快照，按 `seq` 排序，含初始态（`seq = -1`），每个元素 `Snapshot` 结构与单步一致。

## Proposed Changes

### 1. API：新增 `getSnapshots`

文件：[src/api/history.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/api/history.ts)

* 新增：

  ```ts
  export const getSnapshots = async (
    id: GameID,
    gameType: HistoryGameType = 'acquire'
  ): Promise<Snapshot[]> => {
    return APIClient.get({ url: `/api/${gameType}/history/game/${id}/snapshots` });
  };
  ```

* 返回类型按用户确认：`Snapshot[]`（与单步同形，按 seq 升序，含 `seq = -1` 初始态）。若后端实际为包裹对象 `{ snapshots: Snapshot[] }`，在 hook 里做一次兼容解包（`Array.isArray(res) ? res : res.snapshots`）。

* 保留原 `getSnapshot`（暂不删，避免影响其它潜在调用；本页不再使用）。

### 2. Hook：新增 `useSnapshots`（替换 `useSnapshot`）

文件：[src/hooks/request/useHistory.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/request/useHistory.ts)

* 新增 `useSnapshots()`：`useRequest(async (id, gameType='acquire') => getSnapshots(id, gameType), { manual: true, onError: message.error('获取快照失败') })`，返回 `{ snapshots, runGetSnapshots, snapshotsLoading }`。

* `useSnapshot` 保留（不动）。

### 3. 回放页改为本地查表

文件：[Replay/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/Replay/index.tsx)

* 用 `useSnapshots` 替换 `useSnapshot`：`gameId` 变化时一次性 `runGetSnapshots(gameId, 'acquire')`，并 `setStep(-1)`。

* 构建查表：`const snapshotMap = useMemo(() => new Map(snapshots.map(s => [s.seq, s])), [snapshots])`。

* 当前快照：`const snapshot = snapshotMap.get(step)`（step=-1 命中初始态）。其余 `fakeRoomData = snapshotToWsRoomSyncData(snapshot, viewerID)` 逻辑不变。

* 去掉随 `step` 触发请求的 `useEffect`；棋盘切步纯本地、瞬时。

* loading：用 `snapshotsLoading` 控制首屏「加载快照…」；切步不再有 loading。

* 给 `<ReplayTimeline>` 新增 props：`snapshots={snapshots}`、`players={detail?.players}`（供经济曲线使用）。`loading` 传 `snapshotsLoading`。

* `ScoreModal` 的 `result` 改用 `snapshot?.result`（即 `snapshotMap.get(step)?.result`）。

### 4. 新增图表组件 `EconomyChart`

文件（新建）：`src/view/Acquire/Replay/components/EconomyChart/index.tsx` + `index.module.less`

* props：`{ snapshots: Snapshot[]; players?: GamePlayer[] }`。

* 计算序列（组件内 `useMemo`，纯本地、无请求）：

  * 回合采样点：遍历 `snapshots`，取 `currentEvent?.cmdType === 'game_place_tile'` 的快照作为各回合（含起点 `seq=-1` 作回合 0，可选）。若该字段不可靠，则退化为「按 seq 顺序全量点」。

  * 玩家集合/配色顺序：优先 `players.map(p => p.playerID)`，回退用首个快照 `result` 的键。

  * `series: { playerID; color; points: {turn:number; total:number}[] }[]`，`total = snap.result[playerID]?.total ?? 0`。

* 渲染原生 `<svg>`：

  * x 轴=回合序号，y 轴=0\~max(total)\*1.1；网格线 + y 轴 4\~5 档金额刻度 + x 轴回合刻度（过密则抽稀）。

  * 每位玩家一条 `<polyline>` + 数据点小圆；固定调色板 `['#4f8cff','#ff7a45','#52c41a','#faad14','#eb2f96','#13c2c2']`。

  * 图例：颜色块 + `backendName2FrontendName(playerID)`。

  * hover：基于鼠标 x 找最近回合，画竖向参考线 + tooltip 列出各玩家该回合 total（覆盖层 div 定位）。先保证基础可用，tooltip 从简。

  * 空数据兜底文案；宽度自适应容器（`viewBox` + 100% 宽）。

* 样式沿用时间轴暗色风（参考 [ReplayTimeline/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/Replay/components/ReplayTimeline/index.module.less) 背景/文字色）。

### 5. `ReplayTimeline` 增加 Tab

文件：[ReplayTimeline/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/Replay/components/ReplayTimeline/index.tsx) + [index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/Replay/components/ReplayTimeline/index.module.less)

* 新增 props：`snapshots: Snapshot[]`、`players?: GamePlayer[]`。

* 新增状态 `const [tab, setTab] = useState<'timeline' | 'economy'>('timeline')`。

* 在 `body`（非最小化）顶部插入一行 Tab 切换（暗色胶囊/下划线）。

* `tab === 'timeline'`：渲染现有 statusRow / controls / track（**原逻辑不动**）。

* `tab === 'economy'`：渲染 `<EconomyChart snapshots={snapshots} players={players} />`（纯本地数据，立即出图，无 loading 请求）。

* economy 态给 body 设更大高度（新增 less class，如 `min-height: 240px`）。

* 最小化态（`minimizedBody`）不显示 Tab，仅步进控制（不变）。

## Assumptions & Decisions

* 用户确认：新接口 `/snapshots` 返回的每个快照 `Snapshot` 结构与原单步一致。

* **替换单步拉取**：回放棋盘渲染与经济曲线都从本地全量快照取，切步不再发请求（符合用户「不需要每次切换回合调用接口」诉求）。

* 图表 = 手写 SVG 折线图，零新依赖；经济曲线横轴按**回合**（`game_place_tile`）采样（推荐项）。

* 经济值取 `result[player].total`，与 ScoreModal 口径一致。

* 接口返回若为包裹对象则在 hook 兼容解包；返回数组则直接用。

* 不改后端；保留旧 `getSnapshot`/`useSnapshot` 不删除。

## Verification

1. `npx tsc --noEmit -p tsconfig.json` 通过（EXIT=0）。
2. dev server 进入 Acquire 回放（`/game/acquire/replay/:gameId`）：

   * 进页只发**一次** `/snapshots` 请求（Network 确认），步进切换瞬时、无新请求。

   * 棋盘/公司/玩家资产随步进正确变化，终局与 ScoreModal 一致。

   * 时间轴顶部出现「时间轴 / 经济曲线」Tab，默认时间轴，原功能正常。

   * 切「经济曲线」：立即出图（无 loading 请求），每玩家一条线，横轴回合、纵轴经济，图例/hover 正确；终局值与 ScoreModal total 一致。

   * 最小化态仅步进控制，无异常。

