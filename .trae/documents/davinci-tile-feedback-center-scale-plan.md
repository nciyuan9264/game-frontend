# DaVinci 牌面反馈动画缩放中心修复方案

## Summary

当前 DaVinci 猜对/猜错后，目标牌会出现低透明度红/绿色反馈背景，并在猜对时触发缩放回弹。但这个反馈动画的缩放中心不在牌中心，视觉上会从左上角附近放大。

根因是 `GameCanvas` 里的 tile 是 `PIXI.Container`，局部原点在牌左上角，当前动画直接对 `container.scale` 做缩放；PIXI 默认围绕容器 `(0, 0)` 缩放，而不是围绕牌中心。同时反馈 overlay 使用了全局 `dimensionsRef.current`，但实际渲染时对手牌、自己牌、牌堆牌会使用不同的 `dims`，导致反馈背景尺寸也可能和真实牌尺寸不完全一致。

修复目标：

1. 每次触发反馈时，基于当前目标牌实例独立计算牌的真实中心点。
2. 红/绿反馈背景基于当前牌真实尺寸绘制和缩放。
3. 放大/缩小动画围绕牌中心发生，不再偏向左上角。
4. 不影响现有牌位布局、发牌/归位动画、点击区域和隐藏信息策略。

## Current State Analysis

### 反馈动画入口

文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

当前 `flashTileFeedback` 暴露给父组件使用：

```ts
flashTileFeedback: (tileId: string, correct: boolean) => void;
```

实现逻辑：

* 通过 `tilesMap.current.get(tileId)` 找到目标 `PIXI.Container`。

* 使用 `dimensionsRef.current` 创建 overlay：

```ts
.roundRect(-6, -6, dims.tileWidth + 12, dims.tileHeight + 12, dims.tileRadius + 6)
```

* overlay 只做 `alpha` 闪烁。

* `correct === true` 时对 `container.scale` 做 `1 -> 1.25 -> 1` 的回弹。

* `correct === false` 时对 `container.x` 做左右抖动。

### 牌容器结构

`createTileGraphic(tile, dims)` 创建的牌容器：

* `shadow` 从 `(4, 4)` 开始绘制。

* `body` 从 `(0, 0)` 绘制，大小为当前传入的 `dims.tileWidth` / `dims.tileHeight`。

* `body.name = 'body'`。

* `glint`、文字、JOKER 横线等都以 `body` 尺寸为基准。

* container 本身没有设置 `pivot` 或 `anchor`，所以局部原点就是左上角。

### 多套牌尺寸

同一个 `GameCanvas` 中存在多套实际牌尺寸：

* 牌堆使用 `dims`。

* 对手排列区/aside 使用 `oppDims`。

* 玩家排列区/aside 使用 `playerDims`。

当前 `flashTileFeedback` 使用 `dimensionsRef.current`，而 `dimensionsRef.current` 只代表 `calculateTileDimensions` 的基础尺寸，不一定等于目标牌当前实际尺寸。

这意味着：

* overlay 宽高可能对不上目标牌。

* 缩放补偿如果只用全局尺寸，也会对不同区域的牌产生不同偏差。

### 缩放中心偏移原因

当前正确反馈：

```ts
gsap.fromTo(
  container.scale,
  { x: 1, y: 1 },
  { x: 1.25, y: 1.25, yoyo: true, repeat: 1, duration: 0.25 }
);
```

因为 `container.pivot` 默认是 `(0, 0)`，所以缩放中心就是牌左上角，不是牌中心。即使 overlay 从 `-6, -6` 开始绘制，也不会改变容器缩放中心。

## Proposed Changes

### 1. 新增读取当前牌真实几何信息的 helper

文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

新增内部 helper，例如：

```ts
const getTileGeometry = (container: PIXI.Container) => {
  const body = container.getChildByName('body') as PIXI.Graphics | null;
  const bounds = body?.getLocalBounds();
  const width = bounds?.width || dimensionsRef.current.tileWidth;
  const height = bounds?.height || dimensionsRef.current.tileHeight;
  return {
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
    radius: Math.max(4, Math.min(width, height) * 0.1),
  };
};
```

Why:

* 每次反馈时按目标 `container` 自己的 `body` 获取尺寸。

* 避免对手牌/玩家牌/牌堆牌使用错误的全局 `dimensionsRef`。

* 不需要引入新的状态或改变 render 布局。

兼容：

* 如果 `body` 暂时不存在，降级使用 `dimensionsRef.current`。

### 2. 让红/绿反馈背景围绕牌中心缩放

文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

替换当前 overlay 创建方式：

* 不再用 `roundRect(-6, -6, ...)` 依赖左上角缩放。

* 使用当前牌几何信息绘制 overlay，并把 overlay 的 pivot 设置到中心。

建议实现：

```ts
const geometry = getTileGeometry(container);
const padding = 6;
const overlay = new PIXI.Graphics()
  .roundRect(
    -padding,
    -padding,
    geometry.width + padding * 2,
    geometry.height + padding * 2,
    geometry.radius + padding
  )
  .fill({ color: feedbackColor, alpha: 0.68 });

overlay.pivot.set(geometry.centerX, geometry.centerY);
overlay.position.set(geometry.centerX, geometry.centerY);
overlay.scale.set(0.92);
```

