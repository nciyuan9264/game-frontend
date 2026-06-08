# 达芬奇复用 Acquire 历史战绩展示方案

## Summary

后端历史接口方案位于 [history\_api\_frontend\_usage.md](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/.trae/documents/history_api_frontend_usage.md)。新的接口约定是 Acquire 和 Davinci 复用同一套 `/history` 接口，通过 `game_type` query 参数区分游戏。

本次前端目标：

1. 复用现有 Acquire 的“个人主页 / 历史战绩”弹窗展示能力。
2. 在 `/game/davinci` 游戏大厅点击右上角用户菜单中的“个人主页”时，展示达芬奇历史战绩。
3. Acquire 仍保留原来的历史战绩 + 回放能力。
4. Davinci 不展示回放入口、不跳转回放页，因为后端文档明确“达芬奇不记录步骤，不支持 snapshot”。
5. 前端请求历史接口时始终显式传 `game_type`，避免依赖不同服务默认值。

## Current State Analysis

### 后端接口方案

后端文档说明：

* 历史接口统一使用 `/history` 前缀。

* `GET /history/games?game_type=davinci&limit=20&offset=0` 查询当前用户历史列表。

* `GET /history/stats?game_type=davinci` 查询胜率统计。

* `GET /history/game/:id?game_type=davinci` 查询单局详情。

* `GET /history/game/:id/snapshot?game_type=acquire&seq=N` 仅支持 Acquire。

* 建议前端始终显式传 `game_type`。

关键差异：

* Acquire：有列表、统计、详情、snapshot 回放。

* Davinci：有列表、统计、详情，但无 snapshot 回放；列表和详情中的 `events` 通常为空。

### 当前 API 封装

文件：[history.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/api/history.ts)

当前实现：

```ts
export interface ListGamesParams {
  limit?: number;
  offset?: number;
}

listMyGames(params) -> GET /history/games params: { limit, offset }
getGameDetail(id) -> GET /history/game/:id
getSnapshot(id, seq) -> GET /history/game/:id/snapshot params: { seq }
getMyStats() -> GET /history/stats
```

问题：

* 没有 `game_type` 参数。

* `getSnapshot` 也没有显式 `game_type=acquire`。

* 如果前端在 Davinci 服务或多游戏统一服务下调用，可能拿错默认游戏数据。

### 当前 Hooks

文件：[useHistory.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/request/useHistory.ts)

当前实现：

* `useMyGames()` 返回 `runListMyGames(params)`。

* `useMyStats()` 返回 `runGetMyStats()`。

* `useGameDetail()` 返回 `runGetGameDetail(id)`。

* `useSnapshot()` 返回 `runGetSnapshot(id, seq)`。

问题：

* Hook 层没有 gameType 入参或默认绑定。

* `ProfileModal` 无法告诉 hook 当前是 Acquire 还是 Davinci。

### 当前类型

文件：[history.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/history.d.ts)

当前实现：

* `Game.gameType` 写死为 `'acquire'`。

* `HistoryGameStatus` 是 Acquire 状态枚举。

* `CmdType` 也是 Acquire 命令白名单。

* `PlayerResult` 偏 Acquire 资产字段。

问题：

* 不符合后端文档中 `gameType: 'acquire' | 'davinci'`。

* Davinci 历史返回中 `finalScore`、`finalMoney` 可能为空或不存在，`finalStocks` 通常为 `0`，当前字段部分不够宽松。

* Davinci 详情 `events: []` 可兼容，但 `CmdType` 应放宽，避免未来后端返回 Davinci 事件类型时类型不兼容。

### 当前 UI 入口

文件：[Header/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/Header/index.tsx)

现状：

* `Header` 已接收 `gameType`。

* 根据 `gameType` 展示大厅标题：`达芬奇密码 游戏大厅` 或 `Acquire 游戏大厅`。

* 用户菜单中有“个人主页”入口。

* 但渲染 `ProfileModal` 时只传了 `visible / onClose / userID`，没有传 `gameType`。

这意味着：

* 在 `/game/davinci` 打开个人主页时，`ProfileModal` 不知道当前游戏类型。

* 只能按现有默认接口加载，也就是更偏 Acquire。

### 当前 ProfileModal

文件：[ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)

现状：

* 打开时调用：

  * `runListMyGames({ limit: 20, offset: 0 })`

  * `runGetMyStats()`

* 统计栏展示：总场次、胜场、胜率、平均得分。

* 列表行展示：对局、房间、开始时间、时长、胜者、我的得分、胜/负 tag。

* 点击任意行固定执行：

```ts
navigate(`/game/acquire/replay/${gameId}`)
```

问题：

* 行点击固定跳 Acquire 回放，不适合 Davinci。

* Davinci 没有平均得分，应展示更通用的“平均得分”或对 Davinci 隐藏/显示为 `-`，避免出现 `$0` 误导。

* Davinci 没有回放，列表行不应是可点击回放入口。

