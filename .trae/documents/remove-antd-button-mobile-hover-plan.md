# 移除 AntD Button 移动端 Hover 计划

## Summary

当前移动端按钮仍出现白色 hover 背景，根因高度疑似 AntD `Button` 自带 `.ant-btn` hover/touch 样式在触屏点击后残留或覆盖 CSS Modules。修复方向不再继续覆盖 AntD Button，而是将项目内按钮类交互迁移到原生 `button`/自研 `Button`，并将二次确认弹窗从 AntD `Modal.confirm` 迁移到自研确认弹窗，彻底消除按钮和确认弹窗里的 AntD 默认移动端交互影响，同时保留符合行业规范的 pressed、focus、disabled、PC hover 反馈。

本计划移除两类 AntD 交互入口：`Button` 和 `Modal.confirm`。`Dropdown`、`Popover`、`Tooltip`、`message`、`Spin` 等非按钮/非确认弹窗组件先保留，避免扩大无关风险。

## Current State Analysis

* `src/components/Button/index.tsx` 当前仍然 `import { Button as ButtonAntd } from 'antd'`，并渲染 `<ButtonAntd>`；即使 CSS Modules 限制了 hover，AntD `.ant-btn` 仍可能在移动端注入白色 hover/active 背景。

* `src/components/Button/index.module.less` 已加了 `@media (hover: none), (pointer: coarse)`，但它只能覆盖自定义 class，无法从根上避免 AntD 内部选择器和运行时状态。

* 复用 `src/components/Button` 的关键页面包括：

  * `src/view/GameBoard/index.tsx`

  * `src/view/GameBoard/components/Header/index.tsx`

  * `src/view/GameBoard/components/RoomCard/index.tsx`

  * `src/view/Acquire/components/Game/components/TopBar/index.tsx`

  * `src/view/Acquire/Replay/components/ReplayTopBar/index.tsx`

  * `src/view/Acquire/components/Match/components/Header/index.tsx`

  * `src/view/DaVinci/components/Match/components/Header/index.tsx`

* 仍直接使用 AntD `Button` 的文件包括：

  * `src/view/Acquire/components/Game/components/TopBar3D/index.tsx`

  * `src/view/Acquire/components/Game/components/Board3D/index.tsx`

  * `src/view/Acquire/components/Game/components/MessageSender/index.tsx`

  * `src/view/Splendor/components/MessageSender/index.tsx`

  * `src/view/Splendor/components/GemSelect/index.tsx`

  * `src/view/Splendor/index.tsx`

  * `src/view/Splendor/components/CardBoard/index.tsx`

  * `src/view/Splendor/components/GameEnd/index.tsx`

  * `src/components/CustomInputer/index.tsx`

* `src/view/Acquire/components/Game/components/PlayerAssets3D/index.module.less` 里存在 `:global(.ant-btn)` 和 `:global(.ant-btn:hover)`，这是为 AntD Button 写的样式，也需要跟随移除。

* `src/view/Acquire/components/Game/components/MessageSender/index.module.less` 和 `src/view/Splendor/components/MessageSender/index.module.less` 当前 `.messageButton:hover` 会在移动端变成白色/浅蓝背景，且按钮本体也是 AntD Button。

* `src/components/Modal/index.tsx` 是已有自研弹窗容器，使用 `motion/react` 和 `AnimatePresence`，当前只支持 `visible/onClose/children`，样式在 `src/components/Modal/index.module.less` 中通过 `@media (max-width: 600px)` 将宽度从 70% 调为 90%。

* 仍使用 AntD `Modal.confirm` 的二次确认位置包括：

  * `src/view/GameBoard/components/Header/index.tsx`：退出登录确认。

  * `src/view/Acquire/components/Game/components/TopBar/index.tsx`：离开房间确认。

  * `src/view/Acquire/components/Game/components/TopBar3D/index.tsx`：离开房间确认。

  * `src/view/Acquire/components/Game/components/GameEnd/index.tsx`：重新开始确认，当前用 `Modal as AntModal`。

  * `src/view/Acquire/components/Match/components/Header/index.tsx`：离开 Match 房间确认。

  * `src/view/DaVinci/components/Match/components/Header/index.tsx`：离开 Match 房间确认。

  * `src/view/Acquire/components/Match/components/PlayerCard/hooks/useSeatAction.ts`：移除玩家确认。

  * `src/view/DaVinci/components/Match/components/PlayerCard/hooks/useSeatAction.ts`：移除玩家确认。

  * `src/view/Splendor/index.tsx`：退出登录确认。

  * `src/view/Splendor/components/GameEnd/index.tsx`：重新开始确认。

