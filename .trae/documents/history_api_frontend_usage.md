# 历史接口前端使用文档

## 接口总览

历史接口统一使用 `/history` 前缀。Acquire 和 Davinci 复用同一套接口，通过 `game_type` 参数区分游戏。

| 接口 | 方法 | 用途 | 支持游戏 |
|---|---|---|---|
| `/history/games` | `GET` | 查询当前用户历史对局列表 | `acquire`、`davinci` |
| `/history/game/:id` | `GET` | 查询单局历史详情 | `acquire`、`davinci` |
| `/history/stats` | `GET` | 查询当前用户胜率统计 | `acquire`、`davinci` |
| `/history/game/:id/snapshot` | `GET` | 查询 Acquire 回放快照 | 仅 `acquire` |

## 鉴权说明

历史接口需要登录态。后端通过 auth middleware 从 Cookie/JWT 中解析当前用户。

前端不需要传 `user_id`，后端会自动使用当前登录用户。

未登录或登录态无效时返回：

```json
{
  "error": "unauthorized"
}
```

## game_type 参数

`game_type` 用于区分不同游戏。

| 值 | 说明 |
|---|---|
| `acquire` | Acquire 酒店大亨 |
| `davinci` | 达芬奇密码 |

默认值：

| 服务 | 不传 `game_type` 时默认 |
|---|---|
| Acquire 服务 | `acquire` |
| Davinci 服务 | `davinci` |

建议前端始终显式传 `game_type`，避免不同服务默认值造成误解。

非法 `game_type` 返回：

```json
{
  "error": "invalid game_type"
}
```

## 1. 查询历史对局列表

```http
GET /history/games?game_type=davinci&limit=20&offset=0
```

### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---:|---|---|
| `game_type` | string | 否 | 当前服务默认值 | `acquire` 或 `davinci` |
| `limit` | number | 否 | `20` | 返回数量 |
| `offset` | number | 否 | `0` | 分页偏移量 |

### 响应示例

```json
{
  "status_code": 200,
  "message": "ok",
  "data": {
    "games": [
      {
        "id": 12,
        "roomID": "0604_153000",
        "gameType": "davinci",
        "startedAt": "2026-06-04T15:30:00Z",
        "endedAt": "2026-06-04T15:42:10Z",
        "durationSeconds": 730,
        "winnerUserID": 123,
        "winnerPlayerID": "wzy-123",
        "maxPlayers": 2,
        "initialState": null,
        "finalResult": null,
        "createdAt": "2026-06-04T15:42:10Z",
        "updatedAt": "2026-06-04T15:42:10Z",
        "players": [
          {
            "id": 101,
            "gameID": 12,
            "userID": 123,
            "playerID": "wzy-123",
            "seatIndex": 0,
            "isAI": false,
            "finalStocks": 0,
            "isWinner": true,
            "createdAt": "2026-06-04T15:42:10Z"
          },
          {
            "id": 102,
            "gameID": 12,
            "userID": 456,
            "playerID": "tom-456",
            "seatIndex": 1,
            "isAI": false,
            "finalStocks": 0,
            "isWinner": false,
            "createdAt": "2026-06-04T15:42:10Z"
          }
        ]
      }
    ]
  }
}
```

### 前端说明

- `games` 只返回当前登录用户参与过的完成对局。
- `winnerPlayerID` 是赢家玩家 ID。
- `players[].isWinner` 可直接用于展示“胜/负”。
- 达芬奇不记录分数，`finalScore`、`finalMoney` 可能不存在或为 `null`。
- 达芬奇不记录步骤，列表里的 `events` 通常不存在。

## 2. 查询单局详情

```http
GET /history/game/:id?game_type=davinci
```

示例：

```http
GET /history/game/12?game_type=davinci
```

### Path 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | number | 是 | 对局 ID |

### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---:|---|---|
| `game_type` | string | 否 | 当前服务默认值 | `acquire` 或 `davinci` |

### 响应示例

