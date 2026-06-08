# 修复 DaVinci 牌从 aside 移动到对应位置时的动画路径错误

## Summary

继上次修复 `pool → aside` 路径之后，本次需要修复 `aside → row` 阶段的动画路径错误：

- 场景一（玩家自己 setCard）：玩家在 aside 状态下手动选择插入位置后，牌应当从 aside 位置平滑滑入选定的玩家手牌位置。
- 场景二（猜错自动归位 / 对手归位）：牌自动从 aside 移动到对应排序位置（包括对手 opponentAside → opponentRow）。

当前在某些情况下，牌不是从 aside 平滑过渡到目标位置，而是会从屏幕底部中央（玩家行）或顶部中央（对手行）"飞入"，造成视觉突兀。

## Current State Analysis

入口：[Game/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/index.tsx) → [GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)

数据流：
- 玩家 getCard 后，新牌出现在 `playerHand` 中且 `index < 0`，被 `drawnTiles.forEach`（[L527-L562](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L527-L562)）渲染到 player aside 位置。
- 一旦后端推送 `setCard` 完成（无论是玩家手动选位还是猜错自动归位），该牌的 `index >= 0`，转入 `arrangedSorted`，由 `arrangedSorted.forEach`（[L490-L519](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L490-L519)）渲染到玩家行。
- 对手翻牌同理：从 `opponentDrawnTiles`（[L406-L444](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L406-L444)）转到 `opponentArrangedSorted`（[L370-L402](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L370-L402)）。

动画白名单 `shouldAnimateMove`（[L329-L342](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L329-L342)）已允许：
- `playerAside → playerRow` ✅
- `opponentAside → opponentRow` ✅

### 根因（与上次同源）

牌在 aside 阶段使用的 `playerDims` / `oppDims` 尺寸，会因为 `playerCount` / `oppCount` 增加导致 `playerScale` / `oppScale` 变化而**和 row 阶段不一致**：

- 玩家行：[L455-L462](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L455-L462)，由 `playerCount = arrangedSorted.length` 决定。新牌进入 row 时 `playerCount` 加 1，`playerDims.tileWidth` 变化。
- 对手行：[L352-L356](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L352-L356)，同理。

宽度不一致 → `needsRecreate` 返回 `true` → 旧 container 被销毁、新 container 起点被设置为：

- 玩家行：`(width / 2, height + 100)` — 屏幕底部中央外（[L504-L506](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L504-L506)）。
- 对手行：`(width / 2, -200)` — 屏幕顶部中央外（[L386-L388](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L386-L388)）。

随后 `gsap.to` 从该错误起点动画到目标位置，因此用户看到牌从屏幕外飞入而不是从 aside 平滑移到目标。

### 已修复 / 未修复 对照

| 阶段 | 文件位置 | 是否已修复 |
| ---- | -------- | ---------- |
| `pool → playerAside` | drawnTiles.forEach（[L527-L553](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L527-L553)） | ✅ 上次已修 |
| `pool → opponentAside` | opponentDrawnTiles.forEach（[L406-L432](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L406-L432)） | ✅ 上次已修 |
| `playerAside → playerRow` | arrangedSorted.forEach（[L490-L519](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L490-L519)） | ❌ **本次修复目标** |
| `opponentAside → opponentRow` | opponentArrangedSorted.forEach（[L370-L402](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L370-L402)） | ❌ **本次修复目标** |

## Proposed Changes

只修改一个文件：[GameCanvas/index.tsx](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx)。沿用上次相同的修复模式：在重建 container 前缓存旧 container 的 `x/y`，重建后若旧位置存在则把新 container 起点置为旧位置；若不存在（首次创建）才回退到原默认起点。

### 修改 1：玩家行（`arrangedSorted.forEach`，aside → playerRow）

定位：[L490-L519](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L490-L519)。