## Proposed Changes

### 1. 将通用 Button 改为原生 button

文件：`src/components/Button/index.tsx`

* 移除 `antd` 的 `Button` 和 `ButtonProps` 引入。

* 将 `IButtonProps` 改为继承 `React.ButtonHTMLAttributes<HTMLButtonElement>`，保留现有 `icon`、`content`、`style`、`customType`。

* 渲染原生 `<button type={type ?? 'button'}>`，避免表单默认 submit。

* 合并外部 `className`，保证已有调用传入 class 时不丢失。

* 保持 `{icon}{content}{children}` 渲染兼容，避免调用方使用 children 时丢内容。

* 禁止继续输出任何 `ant-btn` class，从根上消除 AntD Button 白色 hover。

### 2. 强化自研 Button 样式状态

文件：`src/components/Button/index.module.less`

* 使用 `appearance: none; border: 0; font: inherit;` 等 reset，保证原生按钮跨浏览器一致。

* 默认态、主按钮态、disabled、focus-visible、active 状态全部由自研样式控制。

* PC hover 只放在 `@media (hover: hover) and (pointer: fine)` 内。

* 移动端 `@media (hover: none), (pointer: coarse)` 显式设置 hover 不改变背景、颜色、边框和阴影，只保留 `:active` 的 pressed 反馈。

* 主按钮 pressed 使用同色系变暗和轻微 scale，不出现白色背景。

### 3. 替换 Acquire 直接使用 AntD Button 的位置

文件：`src/view/Acquire/components/Game/components/TopBar3D/index.tsx`

* `import { Button, Modal, Typography, Space, Divider } from 'antd'` 改为：

  * `import { Modal, Typography, Space, Divider } from 'antd'`

  * `import { Button } from '@/components/Button'`

* 将 `type="primary" | "default" | "text"`、`size="large"` 等 AntD Button props 改成自研 Button 支持的 `customType`、`className`、`style` 或纯 class。

* 返回按钮、工具按钮、动态动作按钮全部使用自研 Button，避免 `.ant-btn`。

文件：`src/view/Acquire/components/Game/components/Board3D/index.tsx`

* 移除 `import { Button } from 'antd'`。

* 引入 `import { Button } from '@/components/Button'`。

* 重置视角按钮使用 `customType="primary"` 或现有 `resetCameraBtn` class 控制。

文件：`src/view/Acquire/components/Game/components/MessageSender/index.tsx`

* 保留 AntD `Popover` 和 `message`，移除 AntD `Button`。

* 引入 `Button` 自研组件或直接使用原生 `button`。

* 圆形消息按钮保留 `disabled`、icon、倒计时文本。

文件：`src/view/Acquire/components/Game/components/PlayerAssets3D/index.module.less`

* 删除 `:global(.ant-btn)` 和 `:global(.ant-btn:hover)` 样式，改为对自研按钮 class 或 `.messageButton` 自身写样式。

### 4. 替换 Splendor/公共直接使用 AntD Button 的位置

文件：

* `src/view/Splendor/components/MessageSender/index.tsx`

* `src/view/Splendor/components/GemSelect/index.tsx`

* `src/view/Splendor/index.tsx`

* `src/view/Splendor/components/CardBoard/index.tsx`

* `src/view/Splendor/components/GameEnd/index.tsx`

* `src/components/CustomInputer/index.tsx`

处理方式：

* 移除这些文件里的 AntD `Button` import，改用 `src/components/Button`。

* 原 AntD `type="primary"` 映射为 `customType="primary"`。

* `disabled`、`onClick`、`className`、`style` 保持。

* `shape="circle"`、`size="large"` 这类 AntD 专属 props 改为 CSS class 实现。

* 对需要紧凑/圆形/卡牌底部按钮的场景，补充局部 CSS class，不再依赖 AntD button 默认样式。