* 当前“我的得分”展示 `$${finalScore}`，Davinci 通常没有分数，应改成按游戏类型展示：

  * Acquire：`我的得分`

  * Davinci：`结果` 或直接只保留胜/负 tag，不展示得分列。

### 当前路由和回放

文件：[routes.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/route/routes.tsx)

现状：

* 只有 `/game/acquire/replay/:gameId`。

* 没有 `/game/davinci/replay/:gameId`。

这符合后端方案：Davinci 不支持回放，本次不新增 Davinci replay 路由。

## Proposed Changes

### 1. 更新历史类型，支持多游戏

文件：[history.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/history.d.ts)

What:

* 新增或复用游戏类型：

```ts
export type HistoryGameType = 'acquire' | 'davinci';
```

* 修改 `Game.gameType`：

```ts
gameType: HistoryGameType;
```

* 放宽 `GamePlayer` 字段：

```ts
userID?: number | null;
finalScore?: number | null;
finalMoney?: number | null;
finalStocks: number;
```

* 修改 `finalResult`：

```ts
finalResult?: PlayerResultMap | unknown | null;
```

* `CmdType` 可保留 Acquire 白名单，但建议放宽为：

```ts
export type CmdType = string;
```

* `HistoryGameStatus` 可保留现有 acquire 状态并追加 davinci 状态，或同样放宽为 `string`。本次历史列表/详情不依赖状态枚举，建议：

```ts
export type HistoryGameStatus = string;
```

Why:

* 与后端文档中 `gameType: acquire | davinci` 对齐。

* Davinci 没有分数和资产，字段需要允许 `null / undefined`。

* 避免类型层阻塞 Davinci 历史数据接入。

### 2. API 层显式传 game\_type

文件：[history.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/api/history.ts)

What:

* `ListGamesParams` 增加 `gameType?: HistoryGameType` 或直接使用后端 query 名 `game_type?: HistoryGameType`。

* 为了前端调用语义统一，推荐前端内部使用 `gameType`，API 内转换成后端 `game_type`。

建议类型：

```ts
export interface ListGamesParams {
  gameType?: HistoryGameType;
  limit?: number;
  offset?: number;
}
```

请求转换：

```ts
const toHistoryParams = (params: { gameType?: HistoryGameType; limit?: number; offset?: number }) => ({
  game_type: params.gameType,
  limit: params.limit,
  offset: params.offset,
});
```

修改函数：

```ts
listMyGames({ gameType = 'acquire', limit = 20, offset = 0 })
getGameDetail(id, gameType = 'acquire')
getMyStats(gameType = 'acquire')
getSnapshot(id, seq, gameType = 'acquire')
```

其中 `getSnapshot` 固定传 `game_type=acquire`，不对 Davinci 暴露调用入口。

Why:

* 符合后端建议“前端始终显式传 `game_type`”。

* 兼容现有 Acquire 调用默认行为。

* 为 Davinci 个人主页提供数据隔离。

### 3. Hook 层支持 gameType 参数

文件：[useHistory.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/request/useHistory.ts)

What:

* `useMyGames` 保持 run 参数可传，但 `ListGamesParams` 支持 `gameType`。

* `useMyStats` 的 `runGetMyStats` 改为接收 `gameType`：

```ts
async (gameType: HistoryGameType = 'acquire') => getMyStats(gameType)
```

* `useGameDetail` 的 `runGetGameDetail` 改为接收 `(id, gameType = 'acquire')`。

* `useSnapshot` 保持 `(id, seq)` 或改成 `(id, seq, gameType = 'acquire')`，但 Acquire 回放调用时显式传 `acquire`。

Why:

* `ProfileModal` 可以按当前大厅 gameType 拉取列表和统计。

* Acquire replay 保持稳定，不会因为当前路由解析异常拿错游戏类型。

### 4. Header 将当前 gameType 传给 ProfileModal

文件：[Header/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/Header/index.tsx)

What:

```tsx
<ProfileModal
  visible={profileVisible}
  onClose={() => setProfileVisible(false)}
  userID={viewerID}
  gameType={gameType}
/>
```

Why:

* `Header` 已经有当前 `gameType`，这是最准确的数据源。

* 不需要 `ProfileModal` 再自己从路由解析，避免 `/game/acquire/replay/:gameId` 这类路径被 `useGameType` 误判。

### 5. ProfileModal 按 gameType 加载和展示

文件：[ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)

What:

* Props 增加：

```ts
gameType: Extract<GameType, 'acquire' | 'davinci'>;
```

* 打开时按游戏类型请求：

```ts
runListMyGames({ gameType, limit: 20, offset: 0 });
runGetMyStats(gameType);
```

* 标题可展示当前游戏：

```ts
const gameName = gameType === 'davinci' ? '达芬奇密码' : 'Acquire';
headerTitle: `${gameName} 个人主页`
```

* 列表标题：

```ts
`${gameName} 历史对局（最近 20 局）`
```

* 统计栏第四项：

  * Acquire：`平均得分`，值为 `$${avgScore}`。

  * Davinci：可展示 `平均得分` 为 `-`，或改成 `游戏类型` / `无分数`。