参考改动：
```ts
arrangedSorted.forEach((tile, i) => {
  let container = tilesMap.current.get(tile.id);
  const prevX = container?.x;
  const prevY = container?.y;
  const pos = playerPositions[i];

  if (!container || needsRecreate(container, playerDims.tileWidth)) {
    if (container) {
      if (container.parent) {
        container.parent.removeChild(container);
      }
      tilesMap.current.delete(tile.id);
    }
    container = createTileGraphic(tile, playerDims);
    cardLayer.addChild(container);
    tilesMap.current.set(tile.id, container);
    if (prevX !== undefined && prevY !== undefined) {
      // 复用旧位置（aside 位置或上一次行内位置），让动画从此处开始
      container.x = prevX;
      container.y = prevY;
    } else {
      const startLocal = toLocalPoint(cardLayer, width / 2, height + 100);
      container.x = startLocal.x;
      container.y = startLocal.y;
    }
  } else {
    updateTileGraphic(container, tile, playerDims, false);
  }
  ...
});
```

修改后：
- 当玩家手动选位后，新牌从 aside 位置平滑滑到选中插槽位置。
- 当猜错自动归位时，新牌也从 aside 位置滑到排序后的位置。
- 当玩家行内已有牌因 `playerScale` 变化而触发重建时，也会从其原位置平滑过渡到新位置（避免现有牌飞入）。

### 修改 2：对手行（`opponentArrangedSorted.forEach`，aside → opponentRow）

定位：[L370-L402](file:///Users/bytedance/github:@nciyuan9264/game/game-frontend/src/view/DaVinci/components/Game/components/GameCanvas/index.tsx#L370-L402)。

同样模式：
```ts
opponentArrangedSorted.forEach((tile, i) => {
  let container = tilesMap.current.get(tile.id);
  const prevX = container?.x;
  const prevY = container?.y;
  const pos = oppPositions[i];

  if (!container || needsRecreate(container, oppDims.tileWidth)) {
    if (container) {
      if (container.parent) {
        container.parent.removeChild(container);
      }
      tilesMap.current.delete(tile.id);
    }
    container = createTileGraphic(tile, oppDims);
    cardLayer.addChild(container);
    tilesMap.current.set(tile.id, container);
    cardLayer.x = 0;
    cardLayer.y = 0;
    if (prevX !== undefined && prevY !== undefined) {
      container.x = prevX;
      container.y = prevY;
    } else {
      const startLocal = toLocalPoint(cardLayer, width / 2, -200);
      container.x = startLocal.x;
      container.y = startLocal.y;
    }
  } else {
    updateTileGraphic(container, tile, oppDims, false);
  }
  ...
});
```

理由：对手抽牌后归位（无论是被玩家猜对翻牌后归位、还是对手自己 setCard 完成）需要相同的平滑过渡。

### 不在本次改动范围

- 不调整 `shouldAnimateMove` 的过渡白名单（当前白名单已涵盖 `playerAside → playerRow` 与 `opponentAside → opponentRow`）。
- 不改动 `pool.forEach`、`drawnTiles.forEach`、`opponentDrawnTiles.forEach`（已在上次修复）。
- 不改动 `Game/index.tsx`、`DaVinci/index.tsx` 等上层文件，不修改样式与类型定义。
- 不替换 `needsRecreate` 的判定逻辑——只通过保留起点来回避错误飞入。

## Assumptions & Decisions

1. 旧 container 的 `x/y` 即上次渲染结束/动画终点的位置，可作为新 container 的可信起点。
2. 当 `playerCount` / `oppCount` 改变时尺寸略变属于已知行为；本次修复让重建时以原位置为起点，仍保留 `gsap.to` 缓动到新位置，整体视觉无突兀。
3. 不在本次新增任何"翻牌动画"等额外效果；用户描述的两种场景都属于"位置变更"，仅修复路径起点即可。
4. 不修改首次入场起点（屏幕底部/顶部外），保留首次出现的滑入感。

## Verification Steps

1. 启动前端，进入 DaVinci 游戏房间。
2. 自己回合：
   - 从牌池抽牌（getCard）→ 牌从原位置滑到右手边（已修复）。
   - 选择插入位置（setCard 猜错或主动放置）→ **期望：牌从右手边平滑滑动到选中插槽位置**，无屏幕底部飞入。
3. 自己回合：猜错对手牌触发自动归位 → **期望：牌从右手边平滑滑动到排序后位置**。
4. 对手回合：对手抽牌、归位 → **期望：对手牌从右手边平滑滑动到对手对应行位置**，无屏幕顶部飞入。
5. 多次连续 getCard / setCard，确认 `playerCount` / `oppCount` 变化时已存在的其他牌也不会出现飞入异常。
