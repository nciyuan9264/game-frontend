# Splendor 前端重构：对齐 Acquire 架构 + 全新珠宝主题 UI

## Summary

将 `src/view/Splendor` 从「老架构」重构为与 Acquire/DaVinci 完全同型的「Match + Game 双阶段」架构，并对齐**已经迁移完成的 Splendor 后端协议**；同时按「深色珠宝主题 + 纯 CSS/矢量重绘」重新设计全套 UI，支持 PC 与移动端（移动端单页紧凑布局，不分页）。

本次为**纯前端改动**：经核实，Splendor 后端（`game-backend/internal/games/splendor`）已迁移到内存态 + Match 阶段 + `roomcore` 通用逻辑，命令名、消息协议、WS 路由都已变更，而前端仍是旧实现且路由被注释。后端无需改动。

---

## Current State Analysis

### 后端现状（已迁移，作为前端必须对齐的契约）

经核实 `game-backend` 中 Splendor 已完成架构迁移：

1. **WS 路由**：`router.go` 注册的是 `r.GET("/ws", ws.HandleWebSocket)`（不再是 `/splendor/ws`）。连接 query 同为 `?roomID=...&userID=...`。
2. **REST**：`/room/create`、`/room/delete`、`/room/list`、`/room/game_status`，与 acquire/davinci 同型（`MakeCreateHandler`/`MakeListHandler`）。`GetRoomList` 返回 `{roomID, ownerID, maxPlayers, status(string), roomPlayer:[{playerID,online,ai,ready}]}`。
3. **下行消息类型**：
   - `MATCH_SYNC`（大厅）：`{type, roomID, ownerID, status, playerID, players:{[id]:{playerID,online,ai,ready}}}`，见 [send_message.go](file:///Users/bytedance/github:@nciyuan9264/game/game-backend/internal/games/splendor/domain/game/send_message.go#L152-L186)。
   - `sync`（对局，注意**仍叫 `sync` 不是 `ROOM_SYNC`**）：`{type:"sync", playerId, playerData:{[id]:SplendorPlayerData}, roomData:{card:{[level]:NormalCard[]}, gems, nobles, roomInfo, currentPlayer, lastData, turnDeadline, turnTimeoutMs}}`，见 [send_message.go](file:///Users/bytedance/github:@nciyuan9264/game/game-backend/internal/games/splendor/domain/game/send_message.go#L111-L125)。
   - `error`：`{type:"error", message}`。
   - `audio`：`{type:"audio", message:<audioType>}`。
4. **roomInfo 结构已变**（关键破坏点）：[entities/room.go](file:///Users/bytedance/github:@nciyuan9264/game/game-backend/internal/games/splendor/entities/room.go#L15-L20) 现为 `{roomStatus: bool, gameStatus: RoomStatus, maxPlayers: int, userID: string}`。
   - `roomStatus`（bool）= `RoomStatus != match`（true 表示已开始）。
   - `gameStatus`（string enum）= `waiting | playing | last_turn | end` —— **真正的对局状态枚举从这里读，不再是 `roomInfo.roomStatus`**。
   - 旧前端读 `roomInfo.roomStatus` 当 enum 用，现在会拿到 bool，必然出错。
5. **上行命令名已全部改为 `match_*` / `game_*`**，见 [room.go handleCommand](file:///Users/bytedance/github:@nciyuan9264/game/game-backend/internal/games/splendor/domain/roompkg/room.go#L51-L82)：
   | 动作 | 新命令 | payload |
   |------|--------|---------|
   | 连接后就绪 | `game_ready` | 无 |
   | 拿宝石/跳过 | `game_get_gem` | `Record<color,number>`；跳过为 `{}` |
   | 买卡 | `game_buy_card` | `cardID`（number，裸值）|
   | 预留卡 | `game_preserve_card` | `cardID`（number，裸值）|
   | 结束 | `game_end` | 无 |
   | 语音 | `game_play_audio` | `{audioType}` |
   | 重开 | `game_restart_game` | 无 |
   | 大厅准备 | `match_ready` | `{ready: boolean}` |
   | 开始游戏 | `match_begin` | 无 |
   | 加 AI | `match_add_ai` | 无 |
   | 移除玩家 | `match_remove_player` | `{playerID}` |
   - 旧前端发的是 `get_gem`/`buy_card`/`preserve_card`/`play_audio`/`restart_game`，**全部失效**，且根本没有 Match 阶段命令。
6. **游戏流程**：4 人房（默认 maxPlayers=4，开始时取实际人数）。开局随机选 firstPlayer。买卡后 score≥15 触发 `last_turn`/`end`。贵族在买卡时自动结算。`game_get_gem` 空 payload = 跳过回合。

### 前端现状（待重构）

- 路由 [routes.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/route/routes.tsx#L37-L44) 中 splendor 两条路由被**注释**。但 `RoomCard`、`useCreateRoom`、`useGameType` 已支持 splendor，跳转目标是 `/game/splendor/match?roomID=...`（对齐 acquire/davinci）。
- [Splendor/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/index.tsx) 是单文件老架构：直接进对局，无 Match；连 `${splendorWsUrl}/splendor/ws`；只处理 `sync`；读 `roomInfo.roomStatus` 当 enum。
- 子组件（CardBoard/Card/GemSelect/PlayerData/UserData/MessageSender/GameEnd）发送旧命令名，读旧数据结构，样式用紫色渐变 + jpg 实拍图 + `vw` 硬编码，**无手机竖屏适配**。
- 类型 [splendorRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/splendorRoom.d.ts) 用非法 `map<K,V>` 语法，`roomInfo` 结构与后端不符，无 Match 类型。
- 颜色/常量（`CardColorType`/`GemColor` 等）耦合定义在 `UserData/index.tsx` 里。

### 参考架构（Acquire / DaVinci）

DaVinci 是与 Splendor 复杂度最接近的参照（单局结束弹窗、无 3D、Match 仅 2 座位）。核心模式：
- 顶层 `index.tsx` = 唯一 WS 拥有者，按 `type` 分流 `MATCH_SYNC→Match` / `ROOM_SYNC(splendor 为 sync)→Game`，弹窗显隐在顶层决策。
- `components/Match/` = `index.tsx` + `types.ts` + `components/Header` + `components/PlayerCard`（含 `hooks/useSeatAction`、`hooks/useSeatUIState`、`components/StatusTag`）。
- `components/Game/` = `index.tsx` 编排 + `utils/game.ts`（派生纯函数）+ 子组件。
- 通用件复用：`useWebSocket`、`useProfile`、`profile2BackendName`/`backendName2FrontendName`、`useConfirmDialog`、`Button`、`LoadingBlock`、`useInteractionMode`、`useAudio`、`useFullHeight`、`motion/react`、`styles/variables.less`。

---

## Assumptions & Decisions

1. **纯前端改动**，后端协议为既定契约，不改后端。
2. **下行对局消息仍是 `type:"sync"`**（不是 `ROOM_SYNC`）——这是 Splendor 后端与 acquire 唯一的协议差异，前端 onMessage 分流要按 `sync` 处理对局、`MATCH_SYNC` 处理大厅。
3. **对局状态枚举从 `roomData.roomInfo.gameStatus` 读**（`SplendorGameStatus`：waiting/playing/last_turn/end）。`roomInfo.roomStatus`(bool) 仅用于判断是否已开始（一般不需要，用 gameStatus 即可）。
4. **目录结构对齐 acquire/davinci**：`Splendor/index.tsx` + `components/Match/` + `components/Game/`。原有 7 个组件全部迁移重写进 `Game/components/` 下，删除老的 `Splendor/components/*` 旧文件。
5. **视觉**：深色珠宝主题。新增 Splendor 专属 less 变量（在各自 module.less 顶部 `@import variables.less` 并叠加珠宝色：深色背景 + 五宝石色 emerald/sapphire/ruby/diamond/onyx + 金色 gold 点缀）。五种宝石映射沿用现有英文 key（Black/Blue/Green/Red/White/Gold）。
6. **素材纯 CSS/矢量重绘**：弃用 `public/splendorCard/*.jpg`、`noble/*.jpg`、`gem/*.png`。卡牌用 CSS 渐变卡面 + 宝石色角标 + 成本徽章；宝石用径向渐变圆形 token + 高光；贵族用金边卡 + 成本徽章。不引入新图片资源。
7. **移动端**：单页紧凑布局，不分页。PC 与移动端通过 CSS 媒体查询 + `useInteractionMode` 区分卡片/宝石尺寸；对手玩家手牌区横向/纵向滚动；自己资产与操作区紧凑常驻。
8. **类型规范化**：新建 `src/types/SplendorRoom.d.ts`（驼峰命名对齐 `AcquireRoom.d.ts`/`DaVinicRoom.d.ts`），用合法 `Record<>` 语法，新增 Match 相关类型与 REST 类型（`ListRoomInfo` 等）。保留旧 `splendorRoom.d.ts` 还是替换：**替换**（改写为正确结构，避免全局重复声明冲突）。
9. **业务规则集中**：把 `canBuy`/`canPreserve`/`canGet` 等派生函数集中到 `Game/utils/game.ts`，供组件复用（对齐 acquire 的 game.ts 模式）。
10. **颜色常量迁移**：把 `CardColorType`/`GemColorType`/`GemColor`/`gemColors`/`cardColors` 从 `UserData/index.tsx` 迁到 `Game/utils/game.ts`（或 `Game/constants.ts`），统一 import。
11. **重开权限**：沿用现有「仅房主可重开」逻辑，房主判定用 `roomData.roomInfo.userID === userID`（后端 roomInfo.userID = ownerID）。
12. **Match 座位数**：Splendor 默认 maxPlayers=4，座位网格补满到 4 个空位（参照 acquire 的 6、davinci 的 2，Splendor 用 4）。

---

## Proposed Changes

### 阶段 0：路由与类型（基础）

#### 0.1 `src/route/routes.tsx`
- 取消注释并改为对齐 acquire/davinci 的双路由：
  - `/game/splendor` → `<GameBoard />`（大厅，复用现有 GameBoard）。
  - `/game/splendor/match` → `<Splendor />`（lazy 引入 `@/view/Splendor`）。
- 顶部 `const Splendor = lazy(() => import("@/view/Splendor"));`。

#### 0.2 `src/types/SplendorRoom.d.ts`（新建，替换旧 `splendorRoom.d.ts`）
- 用合法语法定义（参照 AcquireRoom/DaVinicRoom）：
  - `CardColorType`/`GemColorType` 全局类型。
  - `SplendorNormalCard`/`SplendorNoble`（对齐后端 `id/level/bonus/points/cost/state`）。
  - `SplendorPlayerData`：`{normalCard, nobleCard, reserveCard, gem:Record<string,number>, score}`。
  - `SplendorRoomData`：`{card: Record<string, SplendorNormalCard[]>, gems: Record<string,number>, nobles: SplendorNoble[], currentPlayer, lastData?, turnDeadline?, turnTimeoutMs?, roomInfo: {roomStatus:boolean, gameStatus:GameStatus, maxPlayers:number, userID:string}}`。
  - `SplendorWsRoomSyncData`：`{type, playerId, playerData:Record<string,SplendorPlayerData>, roomData, message?}`。
  - `SplendorWsMatchSyncData`：`{type, roomID, ownerID, status, playerID, players:Record<string,PlayerInfo>, message?}`。
  - `ListRoomInfo`/`CreateRoomRequest`/`GetRoomListReponse` 等（如复用 AcquireRoom 的同名全局声明则不重复，仅补 splendor 独有的）。
- 删除旧 [splendorRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/splendorRoom.d.ts)（避免 `SplendorWsRoomSyncData` 等全局重复声明）。
- **注意**：旧 `.d.ts` 是全局 ambient（无 import/export）。新文件保持同样全局风格，确保现有引用 `SplendorWsRoomSyncData`/`SplendorCard` 仍可用——但因要新增 Match 类型且组件改为显式 import 更清晰，统一改为 `export` + 各组件 `import from '@/types/SplendorRoom'`（对齐 AcquireRoom.d.ts 的 export 用法）。组件里 `SplendorCard` 重命名为 `SplendorNormalCard`，全量替换引用。

#### 0.3 `src/enum/game.ts`
- `SplendorGameStatus` 已有（waiting/playing/last_turn/end），无需改动，对局用它。

---

### 阶段 1：顶层 index.tsx（连接 + 分发中枢）

重写 [Splendor/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/index.tsx)，对齐 [DaVinci/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/index.tsx)：
- 用 `useUrlParams()` 取 `roomID`（替换 `useParams`，对齐 acquire/davinci 的 query 方式）。
- `useProfile()` + `profile2BackendName` 得 `userID`。
- URL：`${splendorWsUrl}/ws?roomID=${roomID}&userID=${userID}`（去掉 `/splendor` 前缀）。
- `useWebSocket(url, onMessage)`。onMessage 按 `type` 分流：
  - `error` → `message.error` + 清空两 sync + 若「你已被移出房间」`navigate('/game/splendor')`。
  - `audio` → `playAudio`。
  - `MATCH_SYNC` → set match data, clear room data。
  - `sync` → set room data, clear match data；若 `roomData.roomInfo.gameStatus === END` → `setGameEndModalVisible(true)`，否则 false。
- 状态：`wsMatchSyncData`、`wsRoomSyncData`、`gameEndModalVisible`。
- 渲染：LoadingBlock / `<Match/>` / `<Game/>`，把 `sendMessage`/`wsRef`/对应 sync data/`userID`/弹窗 props 下传。
- 顶层容器 `index.module.less`：对齐 davinci/acquire 的 `.acquire`（深色背景、移动端 overflow 处理）。

---

### 阶段 2：Match 大厅模块（新建）

新建 `src/view/Splendor/components/Match/`，结构镜像 [DaVinci/components/Match](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Match/index.tsx)：

#### 2.1 `Match/index.tsx`
- Props：`{sendMessage, wsRef, wsMatchSyncData?, userID}`。
- `isOwner`、`currentPlayerData`、`isAllReady`（全 ready 且 >1 人）。
- 被踢则 `navigate('/game/splendor')`；房主在 match 阶段注册 `beforeunload`。
- `seats`：真人(房主 Host/其余 Player) → AI → 补空位到 **4**（`totalSeats = 4`）。
- `firstEmptySeatIndex` 控制只第一个空位可加 AI。
- 渲染 `<Header>` + `.seatGrid` 内 `<PlayerCard>`。

#### 2.2 `Match/types.ts`
- 复制 davinci 的 `Role`/`ViewRole`/`Seat`/`RoomCounts`。

#### 2.3 `Match/components/Header/index.tsx`
- 复制 davinci Header：返回（confirm + wsRef.close + navigate `/game/splendor`）；房主「添加人机」(`match_add_ai`) + 「开始游戏」(`match_begin`, disabled=!isAllReady)；非房主「准备/取消准备」(`match_ready` {ready})。
- 标题文案改为「璀璨宝石 · 房间准备」。

#### 2.4 `Match/components/PlayerCard/`（index.tsx + hooks/useSeatAction.ts + hooks/useSeatUIState.ts + components/StatusTag/）
- 复制 davinci 对应文件。`useSeatAction` 的 `wsMatchSyncData` 类型改为 `SplendorWsMatchSyncData`（或在 union 里加上）。
- `navigate` 目标改 `/game/splendor`。

#### 2.5 各 `index.module.less`
- 复制 davinci/acquire 的 Match 样式，套用珠宝主题（深色背景 + 金色/宝石色强调）。`.seatGrid` 响应式：手机 1 列、≥768px 2 列。

---

### 阶段 3：Game 对局模块（重写 + 重设计）

新建 `src/view/Splendor/components/Game/index.tsx` 作为编排器，并把旧组件重写迁入 `Game/components/`。

#### 3.1 `Game/utils/game.ts`（新建，派生函数 + 常量）
集中：
- 颜色常量：`CardColorType`/`GemColorType`/`GemColor`/`gemColors`/`cardColors`（从 UserData 迁入）。珠宝主题下 `GemColor` 调整为更有质感的渐变色值（保留 key）。
- 派生函数（纯函数，签名 `(data, userID/card)`）：
  - `getGameStatus(data)` → 读 `roomData.roomInfo.gameStatus`。
  - `isCurrentPlayer(data, userID)`。
  - `canBuy(data, card)`（从 CardBoard 迁入，改读 gameStatus）。
  - `canPreserve(data, card)`（从 GemSelect 迁入，改读 gameStatus）。
  - `getCardCountByColor(normalCard)`（折扣统计，多处复用）。
  - `isOwner(data, userID)` → `roomData.roomInfo.userID === userID`。
- 拿宝石合法性 `canGetGems`/`isTwoSameColorAndLowSupply`：保留在 GemSelect 内部（依赖本地选择态），但可把纯校验抽到 utils。

#### 3.2 `Game/index.tsx`（编排器）
- Props：`{sendMessage, wsRef, wsRoomSyncData, userID, gameEndModalVisible, setGameEndModalVisible}`。
- 本地态：`selectedCard`（购买/预购选中卡，跨 CardBoard 与 ReserveCard 共享）。
- `useEffect`：挂载发 `game_ready`；`currentPlayer===userID` 播 YourTurn 音效；每次 sync 清空 selectedCard。
- `useInteractionMode()` 得 `isFinePointer`，下传子组件做 PC/移动端尺寸与交互差异。
- 布局（深色珠宝主题）：
  - **TopBar**：返回按钮（confirm+close+navigate）、房间号/昵称、回合状态文案（你的回合/等待 X / 最后一回合，读 gameStatus）、TurnCountdown（复用 `@/view/Acquire/.../TurnCountdown`，有 turnDeadline 时）、「结束清算」按钮（gameStatus===END 可点）。
  - **主区**：贵族行 + 三级卡阵（CardBoard） + 宝石池（GemSelect）。
  - **资产区**：其他玩家（PlayerData，可滚动） + 自己资产/预留卡（UserData） + MessageSender。
  - **弹窗**：GameEnd（受控）。
- 各操作回调统一：可选 playAudio → `sendMessage({type, payload})` → 关弹窗。

#### 3.3 `Game/components/CardBoard/`（重写）
- 渲染贵族行（`roomData.nobles` 按 id 排序）+ 三级卡阵（`[3,2,1].map(level => roomData.card[level])`）。
- 卡牌点击 `setSelectedCard`；选中态/可买态高亮。
- 「购买」按钮 → `game_buy_card` payload=**裸 cardID（number）**；disabled=`!canBuy`。
- 「预购」按钮 → `game_preserve_card` payload=**裸 cardID（number）**；disabled=`!canPreserve`。
- 纯 CSS 卡面：宝石色渐变卡背 + 右上 bonus 宝石角标 + points + 左下成本徽章列。
- 响应式：PC 大卡、移动端缩小卡尺寸（CSS var + 媒体查询）。

#### 3.4 `Game/components/Card/`（重写 NobleCard/NormalCard/GemToken/CostBadge）
- 弃用 jpg 背景，全 CSS 重绘：
  - `NormalCard`：渐变卡面（按 bonus 取 GemColor），右上 bonus 宝石点，points 数字，底部成本徽章（遍历 cost，仅 count>0）。
  - `NobleCard`：金边卡 + points + 成本徽章。
  - `GemToken`（原 RoundCard）：径向渐变圆 + 高光 + 数量/成本数字。
  - `CostBadge`（原 SmallCard）：小圆/方角徽章，宝石色背景。
- 这些是纯展示组件，props 简单（card/noble/color/cost/size）。新增 `size` prop 支持 PC/移动端尺寸。

#### 3.5 `Game/components/GemSelect/`（重写）
- 左侧 3 个待选槽 + 右侧宝石池（含 Gold 不可选）+ 拿取/取消/跳过。
- 本地 `selectedGems`/`localGems` 选择态逻辑保留。
- 「拿取」→ `game_get_gem` payload=`Record<color,number>`，发后清空。
- 「跳过」→ `game_get_gem` payload=`{}`。
- 「取消」仅清本地。
- `canGet` 改读 `gameStatus===PLAYING` 且 `currentPlayer===userID`。
- 珠宝主题 token 样式；移动端宝石缩小、可点区域保证 ≥40px。

#### 3.6 `Game/components/PlayerData/`（重写，其他玩家）
- 遍历 `playerData` 跳过自己，每人卡片：昵称、5 色折扣计数（CostBadge）、宝石（GemToken，Gold 末位）、分数、预留数。
- 容器可滚动（移动端横向滚动卡片或纵向滚动列表，紧凑）。
- 当前回合玩家高亮。

#### 3.7 `Game/components/UserData/`（重写，自己资产 + 预留卡）
- 分数、5 色折扣计数 + 对应宝石数 + Gold。
- 3 个预留卡槽：有卡渲染 NormalCard（点击 setSelectedCard，canBuy 高亮），无卡占位。
- 颜色常量改从 `utils/game.ts` import。
- 响应式：移动端紧凑横排。

#### 3.8 `Game/components/MessageSender/`（迁移）
- 基本复用，回调拼 `game_play_audio`（注意：旧是 `play_audio`，**改成 `game_play_audio`**）。
- `PRESET_MESSAGES` 保留。珠宝主题按钮配色。

#### 3.9 `Game/components/GameEnd/`（重写）
- 排名弹窗：按 score 降序，同分比贵族分。展示排名/普通分/贵族分/总分。
- 「再来一局」→ `game_restart_game`（旧是 `restart_game`，**改名**），仅房主可见（`roomData.roomInfo.userID===userID`）。
- 用通用 `Modal`（motion）或保留 antd Modal + 珠宝主题样式。

#### 3.10 各 `index.module.less`
- 全部套用珠宝主题：`@import variables.less` + 新增 splendor 局部宝石色变量。
- 统一响应式断点（`max-width: 768px` 手机、`max-width:1024px` 平板），移动端单页紧凑、对手区滚动。

---

### 阶段 4：清理

- 删除旧 `src/view/Splendor/components/` 下被替换的旧组件文件（CardBoard/Card/GemSelect/PlayerData/UserData/MessageSender/GameEnd 旧版）与旧 `Splendor/index.module.less`（被新顶层样式替换）。
- 删除旧 `src/types/splendorRoom.d.ts`。
- 全局搜索确认无残留 import 旧路径/旧命令名/`/splendor/ws`/`roomInfo.roomStatus` 当 enum 的用法。

---

## 文件改动一览

### 新增
- `src/types/SplendorRoom.d.ts`
- `src/view/Splendor/components/Match/index.tsx` `index.module.less` `types.ts`
- `src/view/Splendor/components/Match/components/Header/index.tsx` `index.module.less`
- `src/view/Splendor/components/Match/components/PlayerCard/index.tsx` `index.module.less`
- `src/view/Splendor/components/Match/components/PlayerCard/hooks/useSeatAction.ts` `useSeatUIState.ts`
- `src/view/Splendor/components/Match/components/PlayerCard/components/StatusTag/index.tsx` `index.module.less`
- `src/view/Splendor/components/Game/index.tsx` `index.module.less`
- `src/view/Splendor/components/Game/utils/game.ts`
- `src/view/Splendor/components/Game/components/{CardBoard,Card,GemSelect,PlayerData,UserData,MessageSender,GameEnd}/...`（重写后的组件 + less）

### 修改
- `src/route/routes.tsx`（启用 splendor 路由 + lazy）
- `src/view/Splendor/index.tsx`（重写为连接+分发中枢）
- `src/view/Splendor/index.module.less`（顶层容器样式）

### 删除
- `src/types/splendorRoom.d.ts`
- 旧 `src/view/Splendor/components/{CardBoard,Card,GemSelect,PlayerData,UserData,MessageSender,GameEnd}` 全部旧实现

---

## Verification Steps

1. **类型检查/构建**：`pnpm build`（或 `tsc --noEmit`）无类型错误；GetDiagnostics 无报错。
2. **路由可达**：从 Home → 「进入并购大厅」不受影响；splendor 通过 `/game/splendor` 大厅 → 创建/进入房间 → `/game/splendor/match?roomID=...`。
3. **Match 流程**：进房显示 4 座位；非房主可准备/取消；房主可加 AI、移除玩家、全员 ready 后开始。
4. **对局流程**（对照后端契约逐项）：
   - 收到 `sync` 正确渲染贵族/三级卡/宝石池/各玩家资产。
   - 拿宝石（3 异色 / 2 同色且库存>3）发 `game_get_gem` 正确；跳过发 `{}`。
   - 买卡发 `game_buy_card` 裸 cardID；预留发 `game_preserve_card` 裸 cardID。
   - 回合状态读 `roomInfo.gameStatus`；`last_turn` 文案；`end` 弹结算。
   - 语音发 `game_play_audio`；重开发 `game_restart_game`（仅房主）。
5. **响应式**：PC 宽屏完整布局；手机竖屏单页紧凑、对手手牌区可滚动、宝石/卡片尺寸缩小且可点；平板横屏正常。
6. **视觉**：深色珠宝主题，无 jpg/png 实拍图依赖（CSS 重绘），风格与 Acquire/DaVinci 协调。
7. **回归**：Acquire/DaVinci 不受影响（仅共享 routes.tsx/通用组件，未改其逻辑）。

---

## Out of Scope（明确不做）
- 不改后端任何代码。
- 不补 Splendor AI 决策（后端占位空，前端不涉及）。
- 不实现 Splendor 回放（Replay）功能。
- 不改 Acquire/DaVinci 的业务逻辑与既有样式（仅可能复用其通用组件如 TurnCountdown）。
- 不新增图片资源。