### 5. 移动端 hover 白色兜底

文件：

* `src/view/Acquire/components/Game/components/MessageSender/index.module.less`

* `src/view/Splendor/components/MessageSender/index.module.less`

* `src/view/Acquire/components/Game/components/TopBar3D/index.module.less`

* `src/view/Acquire/components/Game/components/Board3D/index.module.less`

* 以及 Splendor/CustomInputer 对应按钮样式文件

处理方式：

* 所有按钮 hover 样式都包进 `@media (hover: hover) and (pointer: fine)`。

* 移动端用 `:active` 表达 pressed，样式为轻微 `scale(0.97~0.99)`、阴影收敛、同色系变暗。

* 明确禁止移动端 hover 变白：`@media (hover: none), (pointer: coarse)` 中不写浅色 hover 背景。

* 对消息按钮 `.messageButton:hover` 这种现有白色/浅蓝 hover，改为 PC-only；移动端保持蓝色底，只在 active 时压下。

### 6. 保留非按钮 AntD 组件

### 6. 新增自研 ConfirmDialog 与 useConfirmDialog

文件：

* `src/components/ConfirmDialog/index.tsx`

* `src/components/ConfirmDialog/index.module.less`

* `src/components/ConfirmDialog/useConfirmDialog.tsx`

具体实现：

* 新增声明式确认弹窗组件 `ConfirmDialog`，基于现有 `src/components/Modal` 或同样的 `motion/react` 动画能力实现。

* 支持参数：

  * `visible`

  * `title`

  * `content`

  * `okText`

  * `cancelText`

  * `danger`

  * `loading`

  * `onConfirm`

  * `onCancel`

* 新增 `useConfirmDialog()` Hook，返回：

  * `confirm(options): Promise<boolean>`

  * `ConfirmDialogHolder`

* 调用方式示例：

```tsx
const { confirm, ConfirmDialogHolder } = useConfirmDialog();

const handleLeave = async () => {
  const ok = await confirm({
    title: '确认操作',
    content: '你确定要离开房间吗？',
    okText: '确认',
    cancelText: '取消',
    danger: true,
  });
  if (!ok) return;
  // 原 onOk 逻辑
};

return (
  <>
    {ConfirmDialogHolder}
    ...
  </>
);
```

* 确认弹窗内部按钮必须使用自研 `Button`，不能使用 AntD Button。

* 弹窗背景点击是否关闭沿用自研 Modal 的 `onClose`，确认类弹窗默认允许取消关闭，但不触发确认逻辑。

* `useConfirmDialog` 要避免 stale closure：每次 `confirm` 存储当前 options，并在确认/取消后清理 resolver 和状态。

### 7. ConfirmDialog 移动端适配

文件：`src/components/ConfirmDialog/index.module.less`

* PC：居中卡片，宽度约 `min(24rem, 92vw)`，按钮横向排列，hover 只在精细指针设备启用。

* 移动端：使用底部弹层/Action Sheet 风格，`bottom: 0`、圆角在顶部、宽度 100%，按钮高度不低于 `44px`，按钮可全宽纵向排列或保留双按钮横排但确保触控面积。

* 移动端按钮不使用 hover；仅使用 `:active` 的 pressed 反馈。

* 标题、正文、危险确认按钮要有清晰层级；危险操作如“移除玩家”“退出房间”“重新开始”使用危险色，但不使用白色 hover。

* 支持 `prefers-reduced-motion`：减少弹窗 scale/spring 动画，只做淡入淡出或缩短动画。

### 8. 替换 AntD Modal.confirm

文件：

* `src/view/GameBoard/components/Header/index.tsx`

* `src/view/Acquire/components/Game/components/TopBar/index.tsx`

* `src/view/Acquire/components/Game/components/TopBar3D/index.tsx`

* `src/view/Acquire/components/Game/components/GameEnd/index.tsx`

* `src/view/Acquire/components/Match/components/Header/index.tsx`

* `src/view/DaVinci/components/Match/components/Header/index.tsx`

* `src/view/Splendor/index.tsx`

* `src/view/Splendor/components/GameEnd/index.tsx`

处理方式：

* 引入 `useConfirmDialog`。

