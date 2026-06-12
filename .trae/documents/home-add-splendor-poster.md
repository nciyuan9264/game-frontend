# 计划：为 Home 页新增「璀璨宝石 Splendor」入口

## Summary（概述）

在首页海报式切换器（poster switcher）中新增第三个游戏 **Splendor（璀璨宝石）** 的入口。
首页目前是单屏海报 + 顶部 Tab 切换的结构，所有游戏数据硬编码在 `Home/index.tsx` 顶部的 `gameConfigs` 数组里，每个游戏有自己的主题色与一个纯 CSS/motion 绘制的「手机界面 mockup」视觉组件。

本次只新增 Splendor 一项，**不改路由、不改大厅、不改 Splendor 游戏本体**（这些都已存在）。核心改动集中在两个文件：`Home/index.tsx` 与 `Home/index.module.less`。

设计方向：宝石/珠宝质感（gem / jewel），主题色采用 **金 `#f5c451` + 紫晶 `#a855f7`**，与 Splendor 游戏内 UI 现有的 `@gold: #f5c451`、`@accent: #a855f7` 保持一致（即「匹配当前项目」）。视觉 mockup 用彩色宝石 token + 发展卡 + 贵族卡构成，宝石的多彩配色让该主题一眼可辨，不与 DaVinci（amber/violet）混淆。

## Current State Analysis（现状分析）

关键文件：
- `src/view/Home/index.tsx`
  - 第 18-57 行：`gameConfigs as const`，含 acquire / davinci 两项。`type GameKey = typeof gameConfigs[number]['key']` 会自动随数组扩展。
  - 第 61-123 行：`AcquireVisual`；第 125-187 行：`DaVinciVisual`（纯 div + motion 动画 mockup）。
  - 第 193 行：`themeClass = activeGame.key === 'acquire' ? styles.themeAcquire : styles.themeDavinci`（二元判断，需扩展）。
  - 第 215 行：Tab className `game.key === 'acquire' ? styles.gameTabAcquire : styles.gameTabDavinci`（二元判断，需扩展）。
  - 第 282 行：`activeGame.key === 'acquire' ? <AcquireVisual /> : <DaVinciVisual />`（二元判断，需扩展）。
- `src/view/Home/index.module.less`
  - 第 35-47 行：`.themeAcquire` / `.themeDavinci` 定义 `--accent-primary/-secondary/-soft/-border`。
  - 第 124-140 行：`.gameSwitcher` 使用 `grid-template-columns: repeat(2, minmax(0, 1fr))`（写死 2 列，需改）。
  - 第 206-229 行：`.gameTabAcquire` / `.gameTabDavinci` 定义 `--tab-primary/-secondary/-border` 与 `&::before` 纹理。

已就绪、**无需改动**的部分：
- 路由：`src/route/routes.tsx` 已有 `/game/splendor`（大厅）与 `/game/splendor/match`（对局），`Splendor` 已 lazy import。
- 大厅：`GameBoard` + `Header` 已有 splendor 标题映射（`璀璨宝石 游戏大厅`）。
- CTA 跳转目标与 acquire 一致，指向大厅 `/game/splendor`。

技术栈：React 18 + react-router-dom v6 + `motion`（`motion/react`）+ less CSS Modules + lucide-react 图标。

## Proposed Changes（具体改动）

### 1. `src/view/Home/index.tsx`

**(a) 引入新图标**
在第 4-15 行的 lucide-react import 中追加宝石主题图标：`Gem`、`Coins`、`Crown`、`Sparkles`。

**(b) 在 `gameConfigs` 数组追加第 3 项（acquire、davinci 之后，保持 `as const`）：**
```ts
{
  key: 'splendor',
  tabTitle: '璀璨宝石',
  tabSubtitle: 'SPLENDOR',
  tabStatus: '资源引擎',
  badge: '宝石商人 · 文艺复兴争锋',
  title: 'SPLENDOR',
  subtitle: '璀璨宝石',
  description: '收集五色宝石，购入发展卡，赢得贵族青睐。步步积累引擎，率先夺取 15 分声望，加冕最闪耀的珠宝巨匠。',
  route: '/game/splendor',
  cta: '进入宝石大厅',
  footer: 'Gem Merchant Guild',
  features: [
    { icon: <Gem size={20} />, title: '五色宝石', desc: '钻石/蓝宝/祖母绿/红宝/玛瑙' },
    { icon: <Coins size={20} />, title: '引擎构筑', desc: '发展卡叠加，越滚越强' },
    { icon: <Crown size={20} />, title: '贵族加冕', desc: '满足条件，坐拥额外声望' },
    { icon: <Sparkles size={20} />, title: '15 分制胜', desc: '率先达成者赢得对局' },
  ],
},
```

**(c) 新增 `SplendorVisual` 组件**（放在 `DaVinciVisual` 之后、`Home` 之前）。
结构沿用 `mockup` 容器（手机界面）+ 两张漂浮卡，使用现有公共类 `styles.mockup` 与新建的 splendor 专属类：
- 手机内（`styles.splendorUI`）：
  - 顶部 header：左侧标题点 + 右侧分数徽章 `15`（`styles.splendorHeader` / `styles.scoreBadge`）。
  - 宝石池一行 5 颗彩色 token（白/蓝/绿/红/黑），用内联背景色 + `styles.gemRow` / `styles.gemToken`。
  - 发展卡网格 2×3（`styles.cardGrid` / `styles.devCard`），每张含右上分数点 + 底部成本点，部分卡高亮。
  - 底部贵族条（`styles.nobleRow`）：2-3 个金边方块。
