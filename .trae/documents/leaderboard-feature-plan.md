# 全玩家排行榜功能实现计划（v2，挂载在大厅）

## Summary

新增「全玩家排行榜」功能：在 **游戏大厅（GameBoard）** 顶部 Header 增加排行榜入口按钮，点击打开弹窗。组件 `<LeaderboardModal>` 在 Acquire 与达芬奇两种大厅复用同一份实现，`gameType` 由当前大厅路由传入，弹窗内提供两种排序维度（场次 / 战绩）切换。

接口契约：

* `GET /ranking/leaderboard?game_type={davinci|acquire}&limit=50&offset=0`

* davinci 条目：`userID, playerID, totalGames, wins, winRate`

* acquire 条目：`userID, playerID, totalGames, avgRank`

样式按大厅主题（暗色石板 + 青绿 `@color-accent-teal #00b3a6`）实现，沿用 [variables.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/styles/variables.less) 的色板与 [GameBoard](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/index.module.less) 的风格。

## Current State Analysis

* 大厅入口：`/game/acquire` 与 `/game/davinci` 都渲染 [src/view/GameBoard/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/index.tsx)，通过 `useGameType()` 拿到 `gameType`，再传给 [Header](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/Header/index.tsx)。Header 已有 ProfileModal 调用模式（`useState` 控制 `visible`，`gameType` prop 直接转换为 `HistoryGameType`）—— 排行榜入口可对齐这套模式。

* Header 右侧已有「创建房间」`<Button customType="primary">` 与用户头像 Dropdown（菜单含 `个人主页 / Profile / 退出登录`）。新「排行榜」入口可放在「创建房间」之前，或作为 Dropdown 中第一项。**采用方案 A：在** **`.right`** **中追加独立按钮** **`<Button customType="primary" content="排行榜" icon={<TrophyOutlined />} />`**，更显眼，符合"首页某个按钮"语义（大厅就是用户进入游戏前的"首页"）。

* 大厅主题色：`@color-bg-slate (#020617)` 深色背景 + `@color-accent-teal (#00b3a6)` 强调色 + `@color-text-main (#e2e8f0)`。`color-mix` 与 less 变量混用没有问题（[Header less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/Header/index.module.less) 已大量使用 less 变量）。

* 通用 `<Modal>` 默认白底（[Modal less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.module.less)），ProfileModal 是浅色实现 —— 但大厅本身是深色，弹窗如果保持 ProfileModal 风格的浅色卡片其实是可接受的对比方案；为风格统一，本计划改用**深色暗石板风格**，与大厅自身一致。

* API / 拦截器结构与上一版相同：`APIClient.get<T>` 直接返回 `data` 部分。

* `HistoryGameType = 'acquire' | 'davinci'` 已存在，可作为 `gameType` 复用类型。

* Vite 代理（[vite.config.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/vite.config.ts)）尚未为 `/ranking` 配置，需新增。

## Proposed Changes

### 1. 类型定义（新建）

**File**: `src/types/leaderboard.d.ts`

```ts
import type { HistoryGameType } from './history';

export interface LeaderboardEntryBase {
  userID: number;
  playerID: string;
  totalGames: number;
}

export interface DavinciLeaderboardEntry extends LeaderboardEntryBase {
  wins: number;
  winRate: number; // 0~1
}

export interface AcquireLeaderboardEntry extends LeaderboardEntryBase {
  avgRank: number;
}

export type LeaderboardEntry = DavinciLeaderboardEntry | AcquireLeaderboardEntry;

export interface LeaderboardData {
  gameType: HistoryGameType;
  entries: LeaderboardEntry[];
}

export type LeaderboardSortDim = 'totalGames' | 'metric'; // 场次 / 战绩
```

### 2. API（新建）

**File**: `src/api/leaderboard.ts`