* 删除 AntD `Modal` / `Modal as AntModal` import 中只用于 `Modal.confirm` 的部分。

* 在组件 JSX 根部渲染 `{ConfirmDialogHolder}`。

* 将原 `Modal.confirm({ title, content, okText, cancelText, onOk })` 改为 `await confirm(...)` 后执行原 `onOk` 逻辑。

文件：

* `src/view/Acquire/components/Match/components/PlayerCard/hooks/useSeatAction.ts`

* `src/view/DaVinci/components/Match/components/PlayerCard/hooks/useSeatAction.ts`

* `src/view/Acquire/components/Match/components/PlayerCard/index.tsx`

* `src/view/DaVinci/components/Match/components/PlayerCard/index.tsx`

处理方式：

* `useSeatAction` 不再 import AntD `Modal`。

* `useSeatAction` 增加参数 `confirm: (options) => Promise<boolean>`。

* `PlayerCard` 内使用 `useConfirmDialog`，传入 `confirm`，并在卡片 JSX 中渲染 `{ConfirmDialogHolder}`。

* 移除玩家逻辑改为：

  * `const ok = await confirm({ title: '确认操作', content: '你确定要移除玩家吗？', okText: '确认', cancelText: '取消', danger: true })`

  * `ok` 后发送 `match_remove_player` 消息。

### 9. 保留非按钮/非确认弹窗 AntD 组件

保留以下组件不改：

* `Dropdown`

* `Popover`

* `Tooltip`

* `message`

* `Spin`

* `Spin`

* `Typography` / `Space` / `Divider`

原因：本次反馈集中在按钮 hover 和确认弹窗交互；这些保留项承担弹层、提示、排版、异步反馈能力，不直接产生当前按钮白色 hover 问题。后续如发现 Popover/Dropdown 在移动端也存在交互问题，再单独替换。

## Assumptions & Decisions

* “全面去掉 antd 组件”在本次问题语境下按“全面去掉 AntD Button 和 AntD Modal.confirm”执行；保留非按钮/非确认弹窗 AntD 组件。

* 自研 `Button` 要兼容现有调用方常用 props：`onClick`、`disabled`、`className`、`style`、`children`、`icon`、`content`。

* 不再尝试用更高优先级 CSS 覆盖 `.ant-btn:hover`，因为移动端触屏 hover 残留的根因来自组件库默认样式和浏览器触摸状态叠加。

* 所有 PC hover 必须用 `(hover: hover) and (pointer: fine)` 包裹；所有移动端反馈必须来自 `:active` 或显式状态，而不是 hover。

* 所有二次确认必须走自研 `ConfirmDialog`，且移动端使用更适合触控的布局和按钮尺寸。

## Verification

* 运行 `Grep` 确认代码中不再有 `import { Button } from 'antd'`、`import { ..., Button, ... } from 'antd'`、`Button as ButtonAntd`、`:global(.ant-btn)`。

* 运行 `Grep` 确认代码中不再有 `Modal.confirm`、`Modal as AntModal`。

* 运行 `npx tsc --noEmit`，确认类型通过。

* 使用 `GetDiagnostics` 检查编辑文件。

* 尝试运行 `npm run build`；如果仍因当前 Node `18.20.4` 与 Vite `20.19+` 要求不兼容失败，需要记录环境失败原因。

* 手动验证移动端：

  * 房间列表创建房间/进入房间按钮点击不出现白色 hover 背景。

  * Match 添加人机/开始游戏/准备按钮点击不出现白色 hover 背景。

  * Acquire TopBar/TopBar3D/Board3D/消息按钮点击不出现白色 hover 背景。

  * Splendor 页面按钮点击不出现 AntD 白色 hover 背景。

  * 退出房间、移除玩家、退出登录、重新开始等确认弹窗在移动端以底部弹层或移动端适配布局展示，按钮触控面积足够，点击不出现白色 hover。

* 手动验证 PC：

  * 鼠标 hover 仍有轻微、同色系反馈。

  * 按下时有 pressed 反馈。

  * 键盘 Tab focus-visible 清晰。

  * disabled 按钮没有 hover/pressed 误导。

  * 确认弹窗居中展示，确认/取消按钮支持键盘聚焦和 Enter/Space 触发。

