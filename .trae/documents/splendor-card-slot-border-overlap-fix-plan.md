# Splendor 卡牌选中/可购买外框重叠修复计划

## Summary

修复 Splendor 场上卡牌在新增稳定 slot 后，选中/可购买绿色外框与卡牌本体重叠的问题。

目标效果：
- 卡牌本体保持当前 `NormalCard.md` 尺寸。
- 选中/可购买的绿色外框仍然显示在外层。
- 外框与卡牌之间保留清晰间距，不贴边、不压住卡牌内容。
- 稳定槽位与补牌动画逻辑不变。

## Current State Analysis

相关文件：
- `src/view/Splendor/components/Game/components/CardBoard/index.tsx`
- `src/view/Splendor/components/Game/components/CardBoard/index.module.less`
- `src/view/Splendor/components/Game/components/Card/NormalCard/index.module.less`

当前结构：
- `CardBoard/index.tsx` 中每个场上牌现在渲染为稳定 slot：
  - 外层：`.cardSlot`
  - 内层：`.cardSlotInner`
  - 卡牌：`<NormalCard card={card} size="md" />`
- `.cardSlot` 负责：
  - 固定槽位尺寸；
  - hover/selected/buyable 状态；
  - 空槽占位；
  - motion layout。
- `NormalCard.md` 桌面尺寸是 `5rem x 7rem`，移动端是 `5.6rem x 7.8rem`。

当前问题：
- `.cardSlot` 也被设置为桌面 `5rem x 7rem`、移动端 `5.6rem x 7.8rem`。
- `.cardSlot` 同时有 `padding: 2px` 和状态 `box-shadow`。
- 因为 slot 与卡牌本体尺寸一致，外框没有独立空间，绿色外框视觉上会和卡牌边缘/卡牌阴影重叠。

根因：
- 稳定 slot 引入后，slot 容器从“包裹卡牌的外层”变成了“和卡牌同尺寸的布局占位”。
- 选中/可购买外框仍然画在 slot 上，但 slot 没比卡牌大，因此外框没有外层留白。

## Proposed Changes

### 1. `CardBoard/index.module.less`：扩大 slot 外层尺寸

文件：`src/view/Splendor/components/Game/components/CardBoard/index.module.less`

改动：
- 桌面 `.cardSlot` 从 `5rem x 7rem` 调整为卡牌尺寸加外框间距：
  - `width: calc(5rem + 8px);`
  - `height: calc(7rem + 8px);`
  - `padding: 4px;`
  - `box-sizing: border-box;`
- 移动端 `.cardSlot` 从 `5.6rem x 7.8rem` 调整为：
  - `width: calc(5.6rem + 8px);`
  - `height: calc(7.8rem + 8px);`

为什么：
- 外层 slot 专门承载状态外框和 hover 位移。
- 内部卡牌保持原始尺寸。
- 外框与卡牌之间始终有 `4px` 缓冲，不会重叠。

### 2. `CardBoard/index.module.less`：让 `.cardSlotInner` 居中承载卡牌

文件：`src/view/Splendor/components/Game/components/CardBoard/index.module.less`

改动：
- `.cardSlotInner` 保持 `width: 100%; height: 100%`。
- 增加：
  - `display: flex;`
  - `align-items: center;`
  - `justify-content: center;`

为什么：
- slot 变大后，卡牌需要在 slot 内稳定居中。
- motion 入场动画仍作用在 `.cardSlotInner`，不影响外框层。

### 3. `CardBoard/index.module.less`：保持外框状态只画在 slot 上

文件：`src/view/Splendor/components/Game/components/CardBoard/index.module.less`

保留：
- `.cardSlot.selected`
- `.cardSlot.buyable`
- `.cardSlot.selected.buyable`

不改动 `NormalCard/index.module.less`：
- 卡牌本体视觉是独立组件，不应为了外层选择态修改。
- 这样不会影响预留卡、历史展示或其他复用 `NormalCard` 的地方。

### 4. `CardBoard/index.tsx`：原则上不改逻辑

文件：`src/view/Splendor/components/Game/components/CardBoard/index.tsx`

计划：
- 不改稳定 slot 算法。
- 不改动画参数。
- 不改 selected/buyable class 绑定。

只有在样式调整后发现 motion 子层无法居中时，才考虑给 `.cardSlotInner` 保持当前 class，不新增额外 DOM。

## Assumptions & Decisions

- “绿色 border/boarder”指的是 `.buyable` 或 `.selected.buyable` 的绿色 `box-shadow` 外框。
- 修复目标是让绿色外框在卡牌外侧显示，而不是移除绿色外框。
- 选中且可购买时继续优先显示绿色外框，符合当前逻辑。
- 不改变卡牌尺寸，不影响场上稳定槽位数量。
- 不改 `UserData` 的预留卡高亮样式；本问题只发生在 `CardBoard` 稳定 slot 改造后。

## Verification Steps

1. 类型检查：
   - 运行 `npx tsc --noEmit`
   - 期望无 TypeScript 错误。
2. 静态诊断：
   - 检查 `CardBoard/index.module.less`
   - 期望无新增 diagnostics。
3. 手动验证：
   - 进入 Splendor 对局。
   - 选择一张可购买的场上牌。
   - 观察绿色外框应位于卡牌外侧，和卡牌边缘有间距。
   - hover/selected 位移仍正常。
   - 补牌动画仍在原位发生。
   - 移动端卡牌外框也不重叠。
