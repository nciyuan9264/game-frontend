# 修复 DaVinci 在猜对对手所有牌后报 `Cannot set properties of null (setting 'y')` 的错误

## 总结（Summary）
猜对对手所有牌后，游戏从 `setCard / guessCard` 状态切换到 `end` 状态，触发 `GameCanvas` 重新渲染。重新渲染时 `slotMap` 中的 PIXI 容器会被 `destroy({ children: true })`，但之前启动的 GSAP 补间动画（`gsap.to(slot, { x, y, ... })`、`gsap.to(slot.scale, ...)`）并未被 kill。GSAP 的下一个 tick 仍会尝试给已经 destroy 的对象设置 `y`，而 PIXI v8 destroy 后内部的 `transform.position` 为 `null`，于是抛出：

```
Uncaught TypeError: Cannot set properties of null (setting 'y')
```

同样的隐患也存在于 `tilesMap`（卡牌容器）中的 GSAP 动画——虽然牌容器目前只是被 `removeChild` 不会立即报错，但在组件卸载时 `app.destroy(true, { children: true, texture: true })` 会同时销毁这些容器，仍可能与未结束的 `gsap.to(container, ...)` 冲突。

## 当前状态分析（Current State Analysis）

相关代码位于 [GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)：

1. 进入 setCard 状态时为每个允许的插入位创建 `slot` 容器，并通过：
   - [创建 slot 并启动 gsap 动画](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L648-L723)
     - `gsap.to(slot.scale, ...)`（pointerover/pointerout）
     - `gsap.to(slot, { x, y, duration: 0.4 })`（每次渲染都会触发）
2. 当 `gameStatus !== 'setCard'` 或玩家失去回合时，进入 else 分支：
   - [destroy slot](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L731-L741)
     ```ts
     uiLayer.removeChild(slot);
     if ((slot as any).destroy) {
       (slot as any).destroy({ children: true });
     }
     ```
   - 这里 **没有** 先 `gsap.killTweensOf(slot)`，导致仍在进行中的 0.4s 位置补间和 0.15s 的 scale 补间在下一帧调用 `slot.y = ...` / `slot.scale.x = ...`，而 `slot.transform`/`slot.position` 已经是 `null`。
3. 牌容器 `tilesMap` 的 GSAP 补间在以下场景同样未被 kill：
   - 牌不再属于 `activeIds` 时被 [`removeChild`](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L750-L757)
   - `needsRecreate` 触发的旧 container 被 [`removeChild` 后丢弃](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L381-L390) 等多处
   - 组件卸载时 `app.destroy(true, { children: true, texture: true })`（[index.tsx#L114-L118](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L114-L118)）

「猜对所有对手牌」之所以特别容易触发，是因为这一动作会同时让多个 tile 进入 `isRevealed`、让 `gameStatus` 切换、让 slot 被销毁，正好命中"slot 还有未结束 tween → destroy"的时序。

## 改动方案（Proposed Changes）

只修改 [GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)，原则是：**在销毁/重建 PIXI 对象之前一定先 `gsap.killTweensOf` 它本身以及它的 `scale`**。

### 改动 1：销毁 slot 前 kill 其 tweens
位置：第 731-741 行的 else 分支，以及第 724-730 行的"非活跃 slot 清理"循环。

```ts
// 旧
uiLayer.removeChild(slot);
if ((slot as any).destroy) {
  (slot as any).destroy({ children: true });
}

// 新
gsap.killTweensOf(slot);
gsap.killTweensOf(slot.scale);
slot.removeAllListeners();
uiLayer.removeChild(slot);
if ((slot as any).destroy) {
  (slot as any).destroy({ children: true });
}
```

把对应的 `removeAllListeners` 和 `killTweensOf` 一起放到清理路径里，确保非活跃 slot 与"非 setCard"分支都得到处理。

### 改动 2：删除 / 重建 tile container 前 kill 其 tweens
位置：
- 第 381-390 行 `needsRecreate` 重建分支
- 第 424-432 行 对手抽牌的重建分支
- 第 508-517 行 玩家排好牌的重建分支
- 第 552-561 行 玩家抽牌的重建分支
- 第 605-614 行 牌池的重建分支
- 第 750-757 行 不再活跃的 tile 清理

每处在调用 `container.parent.removeChild(container)` 之前增加：

```ts
gsap.killTweensOf(container);
gsap.killTweensOf(container.scale);
```

> 注：tile 容器目前没有走 `destroy`，单纯 `removeChild` 不会立刻把 position 置 null；但保留未结束的 tween 会让它在下一帧仍然写新坐标，再加上后续重新创建同 id 的牌时 `tilesMap` 的引用切换会出现"老 container 偷偷动到新位置"的视觉残留。统一 kill 才能彻底干净。

### 改动 3：组件卸载时统一 kill 全部 tween 再 destroy app
位置：第 114-118 行的 `useEffect` cleanup。

```ts
return () => {
  // 先 kill 所有正在进行的 gsap 动画，避免在 destroy 之后写入 null
  tilesMap.current.forEach(c => {
    gsap.killTweensOf(c);
    gsap.killTweensOf(c.scale);
  });
  slotMap.current.forEach(s => {
    gsap.killTweensOf(s);
    gsap.killTweensOf(s.scale);
  });
  if (appRef.current) {
    appRef.current.destroy(true, { children: true, texture: true });
    appRef.current = null;
  }
  tilesMap.current.clear();
  slotMap.current.clear();
};
```

## 关键决定 / 假设（Assumptions & Decisions）
- 不改变现有渲染/动画语义，只在销毁前补齐"先 kill tween"的清理动作。
- 不引入新依赖；继续使用项目里已有的 `gsap`（[package.json#L27](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/package.json#L27)）。
- 不动游戏业务逻辑（猜牌结果、状态切换由 WebSocket 决定，与该问题无关）。

## 验证步骤（Verification）
1. 启动前端 `pnpm dev` / `npm run dev`，进入 DaVinci 房间开始一局。
2. 完成一次进入 `setCard` 的回合（例如自己抽到非 Joker 牌后插入位置），观察 slot 出现的位置动画。
3. 反复进入 `guessCard` 直到把对手所有牌猜对，触发游戏结束 / 状态切到 `end`。
4. 确认控制台不再出现 `Cannot set properties of null (setting 'y')`。
5. 再快速切换路由离开 DaVinci 页面（触发 unmount），确认控制台同样无该错误。
