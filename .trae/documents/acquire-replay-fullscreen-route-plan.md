# Acquire 历史回放：移除弹窗、复用游戏 UI、PC 全屏覆盖 / Mobile 独立路由

## Summary

当前回放是塞进一个 70% 宽白色 [Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx) 里的小窗，主题、间距、栅格全跟实际游戏脱节，**没有真正复用游戏 UI**。本期重做：

1. 抽出 **`<ReplayContent>`** —— 一个完全复刻 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.tsx) 容器结构和样式的回放主体，复用 [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.module.less) 中的 `game-container / gameBoard / assets` 三段式（与玩家进入游戏时**像素级一致**），里面用 [Board](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/Board/index.tsx) / [CompanyInfo](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/CompanyInfo/index.tsx) / [PlayerAssets](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/PlayerAssets/index.tsx)。
2. **`<ReplayTopBar>`** —— 复用 [TopBar/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.module.less) 的样式类（直接 `import` 该 less），结构同 TopBar 三段式（左：返回 + 标题 / 中：状态 / 右：step 控制），最大化视觉一致。
3. **`<ReplayTimeline>`** —— 底部的时间轴 + 按钮（初始 / 上一步 / 下一步 / 终局）。
4. 入口分流：
   - **PC**：用一个 `position: fixed; inset: 0; z-index: 60` 的全屏覆盖层（不再用 70% 宽 Modal），里面放 `<ReplayContent>` —— 视觉与游戏完全一致，只是 ESC / 关闭按钮回到列表页。
   - **Mobile**：新增路由 `/game/acquire/replay/:gameId`，由 `<ReplayPage>` 装载 `<ReplayContent>`，整页呈现，与游戏页路由风格一致。
5. 在 [ProfileModal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx) 点击某局时，根据 `window.matchMedia('(max-width: 600px)')` 决定**导航**还是**开覆盖层**。

## Current State Analysis

### 现游戏 UI 三段式（要复用的目标样式）
- 外层 [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.module.less)：
  ```less
  .game-container { display: flex; flex-direction: column; gap: 1rem; padding: 1.6rem 1rem; }
  .gameBoard { flex: 1; display: flex; gap: 1rem; }   // mobile 下 flex-direction: column 且 first-child 排到底部
  .assets { min-height: 20vh; display: flex; gap: 6px; }
  ```
- 上层 [Acquire/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/index.module.less)：暗色径向渐变背景 `100vh × 100vw`。
- TopBar 样式：复用 [TopBar/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.module.less)（含移动端隐藏左侧、状态居中等）。

### 当前实现的问题
- [ReplayModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ReplayModal/index.tsx) 直接套 [Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx)（白底、70% 宽、`max-height:90vh`），破坏了游戏的暗色主题与栅格。
- 回放只是把 Board / CompanyInfo / PlayerAssets 平铺进 modal，没有套用 `game-container` / `gameBoard` / `assets` 这套布局类，所以 **layout 完全不像游戏画面**。
- 没有移动端独立路由方案，弹窗在小屏体验差。

### 路由 / 入口现状
- 路由集中在 [routes.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/route/routes.tsx)，已有 `/game/acquire`、`/game/acquire/match` 两条；新增 `/game/acquire/replay/:gameId` 不会破坏现有结构。
- 入口在 [Header/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/Header/index.tsx)：hover 头像 → 个人主页 → ProfileModal → 当前 `onReplay(id)` 直接 `setReplayGameId(id)`。需要改成「按视口分流」。

### 需要传给展示组件的 props（noop 即可）
- `Board`：`placeTile / setHoveredTile`；`shouldBlink` 在快照里 `gameStatus !== 'setTile'` 永远 false（实际有可能 `setTile` 也不会血洗，但因为 `playerData.tiles` 取的是 viewer，`currentPlayer` 也来自快照，给 viewer 自己看自己回合的快照时仍可能 blink → 改为给 Board 加 `readonly?: boolean` 选项，回放固定 true，更稳定）。
- `CompanyInfo`：`setBuyStockModalVisible / setMergeCompanyModalVisible` 都是 noop。
- `PlayerAssets`：`sendMessage / setHoveredTile / placeTile` 都是 noop；它内部也用 `currentPlayer === userID && gameStatus === SET_Tile` 判断，传 noop 就算触发也无副作用。

## Proposed Changes

