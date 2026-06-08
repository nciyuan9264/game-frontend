# 历史战绩信息裁剪与移动端重排计划

## Summary

当前“历史战绩”实际展示在 `GameBoard` 的个人资料弹窗 `ProfileModal` 中，不是独立页面。列表卡片现在同时展示：

* 对局 ID

* 房间号

* 开始时间

* 时长

* 胜者

* 我的得分或结果

* 胜负标签

你希望优化两点：

1. 不再展示对局 ID、房间号。
2. 移动端重新排列历史战绩卡片，让信息层级更清晰。

你补充后，本次计划目标变为：

1. Acquire 和达芬奇两边都不再展示对局 ID、房间号。
2. 移动端重新排列历史战绩卡片。
3. Acquire 额外把“胜者”字段改成“排名”，排名依据返回的 `finalResult` 中各玩家 `total` 值排序得到。

本次计划将只调整 `ProfileModal` 里的历史对局卡片字段、Acquire/达芬奇分支展示逻辑和响应式布局，不改历史接口、不改 Acquire 回放跳转能力、不改统计栏。

## Current State Analysis

### 1. 历史战绩入口与组件位置

文件：[Header/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/Header/index.tsx)

* “历史战绩”入口在 `GameBoard` 页头部菜单中。

* 点击后实际打开的是 `ProfileModal`。

文件：[ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)

* `ProfileModal` 根据 `gameType` 同时服务 `acquire` 和 `davinci`。

* 历史列表数据来自 `useMyGames()`。

* 顶部标题会根据游戏类型切换为 `Acquire 个人主页` 或 `达芬奇密码 个人主页`。

### 2. 当前卡片字段结构

文件：[ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)

当前 `renderGameRow()` 中依次渲染 7 列：

```tsx
1. 对局        -> #{game.id}
2. 房间        -> {game.roomID}
3. 开始时间    -> {formatDate(game.startedAt)}
4. 时长        -> {formatDuration(game.durationSeconds)}
5. 胜者        -> {winnerName}
6. 我的得分/结果 -> Acquire 显示分数，DaVinci 显示结果
7. 胜负标签    -> 胜 / 负
```

这正是你提到的“对局 id、房间号”来源；同时当前“胜者”字段也是 Acquire 和达芬奇共用的统一展示点。

### 3. 当前移动端布局依赖 7 列 grid-area

文件：[ProfileModal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.module.less)

桌面端：

* `.row` 使用 `grid-template-columns: repeat(7, 1fr)`。

* 每个 `.col` 都按统一列处理。

移动端：

```less
grid-template-columns: 1fr auto;
grid-template-areas:
  'id     tag'
  'room   room'
  'time   duration'
  'winner score';
```

并通过 `.col:nth-child(n)` 把 7 个字段映射到：

* `id`

* `room`

* `time`

* `duration`

* `winner`

* `score`

* `tag`

所以一旦移除“对局”和“房间”，移动端布局必须同步重排，否则 `nth-child` 映射会错位。

### 4. Acquire 排名数据可以从 finalResult 推导

文件：[types/history.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/history.d.ts)

当前历史类型中：

```ts
export interface PlayerResult {
  money: number;
  stocks: number;
  total: number;
}
export type PlayerResultMap = Record<string, PlayerResult>;

export interface Game {
  ...
  finalResult?: PlayerResultMap | unknown | null;
}
```

这意味着：

* Acquire 的排名不需要额外接口字段。

* 可以从 `game.finalResult` 中取出所有玩家的 `total`。

* 按 `total` 从高到低排序后，定位当前用户 `userID` 对应的 `playerID`，计算自己的排名。

当前 `ProfileModal/index.tsx` 中尚未使用 `finalResult`，只用了：

* `winnerPlayerID`

* `players`

* 当前玩家 `me`

因此 Acquire 的“排名”逻辑需要在前端新增一个安全的解析/排序步骤。

### 5. 数据层仍无需改动

文件：[types/history.d.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/types/history.d.ts)

历史 `Game` 类型里确实包含：

* `id`

* `roomID`

* `startedAt`

* `durationSeconds`

* `winnerPlayerID`

* `players`

文件：[useHistory.ts](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/hooks/request/useHistory.ts)

* `useMyGames()` 直接透传接口结果。

* 本次优化只是前端展示裁剪和前端计算，不需要修改 hook 或 API。

## Proposed Changes

### 1. 删除历史卡片中的对局 ID 和房间号显示

文件：[ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)

What:

* 从 `renderGameRow()` 中删除这两块：

```tsx
<div className={styles.col}>
  <span className={styles.label}>对局</span>
  <span className={styles.value}>#{game.id}</span>
</div>

<div className={styles.col}>
  <span className={styles.label}>房间</span>
  <span className={styles.value}>{game.roomID}</span>
</div>
```

* 保留以下信息：

  * 开始时间

  * 时长

  * Acquire：排名、我的得分、胜负标签

  * DaVinci：胜者、结果、胜负标签

Why:

* 直接响应你的需求，移除低价值字段。

