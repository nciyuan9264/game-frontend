# DaVinci Header 顶部 chip 排列与样式优化

## Summary

用户给的两个诉求（基于附图与 [Game/index.tsx#L142-L195](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L142-L195)）：

1. **去掉**最左侧的绿色 brand 块（Layers 圆角方块图标 + "Da Vinci Code / Strategic Deduction Board Game" 文案）。
2. 中间剩下的三个 chip（User-vs-Cpu / 当前状态 / Pool Remaining）大小、对齐不一致，**统一样式让它们成为风格一致、高度一致的小胶囊**。

## Current State Analysis

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx) + [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

### Header 当前 DOM（[Game/index.tsx#L145-L195](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L145-L195)）

```tsx
<header className={styles.header}>
  <div className={styles.brand}>...绿色图标 + Da Vinci Code 文案...</div>
  <div className={styles.headerRight}>
    <div className={styles.statusDesktop}>...User VS Cpu (md+)...</div>
    <div className={styles.statusMobile}>...User vs Cpu (md-)...</div>
    {!winner && <div className={styles.headerStatus}>...statusDot + gameStatus...</div>}
    {!winner && <div className={styles.headerInfo}><div className={styles.infoCard}>...Pool Remaining 数字...</div></div>}
    <button className={styles.resetBtn}><RotateCcw/></button>
  </div>
</header>
```

### 大小不一致根因（[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)）

- `statusMobile` [#L265-L273](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L265-L273)：圆胶囊，padding `4px 8px`，gap 4，**最矮最窄**。
- `statusDesktop` [#L249-L263](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L249-L263)：md+ 才显示，padding `8px 16px`，比 mobile 高一截。
- `headerStatus` [#L227-L243](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L227-L243)：圆角矩形（border-radius 12 → 16），padding `8px 16px`（sm+ `10px 18px`），高度比 statusMobile 大。
- `headerInfo > infoCard` [#L496-L515](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L496-L515)：padding 12（sm+ 16），固定宽度 128/160/192，内含两行（`POOL REMAINING` + 数字 + `Tiles`），**比另两个明显高且宽**。
- 三者圆角各不相同（`9999px` 胶囊、`12-16px` 圆角矩形、`12-16px` 圆角矩形大块），导致视觉破碎。

### 截图实测对照

附图里：左侧绿色色块（brand）、中间一个小胶囊（vs）、再一个深色 chip（`getCard`）、再一个大白边卡片（`POOL REMAINING / 13 Tiles`）、最右侧重置按钮。形态/高度都不一致——和上面的代码完全吻合。

## Proposed Changes

只动 [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx) 与 [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)。

### 1. [Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

**Why**：去除左侧绿色 brand 块；让中间 Pool Remaining chip 内容也是一行（label + 数字 + unit），方便和另外两个等高对齐。

**What/How**：

- 删除 [#L146-L154](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L146-L154) 整段 `<div className={styles.brand}>...</div>`。
- 删除已无用的 `Layers` 图标 import（[#L4](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L4) 内只移除 `Layers`，保留 `Cpu, Info, RotateCcw, Trophy, User`）。
- header 现在只剩 `headerRight`，为了让 reset 按钮仍居右、chips 居左，把 `<header>` 的 flex 改为 `flex-end` 或者直接让 `headerRight` 当唯一子项 `width:100%; justify-content:flex-end`，本次选**最简单的**：在 less 里把 `.header { justify-content: flex-end; }`，DOM 不再需要占位。
- `headerInfo` 的 `infoCard` DOM 改成单行：把 `infoLabel`、`infoCount`、`infoUnit` 放在同一行（保留这 3 个 className，只是排版改成行内），让它在视觉上和 `headerStatus`、`statusMobile/Desktop` 一样是个胶囊。具体：把 [#L178-L186](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L178-L186) 改成：
  ```tsx
  {!winner && (
    <div className={styles.headerInfo}>
      <span className={styles.infoLabel}>Pool</span>
      <span className={styles.infoCount}>{(Object.values(wsRoomSyncData?.roomData.boardCards ?? {}) || []).length}</span>
      <span className={styles.infoUnit}>Tiles</span>
    </div>
  )}
  ```
  即：去掉内层 `infoCard` 包装，直接用 `headerInfo` 当胶囊容器；同时把 label 由两行的 "POOL REMAINING" 简化为 "Pool"，让宽度和另两个 chip 接近。

> 不动 GameCanvas 区域的样式，不动其余 less 块。

### 2. [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

**Why**：把 `statusDesktop`、`statusMobile`、`headerStatus`、`headerInfo` 四个 chip 统一成"同色调 + 等高 + 等圆角"的胶囊。

**What/How**（具体改动均在原文件内）：

- `.header`（[#L94-L106](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L94-L106)）：`justify-content: space-between` → `justify-content: flex-end`。
- 抽一份共享 chip 视觉变量：在 `.header` 之后新增一组共用规则（不引入 `:global`，仍按 CSS Modules）：
  ```less
  .statusDesktop,
  .statusMobile,
  .headerStatus,
  .headerInfo {
    height: 32px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    gap: 8px;
    line-height: 1;
  }
  @media (min-width: @sm) {
    .statusDesktop,
    .statusMobile,
    .headerStatus,
    .headerInfo {
      height: 36px;
      padding: 0 14px;
    }
  }
  ```
- 删除/缩减原来各自的尺寸冲突规则：
  - `.statusDesktop`（[#L249-L263](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L249-L263)）保留 `display: none / @media md → flex`，移除自带 `padding / border-radius / background / border / gap`。
  - `.statusMobile`（[#L265-L278](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L265-L278)）保留 `display: flex / @media md → none`，移除 `padding / border-radius / background / border / gap`。
  - `.headerStatus`（[#L227-L243](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L227-L243)）整块移除自带 `padding / border-radius / gap / background / border / backdrop-filter`，仅保留 hover/inner 元素的样式（无）。换句话说这条规则可以删除整块（让共享规则生效）。
  - `.headerInfo`（[#L245-L247](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L245-L247)）移除原 `display: flex` 单行（已被共享规则覆盖）；`.infoCard` 整块（[#L496-L515](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L496-L515)）**删除**（DOM 已不再使用）。
- 收紧三个 chip 内文本尺寸，让它们目测一致：
  - `.infoLabel`（[#L517-L531](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L517-L531)）：`margin-bottom: 0`、`letter-spacing: 0.1em` 维持，字号统一为 10px（sm+ 11px）。
  - `.infoCount`（[#L544-L552](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L544-L552)）：`font-size: 0.875rem; font-weight: 600; line-height: 1`（去掉原 1.5/1.875rem 的大字）。
  - `.infoUnit`（[#L554-L564](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L554-L564)）：`margin-bottom: 0; font-size: 10px`。
- 低高度横屏适配 [#L962-L996](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L962-L996)：
  - 删除其中已不存在的 `.brandIcon` / `.brandText` 规则，删除 `.infoCard { ... }` 规则（DOM 已无）。

> 不删 `.brand / .brandIcon / .brandIconSvg / .brandText / .brandTitle / .brandSubtitle` 这些规则块，避免越界（DOM 删除后这些 class 自然不会被引用，留作未使用 CSS 即可）。这是为了"最小改动"。如果用户后续要清理可以再说。

## Assumptions & Decisions

- 直接删 brand 模块对应的 DOM，但**保留 less 中相关空规则**，避免顺手做超出范围的清理。
- 不去重写 GameEnd / Match 等其它视图。
- 不改动 `winner` 触发逻辑、`resetGame` 行为、`GameCanvas` props。
- 内容文案 "POOL REMAINING / 13 Tiles" 简化为 "Pool 13 Tiles" 一行，目的是让 chip 整体宽度可控、和其他两枚视觉等高；保留 "Pool" / 数字 / "Tiles" 三段文案以延续既有信息。
- 共享 chip 高度采用 32px / sm+ 36px，与 `headerRight` 内 `.resetBtn`（圆形 28~36px）以及 header padding 相协调。
- `statusDesktop` 在 md+ 才显示且包含较多文案，统一高度后宽度会自然撑开（flex 内容驱动）；不需要再单独 width。

## Verification Steps

1. `pnpm dev`，进入 `/game/davinci/match?roomID=...` 页面。
2. 视觉检查 Header：
   - 最左侧不再有绿色 Layers 图标块。
   - 中间 / 右侧 chip 高度肉眼一致、圆角一致、底色与边框一致；它们整体靠右排列；最右侧仍是 RotateCcw 重置按钮。
   - 切到窄屏（< md），`statusDesktop` 隐藏 `statusMobile` 出现，仍与另两个 chip 等高。
3. 切到 `gameStatus !== 'end'` 各阶段，chip 内文本（getCard / setCard / guessCard…）正常显示。
4. `gameStatus === 'end'` 时 `headerStatus` 与 `headerInfo` 隐藏（保留原 `!winner &&` 行为），不破坏 Victory 弹窗。
5. `pnpm tsc --noEmit` 通过。