### 1. 给 [Board](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/Board/index.tsx) 增加 `readonly?: boolean`（保守增强）

修改 `IBoardProps` 加可选 `readonly?: boolean`，仅在 `readonly` 时强制 `shouldBlink = false`、点击/hover 处理短路。**默认 false 不影响现有调用**。这样 ReplayContent 给 `readonly=true` 即彻底关闭交互，避免「viewer 恰好是当前 step 的 currentPlayer + setTile」时出现误闪。

### 2. 新建回放主体 `<ReplayContent>`

路径：`src/view/Acquire/Replay/index.tsx` + `index.module.less`

职责：**整页（或全屏覆盖层）布局**。结构与 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.tsx) 一致，且**直接 import** [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.module.less) 的 `gameBoard / assets / game-container` 类来保证完全像素一致；时间轴 `<ReplayTimeline>` 不再放在容器底部抢空间，而是**作为可拖动浮窗浮在页面之上**，与原始三段式 UI 完全解耦：

```tsx
import gameStyles from '@/view/Acquire/components/Game/index.module.less';
import outerStyles from '@/view/Acquire/index.module.less';

<div className={outerStyles.acquire}>
  <div className={gameStyles['game-container']}>
    <ReplayTopBar ... />
    <div className={gameStyles.gameBoard}>
      <Board readonly tilesData={...} hoveredTile={undefined} setHoveredTile={noop} wsRoomSyncData={fake} placeTile={noop} />
      <CompanyInfo data={fake} userID={viewerID} setBuyStockModalVisible={noop} setMergeCompanyModalVisible={noop} />
    </div>
    <div className={gameStyles.assets}>
      <PlayerAssets data={fake} sendMessage={noop} setHoveredTile={noop} placeTile={noop} userID={viewerID} />
    </div>
  </div>
  {/* 浮动可拖拽时间轴 —— 与上面三段式同级、绝对定位、portal 不强制 */}
  <ReplayTimeline events={events} step={step} setStep={setStep} loading={snapshotLoading} />
</div>
```

数据流：跟现 ReplayModal 一致 —— `useGameDetail / useSnapshot` + `snapshotToWsRoomSyncData`。

Props：

```ts
interface ReplayContentProps {
  gameId: GameID;
  viewerID: string;
  onExit: () => void;   // PC 模式 → 关闭覆盖层；mobile 路由 → navigate(-1) 或 /game/acquire
}
```

### 3. 新建 `<ReplayTopBar>`

路径：`src/view/Acquire/Replay/components/ReplayTopBar/index.tsx` + `index.module.less`

复用 [TopBar/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.module.less) 的类名结构以保持一致。

```tsx
import topBarStyles from '@/view/Acquire/components/Game/components/TopBar/index.module.less';

<div className={topBarStyles['top-bar']}>
  <div className={topBarStyles['top-bar__header']}>
    <div className={topBarStyles['top-bar__left']}>
      <Button icon={<ArrowLeftOutlined />} onClick={onExit} />
      <div className={topBarStyles['top-bar__brand']}>
        <div className={topBarStyles['top-bar__title']}>Acquire 对局回放</div>
      </div>
    </div>
    <div className={topBarStyles['top-bar__status']}>
      <Button content={`回放中 ${step+1}/${total}`} customType="primary" .../>
    </div>
    <div className={topBarStyles['top-bar__right']}>
      <Button content="对局列表" onClick={...} />
      <Button content="终局" disabled={total===0} onClick={()=>setStep(total-1)} />
    </div>
  </div>
  <div className={topBarStyles['top-bar__footer']}>
    <div><HomeOutlined /> 房间 {game.roomID} <UserOutlined /> 玩家 {backendName2FrontendName(viewerID)}</div>
    <div>胜者 {game.winnerPlayerID ? backendName2FrontendName(game.winnerPlayerID) : '-'}</div>
  </div>
</div>
```

### 4. 新建 `<ReplayTimeline>` —— 浮动可拖拽

路径：`src/view/Acquire/Replay/components/ReplayTimeline/index.tsx` + `index.module.less`

定位：**`position: fixed`（PC 下） / `position: absolute`（mobile 路由页）的浮动卡片**，默认锚在屏幕底部居中（`bottom: 24px; left: 50%; transform: translateX(-50%)`），可通过 header 拖拽到任意位置；带最小化按钮（点击后只剩一个细条 + 上下步按钮，方便看棋盘）。这样原 `gameBoard / assets` 三段式 UI 完全不被挤占。