* 卡片信息密度下降后，移动端更容易排出清晰层级。

How:

* 仅删 UI 渲染，不动 `Game` 类型和接口。

* `key={game.id}` 仍保留，因为 React 列表渲染需要稳定 key。

* `handleRowClick(game.id)` 仍保留，因为 Acquire 回放仍依赖 `game.id`。

### 2. 区分 Acquire 与达芬奇字段展示

文件：[ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)

What:

* 达芬奇：

  * 去掉“对局”“房间”。

  * 保留“开始时间”“时长”“胜者”“结果”“胜负标签”。

* Acquire：

  * 去掉“对局”“房间”。

  * 把“胜者”字段改成“排名”。

  * 保留“开始时间”“时长”“我的得分”“胜负标签”。

建议 JSX 方向：

```tsx
{isAcquire ? (
  <>
    开始时间
    时长
    排名
    我的得分
    胜负标签
  </>
) : (
  <>
    开始时间
    时长
    胜者
    结果
    胜负标签
  </>
)}
```

Why:

* 这是你新增的关键需求：Acquire 和达芬奇不能只做统一裁剪，还要区分字段语义。

* 达芬奇里“胜者”仍然是有效信息；Acquire 更适合显示“我的排名”。

How:

* 在 `renderGameRow()` 里保留一套共用基础数据：

  * `me`

  * `isWin`

  * `myScore`

  * `resultText`

* 再根据 `isAcquire` 分支渲染不同字段组合。

### 3. 为 Acquire 新增“排名”计算逻辑

文件：[ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)

What:

* 新增一个安全辅助函数，例如：

```tsx
const getAcquireRank = (game: Game, userID: string) => { ... }
```

计算方式：

1. 校验 `game.finalResult` 是否为对象。
2. 从 `game.players` 找到当前用户对应的 `playerID`。
3. 将 `finalResult` 转成 `[playerID, total]` 列表。
4. 按 `total` 从高到低排序。
5. 找到当前玩家所在位置，输出 `第 X 名`。

建议安全逻辑：

```tsx
const getAcquireRank = (game: Game, userID: string) => {
  const me = game.players?.find((p) => p.playerID === userID);
  if (!me || !game.finalResult || typeof game.finalResult !== 'object') return '-';

  const entries = Object.entries(game.finalResult as Record<string, { total?: number }>)
    .map(([playerID, result]) => ({
      playerID,
      total: typeof result?.total === 'number' ? result.total : Number.NEGATIVE_INFINITY,
    }))
    .sort((a, b) => b.total - a.total);

  const index = entries.findIndex((item) => item.playerID === me.playerID);
  return index >= 0 ? `第 ${index + 1} 名` : '-';
};
```

Why:

* `winnerPlayerID` 只能表达第 1 名，不满足你要的“排名”。

* `finalResult.total` 已是后端返回的最终总分，足以排序。

How:

* 排名只用于 Acquire。

* 如果 `finalResult` 缺失、结构异常、当前玩家不在结果集中，则回退为 `-`。

* 本次不处理并列名次压缩规则；默认按排序索引给 `第 1 名 / 第 2 名`。若后续需要“并列第 1”，可另行细化。

### 4. 重排桌面端卡片结构

文件：[ProfileModal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.module.less)

What:

* 将桌面端 `.row` 从 `repeat(7, 1fr)` 改为适配 4 个信息块 + 1 个标签位。

* 建议改成更符合信息权重的列宽，而不是平均分布。

建议方向：

```less
.row {
  grid-template-columns: minmax(150px, 1.8fr) minmax(90px, 1fr) minmax(110px, 1.1fr) minmax(110px, 1.1fr) minmax(70px, auto);
}
```

含义：

* 开始时间：更宽

* 时长：中等

* Acquire 排名 / DaVinci 胜者：中等

* 我的得分 / 结果：中等

* 胜负标签：自适应

Why:

* 删除两列后继续 `repeat()` 会让内容显得过散。

* 用有权重的列宽更接近“信息卡片”而不是“表格”。

How:

* `.tag` 仍保持靠右。

* `.col` 样式基础不变，减少改动范围。

### 5. 重新设计移动端卡片信息顺序

文件：[ProfileModal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.module.less)

What:

移动端不再沿用原先的：

```less
'id     tag'
'room   room'
'time   duration'
'winner score'
```

改为只围绕剩余 4 块信息 + 1 个标签排布。

建议移动端布局：

```less
grid-template-columns: 1fr auto;
grid-template-areas:
  'time    tag'
  'duration result'
  'meta     meta';
```

字段映射建议：

* 第 1 列：开始时间

* 第 2 列：时长

* 第 3 列：Acquire 排名 / DaVinci 胜者

* 第 4 列：我的得分 / 结果

* 第 5 列：胜负标签

移动端优先级：

* 第一行：开始时间 + 胜负标签

* 第二行：时长 + 我的得分/结果

* 第三行：Acquire 排名 / DaVinci 胜者

Why:

* 开始时间是最适合作为卡片主识别信息的字段。

* 胜负标签放右上角，符合扫描习惯。

* 第三行可复用成“游戏差异字段位”：Acquire 放排名，DaVinci 放胜者。

How:

* 更新 `.col:nth-child(n)` 的 `grid-area` 对应关系。

* 删除旧的 `id/room` area。

* 继续保留 `.value` 的省略逻辑，避免长用户名撑爆布局。

### 6. 优化移动端行内排版细节

文件：[ProfileModal/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.module.less)

What:

* 移动端 `.col` 继续使用横向 `label + value`，但对不同字段做轻微差异化处理：

  * 开始时间值更醒目。

  * “结果 / 我的得分”保持右对齐。

  * Acquire 排名 / DaVinci 胜者单独一行并允许更自然阅读。

* 标签 `.tag` 保持右上角锚定。

建议细节：

```less
.col:nth-child(1) .value {
  font-size: 0.92rem;
  font-weight: 600;
  color: #1677ff;
}

.col:nth-child(2),
.col:nth-child(4) {
  justify-content: flex-end;
}
```

Why:

* 现在不再有“对局 #8”这种天然主标题，需要让“开始时间”承担主识别点。

* 让第二行左右分栏更平衡，减少拥挤感。

How:

* 不新增 JSX 结构，优先通过现有 `.col:nth-child()` 调整。

* 若执行时发现 `nth-child` 可读性太差，可轻量加类名如 `styles.colTime` / `styles.colDuration`，但优先不扩大 JSX 改动。

### 7. 保持 Acquire 与达芬奇共用组件能力

文件：[ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx)

What:

* 保留现有条件分支并增强：

  * Acquire：显示“排名”“我的得分”

  * DaVinci：显示“胜者”“结果”

* 保留 `handleRowClick()` 仅对 Acquire 生效。

Why:

* 当前历史战绩组件是双游戏共用。

* 本次优化是通用的字段裁剪和布局优化，不应破坏 Acquire 的回放入口。

How:

* 继续使用并扩展：

```tsx
<span className={styles.label}>{isAcquire ? '我的得分' : '结果'}</span>
```

* 新增：

```tsx
<span className={styles.label}>{isAcquire ? '排名' : '胜者'}</span>
```

* 只移除对局 ID 和房间号显示，不动回放跳转逻辑。

## Assumptions & Decisions

* 决策：历史战绩优化范围仅限 `ProfileModal` 历史列表，不修改统计栏、弹窗标题、接口层。

* 决策：删除“对局 ID”和“房间号”这两个展示字段，但内部继续保留 `game.id` 作为 React key 和 Acquire 回放路由参数。

* 决策：Acquire 和达芬奇的历史卡片字段需要分流处理，不再完全共用同一组展示字段。

* 决策：Acquire 把“胜者”改成“排名”，排名来自 `finalResult.total` 的前端排序结果。

* 决策：DaVinci 继续显示“胜者”和“结果”，不计算排名。

* 决策：移动端以“开始时间”作为卡片主识别信息，不再需要额外标题字段。

* 决策：胜负标签继续保留在右上角。

* 决策：Acquire 与达芬奇继续共用同一历史列表组件，不拆分成两个版本。

* 决策：优先通过现有 DOM 结构和 CSS grid 重排实现；只有在样式选择器明显难维护时，才增加显式 class 名。

* 假设：历史接口返回结构保持不变，本次不需要后端支持。

* 假设：`finalResult` 中的 key 与 `game.players[].playerID` 一致，可用于定位当前玩家排名。

* 假设：本次 Acquire 排名按排序序号展示 `第 1 名 / 第 2 名`，不处理并列名次压缩规则。

## Verification Steps

1. 静态验证：

   * 使用 `GetDiagnostics` 检查 [ProfileModal/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.tsx) 和 [index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/GameBoard/components/ProfileModal/index.module.less)。

   * 运行 `node ./node_modules/typescript/bin/tsc --noEmit`。

2. 桌面端验证：

   * 打开历史战绩弹窗。

   * 确认卡片中不再显示“对局 #id”和“房间号”。

   * 确认 DaVinci 展示开始时间、时长、胜者、结果、胜负标签。

   * 确认 Acquire 展示开始时间、时长、排名、我的得分、胜负标签。

   * Confirm Acquire 点击行仍能进入回放，DaVinci 行仍不可点击。

   * 对一条 Acquire 历史记录，核对 `finalResult.total` 排序后展示的排名是否正确。

3. 移动端验证：

   * 在窄屏下打开历史战绩弹窗。

   * 确认卡片重新排版，不再出现原 `id / room` 占位痕迹。

   * 确认第一眼能看到开始时间和胜负标签。

   * 确认时长、结果/得分、Acquire 排名 / DaVinci 胜者排列清晰，不拥挤、不换行错乱。

4. 回归验证：

   * 统计栏数值仍正常展示。

   * 空态、加载态、关闭按钮仍正常。

   * Acquire 回放跳转逻辑不受影响。