```ts
import APIClient from './apiClient';
import type { HistoryGameType } from '@/types/history';
import type { LeaderboardData } from '@/types/leaderboard';

export interface GetLeaderboardParams {
  gameType: HistoryGameType;
  limit?: number;
  offset?: number;
}

export const getLeaderboard = async (
  params: GetLeaderboardParams
): Promise<LeaderboardData> => {
  const { gameType, limit = 50, offset = 0 } = params;
  return APIClient.get({
    url: '/ranking/leaderboard',
    params: { game_type: gameType, limit, offset },
  });
};
```

### 3. 请求 Hook（新建）

**File**: `src/hooks/request/useLeaderboard.ts`

```ts
import { useRequest } from 'ahooks';
import { message } from 'antd';
import { getLeaderboard, GetLeaderboardParams } from '@/api/leaderboard';

export const useLeaderboard = () => {
  const { data, run, loading } = useRequest(
    async (params: GetLeaderboardParams) => getLeaderboard(params),
    { manual: true, onError: () => message.error('获取排行榜失败') }
  );
  return { data, run, loading };
};
```

### 4. 共享排行榜弹窗组件（新建，跨两款游戏复用）

**Files**:

* `src/components/Leaderboard/index.tsx`

* `src/components/Leaderboard/index.module.less`

**Props**：

```ts
interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  gameType: HistoryGameType; // 由大厅按当前游戏传入；弹窗内不切换游戏
}
```

**理由：弹窗内不切换游戏**——大厅本身就是"特定游戏"上下文，弹窗里再放一个游戏 Tab 与之冗余。需求要求"复用排名组件"，复用通过组件本身被两个大厅引入实现即可，不必在弹窗内做切换。

**结构**（沿用 ProfileModal DOM 模式但深色风格）：

1. 头部：`<TrophyOutlined />`(antd icon) + 标题「Acquire 排行榜」/「达芬奇密码 排行榜」 + 关闭按钮。
2. **Sort Tabs（场次 / 战绩）** 段控件，state `sortDim: 'totalGames' | 'metric'`，默认值 `'metric'`。
3. 表头 + 列表：

   * 公共列：`#`（排名）、`玩家`、`总场次`

   * acquire：`平均排名`（`avgRank.toFixed(2)`）

   * davinci：`胜场`、`胜率`（`(winRate*100).toFixed(1)+'%'`）
4. Top 3 高亮：使用 `@color-accent-teal` 渐变边框；第 1 名加 trophy 图标。
5. 加载态：`<Spin>` overlay；空态：「暂无数据」。

**排序逻辑**（前端）：

* `sortDim === 'totalGames'`：`[...entries].sort((a,b) => b.totalGames - a.totalGames)`

* `sortDim === 'metric'`：

  * acquire：`a.avgRank - b.avgRank`（升序，越小越强）

  * davinci：`b.winRate - a.winRate`（降序，越大越强）

* 排名编号在 sort 后基于下标重生成。

**主题（深色，匹配大厅 GameBoard）**：

* 容器背景：`@color-surface-strong-dark (rgba(15,23,42,0.98))` + `backdrop-filter: blur(24px)`。

* 边框：`1px solid @color-border-subtle-dark`。

* 文字主色：`@color-text-main`，副色：`@color-text-soft`。

* 强调色：`@color-accent-teal`（按钮选中、Top 1 高亮、行号、链接）。

* 圆角 `1rem`，阴影 `0 25px 50px -12px rgba(0,0,0,0.6)`。

* 因 `<Modal>` 容器是白底，children 使用 `position:absolute; inset:0; border-radius:24px; overflow:hidden;` + 自身深色背景，**完全覆盖白底**。验证：Modal 容器有 `border-radius:24px; max-height:90vh`，children 充满可贴齐。

**数据获取**：`useEffect([visible, gameType])` → 当 `visible === true` 时 `run({ gameType, limit: 50 })`。`sortDim` 切换不重新请求，仅前端排序。

### 5. 大厅 Header 挂入口

**File**: `src/view/GameBoard/components/Header/index.tsx`

* 新增 `import { TrophyOutlined } from '@ant-design/icons';` 与 `import LeaderboardModal from '@/components/Leaderboard';`。

* 新增 `const [leaderboardVisible, setLeaderboardVisible] = useState(false);`。