推荐：

* 为减少样式变化，第四项 label 保持 `平均得分`。

* Davinci 值展示 `-`，不展示 `$0`。

* 行展示：

  * Acquire 保持“我的得分”列。

  * Davinci 将该列 label 改为 `结果`，value 用 `胜利` / `失败` 或 `-`，同时保留右侧胜/负 tag。

更简洁方案：

* 保留当前 7 列结构，Davinci 第 6 列 label 为 `结果`，value 为 `isWin ? '胜利' : '失败'`。

* 第 7 列仍展示 tag，用于视觉强调。

* 行点击：

```ts
if (gameType !== 'acquire') return;
navigate(`/game/acquire/replay/${gameId}`);
```

* Davinci 行不跳转，样式不应表现为可点击回放。

Why:

* 复用现有弹窗和列表布局，改动最小。

* Davinci 无回放，不应误导用户点击。

* 达芬奇没有分数，避免 `$0` 误导。

### 6. ProfileModal 样式区分可点击和不可点击

文件：[ProfileModal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.module.less)

What:

* 当前 `.row` 默认 `cursor: pointer` 且 hover 蓝边。

* 新增：

```less
.rowClickable { cursor: pointer; }
.rowStatic { cursor: default; }
.rowClickable:hover { ...原 hover... }
.rowStatic:hover { transform: none; box-shadow: none; border-color: #eee; }
```

* 组件中：

```tsx
className={`${styles.row} ${gameType === 'acquire' ? styles.rowClickable : styles.rowStatic}`}
```

Why:

* Acquire 行表示可进入回放。

* Davinci 行只是历史战绩，不应表现为可点击。

### 7. Acquire Replay 调用显式传 acquire

文件：[Acquire/Replay/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/Replay/index.tsx)

What:

* `runGetGameDetail(gameId)` 改为 `runGetGameDetail(gameId, 'acquire')`。

* `runGetSnapshot(gameId, step)` 改为 `runGetSnapshot(gameId, step, 'acquire')`，如果 hook 支持该参数。

Why:

* 避免未来 hook 默认值变化影响 Acquire replay。

* 与后端文档“snapshot 只支持 Acquire”一致。

### 8. 不新增 Davinci 回放路由

文件：[routes.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/route/routes.tsx)

What:

* 不新增 `/game/davinci/replay/:gameId`。

* 不改现有 `/game/acquire/replay/:gameId`。

Why:

* 后端明确 Davinci 不记录步骤，不支持 snapshot。

* 本次产品目标是“复用历史战绩显示”，不是做回放。

## Assumptions & Decisions

* `game_type` 使用后端 query 字段名，前端 API 封装内部把 `gameType` 转换为 `game_type`。

* `ProfileModal` 是多游戏复用组件，不拆出 Davinci 专用弹窗。

* Davinci 不提供行点击回放；点击行无动作。

* Davinci 的 `avgScore` 通常为 `0`，前端展示 `-` 避免误解为分数。

* Davinci 历史列表中胜负优先用 `players[].isWinner` 判断当前用户结果。

* 若当前用户不在 `players` 中，胜负 tag 按 `负` 显示可能误导；本次后端保证 `games` 只返回当前登录用户参与过的完成对局，因此可以依赖 `players.find(playerID === userID)`。

* `Header` 传入的 `gameType` 包含 `splendor`，但当前历史后端只支持 `acquire | davinci`；ProfileModal props 可限制为 `acquire | davinci`，或 Header 在 splendor 时不展示个人主页。本项目 Splendor 路由已注释，本次不处理 Splendor。

* 不改后端接口、不新增 Davinci replay 页面。

## Verification Steps

1. 类型检查：

```bash
npx tsc --noEmit
```

1. Acquire 个人主页：

* 打开 `/game/acquire`。

* 右上角头像菜单点击“个人主页”。

* Network 应请求：

  * `/history/games?game_type=acquire&limit=20&offset=0`

  * `/history/stats?game_type=acquire`

* 弹窗展示总场次、胜场、胜率、平均得分。

* 点击历史行进入 `/game/acquire/replay/:gameId`。

1. Acquire 回放：

* 打开回放页。

* Network 应请求：

  * `/history/game/:id?game_type=acquire`

  * `/history/game/:id/snapshot?game_type=acquire&seq=N`

* 时间轴和快照仍正常工作。

1. Davinci 个人主页：

* 打开 `/game/davinci`。

* 右上角头像菜单点击“个人主页”。

* Network 应请求：

  * `/history/games?game_type=davinci&limit=20&offset=0`

  * `/history/stats?game_type=davinci`

* 弹窗展示达芬奇历史对局。

* 第四个统计项不显示 `$0`，应显示 `-`。

* 历史行不跳转、不显示可点击 hover 回放效果。

1. 空态：

* 如果某游戏无历史，显示“暂无历史对局”。

1. 错误态：

* 如果后端返回 `invalid game_type`、`history disabled` 或 401，现有 `useHistory` 的 `message.error` 能正常提示。

