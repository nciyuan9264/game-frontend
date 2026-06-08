# Home 多游戏入口适配计划

## Summary

采用“单一入口 + 海报顶部游戏 Tab + 沉浸式宣传页切换”的方案。保留 `/` 作为平台首页，不新增第二个 Home 路由；但也不把现有并购海报页简单拆成两个普通卡片。首页整体继续保持当前高质感宣传页形态，在海报页上方放置两个游戏 Tab，选中后主舞台展示对应游戏的标题、卖点、视觉 mockup、主题色和入口按钮。

这个方案兼顾两个目标：用户首次进入时仍能获得完整的单游戏宣传体验；同时两个游戏共享一个统一入口，后续新增游戏只需要增加配置和 Tab，不需要复制多套 Home 页面。

## Current State Analysis

- `src/route/routes.tsx` 已经配置两个活跃游戏大厅：`/game/acquire` 和 `/game/davinci` 都指向 `GameBoard`。
- `src/route/routes.tsx` 已经配置两个游戏内页：`/game/acquire/match` 指向 `Acquire`，`/game/davinci/match` 指向 `DaVinci`。
- `src/view/Home/index.tsx` 当前是并购单游戏宣传页，左侧内容区和右侧视觉区都强绑定 `ACQUIRE / 并购风云`，主按钮固定跳转 `/game/acquire`。
- `src/view/Home/index.module.less` 已经具备暗色背景、玻璃卡片、渐变光晕、右侧手机 mockup、漂浮卡片等宣传页资产，应该尽量复用和扩展，而不是整体推翻。
- `src/view/GameBoard/index.tsx` 已通过 `useGameType()` 从 URL 解析游戏类型，并把 `gameType` 传给 `RoomCard`。
- `src/hooks/request/useRoomList.ts` 已经按 `gameType` 分发房间列表请求。
- `src/hooks/request/useCreateRoom.ts` 目前仍固定使用 `createAcquireRoom`，会导致达芬奇大厅创建房间时没有真正按游戏类型分发。
- `src/view/GameBoard/components/Header/index.tsx` 标题固定为 `Acquire 游戏大厅`，进入达芬奇大厅时文案不准确。
- `src/view/GameBoard/components/RoomCard/index.tsx` 有并购硬编码，包括玩家上限 `6`、地块进度 `108`、并购语义图标和进度文案。

## Design Direction

- 整体概念：桌游海报展台 / 首映切换器。顶部 Tab 像海报展厅的片名切换条，下面始终是一张完整的大幅游戏宣传海报。
- 保留现有并购视觉资产：并购仍使用绿色、蓝色、商业扩张、股票列表、地块网格、漂浮资产卡等元素。
- 为达芬奇新增独立视觉语言：使用金色、紫蓝、黑曜石、密码牌、隐藏数字、推理线索、翻牌扫描等元素，避免只是换文案。
- 页面结构不是两个并列卡片，也不是左侧独立导航占位，而是顶部轻量 Tab + 下方单个大舞台。未选中游戏只停留在顶部切换条里，不抢夺主宣传页注意力。
- Tab 颜色和游戏风格绑定：并购 Tab 使用绿色/蓝色商业科技感，达芬奇 Tab 使用金色/紫蓝神秘推理感。
- 动效重点放在 Tab 切换：顶部高亮滑块移动、内容淡入、标题轻微位移、右侧 mockup 重组、主题光晕切换，控制在精致而不花哨的范围内。

## Proposed Changes

### 1. 改造 `src/view/Home/index.tsx`

- 引入 `useState` 管理当前选中的游戏，默认选中 `acquire`，保留 `useNavigate`。
- 定义 `games` 配置数组，包含两个游戏的展示和跳转信息：
  - 并购：`key: 'acquire'`、`title: 'ACQUIRE'`、`subtitle: '并购风云'`、`route: '/game/acquire'`、商业博弈描述、并购专属特性、绿色蓝色主题。
  - 达芬奇：`key: 'davinci'`、`title: 'DA VINCI CODE'`、`subtitle: '达芬奇密码'`、`route: '/game/davinci'`、隐藏信息推理描述、猜牌/心理博弈/快速对局特性、金色紫蓝主题。
- 页面布局改成“顶部 Tab + 原宣传页主体”：
  - `.gameSwitcher`：放在 `.posterCard` 顶部，横向展示两个 Tab，包含中文名、英文名、短标签；点击只切换当前宣传页，不立即跳转。
  - `.posterBody`：承载原来的左右宣传页布局，保持内容区 + 视觉区结构。
  - `.contentArea`：展示选中游戏的 badge、标题、描述、特性列表、主按钮；按钮文案按游戏区分，例如“进入并购大厅”“进入达芬奇大厅”。
  - `.visualArea`：根据选中游戏渲染不同 mockup；并购复用当前股票列表 + 地块网格，达芬奇渲染数字牌阵列 + 隐藏牌 + 推理提示条。
- 使用 `motion` 的 `AnimatePresence` 或基于 `key={activeGame.key}` 的 motion 容器实现切换动画。
- 保留 `ArrowRight`、`Users`、`Smartphone` 等现有图标，同时为达芬奇引入适合的 `lucide-react` 图标，例如 `EyeOff`、`Brain`、`Puzzle`、`Hash`，实际以依赖已有图标库为准。
- footer 从 `Powered by Acquire Online` 改为平台级文案，例如 `Designed for Board Game Strategists · GameBus Online`。

### 2. 调整 `src/view/Home/index.module.less`

