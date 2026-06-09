# 个人主页弹窗样式对齐排行榜方案

## Summary

[ProfileModal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx) 当前用的是浅色主题（白底 / 灰边 / 蓝色 #1677ff），与项目其他弹窗（[LeaderboardModal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Leaderboard/index.tsx)、Acquire 暗色主题）完全脱节，视觉割裂。本次只调整 ProfileModal 的视觉，使其与 [LeaderboardModal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Leaderboard/index.tsx) 完全一致：

* 同样的 `.root` 暗色径向渐变容器（固定 `80vh / max-height: 90vh`、圆角 24px、深紫蓝渐变 + 深色板岩面）。
* 同样的 `themeAcquire / themeDavinci` 主题色变量（acquire 青绿、davinci 琥珀），并把高亮色（数值、链接 / hover、tag）切到该变量驱动。
* 同样的 header（深底 + 底边、强调色图标、白色标题、统一关闭按钮）。
* 同样的 row 卡片（深色卡 + accent hover border + 圆角 0.75rem）。
* 同样的 empty / loadingOverlay（深底 + 模糊 + soft 文案色）。
* 不动业务逻辑、props、布局（grid 列依旧、移动端 `.row` 重排依旧）。

## Current State Analysis

### 文件

* [ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx) — 渲染 `<Modal>` → `.header` + `.content`（无 `.root` 包裹），直接挂在 [Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx) 的 `children` 上。
* [ProfileModal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.module.less) — 浅色，缺暗色变量。
* 参考：[Leaderboard/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Leaderboard/index.tsx) + [Leaderboard/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Leaderboard/index.module.less)。
* [Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx) 容器本身是白底圆角 24px（[Modal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.module.less)），LeaderboardModal 是用一个 100% 撑满的 `.root` div 把暗色背景画在 children 内层覆盖白底；ProfileModal 也应当采用同样手法（不动 [Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx) 这个共享组件）。

### 差异对照

| 点位 | Leaderboard（目标） | ProfileModal（当前） |
|---|---|---|
| 外层 | `.root` 暗色径向渐变 + `themeAcquire/themeDavinci` 注入 `--accent` | 无 `.root`，沿用白底 |
| header | 深底 `rgba(2,6,23,0.4)`、accent 图标、白标题、统一 `.closeBtn` | 浅底、`#eee` 边、蓝图标、白底关闭 |
| 主标识色 | `--accent: @color-accent-teal` (acquire) / `#f59e0b` (davinci) | 写死 `#1677ff` |
| 卡片 | 深底 `rgba(15,23,42,0.65)` + 1px subtle border + 圆角 0.75rem + accent hover | 白底 + `#eee` border + `#1677ff` hover |
| stats | 渐变高亮 / accent 数值 | 灰底 + 蓝数字 |
| empty | `rgba(15,23,42,0.5)` + dashed | `#f5f6f8` 浅底 |
| loadingOverlay | `rgba(2,6,23,0.6)` + blur | `#fff` 白底（看着很突兀） |

### 颜色变量来源

[styles/variables.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/styles/variables.less) 已有：

* `@color-surface-strong-dark: rgba(15, 23, 42, 0.98);`
* `@color-text-main: #e2e8f0;` `@color-text-soft: #94a3b8;`
* `@color-border-subtle-dark`
* `@color-accent-teal` / `@color-accent-teal-soft`
* `@color-success-dark: #22c55e;` `@color-danger-dark: #f97373;`（用于胜/负 tag）

LeaderboardModal 已在内部用 `--accent` / `--accent-soft` 做主题切换，本次完全照搬这套 token，不引入新变量。

### tag（胜/负）颜色

* 胜：用 `@color-success-dark` + 半透明背景。
* 负：用 `@color-danger-dark` + 半透明背景。
* 替换原浅色 `#e6fff1 / #fff1f0`。

## Proposed Changes

只动 2 个文件，**不修改** [Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx) / [Leaderboard](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Leaderboard/index.tsx) / [variables.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/styles/variables.less) / hooks。

### 1. [ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)

* 把 `<Modal>` 的 children 用 `<div className={`${styles.root} ${isAcquire ? styles.themeAcquire : styles.themeDavinci}`}>...</div>` 包裹（与 LeaderboardModal 完全一致，复用同名类名）。
* 现有 `.header` / `.content` 全部移到 `.root` 内（顺序不变）。
* 不动 props、不动 `useEffect`、不动 `formatDate / formatDuration / getAcquireRank / handleRowClick / renderGameRow` 等业务逻辑。
* 不新增图标 / 文案。

### 2. [ProfileModal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.module.less)

整体重写为暗色主题，对齐 [Leaderboard/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Leaderboard/index.module.less) 的结构。要点：

