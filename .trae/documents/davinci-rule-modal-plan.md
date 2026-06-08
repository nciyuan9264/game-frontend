# 达芬奇密码规则弹窗改造计划

## Summary

把达芬奇密码游戏界面左上角当前“Player vs AI”小图标区域改造成“游戏规则”弹窗打开按钮，并用符合当前暗色霓虹、玻璃拟态游戏风格的弹窗展示 2 人版规则说明。

本次规则文案只基于当前前端代码、已有项目文档和你刚确认的补充规则：

* 2 人版：当前 `Match` 固定 `totalSeats = 2`，可真人对真人，也可房主添加 AI。

* 开局每人 5 张牌：此规则由你确认，前端代码本身不包含发牌数量。

* 牌面范围：猜测弹窗提供 `0-11` 和 `JOKER(-1)`。

* 牌色语义：当前代码里 `tile.color ? '白牌' : '黑牌'`，即 `color` 为真显示白牌，否则显示黑牌。

* 排序规则：普通数字按从小到大排列；同数字“黑大于白”，文案写成“白牌在前、黑牌在后”；JOKER 可放任意位置。

* 回合流程：自己回合先从牌池抽牌，再猜对手未公开的牌，之后把新抽到的牌放回自己的序列。

* 猜牌结果：后端 `roomData.lastData` 是事实来源，`payload.correct` 表示猜对/猜错，猜对会高亮并允许继续，猜错会暴露/处理自己的新抽牌并结束本次优势。

* 胜负目标：前端当前用 `gameStatus === 'end'` 和手牌 `isRevealed` 推断胜负；目标是让对手所有密码牌公开，保护自己的密码牌。

## Current State Analysis

### 1. 达芬奇游戏主界面

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

* 顶部 `header` 内目前只渲染右侧信息区 `.headerRight`。

* 移动端左上角视觉上是 `.statusMobile`，内容是 `User`、`vs`、`Cpu` 三个装饰/状态图标。

* 桌面端存在 `.statusDesktop`，显示 `Player VS AI Alpha`。

* 底部 `footer` 目前有一条英文规则短句：`Rules: Guess opponent's tiles to win. Correct guess allows another turn.`，桌面才显示，移动端隐藏。

* 已使用 `motion/react` 的 `AnimatePresence` 和 `motion.div` 渲染猜牌弹窗、胜利弹窗、最近动作条，适合复用同一动画模式实现规则弹窗。

* 当前导入的 `lucide-react` 图标包括 `Cpu`、`Info`、`RotateCcw`、`Trophy`、`User`。

### 2. 达芬奇游戏样式

