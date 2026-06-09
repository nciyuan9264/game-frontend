import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { Card, GameStatus } from '@/types/DaVinicRoom';


interface GameCanvasProps {
  playerHand: Card[];
  opponentHand: Card[];
  pool: Card[];
  isPlayerTurn: boolean;
  gameStatus: GameStatus;
  onTileClick: (tileId: string) => void;
  onSelectInsertPosition?: (index: number, tileId?: string) => void;
}

export interface GameCanvasHandle {
  flashTileFeedback: (tileId: string, correct: boolean) => void;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({
  playerHand,
  opponentHand,
  pool,
  isPlayerTurn,
  gameStatus,
  onTileClick,
  onSelectInsertPosition,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const tilesMap = useRef<Map<string, PIXI.Container>>(new Map());
  const slotMap = useRef<Map<string, PIXI.Container>>(new Map());
  const onTileClickRef = useRef(onTileClick);
  const onSelectInsertPositionRef = useRef(onSelectInsertPosition);
  const dimensionsRef = useRef({ tileWidth: 60, tileHeight: 90, tileRadius: 8 });
  const hasInitRef = useRef(false);
  const prevLocationRef = useRef<Map<string, string>>(new Map());

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

  const animateContainerScaleFromCenter = (
    container: PIXI.Container,
    centerX: number,
    centerY: number,
    targetScale: number
  ) => {
    const baseX = container.x;
    const baseY = container.y;
    const state = { scale: 1 };

    gsap.killTweensOf(container.scale);
    gsap.to(state, {
      scale: targetScale,
      duration: 0.38,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      onUpdate: () => {
        container.scale.set(state.scale);
        container.x = baseX - centerX * (state.scale - 1);
        container.y = baseY - centerY * (state.scale - 1);
      },
      onComplete: () => {
        container.scale.set(1);
        container.x = baseX;
        container.y = baseY;
      },
    });
  };

  useImperativeHandle(ref, () => ({
    flashTileFeedback: (tileId: string, correct: boolean) => {
      try {
        const container = tilesMap.current.get(tileId);
        if (!container) return;

        const geometry = getTileGeometry(container);
        const padding = 6;
        const feedbackColor = correct ? 0x10b981 : 0xef4444;
        const overlay = new PIXI.Graphics()
          .roundRect(
            -padding,
            -padding,
            geometry.width + padding * 2,
            geometry.height + padding * 2,
            geometry.radius + padding
          )
          .fill({ color: feedbackColor, alpha: 0.68 });
        (overlay as any).name = 'feedbackOverlay';
        overlay.alpha = 0;
        overlay.pivot.set(geometry.centerX, geometry.centerY);
        overlay.position.set(geometry.centerX, geometry.centerY);
        overlay.scale.set(0.92);
        container.addChild(overlay);

        gsap.to(overlay.scale, {
          x: 1.12,
          y: 1.12,
          duration: 0.28,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        });

        gsap.to(overlay, {
          alpha: 0.68,
          duration: 0.18,
          onComplete: () => {
            gsap.to(overlay, {
              alpha: 0,
              duration: 0.6,
              delay: 0.18,
              onComplete: () => {
                if (overlay.parent) overlay.parent.removeChild(overlay);
                overlay.destroy();
              },
            });
          },
        });

        if (correct) {
          // 猜对：绿色高亮 + 放大回弹
          animateContainerScaleFromCenter(container, geometry.centerX, geometry.centerY, 1.25);
          return;
        }

        const baseX = container.x;
        gsap.to(container, {
          x: baseX + 7,
          duration: 0.09,
          yoyo: true,
          repeat: 5,
          ease: 'power1.inOut',
          onComplete: () => {
            gsap.set(container, { x: baseX });
          },
        });
      } catch (e) {
        console.warn('[GameCanvas] flashTileFeedback failed:', e);
      }
    },
  }), []);

  const calculateTileDimensions = useCallback((width: number, height: number) => {
    let tileWidth, tileHeight, tileRadius;
    const isShortLandscape = height < 500 && width > height; // 典型手机横屏
    if (isShortLandscape) {
      tileWidth = 42;
      tileHeight = 62;
      tileRadius = 6;
    } else if (width < 480) {
      tileWidth = 40;
      tileHeight = 60;
      tileRadius = 6;
    } else if (width < 768) {
      tileWidth = 50;
      tileHeight = 75;
      tileRadius = 7;
    } else if (width < 1024) {
      tileWidth = 55;
      tileHeight = 82;
      tileRadius = 7;
    } else {
      tileWidth = 60;
      tileHeight = 90;
      tileRadius = 8;
    }

    const maxTileHeight = height * 0.18;
    if (tileHeight > maxTileHeight) {
      const ratio = maxTileHeight / tileHeight;
      tileWidth = Math.floor(tileWidth * ratio);
      tileHeight = Math.floor(maxTileHeight);
      tileRadius = Math.max(4, Math.floor(tileRadius * ratio));
    }

    dimensionsRef.current = { tileWidth, tileHeight, tileRadius };
    return dimensionsRef.current;
  }, []);

  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;
    const initPixi = async () => {
      if (!containerRef.current) return;

      const app = new PIXI.Application();
      await app.init({
        resizeTo: containerRef.current,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        resolution: 1,
      });

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Create layers
      const cardLayer = new PIXI.Container();
      const uiLayer = new PIXI.Container();
      uiLayer.sortableChildren = true;
      cardLayer.sortableChildren = true;

      // 存到 app 上，方便 renderGame 用
      (app as any).layers = {
        cardLayer,
        uiLayer,
      };
      app.stage.addChild(cardLayer);
      app.stage.addChild(uiLayer);
      app.stage.setChildIndex(uiLayer, app.stage.children.length - 1);

      app.renderer.on('resize', () => {
        renderGame(app);
      });

      renderGame(app);
    };

    initPixi();

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
  }, []);