```less
@import '../../../../styles/variables.less';

.root {
  width: 100%;
  height: 80vh;
  max-height: 90vh;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 0% 0%, rgba(11, 58, 63, 0.55), transparent 55%),
    radial-gradient(circle at 100% 100%, rgba(14, 39, 46, 0.7), transparent 55%),
    @color-surface-strong-dark;
  color: @color-text-main;
  border: 1px solid @color-border-subtle-dark;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  font-family: 'Inter', sans-serif;
  --accent: @color-accent-teal;
  --accent-soft: @color-accent-teal-soft;
}
.themeAcquire { --accent: @color-accent-teal; --accent-soft: @color-accent-teal-soft; }
.themeDavinci { --accent: #f59e0b; --accent-soft: rgba(245, 158, 11, 0.18); }

.header {
  // 与 Leaderboard 同款：深底 + bottom border + accent 图标 + 白标题 + closeBtn
}

.content {
  // 与 Leaderboard 同款：flex: 1; min-height: 0; padding: 1rem 1.1rem 1.2rem; gap: 0.9rem; position: relative;
}

.statsBar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
  .statItem {
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 0.8rem;
    padding: 0.8rem 1rem;
    text-align: center;
    .statLabel { color: @color-text-soft; font-size: 0.75rem; ... }
    .statValue { color: var(--accent); font-size: 1.2rem; font-weight: 700; }
  }
}

.listTitle { color: @color-text-soft; font-weight: 600; }

.list {
  // 同 Leaderboard 暗色滚动条
}

.row {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: @color-text-main;

  &.rowClickable:hover {
    border-color: var(--accent);
    box-shadow: 0 10px 24px -16px var(--accent);
    transform: translateY(-1px);
  }

  .col .label { color: @color-text-soft; }
  .col .value { color: @color-text-main; }
  .tagWin { background: rgba(34, 197, 94, 0.18); color: @color-success-dark; }
  .tagLose { background: rgba(249, 115, 115, 0.18); color: @color-danger-dark; }
}

.colTime .value { color: var(--accent); font-weight: 700; }

.empty {
  background: rgba(15, 23, 42, 0.5);
  border: 1px dashed rgba(148, 163, 184, 0.2);
  color: @color-text-soft;
}

.loadingOverlay {
  background: rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(2px);
  .loadingText { color: @color-text-soft; }
}
```

* 保留原 `@media (max-width: 600px)` 里的 `.row` grid-template-areas 重排（仅替换颜色 token）。
* 保留 grid 列宽 `minmax(150px, 1.8fr) ...`，不改业务可读性。
* 删掉 `.loadingWrap`（未使用）—— 可选，不影响功能；为保持 diff 干净，本期保留也可（决策见下）。

### 3. davinci 专用色

ProfileModal 之前没区分主题，本期跟 LeaderboardModal 对齐，依据 `gameType` 切类：

* `acquire` → `themeAcquire`（青绿）
* `davinci` → `themeDavinci`（琥珀）

`isAcquire` 已经在组件里算好（[ProfileModal/index.tsx#L63](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx#L63)），直接用。

## Assumptions & Decisions

1. **不动 [Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx) 共享组件**：它仍是白底圆角壳，靠 `.root` 在内部 `border-radius: 24px; overflow: hidden;` 把白色挡住——LeaderboardModal 已经验证此手法可行。
2. **不引入新颜色变量**：全部走 [variables.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/styles/variables.less) 已有 token + 行内 rgba（与 LeaderboardModal 完全同款值）。
3. **保留交互行为**：clickable / static row 区分仍存在；hover 仅 `rowClickable` 生效。
4. **保留功能样式细节**：胜负 tag 改深色版（`@color-success-dark` / `@color-danger-dark`）以保证与暗底对比度，不再用浅绿浅红。
5. **stats 数值色用 `var(--accent)`**：让"总场次/胜场/胜率/平均得分"在 acquire 是青绿、davinci 是琥珀，与 LeaderboardModal 保持一致。
6. **不删 `.loadingWrap`** 这个未使用类（保持最小 diff）。
7. **不改组件 Modal 中文档结构**：`<Modal>` 直挂 `<div className={styles.root}>`，里面才放 `.header` 和 `.content`。这与 LeaderboardModal 一致。

## Verification

1. 在 PC（>=768px）打开 `/game/acquire` → hover 头像 → 「个人主页」：
   * Modal 容器外观是暗色板岩 + 青绿径向渐变（与 「Acquire 排行榜」 一致）。
   * 顶部 header 深色、UserOutlined 图标青绿、标题白色、关闭按钮 hover 浅高亮。
   * stats 4 个卡片暗底；数值 `00b3a6` 青绿。
   * 历史列表卡片暗底，hover 时整张卡边框变青绿、上浮 1px、阴影青绿。
   * 胜/负 tag 在暗底上对比度合适（绿色 / 红色）。
2. 切到 `/game/davinci` 打开个人主页：
   * 主色变为琥珀 `#f59e0b`，与 「达芬奇密码 排行榜」 完全一致。
3. 移动端（< 600px）：`.statsBar` 仍 2 列；`.row` 仍按 grid-areas 折行；颜色全部走暗色，无白底残留。
4. 排行榜弹窗对比：把"排行榜"和"个人主页"两个 modal 同时打开（先关再开），整体外形 / 圆角 / 渐变 / 关闭按钮 / 卡片间距视觉一致。
5. 加载态：初次打开时 `loadingOverlay` 是暗色半透明 + blur，不再是白色覆盖层。
6. 空状态："暂无历史对局" 文案在暗底 + dashed border 卡片中显示。
7. `tsc --noEmit` 通过；其它视图（Leaderboard、GameBoard、Acquire、DaVinci）零回归（只动 ProfileModal 两文件）。

## 变更文件清单

修改：

* [src/view/GameBoard/components/ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx) —— 在 `<Modal>` 与 `.header`/`.content` 之间插入 `<div className={`${styles.root} ${isAcquire ? styles.themeAcquire : styles.themeDavinci}`}>`，其余结构不变。
* [src/view/GameBoard/components/ProfileModal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.module.less) —— 整体重写为对齐 LeaderboardModal 的暗色主题，含 `.root / .themeAcquire / .themeDavinci / .header / .content / .statsBar / .listTitle / .list / .row / .empty / .loadingOverlay` 与 600px 媒体查询。

不新增 / 不删除文件。