文件：[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

* 整体风格是黑色背景、半透明玻璃态 chip、绿色 `#10b981` 主强调、紫色 AI 辅助色。

* `.headerRight` 在移动端通过 `.statusMobile { margin-right: auto; }` 把小图标推到左侧；桌面端不显示 `.statusMobile`。

* 已有 `.modalWrapper`、`.modalBackdrop`、`.modalCard`、`.modalHeader`、`.modalTitle`、`.modalDesc`、`.cancelButton` 可复用基础弹层布局。

* 猜牌弹窗宽度较小，规则弹窗内容更多，需要新增专用样式避免影响猜牌弹窗。

* 底部 `.footer` 和 `.ruleText` 是旧规则提示入口，可以删除或改为不再渲染，避免规则信息重复。

### 3. 游戏规则来源

文件：[DaVinicRoom.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/DaVinicRoom.d.ts)

* `GameStatus` 包含 `'match' | 'waiting' | 'getCard' | 'guessCard' | 'setCard' | 'end'`。

* `Card` 包含 `id`、`color`、`num`、`isRevealed`、`index`。

* `RoomData` 包含 `currentPlayer`、`gameStatus`、`players`、`boardCards`、`lastData`。

* `lastData.payload` 包含 `targetCardID`、`targetPlayerID`、`guessNum`、`correct`。

文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

* `pool` 中的牌仅在 `isPlayerTurn && gameStatus === 'getCard'` 时可点击抽取。

* 对手未公开牌在 `isPlayerTurn && (gameStatus === 'guessCard' || gameStatus === 'setCard') && !tile.isRevealed` 时可点击猜测。

* `setCard` 阶段，非 JOKER 新牌只允许插入按数字从小到大的唯一位置。

* `setCard` 阶段，JOKER 新牌允许插入任意位置。

* 当前前端插入位只按数字比较，未体现同号黑白顺序；规则弹窗会按你确认的“黑大于白”说明，但不在本次主动改 Canvas 插入算法，除非执行时发现后端要求前端强校验。

文件：[Match/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Match/index.tsx)

* `totalSeats = 2`，明确当前达芬奇房间是 2 人版。

* 房主可添加 AI，所有玩家准备且人数大于 1 后可开始游戏。

已有文档：[davinci-lastdata-frontend-adaptation-plan.md](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/.trae/documents/davinci-lastdata-frontend-adaptation-plan.md)

* 说明 `lastData` 是猜牌动作和结果的公开事实来源。

* 说明猜错时不能泄露目标牌真实 `num`。

* 说明 `-1` 显示为 `JOKER`。

## Proposed Changes

### 1. 调整 Header 左侧入口

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

* 新增 `const [showRuleModal, setShowRuleModal] = useState(false);`。

* 从 `lucide-react` 改为导入 `CircleHelp`，作为规则入口图标。

* 在 `.headerRight` 的最左侧放置规则按钮：

```tsx
<button
  type="button"
  className={styles.ruleTrigger}
  onClick={() => setShowRuleModal(true)}
  aria-label="查看游戏规则"
>
  <CircleHelp className={styles.ruleTriggerIcon} />
  <span className={styles.ruleTriggerText}>规则</span>
</button>
```

* 移除或隐藏当前 `.statusMobile` 的 `User vs Cpu` 小图标区域，让左上角主要功能变成规则入口。

* 桌面端保留 `.statusDesktop` 的玩家对阵状态，但规则按钮始终在左上角可见。

* 删除 `footer` 中旧的英文 `Rules:` 简短提示，避免与规则弹窗重复。

Why:

* 用户反馈左上角图标“没什么用”，规则按钮比纯装饰状态更有操作价值。

* `CircleHelp` 语义清晰，比 `Info` 更像“可点击查看帮助/规则”的入口。

* 保持左上角按钮常驻，移动端也不会因为 footer 隐藏而找不到规则。

How:

* `.ruleTrigger` 使用 `margin-right: auto` 占据 header 左侧，后续状态 chip 和重开按钮仍在右侧。

* `type="button"` 避免默认提交行为。

* `aria-label` 提升可访问性。

* 点击只打开本地状态弹窗，不发送 WebSocket，不影响游戏流程。

### 2. 新增规则弹窗结构

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

* 在现有 Guess Modal 和 Victory Modal 同级新增 `AnimatePresence` 包裹的规则弹窗。

* 弹窗结构建议：

```tsx
<AnimatePresence>
  {showRuleModal && (
    <div className={styles.modalWrapper}>
      <motion.div ... className={styles.modalBackdrop} onClick={() => setShowRuleModal(false)} />
      <motion.div ... className={styles.ruleModalCard} role="dialog" aria-modal="true" aria-labelledby="davinci-rules-title">
        ...
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

* 点击遮罩关闭，底部提供“知道了”按钮关闭。

* 弹窗内容分为 4 块：

  * `目标`：让对手的密码牌全部公开，同时尽量保护自己的牌。

  * `牌组与排序`：黑白牌、数字 `0-11`、`JOKER`、开局每人 5 张、数字升序、同号白在前黑在后、JOKER 任意位置。

  * `回合流程`：抽牌、猜对手未公开牌、选择数字/JOKER、根据结果继续或放回新牌。

  * `猜牌与胜负`：猜对公开目标牌并可继续；猜错不会公开目标真实数字，会处理自己的新牌；任一方全部被公开则结束。

Why:

* 用分块信息降低阅读负担，比长段落更适合游戏中快速查看。

* 文案完全贴合当前 2 人版代码和你确认的补充规则，不引用通用达芬奇密码规则。

* 保留“猜错不泄露真实牌面”的隐藏信息边界。

How:

* 把规则内容写成组件内常量数组，例如 `ruleSections`，再 `map` 渲染，避免 JSX 过长。

* 不新增单独文件，保持本次改动集中在 DaVinci 游戏主组件。

* 如果执行时发现 JSX 过长影响可读性，可在同文件中抽一个局部 `RuleModalContent` 小组件，不对外导出。

### 3. 适配规则弹窗样式

文件：[Game/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)

What:

* 新增 `.ruleTrigger`、`.ruleTriggerIcon`、`.ruleTriggerText`：

  * 玻璃态圆角胶囊按钮。

  * 绿色微光边框和 hover/focus 状态。

  * 移动端只显示图标或缩短文案，保证不挤占顶部状态。

* 新增 `.ruleModalCard`：

  * 宽度 `min(92vw, 560px)`，最大高度 `86vh`，可滚动。

  * 背景使用 `linear-gradient` 暗色层次，边框为半透明绿色/白色。

  * 加 `box-shadow` 和 `backdrop-filter`，与现有 `.modalCard`、`.victoryCard` 风格一致。

* 新增 `.ruleHero`、`.ruleEyebrow`、`.ruleModalTitle`、`.ruleModalDesc`：

  * 顶部用 `CircleHelp` 图标、标题“游戏规则”、副标题“2 人推理版”。

  * 可增加轻微网格/扫描线氛围，但不引入图片资源。

* 新增 `.ruleSectionList`、`.ruleSection`、`.ruleSectionTitle`、`.ruleList`、`.ruleMetaGrid`、`.ruleMetaItem`：

  * 使用小卡片承载规则点。

  * 关键数字如 `0-11`、`JOKER`、`5 张` 用等宽字体/绿色强调。

* 新增 `.ruleCloseButton`：

  * 复用绿色主按钮风格。

  * 移动端触控面积不小于 44px。

Why:

* 规则弹窗内容明显多于猜牌弹窗，需要独立布局和滚动控制。

* 暗色玻璃拟态、绿色强调、等宽数字能和当前牌面/状态栏风格一致。

* 移动端和横屏低高度是当前项目重点适配场景，需要避免遮挡牌区和顶部状态。

How:

* 不改全局样式，只在 CSS Modules 文件中新增类。

* hover 使用 `@media (hover: hover) and (pointer: fine)` 包裹，避免移动端出现异常 hover 残留。

* 在已有 `@media (orientation: landscape) and (max-height: 500px)` 中压缩规则弹窗 padding、标题和间距。

### 4. 规则文案草案

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

建议落地文案：

```txt
游戏目标
破解对手的密码序列。谁先让对手所有密码牌公开，谁就获胜；自己的牌被全部公开则失败。

牌组与排序
本房间是 2 人版，开局每人 5 张。牌面包含黑、白两色的 0-11，以及 JOKER。
自己的密码牌按从小到大排列；同数字时白牌在前、黑牌在后，因为黑大于白。JOKER 不受顺序限制，可以放在任意位置。

回合流程
轮到你时，先从中间牌池抽一张牌。随后选择对手一张未公开的牌，猜它是 0-11 或 JOKER。
猜完后，新抽到的牌会进入放回阶段；普通数字会提示唯一正确位置，JOKER 可以选择任意位置。

猜牌结果
猜对：目标牌公开，并且你可以继续掌握主动。
猜错：不会公开目标牌的真实数字，你需要处理自己刚抽到的牌。
最近一次猜牌会显示在顶部提示条，绿色代表猜对，红色代表猜错。
```

注意：

* “普通数字会提示唯一正确位置”来自当前 `GameCanvas` 的 `setCard` 插槽逻辑。

* “JOKER 可以选择任意位置”来自 `openAllSlots` 逻辑。

* “黑大于白”不改写成通用桌游规则，而是按你确认的项目规则呈现。

### 5. 清理旧入口与未使用代码

文件：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

What:

* 如果删除 footer 中旧 `Info` 图标，则同时从 `lucide-react` import 中移除 `Info`。

* 如果 `.footer`、`.footerIcon`、`.ruleText` 不再被使用，则在样式文件中删除这些类。

* 保留 `.modalWrapper`、`.modalBackdrop` 等共享弹窗基础样式，因为猜牌和胜利弹窗仍在使用。

Why:

* 避免同时存在一个旧规则短句和一个新规则弹窗，造成信息不一致。

* 保持 import 和样式整洁。

How:

* 只删除确认未使用的 footer 相关类，不动其他历史样式如 `.brand*`，避免扩大改动面。

## Assumptions & Decisions

* 决策：规则按钮使用 `CircleHelp`，不使用 `Info`。原因是它更像帮助/规则入口，符合“点击打开规则”的语义。

* 决策：左上角按钮替换移动端 `User vs Cpu` 小图标区域；桌面端仍保留 `Player VS AI Alpha` 状态 chip，但规则按钮常驻最左侧。

* 决策：规则弹窗不发送任何 WebSocket 消息，也不改变游戏状态。

* 决策：规则文案使用中文，与游戏大厅和 Match 页面现有中文 UI 一致。

* 决策：开局每人 5 张写入规则，因为你已确认。

* 决策：同号排序写成“白牌在前、黑牌在后，因为黑大于白”，与“数字从小到大”一起表达。

* 决策：本计划不改 `GameCanvas` 的插入位算法。若后端已经强制校验黑白同号顺序，前端文案足够；若希望前端也强制展示同号插槽，需另起任务修改插入逻辑。

* 假设：当前 `guessCard` 后“猜对可继续”的行为仍由后端控制，前端只展示规则，不自行决定是否继续。

* 假设：胜负仍以当前 `gameStatus === 'end'` 和牌是否公开的状态展示为准，本次不重构结束弹窗。

## Verification Steps

1. 静态检查：

   * 运行 `pnpm build`，确认 TypeScript 和 Vite 构建通过。

   * 使用 `GetDiagnostics` 检查 `Game/index.tsx` 和 `Game/index.module.less` 无新增诊断。

2. 桌面端手动验证：

   * 进入达芬奇游戏房间。

   * 确认左上角出现规则按钮，右侧状态、牌池数量、重开按钮仍正常。

   * 点击规则按钮，弹窗以暗色玻璃拟态显示。

   * 点击遮罩和“知道了”均能关闭。

3. 移动端手动验证：

   * 在窄屏确认原 `User vs Cpu` 小图标不再占用左上角，规则按钮可点击。

   * 弹窗内容可滚动，按钮触控面积足够。

   * 顶部状态和重开按钮不被规则按钮挤出屏幕。

4. 横屏低高度验证：

   * 在手机横屏或浏览器高度 `< 500px` 下打开规则弹窗。

   * 弹窗高度受限且可滚动，不遮挡导致无法关闭。

5. 游戏流程回归：

   * 抽牌、猜牌、放回、重开按钮仍可正常操作。

   * 规则弹窗打开/关闭不触发 WebSocket 消息、不改变回合状态。

   * 最近猜牌动作条仍按 `lastData` 显示，且不被规则按钮影响。