```json
{
  "status_code": 200,
  "message": "ok",
  "data": {
    "game": {
      "id": 12,
      "roomID": "0604_153000",
      "gameType": "davinci",
      "startedAt": "2026-06-04T15:30:00Z",
      "endedAt": "2026-06-04T15:42:10Z",
      "durationSeconds": 730,
      "winnerUserID": 123,
      "winnerPlayerID": "wzy-123",
      "maxPlayers": 2,
      "initialState": null,
      "finalResult": null,
      "createdAt": "2026-06-04T15:42:10Z",
      "updatedAt": "2026-06-04T15:42:10Z"
    },
    "players": [
      {
        "id": 101,
        "gameID": 12,
        "userID": 123,
        "playerID": "wzy-123",
        "seatIndex": 0,
        "isAI": false,
        "finalStocks": 0,
        "isWinner": true,
        "createdAt": "2026-06-04T15:42:10Z"
      },
      {
        "id": 102,
        "gameID": 12,
        "userID": 456,
        "playerID": "tom-456",
        "seatIndex": 1,
        "isAI": false,
        "finalStocks": 0,
        "isWinner": false,
        "createdAt": "2026-06-04T15:42:10Z"
      }
    ],
    "events": []
  }
}
```

### 前端说明

- 达芬奇详情中 `events` 是空数组，因为达芬奇不记录详细步骤。
- Acquire 详情中 `events` 是事件元信息，只包含 `seq`、`playerID`、`cmdType`，不包含 payload。
- 如果 `id` 不存在，返回 `404 {"error":"not found"}`。
- 如果 `game_type` 和该对局实际类型不匹配，也会返回 `404`。

## 3. 查询胜率统计

```http
GET /history/stats?game_type=davinci
```

### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---:|---|---|
| `game_type` | string | 否 | 当前服务默认值 | `acquire` 或 `davinci` |

### 响应示例

```json
{
  "status_code": 200,
  "message": "ok",
  "data": {
    "totalGames": 10,
    "wins": 6,
    "winRate": 0.6,
    "avgScore": 0
  }
}
```

### 前端说明

- `totalGames`：当前用户完成的该游戏对局数。
- `wins`：当前用户获胜局数。
- `winRate`：胜率，范围 `0 ~ 1`。
- `avgScore`：平均分，Acquire 有意义；Davinci 没有分数，通常为 `0`。

百分比展示示例：

```ts
const winRateText = `${Math.round(stats.winRate * 100)}%`
```

## 4. Acquire 快照接口

```http
GET /history/game/:id/snapshot?game_type=acquire&seq=10
```

该接口只支持 Acquire，用于回放。Davinci 不记录步骤，不支持 snapshot。

### Path 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | number | 是 | 对局 ID |

### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---:|---|---|
| `game_type` | string | 否 | `acquire` | 只支持 `acquire` |
| `seq` | number | 否 | `-1` | 回放到第几步，`-1` 表示初始状态 |

### 不支持 Davinci

如果请求：

```http
GET /history/game/12/snapshot?game_type=davinci
```

会返回：

```json
{
  "error": "snapshot is only supported for acquire"
}
```

## 字段说明

### Game

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | number | 对局 ID |
| `roomID` | string | 房间 ID |
| `gameType` | string | 游戏类型，`acquire` 或 `davinci` |
| `startedAt` | string | 开始时间，ISO 时间字符串 |
| `endedAt` | string \| null | 结束时间，完成对局才有 |
| `durationSeconds` | number | 对局耗时，单位秒 |
| `winnerUserID` | number \| null | 赢家用户 ID，AI 或无法解析时可能为空 |
| `winnerPlayerID` | string | 赢家玩家 ID |
| `maxPlayers` | number | 最大/实际参与玩家数 |
| `initialState` | any | Acquire 回放用；Davinci 为空 |
| `finalResult` | any | Acquire 终局结果；Davinci 为空 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |
| `players` | `HistoryGamePlayer[]` | 参与玩家列表，列表接口会带 |

### HistoryGamePlayer

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | number | 玩家历史记录 ID |
| `gameID` | number | 对局 ID |
| `userID` | number \| null | 用户 ID，AI 为空 |
| `playerID` | string | 游戏内玩家 ID |
| `seatIndex` | number | 座位顺序 |
| `isAI` | boolean | 是否 AI |
| `finalScore` | number \| null | 终局分数，Davinci 通常为空 |
| `finalMoney` | number \| null | 终局金钱，Davinci 通常为空 |
| `finalStocks` | number | 终局股票估值，Davinci 通常为 `0` |
| `isWinner` | boolean | 是否赢家 |
| `createdAt` | string | 创建时间 |

