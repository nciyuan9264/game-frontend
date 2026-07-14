# Splendor 场上卡牌稳定槽位与替换动画计划

## Summary

目标：Splendor 游戏页的 `cardRows` 不能再直接跟随后端返回数组顺序重排。前端需要做到：玩家买走/预留/拿走场上一张发展卡后，新补出的卡牌在被拿走卡牌的原位置出现；如果后端同步中只是数组顺序变化，前端展示位置保持不变。同时为“原位替换”增加轻量动画，让新卡在原槽位出现时有明确视觉反馈。

结论：可以做到。实现方式是在 `CardBoard` 内维护前端稳定槽位状态，按每个等级维护固定 slot 列表，通过 card id 对比新旧同步数据，只把新增卡填入消失卡留下的空槽，而不是按后端数组重新排序渲染。

## Current State Analysis

* 相关组件：`src/view/Splendor/components/Game/components/CardBoard/index.tsx`

* 当前渲染逻辑：

  * `LEVELS = [3, 2, 1]`

  * 每个 level 从 `data.roomData.card?.[level]` 读取数组

  * 当前代码执行 `sort((a, b) => a.id - b.id)` 后直接 `cards.map(...)`

  * 外层 `key={card.id}`

* 当前问题：

  * 后端每次 sync 如果返回顺序变化，前端会跟着排序/重排，用户视觉上会看到卡牌位置跳动。

  * 用户操作拿走某张场上牌后，后端补的新牌无法保证出现在被拿走牌的原位置。

* 动画基础：

  * 项目已有 `motion/react`，例如 `GemSelect`、`GameEnd`、`Home` 都在使用。

  * `CardBoard` 当前没有使用 `motion` 或 `AnimatePresence`。

* 样式基础：

  * `CardBoard` 样式位于 `src/view/Splendor/components/Game/components/CardBoard/index.module.less`

  * `.cardSlot` 已有 hover、selected、buyable 的 transition，可在此基础上叠加入场动画，不需要重做布局。

* 相关约束：

  * `NormalCard` 只负责展示单张卡，不应承担槽位稳定逻辑。

  * `selectedCard` 由 `Game/index.tsx` 管理，并在每次 `wsRoomSyncData` 变化时清空，因此替换时不需要保留旧选择态。

  * 不改变后端协议，不要求后端额外返回 slot index。

## Proposed Changes

### 1. `CardBoard/index.tsx`：引入稳定 slot 状态

文件：`src/view/Splendor/components/Game/components/CardBoard/index.tsx`

改动：

* 从 React 引入 `useEffect`、`useMemo`、`useRef`、`useState`。

* 从 `motion/react` 引入 `motion`。

* 新增类型：

  * `type Level = 1 | 2 | 3`

  * `type CardSlots = Record<Level, (SplendorNormalCard | null)[]>`

* 新增常量：

  * `const LEVELS: Level[] = [3, 2, 1]`

  * `const SLOT_COUNT = 4`

同步算法：

* 首次收到某个 level 的 cards：

  * 用后端当前顺序初始化该 level 的 4 个槽位。

  * 不再按 id 排序。

* 后续 sync：

  * 对每个 level 读取后端 cards。

  * `incomingById`：后端当前仍存在的卡。

  * `seenIncomingIds`：用于避免重复填槽。

  * 遍历旧 slots：

    * 如果旧 slot 里的 card id 仍在 `incomingById`，原槽保留并更新为后端最新 card 对象。

    * 如果旧 card 不在后端数据中，说明被拿走/预留/购买，该 slot 暂时置空。

  * 找出后端新增卡：`incomingCards` 中不在旧 slots 的卡。

  * 按空槽从左到右把新增卡填进去。

  * 如果后端返回卡数少于 4，剩余 slot 保持 `null`。

  * 如果出现异常情况（后端超过 4 张），仅渲染前 4 个槽位，避免布局撑爆。

为什么这样做：

* 旧卡 id 是稳定身份，能抵抗后端数组顺序变化。

* 消失的旧卡槽位天然就是补牌位置，能满足“拿走一张牌，在原位替换一张牌”。

* 不依赖后端 slot index，兼容当前接口。

### 2. `CardBoard/index.tsx`：改渲染为 slot 渲染

文件：`src/view/Splendor/components/Game/components/CardBoard/index.tsx`

改动：

* `cards.map(...)` 改为 `slotsByLevel[level].map((card, slotIndex) => ...)`。

* slot 外层 key 使用稳定槽位 key：

  * `key={`${level}-${slotIndex}`}`

* 当 slot 有 card：

  * 渲染 `motion.div` 或在 slot 内渲染 `motion.div`。

  * `layout` 开启轻微布局平滑。

  * 子内容使用 `key={card.id}`，当同一 slot 换成新 card 时触发新卡入场动画。