* 在 `.right` 中，**「创建房间」按钮之前**插入：

  ```tsx
  <Button
    customType="primary"
    style={{ height: '2rem' }}
    content="排行榜"
    icon={<TrophyOutlined />}
    onClick={() => setLeaderboardVisible(true)}
  />
  ```

  （注意：原「创建房间」按钮被 `Number(roomList?.length) > 0` 守卫；排行榜按钮**始终可见**，所以放在外层、不被守卫。）

* 在 `<ProfileModal />` 同级追加：

  ```tsx
  <LeaderboardModal
    visible={leaderboardVisible}
    onClose={() => setLeaderboardVisible(false)}
    gameType={historyGameType}
  />
  ```

**File**: `src/view/GameBoard/components/Header/index.module.less`

* 无需改动（沿用 `.right` 现有 flex + gap）。

### 6. Vite 开发代理（修改）

**File**: `vite.config.ts`

在 `/history` 后追加：

```ts
'/ranking': {
  target: 'http://localhost:8000',
  changeOrigin: true,
  secure: true,
  headers: { Cookie: /* 同 history 中那串 access_token */ },
},
```

## Assumptions & Decisions

1. **挂载位置改为大厅 Header** **`.right`**（用户 v2 反馈），与「创建房间」并排，是用户进入大厅必经入口。Home 页不再改动。
2. **弹窗内不切换游戏类型**：大厅本身已确定 `gameType`，避免冗余 Tab；通过两款大厅都引入同一个组件实现"复用"。
3. **样式跟随大厅暗色主题**（teal + slate），不是 Home 海报双主题（绿蓝/金紫）。这与请求"样式适配当前游戏样式"一致 —— 当前两款大厅共享同一套深色主题。
4. **覆盖通用 Modal 白底**：`<Modal>` 默认白色 `.modal`，children 用绝对定位 + 深色背景 + 圆角对齐覆盖。
5. **接口数据按契约直用**，`winRate ∈ [0,1]` 渲染乘 100 加百分号；`avgRank` 保留 2 位小数。
6. **playerID 显示**：用 `backendName2FrontendName(playerID)` 取 `name` 部分。
7. **不做分页**：`limit=50` 单次请求满足首版。
8. **当前用户高亮**：使用 `useProfile()` 拿到当前用户 `userProfile.id`，当 `entry.userID === userProfile.id` 时高亮该行（teal 边框 + 「我」徽标）。

## File-by-File Summary

| 操作 | 路径                                                            |
| -- | ------------------------------------------------------------- |
| 新增 | `src/types/leaderboard.d.ts`                                  |
| 新增 | `src/api/leaderboard.ts`                                      |
| 新增 | `src/hooks/request/useLeaderboard.ts`                         |
| 新增 | `src/components/Leaderboard/index.tsx`                        |
| 新增 | `src/components/Leaderboard/index.module.less`                |
| 修改 | `src/view/GameBoard/components/Header/index.tsx`（新增按钮 + 弹窗挂载） |
| 修改 | `vite.config.ts`（新增 `/ranking` 代理）                            |

> 不再修改：`src/view/Home/*`

## Verification Steps

1. `npm run dev`（或 `pnpm dev`），打开 `http://localhost:5173`。
2. 进入 `/game/acquire` 大厅，Header 右侧出现「排行榜」按钮 → 点击打开弹窗。
3. Network：`GET /ranking/leaderboard?game_type=acquire&limit=50&offset=0` 命中本地 8000（经 Vite proxy）。
4. 切换到 `/game/davinci`，相同入口，请求 `game_type=davinci`，列变为「胜场 / 胜率」。
5. 弹窗内切换「场次 / 战绩」分段控件 → 列表前端重排，行号刷新。
6. 当前登录用户出现在列表中时整行 teal 高亮 + 「我」徽标。
7. 接口失败 → antd `message.error('获取排行榜失败')`。
8. 空数组 → 「暂无数据」。
9. ≤600px 宽度下：弹窗 90% 宽，列折叠为标签 + 值的 `flex-direction: row` 紧凑布局。
10. `npm run build` 通过，无 TS 报错。

