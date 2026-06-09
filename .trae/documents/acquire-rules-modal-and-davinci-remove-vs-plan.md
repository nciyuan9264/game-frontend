# Acquire 补充玩法说明 + 去掉达芬奇 PC 端 topbar 的 Player VS AI

## Summary

两件事：

1. **去掉达芬奇密码 PC 端 topbar 第一行右侧的「Player VS AI Alpha」展示块**（仅桌面端可见的那个）。
2. **给 Acquire 补一个「玩法说明/游戏规则」**：复用现有的「公司股票信息」弹窗，把它改造成顶部 Tab 切换——「游戏规则」+「公司股票信息」两个 Tab，保留原有公司股票表格，新增 Acquire 游戏规则内容。触发入口复用现有 topbar 的「公司面板」按钮（不新增按钮）。

## Current State Analysis

### Task 1 — DaVinci VS 块

* 该块是 [Game/index.tsx#L301-L309](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L301-L309) 的 `.statusDesktop`：包含 `User` 图标 + "Player" + 分隔线 + "VS" + 分隔线 + `Cpu` 图标 + "AI Alpha"。

* 它在 `headerRight` 内，独立于状态点/计时器/重开按钮，删除它不影响其它逻辑。

* 相关样式类 `.statusDesktop` / `.vsMono` / `.iconUser` / `.iconCpu` / `.label` / `.divider` 在 [index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.module.less)。`.divider` / `.label` 可能被其它块复用，需确认后再决定是否清理。

### Task 2 — Acquire 规则弹窗

* 现有「公司股票信息」弹窗：[StockInfo/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/StockInfo/index.tsx)，组件名 `CompanyStockInfoModal`，用共享 [Modal](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/components/Modal/index.tsx)（浅色主题）。内部已有 `activeTab` 状态用于股票三档切换，结构为 `.header`（标题+关闭）+ `.content`（`.tabs` + `.tableContainer`）。

* 触发：topbar 的「公司面板」按钮 `setCompanyInfoVisible(true)`（[TopBar/index.tsx#L176](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar/index.tsx#L176)、[TopBar3D/index.tsx#L182](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/TopBar3D/index.tsx#L182)）。弹窗在 [Game/index.tsx#L159-L162](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/index.tsx#L159-L162) 渲染。

* 样式 [StockInfo/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/StockInfo/index.module.less) 已是浅色 Acquire 风格（白底、灰边、Tab 下划线高亮）——本身即「适配 acquire 的弹窗风格」，沿用即可。

* DaVinci 规则文案结构可参考（`ruleSections` / `ruleMeta`，[Game/index.tsx#L62-L102](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx#L62-L102)）。

## Proposed Changes

### 1. 删除 DaVinci VS 块

文件：[DaVinci Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx)

* 删除 L301-L309 整个 `<div className={styles.statusDesktop}>...</div>`。

* 检查 `User` / `Cpu` 图标 import 是否仍被其它处使用；若不再使用则从 lucide-react import 中移除，避免未用告警。

* LESS：确认 `.statusDesktop` / `.vsMono` / `.iconUser` / `.iconCpu` 是否仅此块使用，若仅此处使用则删除对应规则；`.divider` / `.label` 若被其它块复用则保留。

### 2. 改造 Acquire「公司股票信息」弹窗为「规则 + 股票」双 Tab

文件：[StockInfo/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/StockInfo/index.tsx)

* 新增顶层 Tab 状态，例如 `const [activeSection, setActiveSection] = useState<'rules' | 'stock'>('rules');`（默认进入显示规则，符合「玩法说明」诉求）。

* `.header` 标题随 section 动态：规则 → "游戏规则" / "了解 Acquire 玩法"；股票 → "公司股票信息" / "查看股票价格和奖励信息"。

* 在 `.content` 顶部新增一行 section Tab（复用 `.tabs`/`.tab`/`.active` 样式）：「游戏规则」「公司股票信息」。

* section === 'stock' 时渲染**现有**三档股票 Tab + 表格（原 `activeTab` 逻辑原样保留）。

* section === 'rules' 时渲染新增的规则内容：用一组 Acquire `ruleSections` 数据（标题 + 要点列表）渲染，结构参考 DaVinci 的 section/list。规则文案（中文，覆盖 Acquire 核心）：

  * **游戏目标**：通过建立、扩张、合并公司并持有股票，在游戏结束时拥有最多资产者获胜。

  * **放置地块**：每回合先在棋盘放置一块地块；相邻地块连成片可组建或扩张公司。

  * **创建公司**：当放置使两块以上地块相连且尚无公司时，可创建一家新公司，并获赠 1 股创始股。

  * **购买股票**：每回合最多购买 3 股在场公司股票，价格随公司规模上涨。

  * **公司合并**：当地块连接两家公司时，较大公司吞并较小公司；被并方大股东/二股东获得奖金，持股可兑现、保留或按 2:1 换购。

  * **游戏结束与清算**：当某公司达到 41 格，或所有在场公司都已「安全」（≥11 格）时可结束；结算各公司大/二股东奖金并按持股变现，资产最高者胜。

* 规则内容若需要少量新样式（如 `.ruleSection` / `.ruleList`），在 StockInfo 的 less 内新增，沿用浅色风格（标题深灰、列表项行距），不引入暗色。

文件：[StockInfo/index.module.less](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/Acquire/components/Game/components/StockInfo/index.module.less)

* 新增规则区样式：`.ruleSection`（间距）、`.ruleSectionTitle`（深色小标题）、`.ruleList`（ul，行高/项间距，列表项 `color:#333`）。复用现有配色，保持与表格一致的浅色卡片观感。

> 触发入口、Modal 组件、`companyInfoVisible` 状态与 Game 渲染处均**不改**——仍由「公司面板」按钮打开同一弹窗，只是内容多了规则 Tab。

## Assumptions & Decisions

* 采用 **Tab 切换** 结构、**复用现有「公司面板」按钮**（用户提供的两项默认推荐）。

* 弹窗「适配 acquire 的风格」= 沿用现有 StockInfo 浅色弹窗风格（白底/灰边/下划线 Tab），不改成达芬奇的暗色风。

* 默认 section 为「游戏规则」，让「玩法说明」第一眼可见；用户仍可切到「公司股票信息」。

* Acquire 规则文案按标准 Acquire 规则编写（上方 6 条），如与后端实现细节有出入，以可读概览为准，不追求逐条精确数值。

* 不改动 topbar 按钮文案（仍叫「公司面板」），避免扩大改动；如后续希望改名「玩法/信息」可再提。

## Verification

1. `npx tsc --noEmit -p tsconfig.json` 通过（EXIT=0）。
2. 启动 dev server：

   * 达芬奇 PC 端：topbar 第一行右侧不再出现「Player VS AI Alpha」块；状态点、计时器、结束后重开按钮均正常。移动端无回归。

   * Acquire：点击 topbar「公司面板」→ 弹窗打开，默认显示「游戏规则」Tab，内容为 Acquire 玩法要点；切到「公司股票信息」Tab → 原三档股票表格正常；关闭按钮/遮罩可关闭。2D 与 3D（TopBar/TopBar3D）入口均生效。