- 复用现有 `.posterContainer`、`.backgroundDecor`、`.posterCard` 的暗色玻璃质感和全屏舞台，不把页面改成普通网格列表。
- 将 `.posterCard` 从原来的单层左右布局调整为上下结构：
  - 顶部 `.gameSwitcher` 高度约 `72px`，作为海报内置导航，不独立占用大面积布局。
  - 下方 `.posterBody` 保持原来的 12 栅格海报主体，桌面端继续左内容右视觉。
  - 移动端 `.gameSwitcher` 保持横向滚动或双列胶囊，`.posterBody` 上下堆叠。
- 新增顶部 Tab 样式：
  - `.gameSwitcher`：位于海报卡片顶部，使用半透明深色底、细边框、内阴影和轻微模糊，像嵌在海报上的控制条。
  - `.gameTab`：胶囊式或分段按钮式，未选中低对比但保留对应游戏的淡色光晕，选中态使用该游戏主题渐变、边框和底部高亮线。
  - `.gameTabAcquire`：绿色/蓝色渐变、金融网格纹理、细线条高光。
  - `.gameTabDavinci`：金色/紫蓝渐变、暗牌纹理、点阵/密码感高光。
  - `.tabTitle`、`.tabSubtitle`、`.tabStatus`：保持紧凑，不让 Tab 抢主标题层级。
- 新增主题变量类：
  - `.themeAcquire` 设置 `--accent-primary: #10b981`、`--accent-secondary: #3b82f6`。
  - `.themeDavinci` 设置 `--accent-primary: #f59e0b`、`--accent-secondary: #7c3aed`。
- 改造现有样式使用 CSS 变量驱动颜色，让 Tab 切换时 badge、按钮、渐变文字、mockup 高亮同步变化。
- 新增达芬奇视觉样式：
  - `.codeBoard`：数字牌网格。
  - `.numberTile`：明牌/暗牌两种状态。
  - `.deductionLine`：推理提示条或扫描线。
  - `.mysteryCard`：漂浮的隐藏牌。
- 保留并购现有 `.stockList`、`.grid`、`.floatingCard` 等结构，并把命名/样式调整到可与达芬奇视觉共存。

### 3. 修正 `src/hooks/request/useCreateRoom.ts`

- 将创建房间函数按 `gameType` 分发：
  - `acquire` 使用 `createAcquireRoom`。
  - `davinci` 使用 `createDaVinciRoom`。
- 成功后继续跳转 `/game/${gameType}/match?roomID=${data.roomID}`。
- `splendor` 当前路由未启用，本次不在首页暴露；如果保留类型分支，必须避免无参数调用 `createSplendorRoom`。

### 4. 配置化 `src/view/GameBoard/components/Header/index.tsx`

- 从 `GameBoard` 向 `Header` 传入 `gameType`，避免 Header 自己重复解析路由。
- 根据 `gameType` 显示大厅标题：
  - `acquire` 显示 `Acquire 游戏大厅`。
  - `davinci` 显示 `达芬奇密码 游戏大厅`。
- 其他个人主页、Profile、退出登录逻辑保持不变。

### 5. 轻量适配 `src/view/GameBoard/components/RoomCard/index.tsx`

- 增加游戏元信息映射，集中管理不同游戏的大厅展示差异。
- 并购继续展示地块进度：`108 - emptyTileCount` / `108`。
- 达芬奇不展示并购地块进度；改为展示“推理对局”或“房间状态”，避免错误使用 `emptyTileCount`。
- 玩家上限不要散落硬编码。若达芬奇现有类型没有暴露上限，先配置成与当前大厅逻辑一致的 `6`，后续可按后端规则调整。
- 进入房间逻辑保持不变，继续使用 `/game/${gameType}/match?roomID=...`。

## Assumptions & Decisions

- 本次两个游戏指已启用路由的 `Acquire` 和 `DaVinci`。
- `/` 是统一平台入口，左侧 Tab 只做宣传页切换，真正进入游戏通过选中宣传页的主按钮。
- 不新增 `/home/acquire`、`/home/davinci` 作为主要方案，避免路由和用户入口分散。
- 不把首页做成两个并排普通卡片，因为这会削弱现有并购页面的宣传质感。
- `Splendor` 代码存在但路由仍注释，本次不在首页展示，避免暴露未完成入口。
- 本次只做前端入口和大厅展示适配，不调整后端接口路径、鉴权、WebSocket 协议。

## Verification Steps

- 运行 `npm run build`，确认 TypeScript 和 Vite 构建通过。
- 打开 `/`，确认默认展示并购宣传页，海报上方显示并购和达芬奇两个顶部 Tab。
- 点击顶部“达芬奇密码” Tab，确认 Tab 选中态切换为达芬奇主题色，主标题、描述、特性、主题色、右侧视觉 mockup 和入口按钮都切换为达芬奇。
- 点击顶部“并购风云” Tab，确认 Tab 选中态切回并购主题色，页面恢复当前并购风格并保留现有宣传页质感。
- 点击并购入口按钮，确认进入 `/game/acquire` 并正常加载大厅。
- 点击达芬奇入口按钮，确认进入 `/game/davinci` 并正常加载大厅。
- 在达芬奇大厅点击“创建房间”，确认使用达芬奇创建逻辑并跳转 `/game/davinci/match?roomID=...`。
- 检查移动端宽度下顶部 Tab 仍可触达、不会挤压主视觉，内容可滚动且入口按钮可点击。