- 两张漂浮卡：一颗放大的宝石 token（`styles.floatingGem`，带 motion 上下浮动）与一张金色贵族卡（`styles.floatingNoble`，带 ♛ 与 motion 浮动），呼应 acquire/davinci 的 `floatingCard`/`mysteryCard` 漂浮风格。
- 用 `motion.div` 做入场（initial/animate/exit scale+rotate，与 AcquireVisual 一致的 spring 参数）与循环浮动。

**(d) 把 3 处二元判断改为支持三类 key：**
- 第 193 行 `themeClass`：改为映射对象或 switch：
  ```ts
  const themeMap = { acquire: styles.themeAcquire, davinci: styles.themeDavinci, splendor: styles.themeSplendor } as const;
  const themeClass = themeMap[activeGame.key];
  ```
- 第 215 行 Tab className：同理用 `tabThemeMap[game.key]`（`gameTabAcquire/Davinci/Splendor`）。
- 第 282 行 visual：改为
  ```ts
  {activeGame.key === 'acquire' ? <AcquireVisual /> : activeGame.key === 'davinci' ? <DaVinciVisual /> : <SplendorVisual />}
  ```

### 2. `src/view/Home/index.module.less`

**(a) 新增主题变量类（紧随 `.themeDavinci` 之后）：**
```less
.themeSplendor {
  --accent-primary: #f5c451;   // 金
  --accent-secondary: #a855f7; // 紫晶
  --accent-soft: rgba(245, 196, 81, 0.14);
  --accent-border: rgba(245, 196, 81, 0.36);
}
```

**(b) `.gameSwitcher` 改为自适应列数**（第 127 行）：
将 `grid-template-columns: repeat(2, minmax(0, 1fr));` 改为 `repeat(3, minmax(0, 1fr));`。
并在 `@media (max-width: 640px)` 内补充 `grid-template-columns: 1fr;`（窄屏 Tab 纵向堆叠，避免 3 列过窄文字溢出）。

**(c) 新增 Tab 主题类（紧随 `.gameTabDavinci` 之后）：**
```less
.gameTabSplendor {
  --tab-primary: #f5c451;
  --tab-secondary: #a855f7;
  --tab-border: rgba(245, 196, 81, 0.5);

  &::before {
    background-image:
      radial-gradient(circle at 22% 30%, rgba(245, 196, 81, 0.22), transparent 30%),
      radial-gradient(circle at 80% 72%, rgba(168, 85, 247, 0.18), transparent 32%),
      repeating-linear-gradient(135deg, transparent 0 13px, rgba(255, 255, 255, 0.05) 13px 14px);
  }
}
```

**(d) 新增 `SplendorVisual` 所需样式类**（放在 `.mysteryCard` 块之后、`@keyframes` 之前），复用 `.mockup` 基类，新增：
- `.splendorUI`（padding/flex 列布局 + 宝石主题径向渐变背景，参考 `.cipherUI` 写法）
- `.splendorHeader`、`.scoreBadge`（金色分数徽章）
- `.gemRow`、`.gemToken`（圆形 token，含高光 `box-shadow: inset`，颜色由内联 style 传入）
- `.cardGrid`、`.devCard`（含 `.devPoint` 角标、`.devCost` 底部点、`&.active` 高亮）
- `.nobleRow`、`.nobleTile`（金边方块）
- `.floatingGem`（绝对定位、上下浮动、圆形大宝石）
- `.floatingNoble`（绝对定位、金渐变贵族卡，含 ♛ 字符）
所有颜色统一引用 `var(--accent-primary)` / `var(--accent-secondary)` 与宝石固有色，保证与主题联动。

## Assumptions & Decisions（假设与决策）

1. **主题色采用金 `#f5c451` + 紫晶 `#a855f7`**：直接对齐 Splendor 游戏内 UI 现有变量（`@gold`/`@accent`），最符合「匹配当前项目」。与 DaVinci（amber/violet）虽相近，但通过 SplendorVisual 的多彩宝石 token 与发展卡/贵族卡内容做强区分。
2. **CTA 指向大厅 `/game/splendor`**（与 acquire `/game/acquire` 同模式），而非直接进对局。
3. **视觉用纯 CSS/motion mockup**，不引入 `public/cover/splendor.jpg` 等图片，保持与现有两个 Visual 的实现风格一致。
4. **Tab 三列**：桌面 3 列等分；≤640px 改为单列堆叠，规避窄屏文字溢出。
5. **不新增路由 / 不改 GameBoard / Header / Splendor 本体**——经探查均已支持 splendor。
6. 三处 `key` 判断统一改为「映射对象 / 三元链」，避免后续再加游戏时继续堆叠三元（最小必要重构，不过度抽象）。

## Verification（验证步骤）

1. `npm run dev` 启动开发服务器，浏览器打开 `/`（首页）。
2. 顶部出现 3 个 Tab：并购风云 / 达芬奇密码 / 璀璨宝石；点击「璀璨宝石」：
   - 主题色切换为金/紫晶（标题渐变、徽章、按钮、glow）。
   - 左侧标题 `SPLENDOR / 璀璨宝石`、描述、4 个 feature（宝石/引擎/贵族/15 分）正确显示。
   - 右侧 `SplendorVisual` 正常渲染：宝石池彩色 token、发展卡网格、贵族条、漂浮宝石与贵族卡，入场与浮动动画流畅。
3. 点击「进入宝石大厅」CTA → 跳转到 `/game/splendor`，进入璀璨宝石大厅（Header 显示「璀璨宝石 游戏大厅」）。
4. 切回 acquire / davinci，确认主题、视觉、动画无回归。
5. 响应式：桌面（≥1024px）双栏正常；窄屏（≤640px）Tab 单列堆叠不溢出，整体可滚动。
6. 控制台无 TS / 运行时报错（`GameKey` 类型已自动包含 'splendor'）。