* 当 slot 为 `null`：

  * 渲染一个空槽占位，保持布局不塌。

点击逻辑：

* 有 card 时才允许 `onClick={() => setSelectedCard(card)}`。

* 空槽不响应点击。

### 3. `CardBoard/index.tsx`：新增替换动画

文件：`src/view/Splendor/components/Game/components/CardBoard/index.tsx`

动画策略：

* 对 slot 容器保留稳定布局。

* 对卡牌内容使用 `motion.div`：

  * `initial={{ opacity: 0, y: -10, scale: 0.94, rotateZ: -2 }}`

  * `animate={{ opacity: 1, y: 0, scale: 1, rotateZ: 0 }}`

  * `transition={{ type: 'spring', stiffness: 360, damping: 26 }}`

* 对 slot 容器加 `layout`，避免轻微尺寸变化造成生硬跳动。

* 新卡入场效果保持短促，不做长时间离场动画，避免 WebSocket 高频同步时拖慢操作反馈。

边界：

* 后端顺序变化但 card id 集合不变：不触发替换动画，位置保持不变。

* 旧卡消失且新卡出现：新卡在旧卡 slot 入场。

* 多张卡同时变化：多个空槽按从左到右填充新卡，各自入场。

### 4. `CardBoard/index.module.less`：增加空槽与动画容器样式

文件：`src/view/Splendor/components/Game/components/CardBoard/index.module.less`

改动：

* `.cards` 建议改为不换行或保持当前布局但固定 slot 尺寸：

  * 保留当前 `display: flex` 和 `gap`。

  * 每个 `.cardSlot` 负责固定占位。

* 新增/调整：

  * `.cardSlot` 增加 `width`/`height` 与 `NormalCard.md` 对齐：桌面 `5rem x 7rem`，移动端 `5.6rem x 7.8rem`。

  * `.cardSlotInner`：承载 motion 内容，宽高 100%。

  * `.emptySlot`：半透明虚线边框/轻微紫金背景，表示暂时没有牌但保留槽位。

* 注意：

  * `.selected` 和 `.buyable` 的 box-shadow 保持在 `.cardSlot` 上。

  * hover transform 继续作用在 `.cardSlot`，避免影响 motion 子节点的入场 transform。

### 5. 可选小工具函数（仅在需要时）

文件：`src/view/Splendor/components/Game/components/CardBoard/index.tsx`

如果 `index.tsx` 同步算法过长，抽出本文件内私有函数：

* `createInitialSlots(cards: SplendorNormalCard[]): (SplendorNormalCard | null)[]`

* `syncCardSlots(prevSlots, incomingCards): (SplendorNormalCard | null)[]`

不建议放到 `utils/game.ts`：

* 这是纯 UI slot 稳定策略，不是游戏规则。

* 放在 `CardBoard` 本地更清晰，避免污染规则工具文件。

## Assumptions & Decisions

* 不修改后端协议；前端根据 card id 推断槽位变化。

* 不再对 `data.roomData.card[level]` 按 id 排序；首次展示顺序以第一次收到的后端顺序为准。

* 后续后端只要 card id 还存在，前端位置就不变。

* 新增卡填入消失卡留下的第一个空槽；多张新增卡按后端返回顺序依次填空槽。

* 每个 level 默认最多展示 4 个场上发展卡槽位，符合当前 Splendor 场上牌布局。

* 不处理“后端真实把同一张卡移动到另一个 slot”的语义，因为当前接口没有 slot index；在现有协议下，前端稳定位置优先。

* 动画使用项目已有 `motion/react`，不新增依赖。

* 动画只用于新卡入场和轻微 layout 平滑，不做复杂飞牌路径，降低实现和维护成本。

## Verification Steps

1. 类型检查：

   * 运行 `npx tsc --noEmit`

   * 期望无 TypeScript 错误。
2. 静态诊断：

   * 使用 IDE diagnostics 检查 `CardBoard/index.tsx` 和 `CardBoard/index.module.less`

   * 期望无新增错误。
3. 手动验证场景：

   * 进入 Splendor 对局，记录某个 level 的 4 张卡位置。

   * 模拟/实际购买或预留其中一张场上卡。

   * 后端同步新卡后，新卡应出现在被拿走卡的原位置。

   * 后端返回同一批 card id 但顺序变化时，前端位置不变。

   * 新卡出现时有短促的淡入/下落/缩放动画。

   * selected/buyable 的高亮仍然正常。
4. 边界验证：

   * 某个 level 后端少于 4 张卡时，空位仍占位，不挤压其他卡。

   * 多张卡同时变化时，多个新卡按空槽顺序补位。

   * 移动端布局下槽位尺寸与 `NormalCard.md` 对齐，不产生错位。