实现细节：
- 使用 `motion` 的 `drag` / `dragConstraints={{ top: -window.innerHeight, ... }}` 做拖拽（项目已用过 `motion`，见 [Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx) / [GameEnd](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/GameEnd/index.tsx)），避免引入新依赖。
- `dragListener={false}` + `dragControls`，**只在 header 拖把上响应**，避免点 dot 时误拖。
- `z-index: 70`（高于 overlay 的 60，确保始终可见）。
- 内容：
  - header（拖把 + 最小化按钮）
  - 状态行：`step+1 / total`，loading 时尾部 `...`
  - 控制按钮行：`« 初始 / ‹ 上一步 / 下一步 › / 终局 »`
  - 横向滚动 dot 列表：每个 dot 显示 `seq+1 + cmdType 中文 label`，hover/title 显示 `playerID + cmdType`，当前 step 高亮。
- 移动端（≤ 600px）：自动改为底部贴边、宽度 100%、关闭拖拽（`drag={false}` + 改用 `position: fixed; bottom: 0; left: 0; right: 0`），并保持最小化能力。
- 视觉与游戏暗色主题保持一致：深色半透明背景（`rgba(11, 18, 32, 0.92)` + `backdrop-filter: blur(8px)`）、青绿高亮 `#00b3a6`，参考 [variables.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/styles/variables.less)。

Props：

```ts
interface ReplayTimelineProps {
  events: EventMeta[];
  step: number;                    // -1 ~ events.length - 1
  setStep: (s: number) => void;
  loading?: boolean;
}
```

### 5. PC 全屏覆盖层：替换现 [ReplayModal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ReplayModal/index.tsx)

把 `src/view/GameBoard/components/ReplayModal/index.tsx` 重写为一个 **`position: fixed; inset: 0; z-index: 60`** 的覆盖层（不再用 `<Modal>`），背景沿用游戏背景色（不要白底圆角）。它内部直接渲染 `<ReplayContent gameId viewerID onExit={onClose} />`。

`index.module.less` 改为：
```less
.overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: var(--color-bg-slate, #0b1220);
}
```

`snapshotAdapter.ts` 不动；删除现 `ReplayModal/index.module.less` 里 modal 风格的样式块（仅保留 overlay）。

### 6. Mobile 路由：`<ReplayPage>`

路径：`src/view/Acquire/Replay/page.tsx`（薄壳）

读取 `useParams<{ gameId: string }>()` + `useProfile` 拿 viewer，渲染 `<ReplayContent gameId={Number(gameId)} viewerID={...} onExit={() => navigate(-1)} />`。

在 [routes.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/route/routes.tsx) 增加：
```tsx
{
  path: '/game/acquire/replay/:gameId',
  element: <AcquireReplayPage />
}
```

`AcquireReplayPage` 用 `lazy(() => import('@/view/Acquire/Replay/page'))`。

> 注：PC 用同一路径吗？—— **不用**。PC 在列表页直接弹覆盖层，不离开 `/game/acquire`；移动端走路由。这样 PC 体验保留「直接看完关闭即回」，移动端能享受浏览器后退键。

### 7. ProfileModal 入口分流

修改 [ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)：行点击改为：

```tsx
const isMobile = window.matchMedia('(max-width: 600px)').matches;
if (isMobile) {
  navigate(`/game/acquire/replay/${game.id}`);
  onClose();   // 关闭 ProfileModal，避免堆叠
} else {
  onReplay(game.id);   // 触发父级覆盖层
}
```

- 600px 与项目现有 mobile 断点一致（见 [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.module.less)、[Acquire/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/index.module.less)）。
- 引入 `useNavigate` from react-router-dom。

### 8. Header 行为不变

[Header/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/Header/index.tsx) 仍然挂载 `<ProfileModal>` 与 `<ReplayModal>`（`ReplayModal` 现已是覆盖层版本）。`onReplay(id)` 仅 PC 才会触发；移动端直接路由跳走，所以 `replayGameId` state 不会被 set，`ReplayModal` 不会渲染 —— 安全。