  // Update the ref whenever onTileClick changes
  useEffect(() => {
    onTileClickRef.current = onTileClick;
  }, [onTileClick]);
  useEffect(() => {
    onSelectInsertPositionRef.current = onSelectInsertPosition;
  }, [onSelectInsertPosition]);

  // Update rendering when props change
  useEffect(() => {
    if (appRef.current) {
      renderGame(appRef.current);
    }
  }, [playerHand, opponentHand, pool, isPlayerTurn, gameStatus]);

  const setContainerInteractive = (container: PIXI.Container, enabled: boolean) => {
    container.eventMode = enabled ? 'static' : 'none';
    container.cursor = enabled ? 'pointer' : 'default';
    if (!enabled) {
      gsap.to(container.scale, { x: 1, y: 1, duration: 0.2 });
    }
  };

  const updateTileGraphic = (
    container: PIXI.Container,
    tile: Card,
    dims: { tileWidth: number; tileHeight: number; tileRadius: number },
    clickable: boolean,
    unrevealedReveal: boolean = false
  ) => {
    const oldText = container.getChildByName('valueText');
    if (oldText) container.removeChild(oldText);

    const oldGlow = container.getChildByName('glow');
    if (oldGlow) container.removeChild(oldGlow);

    const oldBar = container.getChildByName('jokerBar');
    if (oldBar) container.removeChild(oldBar);

    const isClickable = clickable;

    if (isClickable) {
      const glow = new PIXI.Graphics()
        .roundRect(-4, -4, dims.tileWidth + 8, dims.tileHeight + 8, dims.tileRadius + 4)
        .fill({ color: 0x10b981, alpha: 0.2 });
      glow.name = 'glow';
      container.addChildAt(glow, 0);

      gsap.to(glow, { alpha: 0.5, duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    setContainerInteractive(container, isClickable);

    const textColor = tile.color ? '#000000' : '#ffffff';
    const fontSize = Math.max(16, Math.floor(dims.tileHeight * 0.4));
    if (tile.num === -1) {
      const barWidth = Math.max(18, Math.floor(dims.tileWidth * 0.5));
      const barHeight = Math.max(6, Math.floor(dims.tileHeight * 0.12));
      const bar = new PIXI.Graphics()
        .roundRect(
          dims.tileWidth / 2 - barWidth / 2,
          dims.tileHeight / 2 - barHeight / 2,
          barWidth,
          barHeight,
          Math.max(2, Math.floor(barHeight / 2))
        )
        .fill({ color: tile.color ? 0x000000 : 0xffffff });
      bar.name = 'jokerBar';
      container.addChild(bar);
    } else {
      const text = new PIXI.Text({
        text: tile.num ?? '',
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: fontSize,
          fontWeight: 'bold',
          fill: textColor,
          align: 'center',
        }
      });
      text.name = 'valueText';
      text.anchor.set(0.5);
      text.x = dims.tileWidth / 2;
      text.y = dims.tileHeight / 2;
      container.addChild(text);
    }

    if (tile.isRevealed) {
      const body = container.getChildByName('body') as PIXI.Graphics;
      if (body) {
        body.clear()
          .roundRect(0, 0, dims.tileWidth, dims.tileHeight, dims.tileRadius)
          .fill(tile.color ? 0xf0f0f0 : 0x2a2a2a)
          .stroke({ color: 0x10b981, width: 3 });
      }
    } else if (unrevealedReveal) {
      const body = container.getChildByName('body') as PIXI.Graphics;
      if (body) {
        body.clear()
          .roundRect(0, 0, dims.tileWidth, dims.tileHeight, dims.tileRadius)
          .fill(tile.color ? 0xf0f0f0 : 0x2a2a2a)
          .stroke({ color: 0xef4444, width: 3 });
      }
    }
  };

  const createTileGraphic = (tile: Card, dims: { tileWidth: number; tileHeight: number; tileRadius: number }) => {
    const container = new PIXI.Container();
    const tileId = tile.id;
    // Shadow
    const shadow = new PIXI.Graphics()
      .roundRect(4, 4, dims.tileWidth, dims.tileHeight, dims.tileRadius)
      .fill({ color: 0x000000, alpha: 0.3 });
    container.addChild(shadow);

    // Body
    const bodyColor = tile.color ? 0xf0f0f0 : 0x2a2a2a;
    const body = new PIXI.Graphics()
      .roundRect(0, 0, dims.tileWidth, dims.tileHeight, dims.tileRadius)
      .fill(bodyColor)
      .stroke({ color: tile.color ? 0xcccccc : 0x444444, width: 2 });
    body.name = 'body';
    container.addChild(body);

    // Glint/Highlight
    const glint = new PIXI.Graphics()
      .roundRect(2, 2, dims.tileWidth - 4, dims.tileHeight / 2, dims.tileRadius)
      .fill({ color: 0xffffff, alpha: tile.color ? 0.4 : 0.1 });
    glint.name = 'glint';
    container.addChild(glint);

    // Store tile id for reference
    (container as any).tileId = tileId;

    // Interaction
    container.eventMode = 'static';
    container.cursor = 'pointer';

    container.on('pointerover', () => {
      gsap.to(container.scale, { x: 1.05, y: 1.05, duration: 0.2 });
    });

    container.on('pointerout', () => {
      gsap.to(container.scale, { x: 1, y: 1, duration: 0.2 });
    });

    container.on('pointertap', () => {
      console.log('[GameCanvas] Tile clicked:', tileId);
      onTileClickRef.current(tileId);
    });

    updateTileGraphic(container, tile, dims, false);

    return container;
  };

  const renderGame = (app: PIXI.Application) => {
    const { cardLayer, uiLayer } = (app as any).layers;
    app.stage.sortableChildren = true;
    const { width, height } = app.screen;
    if (width === 0 || height === 0) return;

    const PLAYER_SIZE_FACTOR = 0.85;
    const dims = calculateTileDimensions(width, height);
    const { tileWidth, tileHeight } = dims;

    const PADDING_H = Math.max(10, Math.min(20, width * 0.03));
    const SPACING_X_BASE = Math.max(5, Math.min(10, width * 0.02));
    const SPACING_Y = Math.max(5, Math.min(10, height * 0.02));
    const newlyDrawn = playerHand.find(t => (t.index ?? -1) < 0);
    const isSetCard = isPlayerTurn && gameStatus === 'setCard';
    const openAllSlots = Boolean(isSetCard && newlyDrawn && newlyDrawn.num === -1);
    const SPACING_X_PLAYER = SPACING_X_BASE * (openAllSlots ? 1.8 : 1);
    const EFFECTIVE_TILE_W_BASE = tileWidth + SPACING_X_BASE;
    const EFFECTIVE_TILE_W_PLAYER = tileWidth + SPACING_X_PLAYER;
    const EFFECTIVE_TILE_H = tileHeight + SPACING_Y;

    const TOP_MARGIN = Math.max(20, Math.min(40, height * 0.05));
    const BOTTOM_MARGIN = Math.max(20, Math.min(40, height * 0.05));

    const needsRecreate = (container: PIXI.Container, expectedWidth: number) => {
      const existingWidth = (container.getChildByName('body') as PIXI.Graphics)?.getLocalBounds()?.width;
      return existingWidth && Math.abs(existingWidth - expectedWidth) > 2;
    };

    const getWrappedPositions = (
      count: number,
      startY: number,
      isBottomUp: boolean = false,
      forceSingleRow: boolean = false,
      effectiveTileW: number = EFFECTIVE_TILE_W_BASE,
      spacingX: number = SPACING_X_BASE,
      effectiveTileH: number = EFFECTIVE_TILE_H,
      tileH: number = tileHeight
    ) => {
      const maxCols = forceSingleRow ? Math.max(1, count) : Math.max(1, Math.floor((width - PADDING_H * 2) / effectiveTileW));
      const rows = Math.ceil(count / maxCols);
      const positions: { x: number, y: number }[] = [];

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / maxCols);
        const col = i % maxCols;

        const rowCount = Math.min(maxCols, count - row * maxCols);
        const rowWidth = rowCount * effectiveTileW - spacingX;
        const rowXStart = (width - rowWidth) / 2;

        const x = rowXStart + col * effectiveTileW;
        const y = isBottomUp
          ? startY - (rows - row - 1) * effectiveTileH - tileH
          : startY + row * effectiveTileH;

        positions.push({ x, y });
      }
      return positions;
    };

    const toLocalPoint = (parent: PIXI.Container, x: number, y: number) => {
      const worldPoint = new PIXI.Point(x, y);
      const localPoint = parent.toLocal(worldPoint);
      return localPoint;
    };

    const shouldAnimateMove = (tileId: string, newLoc: string) => {
      const prevLoc = prevLocationRef.current.get(tileId);
      const changed = prevLoc !== newLoc;
      let allowed = false;
      if (changed) {
        if (prevLoc === 'pool' && (newLoc === 'playerAside' || newLoc === 'opponentAside')) {
          allowed = true;
        } else if ((prevLoc === 'playerAside' && newLoc === 'playerRow') || (prevLoc === 'opponentAside' && newLoc === 'opponentRow')) {
          allowed = true;
        }
      } else if (prevLoc !== undefined) {
        // 同区内位置变化（row 让位、pool 重排）也允许平滑过渡
        if (newLoc === 'playerRow' || newLoc === 'opponentRow' || newLoc === 'pool') {
          allowed = true;
        }
      }
      prevLocationRef.current.set(tileId, newLoc);
      return allowed;
    };

    const opponentDrawnTiles = opponentHand.filter(t => (t.index ?? -1) < 0);
    const opponentArrangedSorted = opponentHand
      .filter(t => (t.index ?? -1) >= 0)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    const maxRowWidth = width - PADDING_H * 2;
    const oppCount = opponentArrangedSorted.length;
    const oppRequiredWidth = oppCount > 0 ? oppCount * EFFECTIVE_TILE_W_BASE - SPACING_X_BASE : 0;
    const oppScale = oppCount > 0 ? Math.min(1, maxRowWidth / Math.max(1, oppRequiredWidth)) : 1;
    const oppDims = {
      tileWidth: Math.floor(tileWidth * oppScale),
      tileHeight: Math.floor(tileHeight * oppScale),
      tileRadius: Math.max(4, Math.floor(dimensionsRef.current.tileRadius * oppScale)),
    };
    const oppEffectiveTileW = oppDims.tileWidth + Math.floor(SPACING_X_BASE * oppScale);
    const oppSpacingX = Math.floor(SPACING_X_BASE * oppScale);
    const oppEffectiveTileH = oppDims.tileHeight + SPACING_Y;
    const oppPositions = getWrappedPositions(
      opponentArrangedSorted.length,
      TOP_MARGIN,
      false,
      true,
      oppEffectiveTileW,
      oppSpacingX,
      oppEffectiveTileH,
      oppDims.tileHeight
    );
    opponentArrangedSorted.forEach((tile, i) => {
      let container = tilesMap.current.get(tile.id);
      const prevX = container?.x;
      const prevY = container?.y;
      const pos = oppPositions[i];

      if (!container || needsRecreate(container, oppDims.tileWidth)) {
        if (container) {
          gsap.killTweensOf(container);
          gsap.killTweensOf(container.scale);
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
      const canClick = isPlayerTurn && (gameStatus === 'guessCard' || gameStatus === 'setCard') && !tile.isRevealed;
      const isUnguessedReveal = gameStatus === 'end' && !tile.isRevealed;
      updateTileGraphic(container, tile, oppDims, canClick, isUnguessedReveal);
      const targetLocal = toLocalPoint(cardLayer, pos.x, pos.y);
      const animateOppRow = shouldAnimateMove(tile.id, 'opponentRow');
      if (animateOppRow) {
        gsap.to(container, { x: targetLocal.x, y: targetLocal.y, duration: 0.6, ease: 'power2.out' });
      } else {
        container.x = targetLocal.x;
        container.y = targetLocal.y;
      }
    });
    if (opponentDrawnTiles.length > 0) {
      const asideBaseXOpp = PADDING_H;
      const baseYOpp = oppPositions.length > 0 ? oppPositions[0].y : TOP_MARGIN;
      opponentDrawnTiles.forEach((tile, i) => {
        let container = tilesMap.current.get(tile.id);
        const prevX = container?.x;
        const prevY = container?.y;
        const targetX = asideBaseXOpp;
        const targetY = baseYOpp + oppDims.tileHeight + Math.max(10, SPACING_Y) + i * Math.max(8, Math.floor(oppDims.tileHeight * 0.15));
        if (!container || needsRecreate(container, oppDims.tileWidth)) {
          if (container) {
            gsap.killTweensOf(container);
            gsap.killTweensOf(container.scale);
            if (container.parent) {
              container.parent.removeChild(container);
            }
            tilesMap.current.delete(tile.id);
          }
          container = createTileGraphic(tile, oppDims);
          cardLayer.addChild(container);
          tilesMap.current.set(tile.id, container);
          if (prevX !== undefined && prevY !== undefined) {
            container.x = prevX;
            container.y = prevY;
          } else {
            const startLocal = toLocalPoint(cardLayer, width + 100, height + 100);
            container.x = startLocal.x;
            container.y = startLocal.y;
          }
        } else {
          updateTileGraphic(container, tile, oppDims, false);
        }
        const canClick = isPlayerTurn && (gameStatus === 'guessCard' || gameStatus === 'setCard') && !tile.isRevealed;
        const isUnguessedReveal = gameStatus === 'end' && !tile.isRevealed;
        updateTileGraphic(container, tile, oppDims, canClick, isUnguessedReveal);
        (container as any).zIndex = 100;
        const targetLocal = toLocalPoint(cardLayer, targetX, targetY);
        const animateOppAside = shouldAnimateMove(tile.id, 'opponentAside');
        if (animateOppAside) {
          gsap.to(container, { x: targetLocal.x, y: targetLocal.y, duration: 0.6, ease: 'power2.out' });
        } else {
          container.x = targetLocal.x;
          container.y = targetLocal.y;
        }
      });
    }

    const playerStartY = height - BOTTOM_MARGIN;
    const drawnTiles = playerHand.filter(t => (t.index ?? -1) < 0);
    const arrangedSorted = playerHand
      .filter(t => (t.index ?? -1) >= 0)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    const playerCount = arrangedSorted.length;
    const playerRequiredWidth = playerCount > 0 ? playerCount * EFFECTIVE_TILE_W_PLAYER - SPACING_X_PLAYER : 0;
    const playerScale = playerCount > 0 ? Math.min(1, maxRowWidth / Math.max(1, playerRequiredWidth)) : 1;
    const playerDims = {
      tileWidth: Math.floor(tileWidth * playerScale * PLAYER_SIZE_FACTOR),
      tileHeight: Math.floor(tileHeight * playerScale * PLAYER_SIZE_FACTOR),
      tileRadius: Math.max(4, Math.floor(dimensionsRef.current.tileRadius * playerScale * PLAYER_SIZE_FACTOR)),
    };
    const playerEffectiveTileW = playerDims.tileWidth + Math.floor(SPACING_X_PLAYER * playerScale);
    const playerSpacingX = Math.floor(SPACING_X_PLAYER * playerScale);
    const playerEffectiveTileH = playerDims.tileHeight + SPACING_Y;
    let playerPositions: { x: number; y: number }[] = [];
    if (isSetCard && newlyDrawn && newlyDrawn.num !== -1) {
      let insertIdx = arrangedSorted.findIndex(t => (t.num ?? Number.POSITIVE_INFINITY) > (newlyDrawn.num ?? -Infinity));
      if (insertIdx === -1) insertIdx = arrangedSorted.length;
      const positionsWithGap = getWrappedPositions(
        arrangedSorted.length + 1,
        playerStartY,
        true,
        true,
        playerEffectiveTileW,
        playerSpacingX,
        playerEffectiveTileH,
        playerDims.tileHeight
      );
      playerPositions = arrangedSorted.map((_, i) => positionsWithGap[i < insertIdx ? i : i + 1]);
    } else {
      playerPositions = getWrappedPositions(
        arrangedSorted.length,
        playerStartY,
        true,
        true,
        playerEffectiveTileW,
        playerSpacingX,
        playerEffectiveTileH,
        playerDims.tileHeight
      );
    }
    arrangedSorted.forEach((tile, i) => {
      let container = tilesMap.current.get(tile.id);
      const prevX = container?.x;
      const prevY = container?.y;
      const pos = playerPositions[i];

      if (!container || needsRecreate(container, playerDims.tileWidth)) {
        if (container) {
          gsap.killTweensOf(container);
          gsap.killTweensOf(container.scale);
          if (container.parent) {
            container.parent.removeChild(container);
          }
          tilesMap.current.delete(tile.id);
        }
        container = createTileGraphic(tile, playerDims);
        cardLayer.addChild(container);
        tilesMap.current.set(tile.id, container);
        if (prevX !== undefined && prevY !== undefined) {
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
      updateTileGraphic(container, tile, playerDims, false);
      const targetLocal = toLocalPoint(cardLayer, pos.x, pos.y);
      const animatePlayerRow = shouldAnimateMove(tile.id, 'playerRow');
      if (animatePlayerRow) {
        gsap.to(container, { x: targetLocal.x, y: targetLocal.y, duration: 0.6, ease: 'power2.out' });
      } else {
        container.x = targetLocal.x;
        container.y = targetLocal.y;
      }
    });

    // Render newly drawn tiles (index === -1) aside near player's row (right side)
    if (drawnTiles.length > 0) {
      const asideBaseX = Math.max(PADDING_H, Math.min(width - PADDING_H - tileWidth, width - PADDING_H - tileWidth));
      const baseY = playerPositions.length > 0 ? playerPositions[0].y : (playerStartY - playerDims.tileHeight);
      const SAFE_VERTICAL_MARGIN = Math.max(Math.floor(tileHeight * 0.9), SPACING_Y * 2);
      const STACK_GAP = Math.max(10, Math.floor(playerDims.tileHeight * 0.2));
      drawnTiles.forEach((tile, i) => {
        let container = tilesMap.current.get(tile.id);
        const prevX = container?.x;
        const prevY = container?.y;
        const targetX = asideBaseX;
        const targetY = baseY - SAFE_VERTICAL_MARGIN - i * STACK_GAP;
        if (!container || needsRecreate(container, playerDims.tileWidth)) {
          if (container) {
            gsap.killTweensOf(container);
            gsap.killTweensOf(container.scale);
            if (container.parent) {
              container.parent.removeChild(container);
            }
            tilesMap.current.delete(tile.id);
          }
          container = createTileGraphic(tile, playerDims);
          cardLayer.addChild(container);
          tilesMap.current.set(tile.id, container);
          if (prevX !== undefined && prevY !== undefined) {
            container.x = prevX;
            container.y = prevY;
          } else {
            const startLocal = toLocalPoint(cardLayer, width + 100, height + 100);
            container.x = startLocal.x;
            container.y = startLocal.y;
          }
        } else {
          updateTileGraphic(container, tile, playerDims, false);
        }
        updateTileGraphic(container, tile, playerDims, false);
        const targetLocal = toLocalPoint(cardLayer, targetX, targetY);
        const animatePlayerAside = shouldAnimateMove(tile.id, 'playerAside');
        if (animatePlayerAside) {
          gsap.to(container, { x: targetLocal.x, y: targetLocal.y, duration: 0.6, ease: 'power2.out' });
        } else {
          container.x = targetLocal.x;
          container.y = targetLocal.y;
        }
      });
    }

    const oppRowEffectiveH = (typeof oppDims !== 'undefined' ? oppDims.tileHeight : tileHeight * oppScale) + SPACING_Y;
    const oppBottom = TOP_MARGIN + oppRowEffectiveH;

    const playerRowEffectiveH = playerDims.tileHeight + SPACING_Y;
    const playerTop = playerStartY - playerRowEffectiveH;

    const midY = (oppBottom + playerTop) / 2;

    const poolCols = Math.min(pool.length, Math.floor((width - PADDING_H * 2) / EFFECTIVE_TILE_W_BASE));
    const poolRows = Math.ceil(pool.length / Math.max(1, poolCols));
    const poolXStart = width / 2 - (poolCols * EFFECTIVE_TILE_W_BASE - SPACING_X_BASE) / 2;
    const poolYStart = midY - (poolRows * EFFECTIVE_TILE_H - SPACING_Y) / 2;

    pool.forEach((tile, i) => {
      let container = tilesMap.current.get(tile.id);
      const col = i % poolCols;
      const row = Math.floor(i / poolCols);
      const targetX = poolXStart + col * EFFECTIVE_TILE_W_BASE;
      const targetY = poolYStart + row * EFFECTIVE_TILE_H;

      if (!container || needsRecreate(container, dims.tileWidth)) {
        if (container) {
          gsap.killTweensOf(container);
          gsap.killTweensOf(container.scale);
          if (container.parent) {
            container.parent.removeChild(container);
          }
          tilesMap.current.delete(tile.id);
        }
        container = createTileGraphic(tile, dims);
        cardLayer.addChild(container);
        tilesMap.current.set(tile.id, container);
        const startLocal = toLocalPoint(cardLayer, width / 2, height + 100);
        container.x = startLocal.x;
        container.y = startLocal.y;
      } else {
        updateTileGraphic(container, tile, dims, false);
      }

      const canClick = isPlayerTurn && gameStatus === 'getCard';
      updateTileGraphic(container, tile, dims, canClick);
      const targetLocal = toLocalPoint(cardLayer, targetX, targetY);
      const animatePool = shouldAnimateMove(tile.id, 'pool');
      if (animatePool) {
        gsap.to(container, { x: targetLocal.x, y: targetLocal.y, duration: 0.6, ease: 'power2.out' });
      } else {
        container.x = targetLocal.x;
        container.y = targetLocal.y;
      }
    });

    // Slot markers for setCard
    if (isPlayerTurn && gameStatus === 'setCard') {
      const slotCount = arrangedSorted.length + 1;
      const activeSlotIds = new Set<string>();
      let allowedIndices: number[] = [];
      if (newlyDrawn) {
        if (newlyDrawn.num === -1) {
          allowedIndices = Array.from({ length: slotCount }, (_, i) => i);
        } else {
          let insertIdx = arrangedSorted.findIndex(t => (t.num ?? Number.POSITIVE_INFINITY) > (newlyDrawn.num ?? -Infinity));
          if (insertIdx === -1) insertIdx = arrangedSorted.length;
          allowedIndices = [insertIdx];
        }
      }
      allowedIndices.forEach(i => {
        const id = `slot:${i}`;
        activeSlotIds.add(id);
        let slot = slotMap.current.get(id);
        if (!slot) {
          slot = new PIXI.Container();
          const buttonW = Math.max(24, Math.floor(tileWidth * 0.24));
          const buttonH = Math.max(36, Math.floor(tileHeight * 0.6));
          const bg = new PIXI.Graphics()
            .roundRect(0, 0, buttonW, buttonH, Math.max(6, Math.floor(dimensionsRef.current.tileRadius * 0.6)))
            .fill({ color: 0x10b981, alpha: 0.85 })
            .stroke({ color: 0xffffff, width: 2 });
          bg.name = 'buttonBg';
          slot.addChild(bg);
          const label = new PIXI.Text({
            text: '放\n回',
            style: {
              fontFamily: 'Arial, sans-serif',
              fontSize: Math.max(14, Math.floor(buttonH * 0.35)),
              fontWeight: 'bold',
              fill: '#ffffff',
              align: 'center',
              lineHeight: Math.max(16, Math.floor(buttonH * 0.45)),
            }
          });
          label.name = 'buttonLabel';
          label.anchor.set(0.5);
          label.x = buttonW / 2;
          label.y = buttonH / 2;
          slot.addChild(label);
          uiLayer.addChild(slot);
          slotMap.current.set(id, slot);
          slot.visible = true;
          slot.alpha = 1;
          slot.scale.set(1);
        }
        if (!slot.parent) {
          uiLayer.addChild(slot);
        }
        slot.zIndex = 1000;
        slot.removeAllListeners();
        slot.eventMode = 'static';
        slot.cursor = 'pointer';
        slot.on('pointerover', () => {
          gsap.to(slot!.scale, { x: 1.2, y: 1.2, duration: 0.15 });
        });
        slot.on('pointerout', () => {
          gsap.to(slot!.scale, { x: 1, y: 1, duration: 0.15 });
        });
        slot.on('pointertap', () => {
          if (onSelectInsertPositionRef.current && newlyDrawn) {
            onSelectInsertPositionRef.current(i, newlyDrawn.id);
          }
        });
        let x: number;
        let y: number;
        const markerWidth = Math.max(24, Math.floor(tileWidth * 0.24));
        if (playerPositions.length === 0) {
          x = width / 2 - markerWidth / 2;
          y = playerStartY - playerDims.tileHeight;
        } else if (i === 0) {
          x = playerPositions[0].x - playerSpacingX / 2 - markerWidth / 2;
          y = playerPositions[0].y - Math.max(10, SPACING_Y / 2);
        } else if (i === playerPositions.length) {
          const last = playerPositions[playerPositions.length - 1];
          x = last.x + playerDims.tileWidth + playerSpacingX / 2 - markerWidth / 2;
          y = last.y - Math.max(10, SPACING_Y / 2);
        } else {
          const a = playerPositions[i - 1];
          const b = playerPositions[i];
          x = (a.x + b.x + playerDims.tileWidth) / 2 - markerWidth / 2;
          y = a.y - Math.max(10, SPACING_Y / 2);
        }
        const local = toLocalPoint(uiLayer, x, y);
        gsap.to(slot, { x: local.x, y: local.y, duration: 0.4, ease: 'power2.out' });
      });
      Array.from(slotMap.current.entries()).forEach(([id, slot]) => {
        if (!activeSlotIds.has(id)) {
          gsap.killTweensOf(slot);
          gsap.killTweensOf(slot.scale);
          slot.removeAllListeners();
          uiLayer.removeChild(slot);
          slotMap.current.delete(id);
        }
      });
    } else {
      Array.from(slotMap.current.values()).forEach(slot => {
        gsap.killTweensOf(slot);
        gsap.killTweensOf(slot.scale);
        slot.removeAllListeners();
        uiLayer.removeChild(slot);
        // 强制清理，避免残留
        if ((slot as any).destroy) {
          (slot as any).destroy({ children: true });
        }
      });
      slotMap.current.clear();
    }

    const activeIds = new Set([
      ...pool.map(t => t.id),
      ...arrangedSorted.map(t => t.id),
      ...drawnTiles.map(t => t.id),
      ...opponentHand.map(t => t.id)
    ]);

    tilesMap.current.forEach((container, id) => {
      if (!activeIds.has(id)) {
        gsap.killTweensOf(container);
        gsap.killTweensOf(container.scale);
        if (container.parent) {
          container.parent.removeChild(container);
        }
        tilesMap.current.delete(id);
      }
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#121212] overflow-hidden rounded-2xl border border-white/5 shadow-2xl"
      id="game-canvas-container"
    />
  );
});

GameCanvas.displayName = 'GameCanvas';
