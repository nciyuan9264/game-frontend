# 修复达芬奇匹配页添加人机人数上限

## Summary

修复达芬奇密码游戏 Match 界面右上角“添加人机”按钮在房间已满 2 人后仍可继续发送 `match_add_ai` 消息的问题。前端应在达芬奇匹配页根据当前玩家数和固定座位上限 2 判断是否还有空位；没有空位时禁用按钮，并在点击处理里二次拦截，避免继续向 WebSocket 发送添加 AI 请求。

## Current State Analysis

* 达芬奇匹配主组件位于 `src/view/DaVinci/components/Match/index.tsx`。

* 该组件已在构造 `seats` 时使用 `const totalSeats = 2`，并只补齐 2 个座位。

* 座位卡片的添加 AI 入口通过 `firstEmptySeatIndex` 和 `canAddAI` 控制，因此座位卡片路径在满员后不会继续提供空位添加入口。

* 右上角 Header 组件位于 `src/view/DaVinci/components/Match/components/Header/index.tsx`。

* Header 内“添加人机”按钮仅判断 `isHostView` 和 WebSocket 是否打开，不知道当前房间是否已满，因此满 2 人后仍会发送：

```ts
sendMessage(JSON.stringify({
  type: 'match_add_ai',
}));
```

* 公共按钮组件 `src/components/Button/index.tsx` 已继承原生 `button` 属性，支持 `disabled`；样式文件 `src/components/Button/index.module.less` 已提供禁用态样式。

## Proposed Changes

### `src/view/DaVinci/components/Match/index.tsx`

* 将达芬奇匹配页的座位上限抽为组件内常量，例如 `const totalSeats = 2`，避免同一逻辑分散。

* 基于 `wsMatchSyncData?.players` 计算当前玩家数：

```ts
const playerCount = Object.values(wsMatchSyncData?.players || {}).length;
```

* 计算 Header 是否还能添加 AI：

```ts
const canAddAI = playerCount < totalSeats;
```

* 将该布尔值传入 Header：

```tsx
<Header
  isHostView={isOwner}
  wsRef={wsRef}
  currentPlayerData={currentPlayerData}
  isAllReady={isAllReady}
  canAddAI={canAddAI}
  sendMessage={sendMessage}
/>
```

* 保持 PlayerCard 现有 `canAddAI={index === firstEmptySeatIndex}` 行为不变，避免改变座位卡片交互。

### `src/view/DaVinci/components/Match/components/Header/index.tsx`

* 在 `IHeaderProps` 中新增 `canAddAI: boolean`。

* 在 Header 参数中接收 `canAddAI`。

* 给右上角“添加人机”按钮添加 `disabled={!canAddAI}`。

* 在 `onClick` 中先判断 `canAddAI`，如果为 `false` 直接 return，再判断 WebSocket 并发送消息。

* 可选地将按钮文案在满员时改为 `房间已满`，但为保持 UI 文案稳定，默认计划只禁用按钮，不改文案。

## Assumptions & Decisions

* 达芬奇密码游戏最多 2 名玩家是当前产品规则，前端以 `Match/index.tsx` 中已有的 `totalSeats = 2` 为准。

* 本次只修复达芬奇匹配页，不修改 Acquire 匹配页，因为 Acquire 当前上限是 `totalSeats = 6`，用户反馈的问题限定为达芬奇密码。

* 前端禁用按钮和点击二次拦截用于修复 UI 层重复添加问题；后端仍应保留人数上限校验，但本次计划不涉及后端。

* 不新增测试文件；该项目当前没有发现现成的组件测试框架配置，改动较小，使用类型检查和手动验证即可。

## Verification Steps

* 运行类型与构建检查：

```bash
npm run build
```

* 手动验证达芬奇匹配页：

  * 创建或进入达芬奇房间，房间只有房主 1 人时，右上角“添加人机”可点击。

  * 点击一次后房间达到 2 人，“添加人机”按钮进入禁用态。

  * 房间达到 2 人后再次点击该按钮不会发送新的 `match_add_ai` 消息。

  * 通过座位卡片添加 AI 的原有行为保持不变：只有第一个空位可添加，满员后没有空位入口。

  * “开始游戏”按钮仍按 `isAllReady` 规则启用或禁用。

