# 达芬奇密码 PC 端 TopBar 第二行居中 + Canvas 下移方案

## Summary

PC 端进入达芬奇密码对局后存在两个视觉问题：

1. \*\*TopBar 第二行（最近一次猜牌结果 / 行动提示条 `.lastActionPanel`）\*\*目前继承父容器 `align-items: flex-end`，被挤到右侧，与第一行（规则按钮 / Player VS AI / 状态 / 倒计时 / 重开）一起贴右，看起来不对称、不居中。期望：第二行整条横向居中。
2. **棋盘 Canvas 区（`.main`** **→** **`.board`）顶端贴得太靠上**。`.header` 是 `position: fixed`，固定高度 = 第一行 (\~36px) + 第二行 (\~40\~48px) + gap 8px + 上下 padding 24\~32px ≈ 140px，但 [`.main`](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less) 上 PC（`@md`）只留了 `padding-top: 96px`，第二行经常压在棋盘上，或刚好相切，视觉拥挤。期望：把棋盘整体下移一点，使第二行下方留出明显空隙。

只调 [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less) 一份样式即可，不动 JSX，不改交互逻辑。

## Current State Analysis

文件：[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

### `.header` 结构

```less
.header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
  padding: 12px 16px;             // @sm: 16/24, @md: 24/32
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;          // ← 两行都右对齐
  gap: 8px;
  ...
}
```

`.header` 直接子元素只有两个（[Game/index.tsx#L286-L370](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L286-L370)）：

1. `.headerRight`（永久存在，第一行：规则 / Player VS AI / 状态 / 倒计时 / 重开）\
   样式里它已经 `width: 100%; justify-content: flex-end`，所以无视父容器的 `align-items`，自身宽度撑满整条 → 第一行不受影响。
2. `.lastActionPanel`（条件渲染，第二行）\
   样式里 `width: min(560px, 100%); margin: 0`，**没有** **`align-self`，被父容器** **`align-items: flex-end`** **拉到右边**。

### `.main` 顶部留白

```less
.main {
  padding-top: 64px;     // 默认
}
@media (min-width: @sm) { .main { padding-top: 80px; } }
@media (min-width: @md) { .main { padding-top: 96px; } }   // ← PC
```

`.board` 紧挨 `.main` 内部 `flex: 1`，没有自己的 `margin-top`。`@md` 时实际占用约 96px，但 fixed header 在显示第二行时高度约 24（top padding）+ 36 + 8 + 40 + 24（bottom padding）≈ 132px，**差了至少 30+ px**，所以 canvas 顶端会被第二行覆盖或紧贴。

### 移动端 / 横屏

`@media (orientation: landscape) and (max-height: 500px)` 已单独写过 `.header` `.main` 的紧凑值。本次只动 PC（`@md`）相关分支与默认分支，不破坏移动 / 横屏紧凑布局。

## Proposed Changes

只修改 [Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)。

### 1. 让 `.lastActionPanel` 居中

最小改动方案：在 `.lastActionPanel` 选择器里加 `align-self: center` 与 `margin: 0 auto`，覆盖父级 `align-items: flex-end` 的拉伸效果。`width: min(560px, 100%)` 保持不变 → 限定最大宽度后水平居中。

```less
.lastActionPanel {
  position: static;
  z-index: 20;
  width: min(560px, 100%);
  margin: 0 auto;          // ← 新增
  align-self: center;      // ← 新增（覆盖父级 align-items: flex-end）
  pointer-events: none;
  ...                      // 其余保持
}
```

> 不动 `.headerRight`：它已经 `width: 100%`，本身就横跨整行，不会被父级 `align-items` 影响。

### 2. 棋盘 Canvas 区下移

加大 `.main` 的 `padding-top`，让 canvas 始终在第二行（lastActionPanel）下方留出 16px 左右空隙。

| 断点         | 现值                  | 改为      | 理由                                               |
| ---------- | ------------------- | ------- | ------------------------------------------------ |
| 默认（mobile） | `padding-top: 64px` | `96px`  | header 在 mobile 下也是两行，原 64 偏紧                    |
| `@sm`      | `padding-top: 80px` | `120px` | sm 下行高更大                                         |
| `@md` (PC) | `padding-top: 96px` | `148px` | 第一行 36 + gap 8 + 第二行 40 + 上下 padding 32+32 ≈ 148 |

> 横屏紧凑分支（`(orientation: landscape) and (max-height: 500px)`）维持 `padding-top: 48px` 不动 —— 该场景下 header 也被压扁，原值仍合理。

### 3. （可选保险）防止 lastActionPanel 在极窄屏幕里溢出 `.header`

`.header` 横向左右 padding 已经够，`width: min(560px, 100%)` 在加 `margin: 0 auto` 后会自动收缩到容器宽，无需再改。

## Assumptions & Decisions

1. **只改 less，不动 JSX**：组件结构合理，文案居中是布局问题，应当用 CSS 解决。
2. **保留 fixed header**：用户没要求改成静态布局；继续用增大 `.main` 顶部内边距的方式给棋盘让位，最小风险。
3. **不引入 JS 动态测高**：fixed header 的高度在两行模式下接近恒定，硬编码 padding 就够；后续若文案换行会变高，再考虑。
4. **居中只改第二行**：第一行 `.headerRight` 是工具栏，按钮整体右对齐符合习惯，不动。
5. **断点参考现有** **`@sm: 640px / @md: 768px`**：与项目其他分支一致。

## Verification

1. PC 浏览器宽度 ≥ 768px：进入 `/game/davinci/match?roomID=...` 后，TopBar 第二行（猜牌结果 / 行动提示）水平居中显示在屏幕中线，与第一行右对齐的工具栏视觉错落。
2. 棋盘容器（`.board`）顶部不再被 header 第二行遮挡；第二行底边到棋盘顶部至少 16px 间距。
3. 第二行不存在时（无 `lastGuessView` & 无 `actionPromptView`），棋盘留白略多但\*\*仍符合"略偏下"\*\*的预期；不应再被新增 padding 顶到看不到底部内容（因 `.main` 高度是 `100vh`，flex `.board` 自动收缩）。
4. 移动端（< 640px）：第二行与原先一致（继续居中 / 满宽），棋盘下移后视觉舒展。
5. 横屏（高度 < 500）：保持原紧凑值，无回归。
6. `tsc --noEmit` 无新增报错（实际不改 ts）；项目其他视图（Acquire / Splendor）零影响（只动 DaVinci 的 less 模块）。

## 变更文件清单

修改：

* [src/view/DaVinci/components/Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

  * `.lastActionPanel`：加 `align-self: center; margin: 0 auto;`

  * `.main`：默认 `padding-top: 64px → 96px`

  * `@media (min-width: @sm) .main`：`padding-top: 80px → 120px`

  * `@media (min-width: @md) .main`：`padding-top: 96px → 148px`

