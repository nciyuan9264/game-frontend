# DaVinci 横屏适配调研与方案

## Summary

本次任务分为两部分：
1. **调研**：浏览器是否能识别手机横屏切换。
2. **方案**：达芬奇密码（DaVinci）页面在手机横屏时的适配方案。

调研结论：**浏览器能识别横屏切换**，且当前 `PIXI` 已通过 `resizeTo` 自动跟随容器尺寸重渲染，无需新增 orientation 监听。问题主要集中在 CSS 断点与 `GameCanvas` 内的尺寸阈值未覆盖"横屏低高度"场景，导致手机横屏下布局挤压、tile 太大。修复仅需：
- 给 `.main`/`.header` 增加针对短高度的横屏 media query。
- 在 `calculateTileDimensions` 中追加基于高度的尺寸下调逻辑。

## Current State Analysis

### 一、浏览器横屏识别能力（调研结果）

1. **`window.resize` 事件**：所有现代移动浏览器（iOS Safari、Chrome Android、各内置 WebView）在横竖屏切换后都会触发 `resize`，`window.innerWidth/innerHeight` 会随之互换。代码中已多处使用：
   - [useFullHeight.ts#L15](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/useFullHeight.ts#L15) 监听 `resize` 调整全屏高度。
   - [useScene.ts#L86](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/Board3D/hooks/useScene.ts#L86) 监听 `resize` 调用 `engine.resize()`。

2. **CSS `(orientation: landscape)` media query**：现代浏览器原生支持。代码中已有用例：
   - [Splendor/index.module.less#L209](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Splendor/index.module.less#L209)：`@media screen and (min-width: 768px) and (max-width: 1024px) and (orientation: landscape)`。
   - [util/window.ts#L1](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/util/window.ts#L1)：使用 `window.matchMedia('(orientation: landscape)')`。

3. **`screen.orientation` API + `orientationchange` 事件**：iOS 16.4+/Android Chrome 都已支持。`orientationchange` 在 iOS 上有时早于 viewport 更新，所以一般用 `resize` 更稳。

4. **PIXI 当前的响应**：[GameCanvas/index.tsx#L74-L102](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L74-L102)
   ```ts
   await app.init({
     resizeTo: containerRef.current,  // 自动 ResizeObserver 监听容器
     ...
   });
   app.renderer.on('resize', () => {
     renderGame(app);  // 容器变化即重渲染
   });
   ```
   `resizeTo` 会自动监听 window resize 并按容器尺寸调整 canvas，`renderer.on('resize')` 会触发完整重布局，所以 PIXI 部分**横屏切换天然支持**，无需引入额外监听。

**结论**：浏览器与 PIXI 都能识别横屏；剩下的问题是 CSS 与尺寸阈值。

### 二、当前在手机横屏下的具体问题

典型手机横屏视窗尺寸：宽 ~667–844 px、高 ~320–390 px。

1. **`.main` 顶部/底部 padding 过大** —— [Game/index.module.less#L357-L383](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L357-L383)
   ```less
   .main {
     padding-top: 64px;
     padding-bottom: 64px;
     height: 100vh;
   }
   @media (min-width: @sm /* 640px */) {
     .main {
       padding-top: 80px;
       padding-bottom: 80px;
     }
   }
   ```
   横屏下 `width >= 640px` 会进入 `@sm`，padding-top/bottom 共 160px，但 `height` 只有 320–390，导致 `.board` 实际可用高度仅 ~150–230px，tile 行严重挤压。

2. **`.header` 顶栏在低高度下相对过高** —— `padding: 16px 24px`，再加上 brand 的 SVG/title 行高约 36–40px。低高度横屏下顶栏占比可能超 25%。

3. **`calculateTileDimensions`（[#L36-L66](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L36-L66)）只按 width 选档**：
   ```ts
   if (width < 480) tileWidth = 40, tileHeight = 60;
   else if (width < 768) tileWidth = 50, tileHeight = 75;
   else if (width < 1024) tileWidth = 55, tileHeight = 82;
   else tileWidth = 60, tileHeight = 90;
   const maxTileHeight = height * 0.18;  // 已有高度限制
   ```
   `height * 0.18` 在 320 高度下 = 57.6，会缩到 ~57，但 row 数变多时可能仍堆叠超出。横屏 width 通常 768–844，所以会选 55×82 档，再被 `maxTileHeight` 拉到 ~57×?；实际跑下来 tile 看起来过大。

4. **`SPACING_Y`、`TOP_MARGIN`、`BOTTOM_MARGIN` 的 cap 没考虑高度过低**——[#L283-L284](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L283-L284)
   ```ts
   const TOP_MARGIN = Math.max(20, Math.min(40, height * 0.05));  // 320 时 ≈ 20
   const BOTTOM_MARGIN = Math.max(20, Math.min(40, height * 0.05));
   ```
   这部分较合理，无需改。

5. **`.footer` 在 sm 以下隐藏**——[#L930-L946](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less#L930-L946)，横屏（宽 ≥ 640）会显示规则文案 footer，会再吃掉底部一行。可在低高度横屏隐藏。

## Proposed Changes

只改两处：

### 修改 1：CSS 给"低高度横屏"加一个 media query —— [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

**Why**：在 `(orientation: landscape) and (max-height: 500px)` 时，缩小顶栏 padding、`.main` 上下 padding，并隐藏底部规则文案，腾出更多 board 区域。

**What/How**：在文件末尾追加：
```less
// 低高度横屏适配（典型手机横屏：高度 < 500）
@media (orientation: landscape) and (max-height: 500px) {
  .header {
    padding: 6px 12px;
  }
  .brandIcon {
    width: 28px;
    height: 28px;
  }
  .brandText {
    display: none;
  }
  .main {
    padding-top: 48px;
    padding-bottom: 8px;
    padding-left: 8px;
    padding-right: 8px;
    gap: 8px;
  }
  .footer {
    display: none;
  }
  .headerStatus {
    padding: 4px 10px;
    gap: 6px;
  }
  .infoCard {
    padding: 6px 10px;
    width: auto;
    min-width: 96px;
  }
  .modalCard {
    max-height: 86vh;
    padding: 12px;
  }
}
```
- 阈值取 `max-height: 500px`，覆盖几乎所有手机横屏（iPhone 横屏 320–428 高、安卓多在 360–412 高），同时规避 iPad 横屏（高度 ≥ 768）误命中。
- 同时叠加 `(orientation: landscape)`，以避免极矮窗口（PC 浏览器纵向缩小窗口）误触发。

### 修改 2：`calculateTileDimensions` 增加横屏低高度档 —— [GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

**Why**：当前阈值只看 `width`，导致手机横屏（width 668–844、height 320–390）走 55×82 档；高度过小，tile 仍偏大。

**What/How**：在现有 width 选档之前先做横屏判断，命中横屏低高度则强制小尺寸档；其余路径不变。

定位：[#L36-L66](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L36-L66)。

参考改动结构：
```ts
const calculateTileDimensions = useCallback((width: number, height: number) => {
  let tileWidth, tileHeight, tileRadius;
  const isShortLandscape = height < 500 && width > height; // 典型手机横屏
  if (isShortLandscape) {
    tileWidth = 42;
    tileHeight = 62;
    tileRadius = 6;
  } else if (width < 480) {
    tileWidth = 40; tileHeight = 60; tileRadius = 6;
  } else if (width < 768) {
    tileWidth = 50; tileHeight = 75; tileRadius = 7;
  } else if (width < 1024) {
    tileWidth = 55; tileHeight = 82; tileRadius = 7;
  } else {
    tileWidth = 60; tileHeight = 90; tileRadius = 8;
  }

  const maxTileHeight = height * 0.18;
  if (tileHeight > maxTileHeight) {
    const ratio = maxTileHeight / tileHeight;
    tileWidth = Math.floor(tileWidth * ratio);
    tileHeight = Math.floor(maxTileHeight);
    tileRadius = Math.max(4, Math.floor(tileRadius * ratio));
  }
  dimensionsRef.current = { tileWidth, tileHeight, tileRadius };
  return dimensionsRef.current;
}, []);
```
现有的 `maxTileHeight = height * 0.18` 限制保留，作为兜底。

### 不在本次改动范围

- 不强制锁定屏幕方向（`screen.orientation.lock`），保留用户自由选择。
- 不新增 orientation 监听 hook —— 现有 `resize` 与 PIXI `resizeTo` 已足够。
- 不改 `Game/index.tsx`、`DaVinci/index.tsx`、不改其他游戏（Splendor/Acquire）的样式。
- 不引入新依赖，不做全局响应式重构。
- 不改 [vite.config.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/vite.config.ts)、`index.html` 的 viewport meta（已有 `width=device-width, initial-scale=1.0`，足够）。

## Assumptions & Decisions

1. 浏览器与 PIXI 已能自动响应横屏切换，无需引入 `orientationchange` 监听，避免重复或抖动。
2. 阈值采用"`(orientation: landscape) and (max-height: 500px)`" + JS 中"`height < 500 && width > height`"二者一致，避免 CSS 命中而 JS 不命中（或反之）造成视觉不一致。
3. 不锁定横屏：iOS Safari 不支持非 PWA 的 `screen.orientation.lock()`，强制锁定不可移植；UI 提示让用户主动横屏的体验更通用，本次不做。
4. 改动只覆盖 DaVinci 组件，与之前修复 getCard / aside 路径动画的工作正交，不影响动画逻辑。

## Verification Steps

1. 浏览器 DevTools 切换到 iPhone SE/12/14 等设备，分别测试竖屏与横屏：
   - 竖屏：布局与改动前一致。
   - 横屏：顶栏更紧凑、`.main` 上下 padding 缩小、`.board` 区域可用面积明显变大、tile 尺寸合理。
2. 真机或模拟器：进入 DaVinci 房间后旋转屏幕：
   - PIXI canvas 立即跟随重新渲染，无白屏、无溢出。
   - 牌池、玩家手牌、对手手牌都重新自适应布局，且 row 不会被顶栏/底栏遮挡。
3. PC 上不同窗口大小拖拽：阈值 `max-height: 500px` 与 `width > height` 不会在常规桌面尺寸下触发，行为应与改动前一致。
4. 之前修复的 getCard / aside → row 动画在横屏下仍能从正确起点平滑过渡。
