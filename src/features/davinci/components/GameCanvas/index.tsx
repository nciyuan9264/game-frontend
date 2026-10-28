import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import type { Card, GameStatus } from '@/features/davinci/model/types';
import { computeInsertIndex } from './layout';
import styles from './index.module.less';


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

type CanvasHitTarget = {
  kind: 'tile';
  tileId: string;
  x: number;
  y: number;
  width: number;
  height: number;
} | {
  kind: 'slot';
  tileId: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  const latestPropsRef = useRef({ playerHand, opponentHand, pool, isPlayerTurn, gameStatus });
  const hitTargetsRef = useRef<CanvasHitTarget[]>([]);
  const lastPointerActionRef = useRef({ key: '', time: 0 });

  const runPointerAction = useCallback((key: string, action: () => void) => {
    const now = performance.now();
    const previous = lastPointerActionRef.current;
    if (previous.key === key && now - previous.time < 250) return;
    lastPointerActionRef.current = { key, time: now };
    action();
  }, []);

  const dispatchTileClick = useCallback((tileId: string) => {
    runPointerAction('tile:' + tileId, () => onTileClickRef.current(tileId));
  }, [runPointerAction]);

  const dispatchSlotSelect = useCallback((index: number, tileId: string) => {
    runPointerAction('slot:' + index + ':' + tileId, () => onSelectInsertPositionRef.current?.(index, tileId));
  }, [runPointerAction]);

  const findHitTarget = useCallback((x: number, y: number) => {
    for (let i = hitTargetsRef.current.length - 1; i >= 0; i--) {
      const target = hitTargetsRef.current[i];
      if (x >= target.x && x <= target.x + target.width && y >= target.y && y <= target.y + target.height) {
        return target;
      }
    }
    return undefined;
  }, []);

  const updateCanvasCursor = useCallback((cursor: string) => {
    const node = containerRef.current;
    if (!node) return;
    node.style.cursor = cursor;
    const canvas = node.querySelector('canvas');
    if (canvas) canvas.style.cursor = cursor;
  }, []);

  latestPropsRef.current = { playerHand, opponentHand, pool, isPlayerTurn, gameStatus };

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

  const clearLayer = (layer: PIXI.Container) => {
    const children = layer.removeChildren();
    children.forEach(child => child.destroy({ children: true }));
  };

  const drawTableSurface = (
    tableLayer: PIXI.Container,
    width: number,
    height: number,
    zones: {
      opponentY: number;
      opponentHeight: number;
      poolX: number;
      poolY: number;
      poolWidth: number;
      poolHeight: number;
      playerY: number;
      playerHeight: number;
    }
  ) => {
    clearLayer(tableLayer);

    const background = new PIXI.Graphics()
      .rect(0, 0, width, height)
      .fill(0x111411);
    tableLayer.addChild(background);

    const vignette = new PIXI.Graphics()
      .ellipse(width / 2, height * 0.48, width * 0.48, height * 0.36)
      .fill({ color: 0x20251f, alpha: 0.72 });
    tableLayer.addChild(vignette);

    const centerLine = new PIXI.Graphics()
      .rect(Math.max(12, width * 0.08), height * 0.5 - 0.5, Math.max(0, width * 0.84), 1)
      .fill({ color: 0xd0aa68, alpha: 0.14 });
    tableLayer.addChild(centerLine);

    const opponentBand = new PIXI.Graphics()
      .roundRect(
        Math.max(8, width * 0.16),
        zones.opponentY,
        Math.max(0, width - Math.max(16, width * 0.32)),
        zones.opponentHeight,
        14
      )
      .fill({ color: 0x171b18, alpha: 0.58 })
      .stroke({ color: 0x3e4740, width: 1, alpha: 0.28 });
    tableLayer.addChild(opponentBand);

    if (zones.poolWidth > 0 && zones.poolHeight > 0) {
      const rail = new PIXI.Graphics()
        .roundRect(
          Math.max(6, zones.poolX),
          zones.poolY,
          Math.min(width - 12, zones.poolWidth),
          zones.poolHeight,
          18
        )
        .fill({ color: 0x17241e, alpha: 0.54 })
        .stroke({ color: 0x78c69a, width: 1, alpha: 0.22 });
      tableLayer.addChild(rail);

      const railGlow = new PIXI.Graphics()
        .roundRect(
          Math.max(6, zones.poolX) - 4,
          zones.poolY - 4,
          Math.min(width - 12, zones.poolWidth) + 8,
          zones.poolHeight + 8,
          20
        )
        .stroke({ color: 0x78c69a, width: 2, alpha: 0.08 });
      tableLayer.addChild(railGlow);
    }

    const playerBand = new PIXI.Graphics()
      .roundRect(
        Math.max(8, width * 0.16),
        zones.playerY,
        Math.max(0, width - Math.max(16, width * 0.32)),
        zones.playerHeight,
        14
      )
      .fill({ color: 0x161915, alpha: 0.64 })
      .stroke({ color: 0xd0aa68, width: 1, alpha: 0.2 });
    tableLayer.addChild(playerBand);

    const grain = new PIXI.Graphics();
    const step = Math.max(34, Math.floor(width / 28));
    for (let x = -step; x < width + step; x += step) {
      grain.moveTo(x, 0).lineTo(x + height * 0.28, height);
    }
    grain.stroke({ color: 0xffffff, width: 1, alpha: 0.018 });
    tableLayer.addChild(grain);
  };

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const getPoint = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const scaleX = rect.width ? node.clientWidth / rect.width : 1;
      const scaleY = rect.height ? node.clientHeight / rect.height : 1;
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const point = getPoint(event);
      updateCanvasCursor(findHitTarget(point.x, point.y) ? 'pointer' : 'default');
    };

    const handlePointerUp = (event: PointerEvent) => {
      const point = getPoint(event);
      const target = findHitTarget(point.x, point.y);
      if (!target) return;
      event.preventDefault();
      if (target.kind === 'tile') {
        dispatchTileClick(target.tileId);
        return;
      }
      dispatchSlotSelect(target.index, target.tileId);
    };

    const handlePointerLeave = () => updateCanvasCursor('default');

    node.addEventListener('pointermove', handlePointerMove);
    node.addEventListener('pointerup', handlePointerUp);
    node.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      node.removeEventListener('pointermove', handlePointerMove);
      node.removeEventListener('pointerup', handlePointerUp);
      node.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [dispatchSlotSelect, dispatchTileClick, findHitTarget, updateCanvasCursor]);

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
      } catch {
        // The next authoritative snapshot will restore the card's stable visual state.
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

      const getResolution = () => Math.min(window.devicePixelRatio || 1, 2);
      const app = new PIXI.Application();
      await app.init({
        resizeTo: containerRef.current,
        backgroundColor: 0x111411,
        antialias: true,
        autoDensity: true,
        resolution: getResolution(),
        roundPixels: true,
      });

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Create layers
      const tableLayer = new PIXI.Container();
      const cardLayer = new PIXI.Container();
      const uiLayer = new PIXI.Container();
      uiLayer.sortableChildren = true;
      cardLayer.sortableChildren = true;

      // 存到 app 上，方便 renderGame 用
      (app as any).layers = {
        tableLayer,
        cardLayer,
        uiLayer,
      };
      app.stage.addChild(tableLayer);
      app.stage.addChild(cardLayer);
      app.stage.addChild(uiLayer);
      app.stage.setChildIndex(uiLayer, app.stage.children.length - 1);

      app.renderer.on('resize', () => {
        const nextResolution = getResolution();
        if (app.renderer.resolution !== nextResolution) {
          app.renderer.resolution = nextResolution;
        }
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
    const removeTransientChild = (name: string) => {
      const child = container.getChildByName(name);
      if (!child) return;
      gsap.killTweensOf(child);
      gsap.killTweensOf(child.scale);
      container.removeChild(child);
      child.destroy({ children: true });
    };
    removeTransientChild('valueText');
    removeTransientChild('glow');
    removeTransientChild('jokerBar');

    const isClickable = clickable;
    const isWhite = tile.color === 0;
    container.hitArea = new PIXI.Rectangle(0, 0, dims.tileWidth, dims.tileHeight);

    const baseFill = isWhite ? 0xede9df : 0x272a27;
    const strokeColor = unrevealedReveal
      ? 0xef7770
      : tile.isRevealed
        ? 0x78c69a
        : isClickable
          ? 0x78c69a
          : isWhite ? 0xd6d0c2 : 0x555c55;
    const strokeWidth = tile.isRevealed || unrevealedReveal || isClickable ? 3 : 2;

    const body = container.getChildByName('body') as PIXI.Graphics | null;
    if (body) {
      body.clear()
        .roundRect(0, 0, dims.tileWidth, dims.tileHeight, dims.tileRadius)
        .fill(baseFill)
        .stroke({ color: strokeColor, width: strokeWidth, alpha: isClickable ? 0.95 : 0.78 });
    }

    const innerBorder = container.getChildByName('innerBorder') as PIXI.Graphics | null;
    if (innerBorder) {
      innerBorder.clear()
        .roundRect(3, 3, Math.max(0, dims.tileWidth - 6), Math.max(0, dims.tileHeight - 6), Math.max(3, dims.tileRadius - 2))
        .stroke({ color: isWhite ? 0xffffff : 0x7a8178, width: 1, alpha: isWhite ? 0.45 : 0.22 });
    }

    const topSheen = container.getChildByName('topSheen') as PIXI.Graphics | null;
    if (topSheen) {
      topSheen.clear()
        .roundRect(5, 5, Math.max(0, dims.tileWidth - 10), Math.max(12, Math.floor(dims.tileHeight * 0.34)), Math.max(4, dims.tileRadius - 2))
        .fill({ color: 0xffffff, alpha: isWhite ? 0.34 : 0.08 });
    }

    const bottomShade = container.getChildByName('bottomShade') as PIXI.Graphics | null;
    if (bottomShade) {
      bottomShade.clear()
        .roundRect(5, Math.floor(dims.tileHeight * 0.72), Math.max(0, dims.tileWidth - 10), Math.max(8, Math.floor(dims.tileHeight * 0.22)), Math.max(4, dims.tileRadius - 3))
        .fill({ color: 0x000000, alpha: isWhite ? 0.035 : 0.18 });
    }

    if (isClickable) {
      const glow = new PIXI.Graphics()
        .roundRect(-7, -7, dims.tileWidth + 14, dims.tileHeight + 14, dims.tileRadius + 7)
        .fill({ color: 0x78c69a, alpha: 0.09 })
        .stroke({ color: 0x78c69a, width: 2, alpha: 0.62 });
      glow.name = 'glow';
      container.addChildAt(glow, 0);

      gsap.to(glow, { alpha: 0.86, duration: 1.1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    setContainerInteractive(container, isClickable);

    const textColor = isWhite ? '#11130f' : '#f2ead8';
    const fontSize = Math.max(16, Math.floor(dims.tileHeight * 0.42));
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
        .fill({ color: isWhite ? 0x161813 : 0xf0eadb })
        .stroke({ color: isWhite ? 0xffffff : 0x000000, width: 1, alpha: 0.18 });
      bar.name = 'jokerBar';
      container.addChild(bar);
    } else {
      const textResolution = appRef.current?.renderer.resolution ?? Math.min(window.devicePixelRatio || 1, 2);
      const text = new PIXI.Text({
        text: tile.num ?? '',
        resolution: textResolution,
        roundPixels: true,
        style: {
          fontFamily: 'Georgia, Times New Roman, serif',
          fontSize: fontSize,
          fontWeight: 'bold',
          fill: textColor,
          align: 'center',
        }
      });
      text.name = 'valueText';
      text.anchor.set(0.5);
      text.x = dims.tileWidth / 2;
      text.y = dims.tileHeight * 0.55;
      container.addChild(text);
    }

  };

  const createTileGraphic = (tile: Card, dims: { tileWidth: number; tileHeight: number; tileRadius: number }) => {
    const container = new PIXI.Container();
    const tileId = tile.id;
    const isWhite = tile.color === 0;
    // Shadow
    const shadow = new PIXI.Graphics()
      .roundRect(3, 6, dims.tileWidth, dims.tileHeight, dims.tileRadius + 1)
      .fill({ color: 0x000000, alpha: 0.34 });
    shadow.name = 'shadow';
    container.addChild(shadow);

    // Body
    const bodyColor = isWhite ? 0xede9df : 0x272a27;
    const body = new PIXI.Graphics()
      .roundRect(0, 0, dims.tileWidth, dims.tileHeight, dims.tileRadius)
      .fill(bodyColor)
      .stroke({ color: isWhite ? 0xd6d0c2 : 0x555c55, width: 2, alpha: 0.78 });
    body.name = 'body';
    container.addChild(body);

    const innerBorder = new PIXI.Graphics()
      .roundRect(3, 3, Math.max(0, dims.tileWidth - 6), Math.max(0, dims.tileHeight - 6), Math.max(3, dims.tileRadius - 2))
      .stroke({ color: isWhite ? 0xffffff : 0x7a8178, width: 1, alpha: isWhite ? 0.45 : 0.22 });
    innerBorder.name = 'innerBorder';
    container.addChild(innerBorder);

    const topSheen = new PIXI.Graphics()
      .roundRect(5, 5, Math.max(0, dims.tileWidth - 10), Math.max(12, Math.floor(dims.tileHeight * 0.34)), Math.max(4, dims.tileRadius - 2))
      .fill({ color: 0xffffff, alpha: isWhite ? 0.34 : 0.08 });
    topSheen.name = 'topSheen';
    container.addChild(topSheen);

    const bottomShade = new PIXI.Graphics()
      .roundRect(5, Math.floor(dims.tileHeight * 0.72), Math.max(0, dims.tileWidth - 10), Math.max(8, Math.floor(dims.tileHeight * 0.22)), Math.max(4, dims.tileRadius - 3))
      .fill({ color: 0x000000, alpha: isWhite ? 0.035 : 0.18 });
    bottomShade.name = 'bottomShade';
    container.addChild(bottomShade);

    // Store tile id for reference
    (container as any).tileId = tileId;
    (container as any).tileWidth = dims.tileWidth;
    (container as any).tileHeight = dims.tileHeight;
    container.hitArea = new PIXI.Rectangle(0, 0, dims.tileWidth, dims.tileHeight);

    // Interaction
    container.eventMode = 'static';
    container.cursor = 'pointer';

    container.on('pointerover', () => {
      gsap.to(container.scale, { x: 1.05, y: 1.05, duration: 0.2 });
    });

    container.on('pointerout', () => {
      gsap.to(container.scale, { x: 1, y: 1, duration: 0.2 });
    });


    return container;
  };

  const renderGame = (app: PIXI.Application) => {
    const { playerHand, opponentHand, pool, isPlayerTurn, gameStatus } = latestPropsRef.current;
    const { tableLayer, cardLayer, uiLayer } = (app as any).layers;
    app.stage.sortableChildren = true;
    const { width, height } = app.screen;
    if (width === 0 || height === 0) {
      hitTargetsRef.current = [];
      updateCanvasCursor('default');
      return;
    }
    const nextHitTargets: CanvasHitTarget[] = [];

    const PLAYER_SIZE_FACTOR = 0.85;
    const dims = calculateTileDimensions(width, height);
    const { tileWidth, tileHeight } = dims;

    const PADDING_H = Math.max(10, Math.min(20, width * 0.03));
    const SPACING_X_BASE = Math.max(5, Math.min(10, width * 0.02));
    const SPACING_Y = Math.max(5, Math.min(10, height * 0.02));
    const newlyDrawn = playerHand.find(t => (t.index ?? -1) < 0);
    const isPlacementPhase = isPlayerTurn
      && (gameStatus === 'setCard' || gameStatus === 'initialize');
    const openAllSlots = Boolean(isPlacementPhase && newlyDrawn && newlyDrawn.num === -1);
    const SPACING_X_PLAYER = SPACING_X_BASE * (openAllSlots ? 1.8 : 1);
    const EFFECTIVE_TILE_W_BASE = tileWidth + SPACING_X_BASE;
    const EFFECTIVE_TILE_W_PLAYER = tileWidth + SPACING_X_PLAYER;
    const EFFECTIVE_TILE_H = tileHeight + SPACING_Y;

    const TOP_MARGIN = Math.max(20, Math.min(40, height * 0.05));
    const BOTTOM_MARGIN = Math.max(20, Math.min(40, height * 0.05));

    const needsRecreate = (container: PIXI.Container, expectedWidth: number) => {
      const existingWidth = (container as any).tileWidth as number | undefined;
      return !existingWidth || Math.abs(existingWidth - expectedWidth) > 2;
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
      }
      const canClick = isPlayerTurn && (gameStatus === 'guessCard' || gameStatus === 'setCard') && !tile.isRevealed;
      const isUnguessedReveal = gameStatus === 'end' && !tile.isRevealed;
      if (canClick) nextHitTargets.push({ kind: 'tile', tileId: tile.id, x: pos.x, y: pos.y, width: oppDims.tileWidth, height: oppDims.tileHeight });
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
        }
        const canClick = isPlayerTurn && (gameStatus === 'guessCard' || gameStatus === 'setCard') && !tile.isRevealed;
        const isUnguessedReveal = gameStatus === 'end' && !tile.isRevealed;
        if (canClick) nextHitTargets.push({ kind: 'tile', tileId: tile.id, x: targetX, y: targetY, width: oppDims.tileWidth, height: oppDims.tileHeight });
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
    if (isPlacementPhase && newlyDrawn && newlyDrawn.num !== -1) {
      const insertIdx = computeInsertIndex(arrangedSorted, newlyDrawn);
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
    const poolRailWidth = pool.length > 0 ? poolCols * EFFECTIVE_TILE_W_BASE - SPACING_X_BASE : 0;
    const poolRailHeight = pool.length > 0 ? poolRows * EFFECTIVE_TILE_H - SPACING_Y : 0;

    drawTableSurface(tableLayer, width, height, {
      opponentY: Math.max(8, TOP_MARGIN - 18),
      opponentHeight: oppDims.tileHeight + 36,
      poolX: Math.max(PADDING_H, poolXStart) - 10,
      poolY: poolYStart - 10,
      poolWidth: poolRailWidth + 20,
      poolHeight: poolRailHeight + 20,
      playerY: Math.max(0, playerTop - 18),
      playerHeight: playerDims.tileHeight + 36,
    });

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
      }

      const canClick = isPlayerTurn && gameStatus === 'getCard';
      if (canClick) nextHitTargets.push({ kind: 'tile', tileId: tile.id, x: targetX, y: targetY, width: dims.tileWidth, height: dims.tileHeight });
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

    // Slot markers for turn placement and initial Joker setup.
    if (isPlacementPhase) {
      const slotCount = arrangedSorted.length + 1;
      const activeSlotIds = new Set<string>();
      let allowedIndices: number[] = [];
      if (newlyDrawn) {
        if (newlyDrawn.num === -1) {
          allowedIndices = Array.from({ length: slotCount }, (_, i) => i);
        } else {
          allowedIndices = [computeInsertIndex(arrangedSorted, newlyDrawn)];
        }
      }
      allowedIndices.forEach(i => {
        const id = `slot:${i}`;
        activeSlotIds.add(id);
        let slot = slotMap.current.get(id);
        if (!slot) {
          slot = new PIXI.Container();
          const buttonW = Math.max(24, Math.floor(tileWidth * 0.34));
          const buttonH = Math.max(36, Math.floor(tileHeight * 0.68));
          const bg = new PIXI.Graphics()
            .roundRect(0, 0, buttonW, buttonH, Math.max(6, Math.floor(dimensionsRef.current.tileRadius * 0.7)))
            .fill({ color: 0x2f6f4f, alpha: 0.9 })
            .stroke({ color: 0xcfe9d6, width: 2, alpha: 0.78 });
          bg.name = 'buttonBg';
          slot.addChild(bg);
          slot.hitArea = new PIXI.Rectangle(0, 0, buttonW, buttonH);
          const label = new PIXI.Text({
            text: gameStatus === 'initialize' ? '放\n置' : '放\n回',
            style: {
              fontFamily: 'Noto Sans SC Variable, Noto Sans SC, Arial, sans-serif',
              fontSize: Math.max(12, Math.floor(buttonH * 0.3)),
              fontWeight: 'bold',
              fill: '#edf8ef',
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
        let x: number;
        let y: number;
        const markerWidth = Math.max(24, Math.floor(tileWidth * 0.34));
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
        if (newlyDrawn) {
          nextHitTargets.push({
            kind: 'slot',
            tileId: newlyDrawn.id,
            index: i,
            x,
            y,
            width: markerWidth,
            height: Math.max(36, Math.floor(tileHeight * 0.68)),
          });
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

    hitTargetsRef.current = nextHitTargets;
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
      className={styles.canvas}
      id="game-canvas-container"
    />
  );
});

GameCanvas.displayName = 'GameCanvas';