### Stats

| 字段 | 类型 | 说明 |
|---|---|---|
| `totalGames` | number | 完成对局数 |
| `wins` | number | 获胜局数 |
| `winRate` | number | 胜率，`wins / totalGames` |
| `avgScore` | number | 平均分，Davinci 通常为 `0` |

## 通用错误码

| 状态码 | 错误 | 场景 |
|---:|---|---|
| `400` | `invalid game_type` | `game_type` 不是 `acquire` 或 `davinci` |
| `400` | `invalid id` | 路径参数 `id` 不是数字 |
| `400` | `invalid seq` | snapshot 的 `seq` 不是数字 |
| `400` | `snapshot is only supported for acquire` | 非 Acquire 请求 snapshot |
| `401` | `unauthorized` | 未登录或登录态无效 |
| `404` | `not found` | 对局不存在，或 `game_type` 不匹配 |
| `503` | `history disabled` | 历史仓库未初始化，例如 Postgres 未启用 |
| `500` | 具体错误信息 | 服务端内部错误 |

## TypeScript 类型建议

```ts
export type GameType = 'acquire' | 'davinci'

export interface HistoryGamePlayer {
  id: number
  gameID: number
  userID?: number | null
  playerID: string
  seatIndex: number
  isAI: boolean
  finalScore?: number | null
  finalMoney?: number | null
  finalStocks: number
  isWinner: boolean
  createdAt: string
}

export interface HistoryGame {
  id: number
  roomID: string
  gameType: GameType
  startedAt: string
  endedAt?: string | null
  durationSeconds: number
  winnerUserID?: number | null
  winnerPlayerID?: string
  maxPlayers: number
  initialState?: unknown
  finalResult?: unknown
  createdAt: string
  updatedAt: string
  players?: HistoryGamePlayer[]
}

export interface HistoryEventMeta {
  seq: number
  playerID: string
  cmdType: string
}

export interface HistoryStats {
  totalGames: number
  wins: number
  winRate: number
  avgScore: number
}

export interface HistoryListResponse {
  status_code: number
  message: string
  data: {
    games: HistoryGame[]
  }
}

export interface HistoryDetailResponse {
  status_code: number
  message: string
  data: {
    game: HistoryGame
    players: HistoryGamePlayer[]
    events: HistoryEventMeta[]
  }
}

export interface HistoryStatsResponse {
  status_code: number
  message: string
  data: HistoryStats
}
```

## 请求封装示例

```ts
type GameType = 'acquire' | 'davinci'

export async function getHistoryGames(gameType: GameType, limit = 20, offset = 0) {
  return request('/history/games', {
    method: 'GET',
    params: {
      game_type: gameType,
      limit,
      offset,
    },
  })
}

export async function getHistoryGameDetail(gameType: GameType, id: number) {
  return request(`/history/game/${id}`, {
    method: 'GET',
    params: {
      game_type: gameType,
    },
  })
}

export async function getHistoryStats(gameType: GameType) {
  return request('/history/stats', {
    method: 'GET',
    params: {
      game_type: gameType,
    },
  })
}

export async function getAcquireSnapshot(id: number, seq = -1) {
  return request(`/history/game/${id}/snapshot`, {
    method: 'GET',
    params: {
      game_type: 'acquire',
      seq,
    },
  })
}
```

## 达芬奇页面接入建议

- 历史列表：调用 `GET /history/games?game_type=davinci`。
- 胜率卡片：调用 `GET /history/stats?game_type=davinci`。
- 对局详情：调用 `GET /history/game/:id?game_type=davinci`。
- 不展示回放入口，因为达芬奇不记录步骤。
- 展示胜负优先使用 `players[].isWinner`。
- 也可以用 `game.winnerPlayerID` 和当前用户的 `playerID` 比较。

## Acquire 页面接入建议

- 历史列表：调用 `GET /history/games?game_type=acquire`。
- 胜率卡片：调用 `GET /history/stats?game_type=acquire`。
- 对局详情：调用 `GET /history/game/:id?game_type=acquire`。
- 回放入口：调用 `GET /history/game/:id/snapshot?game_type=acquire&seq=N`。