然后动画：

```ts
gsap.to(overlay.scale, {
  x: 1.12,
  y: 1.12,
  duration: 0.18,
  yoyo: true,
  repeat: 1,
  ease: 'power2.out',
});
```

overlay 透明度仍保留：

```ts
gsap.to(overlay, {
  alpha: 0.68,
  duration: 0.12,
  onComplete: () => {
    gsap.to(overlay, { alpha: 0, duration: 0.45, delay: 0.12, ... });
  },
});
```

Why:

* 低透明度红/绿背景本身从牌中心放大/缩小。

* 即使不缩放整张牌，用户也能看到正确的中心扩散反馈。

### 3. 修正猜对时整张牌回弹的缩放中心

文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

有两种实现方式，推荐使用“不改变 pivot，只补偿 x/y”的方式，避免破坏现有布局动画。

推荐 helper：

```ts
const animateContainerScaleFromCenter = (
  container: PIXI.Container,
  centerX: number,
  centerY: number,
  targetScale: number
) => {
  const baseX = container.x;
  const baseY = container.y;

  gsap.fromTo(
    container,
    { pixiScale: 1 },
    {
      pixiScale: targetScale,
      duration: 0.25,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      onUpdate: function () {
        const scale = 1 + (targetScale - 1) * this.progress();
        container.scale.set(scale);
        container.x = baseX - centerX * (scale - 1);
        container.y = baseY - centerY * (scale - 1);
      },
      onComplete: () => {
        container.scale.set(1);
        container.x = baseX;
        container.y = baseY;
      },
    }
  );
};
```

实际实现可更简单：用一个普通对象 `{ scale: 1 }` 作为 GSAP target，`onUpdate` 中读取 `state.scale`，设置：

```ts
container.scale.set(state.scale);
container.x = baseX - geometry.centerX * (state.scale - 1);
container.y = baseY - geometry.centerY * (state.scale - 1);
```

Why 不直接设置 `container.pivot`：

* 当前所有牌定位逻辑都把 `container.x/y` 当作左上角坐标。

* 如果在 `createTileGraphic` 或反馈时改变 `pivot`，需要同步改所有位置计算和已有移动动画，风险更高。

* 用 `x/y` 补偿能只影响本次反馈动画，动画结束恢复原位。

注意：

* 开始前先 `gsap.killTweensOf(container.scale)`，避免 hover 缩放或旧反馈动画冲突。

* 动画结束必须恢复 `scale = 1`、`x = baseX`、`y = baseY`。

### 4. 修正猜错抖动与反馈动画的并发关系

文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

当前猜错只做：

```ts
const baseX = container.x;
gsap.to(container, { x: baseX + 7, ... });
```

保留抖动，但应注意：

* overlay 的中心缩放独立于 container 抖动。

* 抖动结束恢复 `x = baseX`。

* 不对 container scale 做猜错缩放，避免猜错时未翻开的牌产生过强误导。

如果猜错也希望背景有放大/缩小，只让 overlay 自身缩放，不缩放整张牌。

### 5. 验证范围

不改：

* 不改 `Game/index.tsx` 的 `lastData` 逻辑。

* 不改顶部动作条。

* 不改 `cardData` 隐藏信息策略。

* 不改牌位计算、点击条件、发牌/归位动画。

只改：

* `GameCanvas/index.tsx` 内部 `flashTileFeedback` 及其 helper。

## Assumptions & Decisions

* 目标是修复视觉反馈动画中心，不改变游戏交互或协议。

* 每次反馈都应从当前目标牌实例获取几何信息，而不是使用全局 `dimensionsRef`。

* 不在本次中全局重构牌容器 pivot，因为会影响所有布局坐标。

* 反馈 overlay 的放大缩小应独立于整张牌缩放；猜对可以保留整张牌回弹，但必须做中心补偿。

* 猜错保留红色 overlay 和左右抖动，不缩放整张牌。

* 若动画期间牌位因为 `ROOM_SYNC` 触发移动，`renderGame` 仍可覆盖最终位置；反馈动画 `onComplete` 会把本次动画恢复到开始时位置，避免持久漂移。

## Verification Steps

1. 类型检查：

```bash
npx tsc --noEmit
```

1. 手动验证自己猜对：

* 点击对手未翻牌并猜对。

* 预期：绿色低透明度背景从目标牌中心扩散/回缩；整张牌回弹中心在牌中心；牌最终位置不漂移。

1. 手动验证自己猜错：

* 点击对手未翻牌并猜错。

* 预期：红色低透明度背景从目标牌中心扩散/回缩；目标牌左右抖动后回到原位；不显示真实牌面。

1. 验证不同牌区：

* 对手 row 牌、对手 aside 牌、自己 row 牌、自己 aside 牌、牌堆牌如果触发反馈，overlay 都贴合当前牌尺寸。

1. 验证响应式：

* 桌面、移动端竖屏、低高度横屏下，反馈中心仍在牌中心。

1. 回归验证：

* hover 可点击牌时的轻微缩放仍正常。

* 抽牌、放回、猜牌后牌移动动画不出现持久偏移。