### 9. 删除 / 缩减
- 删除现 [ReplayModal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ReplayModal/index.module.less) 里 `.body / .boardArea / .sideWrap / .controls / .timeline` 等内嵌布局样式 —— 这些已迁到 `Replay/` 子组件。仅保留 `.overlay` 类。
- 现 `ReplayModal/index.tsx` 内 Board/CompanyInfo/PlayerAssets/Timeline 大段 JSX → 全部由 `<ReplayContent>` 接管。

## Assumptions & Decisions

1. **像素级复用**：通过 `import gameStyles from '@/view/Acquire/components/Game/index.module.less'` 直接引用游戏 CSS 模块，最大化与对局界面一致。Less / CSS Modules 在本项目支持（多个组件已在用）。
2. **PC 不再使用 Modal 组件**：弹窗组件本身是白底卡片样式，与游戏暗色主题冲突。改用 `inset:0` 覆盖层。
3. **保留 motion 进出场动画**（与原 Modal 体验对齐）：在 overlay 外层套 `<AnimatePresence>` + `<motion.div>` 做 fade。可选项，简单实现即可。
4. **Mobile 断点 600px**：与项目现有 less `@media (max-width: 600px)` 完全一致。
5. **Board 的 readonly 属性**：可选 + 默认 false，向后兼容；改动小、风险低。
6. **不引入新依赖**：仅复用已有 `react-router-dom / motion / antd`。
7. **不动 3D 版本**：继续仅做 2D 回放（后端 Snapshot 也只够 2D 渲染）。
8. **不持久化 step**：刷新会回到初始状态。本期保持简单，不写 URL query。

## Verification

1. PC 浏览器宽度 > 600px：列表页 hover 头像 → 个人主页 → 点击对局 → 屏幕被 **全屏暗色覆盖层** 覆盖，外观与进入游戏房间时一致；左上有"返回"，中部状态条显示 `回放中 1/N`，棋盘 / 公司栏 / 玩家手牌的栅格、间距、颜色与 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.tsx) 实时对局一模一样；**时间轴是一个浮动卡片**，初始锚在底部居中，**可拖拽到任意位置**，可最小化为细条；棋盘 / 公司 / 玩家手牌不被挤占。
2. 点击底部时间轴 dot / 按钮 → 棋盘 + 公司 + 手牌 同步更新，跳到终局时排名结果与后端 finalResult 对应（可通过 `data.result` 渲染）。
3. PC 点"返回" → 覆盖层消失，回到列表页（ProfileModal 仍打开或已关闭，按设计为已关闭也可，本期保持当前打开状态）。
4. 浏览器宽度 ≤ 600px（DevTools 切换到 iPhone）：点击对局 → 浏览器跳转到 `/game/acquire/replay/:id` 整页路由；样式与移动端进入对局后的画面一致（顶栏 left 隐藏 / `assets` 折叠等都靠原 less 媒体查询自动生效）；时间轴改为底部贴边浮窗（不可拖动），后退键能回到列表。
5. `tsc --noEmit` 与 `vite build` 不报错；现有 Game 实时对局体验 0 回归（Board 加 `readonly?` 是可选项，旧调用不传值→默认 false）。

## 变更文件清单

新建：
- `src/view/Acquire/Replay/index.tsx` + `index.module.less` —— ReplayContent
- `src/view/Acquire/Replay/components/ReplayTopBar/index.tsx`（不需要单独 less，复用 TopBar 的）
- `src/view/Acquire/Replay/components/ReplayTimeline/index.tsx` + `index.module.less`
- `src/view/Acquire/Replay/page.tsx` —— 移动端独立路由壳

修改：
- `src/view/Acquire/components/Game/components/Board/index.tsx` —— 增加可选 `readonly`
- `src/view/GameBoard/components/ReplayModal/index.tsx` —— 重写为 PC 全屏覆盖层，内部渲染 `<ReplayContent>`
- `src/view/GameBoard/components/ReplayModal/index.module.less` —— 仅保留 overlay 样式
- `src/view/GameBoard/components/ProfileModal/index.tsx` —— 入口按视口分流
- `src/route/routes.tsx` —— 新增 `/game/acquire/replay/:gameId`

保留不变：
- `src/view/GameBoard/components/ReplayModal/snapshotAdapter.ts`
- `src/api/history.ts` / `src/types/history.d.ts` / `src/hooks/request/useHistory.ts`
- `vite.config.ts` proxy
