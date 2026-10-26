import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import {
  BOARD_POINT_BY_COORD,
  BOARD_POINT_BY_ID,
  BOARD_POINTS,
  DIRECTIONS,
  type BoardPoint,
} from '../../model/board';
import type { YinshMotion } from '../../model/motion';
import type {
  GameStatus,
  LastAction,
  MoveOption,
  Row,
  Side,
} from '../../model/types';
import styles from './index.module.less';

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

const ease = (value: number) => {
  const progress = clamp(value);
  return progress < 0.5
    ? 4 * progress ** 3
    : 1 - (-2 * progress + 2) ** 3 / 2;
};

const smooth = (value: number) => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};

const phase = (elapsed: number, start: number, duration: number) =>
  clamp((elapsed - start) / duration);

const edges: ReactNode[] = [];
for (const point of BOARD_POINTS) {
  for (const [dq, dr] of DIRECTIONS.slice(0, 3)) {
    const next = BOARD_POINT_BY_COORD[`${point.q + dq},${point.r + dr}`];
    if (next) {
      edges.push(<line
        key={`${point.id}-${next.id}`}
        x1={point.x}
        y1={point.y}
        x2={next.x}
        y2={next.y}
      />);
    }
  }
}

function useMotionElapsed(motion?: YinshMotion) {
  const [sample, setSample] = useState({ id: 0, elapsed: 0 });
  useEffect(() => {
    if (!motion) return;
    let frame = 0;
    let active = true;
    const tick = () => {
      if (!active) return;
      const elapsed = Math.min(
        performance.now() - motion.startedAt,
        motion.duration,
      );
      setSample({ id: motion.id, elapsed: Math.max(0, elapsed) });
      if (elapsed < motion.duration) frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [motion?.id]);
  return motion && sample.id === motion.id ? sample.elapsed : 0;
}

function RingGlyph({ side }: { side: Side }) {
  return <g className={styles.ringGlyph} data-side={side}
    pointerEvents="none" filter="url(#yinshPieceShadow)">
    <circle cy="1" r="15.5" fill="none"
      stroke={side === 'white' ? '#c2b8a3' : '#292628'} strokeWidth="11.3" />
    <circle cy="-1" r="15.4" fill="none"
      stroke={`url(#yinsh${side === 'white' ? 'Ivory' : 'Charcoal'}Ring)`}
      strokeWidth="9.5" />
    <circle cy="-1" r="20.1" fill="none"
      stroke={side === 'white' ? '#fffcf2' : '#888078'} strokeWidth=".8" />
    <circle cy="-1" r="10.7" fill="none"
      stroke={side === 'white' ? '#b7ad96' : '#17181b'} strokeWidth="1" />
  </g>;
}

function MarkerGlyph({ side }: { side: Side }) {
  return <g className={styles.markerGlyph} data-side={side} pointerEvents="none">
    <circle r="12.5"
      fill={`url(#yinsh${side === 'white' ? 'White' : 'Black'}Marker)`}
      stroke={side === 'white' ? '#b3aa97' : '#3e3b3b'} strokeWidth=".8"
      filter="url(#yinshPieceShadow)" />
    <circle cy="-1" r="9.8" fill="none"
      stroke={side === 'white' ? '#fffaf0' : '#837a70'} strokeWidth=".7"
      opacity=".55" />
  </g>;
}

const BoardGrid = memo(function BoardGrid({
  coordinates,
}: {
  coordinates: boolean;
}) {
  return <>
    <defs>
      <radialGradient id="yinshBoardGlow"><stop stopColor="#fbf7ed" /><stop offset="1" stopColor="#e8dfd1" /></radialGradient>
      <linearGradient id="yinshIvoryRing" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#fffef7" /><stop offset=".48" stopColor="#f1ece0" /><stop offset="1" stopColor="#c8c0af" /></linearGradient>
      <linearGradient id="yinshCharcoalRing" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#76716c" /><stop offset=".4" stopColor="#44403f" /><stop offset="1" stopColor="#272628" /></linearGradient>
      <radialGradient id="yinshWhiteMarker" cx=".3" cy=".25"><stop stopColor="#fffef7" /><stop offset="1" stopColor="#e2dbc9" /></radialGradient>
      <radialGradient id="yinshBlackMarker" cx=".3" cy=".25"><stop stopColor="#68635e" /><stop offset="1" stopColor="#363335" /></radialGradient>
      <filter id="yinshPieceShadow" x="-60%" y="-60%" width="220%" height="240%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#524336" floodOpacity=".28" /></filter>
      <marker id="yinshRouteArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#8c5362" strokeWidth="1.2" /></marker>
    </defs>
    <polygon points="253,36 347,36 506,129 554,211 554,389 506,471 347,564 253,564 94,471 46,389 46,211 94,129" fill="url(#yinshBoardGlow)" stroke="#cbbca5" strokeWidth="1" />
    <polygon points="253,44 347,44 500,134 546,215 546,385 500,466 347,556 253,556 100,466 54,385 54,215 100,134" fill="none" stroke="#d7c9b4" strokeWidth=".65" />
    <g className={styles.edges}>{edges}</g>
    <g className={styles.dots}>{BOARD_POINTS.map(point =>
      <circle key={point.id} cx={point.x} cy={point.y} r="1.7" />)}</g>
    {coordinates && <g className={styles.coordinates}>
      {Array.from({ length: 11 }, (_, index) => {
        const points = BOARD_POINTS.filter(point => point.q === index - 5);
        const point = points.reduce((top, current) =>
          top.y < current.y ? top : current);
        return <text key={index} x={point.x} y={point.y - 24}
          textAnchor="middle">{String.fromCharCode(65 + index)}</text>;
      })}
      {Array.from({ length: 11 }, (_, index) => {
        const points = BOARD_POINTS.filter(point =>
          Number(point.id.slice(1)) === index + 1);
        if (!points.length) return null;
        const point = points.reduce((left, current) =>
          left.x < current.x ? left : current);
        return <text key={`row-${index}`} x={point.x - 25}
          y={point.y + 4} textAnchor="middle">{index + 1}</text>;
      })}
    </g>}
  </>;
});

function MovingPieces({ motion }: { motion: YinshMotion }) {
  const elapsed = useMotionElapsed(motion);
  if (motion.kind === 'move' && motion.from && motion.to) {
    const from = BOARD_POINT_BY_ID[motion.from];
    const to = BOARD_POINT_BY_ID[motion.to];
    const progress = smooth(phase(elapsed, motion.lead, motion.travel));
    const settle = phase(
      elapsed,
      motion.lead + motion.travel,
      90 * motion.duration / 760,
    );
    const lift = elapsed < motion.lead
      ? ease(phase(elapsed, 0, motion.lead))
      : 1 - settle;
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    return <g pointerEvents="none" data-testid="moving-pieces"
      data-motion-progress={progress.toFixed(3)}>
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        className={styles.motionRoute} />
      <g transform={`translate(${from.x} ${from.y}) scale(${0.65 + 0.35 * ease(phase(elapsed, 20, 150))})`}
        opacity={phase(elapsed, 20, 100)}>
        <MarkerGlyph side={motion.side} />
      </g>
      {motion.flips.map(flip => {
        const progress = phase(elapsed, flip.at, motion.flipDuration);
        const point = BOARD_POINT_BY_ID[flip.id];
        const scale = Math.max(0.055, Math.abs(Math.cos(Math.PI * progress)));
        return <g key={flip.id} transform={`translate(${point.x} ${point.y})`}
          data-testid={`flip-${flip.id}`}
          data-flip-progress={progress.toFixed(3)}>
          <ellipse cy="4" rx="13" ry="4" fill="#655443"
            opacity={Math.sin(Math.PI * progress) * 0.16} />
          <g transform={`translate(0 ${-Math.sin(Math.PI * progress) * 5}) scale(${scale} 1)`}>
            <MarkerGlyph side={progress < 0.5 ? flip.before : flip.after} />
          </g>
        </g>;
      })}
      <circle cx={to.x} cy={to.y} r="22" className={styles.motionTarget} />
      <ellipse cx={x} cy={y + 7} rx={19 + lift * 3} ry={6 + lift * 2}
        className={styles.motionShadow} />
      <g transform={`translate(${x} ${y - lift * 5}) scale(${1 + lift * 0.065})`}
        data-testid="moving-ring">
        <RingGlyph side={motion.side} />
      </g>
      {settle > 0 && <circle cx={to.x} cy={to.y} r={22 + settle * 12}
        className={styles.settleRing} opacity={(1 - settle) * 0.6} />}
    </g>;
  }
  if (motion.kind === 'place' && motion.to) {
    const point = BOARD_POINT_BY_ID[motion.to];
    const progress = ease(phase(elapsed, 0, motion.duration * 0.73));
    return <g pointerEvents="none" data-testid="placing-ring">
      <g transform={`translate(${point.x} ${point.y - 22 * (1 - progress)}) scale(${1.13 - 0.13 * progress})`}
        opacity={Math.min(1, progress * 3)}>
        <RingGlyph side={motion.side} />
      </g>
      {progress > 0.6 && <circle cx={point.x} cy={point.y}
        r={21 + phase(elapsed, motion.duration * 0.5, motion.duration * 0.5) * 13}
        className={styles.settleRing}
        opacity={1 - phase(elapsed, motion.duration * 0.5, motion.duration * 0.5)} />}
    </g>;
  }
  if (motion.kind === 'clear') {
    return <g pointerEvents="none" data-testid="clearing-row">
      {motion.affected.map((id, index) => {
        const point = BOARD_POINT_BY_ID[id];
        const progress = phase(elapsed, 100 + index * 42, 400);
        const side = motion.before.roomData.markers[id];
        return point && side
          ? <g key={id}
            transform={`translate(${point.x} ${point.y - progress * 30}) scale(${1 - progress * 0.7})`}
            opacity={1 - progress}><MarkerGlyph side={side} /></g>
          : null;
      })}
    </g>;
  }
  if (motion.kind === 'score' && motion.from) {
    const point = BOARD_POINT_BY_ID[motion.from];
    const progress = phase(elapsed, 80, 500);
    return <g pointerEvents="none" data-testid="scoring-ring"
      transform={`translate(${point.x} ${point.y - progress * 50}) scale(${1 - progress * 0.5})`}
      opacity={1 - progress}><RingGlyph side={motion.side} /></g>;
  }
  return null;
}

interface DragState {
  from: string;
  x: number;
  y: number;
  active: boolean;
  target?: string;
  valid: boolean;
  pointerID: number;
  startX: number;
  startY: number;
}

function ReturningRing({
  drag,
  side,
  selected,
  reduced,
  onDone,
}: {
  drag: DragState;
  side: Side;
  selected: boolean;
  reduced: boolean;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const startedAt = performance.now();
    let frame = 0;
    const tick = () => {
      const next = reduced
        ? 1
        : clamp((performance.now() - startedAt) / 210);
      setProgress(ease(next));
      if (next < 1) frame = requestAnimationFrame(tick);
      else onDone();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone, reduced]);
  const target = BOARD_POINT_BY_ID[drag.from];
  const x = drag.x + (target.x - drag.x) * progress;
  const y = drag.y - 9 + (target.y - drag.y + 9 - (selected ? 3 : 0)) * progress;
  const scale = 1.12 + ((selected ? 1.045 : 1) - 1.12) * progress;
  return <g pointerEvents="none" data-testid="returning-ring"
    transform={`translate(${x} ${y}) scale(${scale})`}>
    <RingGlyph side={side} />
  </g>;
}

export function Board({
  rings,
  markers,
  status,
  currentSide,
  selected,
  moves,
  legalMoves = {},
  preview,
  candidateRows,
  selectedRow,
  lastAction,
  interactive,
  coordinates,
  hints,
  zoomed = false,
  motion,
  errorPoint,
  reduced = false,
  onPoint,
  onHover,
  onGrab,
  onDrop,
  onCancel,
}: {
  rings: Record<string, Side>;
  markers: Record<string, Side>;
  status: GameStatus;
  currentSide?: Side;
  selected?: string;
  moves: MoveOption[];
  legalMoves?: Record<string, MoveOption[]>;
  preview?: MoveOption;
  candidateRows: Row[];
  selectedRow?: Row;
  lastAction?: LastAction;
  interactive: boolean;
  coordinates: boolean;
  hints: boolean;
  zoomed?: boolean;
  motion?: YinshMotion;
  errorPoint?: string;
  reduced?: boolean;
  onPoint: (pointID: string) => void;
  onHover: (pointID?: string) => void;
  onGrab?: (pointID: string) => void;
  onDrop?: (
    from: string,
    to: string | undefined,
    position: { x: number; y: number },
  ) => void;
  onCancel?: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const handlersRef = useRef({
    interactive,
    legalMoves,
    onPoint,
    onHover,
    onGrab,
    onDrop,
    onCancel,
  });
  handlersRef.current = {
    interactive,
    legalMoves,
    onPoint,
    onHover,
    onGrab,
    onDrop,
    onCancel,
  };
  const dragRef = useRef<DragState>();
  const suppressClickRef = useRef<{ from: string; until: number }>();
  const [drag, setDrag] = useState<DragState>();
  const [returning, setReturning] = useState<DragState>();
  const [pressed, setPressed] = useState<string>();
  const [focusID, setFocusID] = useState('E4');

  const releasePointer = (pointerID: number) => {
    if (svgRef.current?.hasPointerCapture?.(pointerID)) {
      svgRef.current.releasePointerCapture(pointerID);
    }
  };
  const cancelDrag = () => {
    const current = dragRef.current;
    if (!current) return;
    dragRef.current = undefined;
    if (current.active) setReturning(current);
    setDrag(undefined);
    setPressed(undefined);
    releasePointer(current.pointerID);
    handlersRef.current.onCancel?.();
  };

  useEffect(() => {
    if (motion) setReturning(undefined);
  }, [motion?.id]);

  useEffect(() => {
    if (!interactive) cancelDrag();
  }, [interactive]);

  useEffect(() => {
    window.addEventListener('blur', cancelDrag);
    window.addEventListener('resize', cancelDrag);
    return () => {
      window.removeEventListener('blur', cancelDrag);
      window.removeEventListener('resize', cancelDrag);
    };
  }, []);

  const path = selected && preview
    ? { start: BOARD_POINT_BY_ID[selected], end: BOARD_POINT_BY_ID[preview.to] }
    : undefined;
  const lastFrom = String(lastAction?.payload?.from ?? '');
  const lastTo = String(lastAction?.payload?.to ?? '');
  const lastPath = BOARD_POINT_BY_ID[lastFrom] && BOARD_POINT_BY_ID[lastTo]
    ? { start: BOARD_POINT_BY_ID[lastFrom], end: BOARD_POINT_BY_ID[lastTo] }
    : undefined;

  const localPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(matrix.inverse());
  };
  const nearestPoint = (position: { x: number; y: number }) =>
    BOARD_POINTS.reduce((nearest, point) =>
      Math.hypot(nearest.x - position.x, nearest.y - position.y)
        < Math.hypot(point.x - position.x, point.y - position.y)
        ? nearest
        : point);

  const startDrag = (event: PointerEvent<SVGGElement>, pointID: string) => {
    if (
      !interactive
      || zoomed
      || returning
      || dragRef.current
      || !event.isPrimary
      || event.button !== 0
      || status !== 'move'
      || rings[pointID] !== currentSide
      || !legalMoves[pointID]?.length
    ) {
      return;
    }
    event.currentTarget.focus({ preventScroll: true });
    const position = localPoint(event.clientX, event.clientY);
    const next = {
      from: pointID,
      x: position.x,
      y: position.y,
      active: false,
      target: pointID,
      valid: false,
      pointerID: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    dragRef.current = next;
    setPressed(pointID);
    svgRef.current?.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<SVGSVGElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerID !== event.pointerId) return;
    const position = localPoint(event.clientX, event.clientY);
    if (
      !current.active
      && Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      ) < 6
    ) {
      return;
    }
    if (!current.active) handlersRef.current.onGrab?.(current.from);
    const nearest = nearestPoint(position);
    const target = Math.hypot(
      nearest.x - position.x,
      nearest.y - position.y,
    ) < 32
      ? nearest.id
      : undefined;
    const valid = !!target && !!handlersRef.current.legalMoves[current.from]
      ?.some(option => option.to === target);
    const next = {
      ...current,
      ...position,
      active: true,
      target,
      valid,
    };
    dragRef.current = next;
    setDrag(next);
    setPressed(undefined);
    handlersRef.current.onHover(valid ? target : undefined);
  };

  const endDrag = (
    event: PointerEvent<SVGSVGElement>,
    cancelled = false,
  ) => {
    const current = dragRef.current;
    if (!current || current.pointerID !== event.pointerId) return;
    dragRef.current = undefined;
    setDrag(undefined);
    setPressed(undefined);
    releasePointer(event.pointerId);
    suppressClickRef.current = {
      from: current.from,
      until: performance.now() + 400,
    };
    if (current.active) {
      event.preventDefault();
      setReturning(current);
      handlersRef.current.onDrop?.(
        current.from,
        cancelled ? undefined : current.target,
        { x: current.x, y: current.y },
      );
    } else if (!cancelled) {
      handlersRef.current.onPoint(current.from);
    }
  };

  const handleKey = (
    event: KeyboardEvent<SVGGElement>,
    point: BoardPoint,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (dragRef.current) cancelDrag();
      else handlersRef.current.onCancel?.();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (interactive) handlersRef.current.onPoint(point.id);
      return;
    }
    const directions: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const next = BOARD_POINTS.filter(candidate =>
      (candidate.x - point.x) * direction[0]
        + (candidate.y - point.y) * direction[1] > 1)
      .sort((first, second) => {
        const score = (candidate: BoardPoint) =>
          Math.hypot(candidate.x - point.x, candidate.y - point.y)
          + Math.abs(
            (candidate.x - point.x) * direction[1]
            - (candidate.y - point.y) * direction[0],
          ) * 1.4;
        return score(first) - score(second);
      })[0];
    if (next) {
      setFocusID(next.id);
      svgRef.current
        ?.querySelector<SVGGElement>(`[data-testid="point-${next.id}"]`)
        ?.focus();
    }
  };

  const pointNodes = useMemo(() => BOARD_POINTS.map(point => {
    const side = rings[point.id];
    const marker = markers[point.id];
    const move = moves.find(option => option.to === point.id);
    const chosen = selected === point.id;
    const removable = status === 'remove_ring' && currentSide === side;
    const rowPoint = candidateRows.some(row => row.points.includes(point.id));
    const active = interactive && (
      status === 'placement' ? !side && !marker
        : status === 'remove_ring' ? removable
          : status === 'remove_row' ? rowPoint
            : !!move || side === currentSide
    );
    const label = side
      ? `${removable ? '取走' : '选择'}${side === 'white' ? '白' : '黑'}环 ${point.id}`
      : move
        ? `移动到 ${point.id}`
        : status === 'placement'
          ? `布环到 ${point.id}`
          : status === 'remove_row' && rowPoint
            ? `选择经过 ${point.id} 的五连`
            : `交点 ${point.id}`;
    const flipped = preview?.flips.includes(point.id);
    const dynamicMarker = motion
      && (motion.kind === 'move' || motion.kind === 'clear')
      && motion.affected.includes(point.id);
    const dynamicRing = motion
      && (motion.kind === 'move' || motion.kind === 'score')
      && motion.from === point.id;
    const dragged = drag?.active && drag.from === point.id
      || returning?.from === point.id;
    return <g
      key={point.id}
      className={`${styles.point} ${active ? styles.interactive : ''} ${chosen ? styles.chosen : ''}`}
      role="button"
      aria-label={label}
      aria-disabled={!interactive}
      aria-pressed={chosen}
      aria-description={move
        ? `合法落点，将翻转 ${move.flips.length} 枚棋子。`
        : marker
          ? `${marker === 'white' ? '白' : '黑'}色棋子占用。`
          : side && side !== currentSide
            ? '对手的圆环。'
            : undefined}
      data-testid={`point-${point.id}`}
      data-ring={side ?? ''}
      data-marker={marker ?? ''}
      data-legal={!!move}
      tabIndex={focusID === point.id ? 0 : -1}
      style={{
        touchAction: interactive
          && !zoomed
          && status === 'move'
          && side === currentSide
          ? 'none'
          : 'manipulation',
      }}
      onClick={() => {
        const duplicate = suppressClickRef.current?.from === point.id
          && performance.now() < suppressClickRef.current.until;
        if (duplicate) {
          suppressClickRef.current = undefined;
          return;
        }
        if (interactive) {
          setFocusID(point.id);
          onPoint(point.id);
        }
      }}
      onKeyDown={event => handleKey(event, point)}
      onFocus={() => {
        setFocusID(point.id);
        if (!dragRef.current) onHover(move ? point.id : undefined);
      }}
      onPointerDown={event => startDrag(event, point.id)}
      onPointerEnter={event => {
        if (event.pointerType === 'mouse' && !dragRef.current) {
          onHover(move ? point.id : undefined);
        }
      }}
      onPointerLeave={event => {
        if (event.pointerType === 'mouse' && !dragRef.current) {
          onHover(undefined);
        }
      }}
    >
      <circle cx={point.x} cy={point.y} r="25.5" className={styles.hitArea} />
      {status === 'placement' && interactive && !side && !marker
        && <circle className={styles.placementDot} cx={point.x}
          cy={point.y} r="4" />}
      {(chosen || removable || pressed === point.id) && !dragged
        && <circle className={styles.selectionHalo}
          cx={point.x} cy={point.y} r="26"
          data-removable={removable || undefined} />}
      {move && hints && <g className={styles.moveHint}>
        <circle cx={point.x} cy={point.y} r="12" />
        <circle cx={point.x} cy={point.y} r="4.5" />
        {preview?.to === point.id
          && <circle cx={point.x} cy={point.y} r="19" />}
      </g>}
      {marker && !dynamicMarker
        && <g transform={`translate(${point.x} ${point.y})`}>
          <MarkerGlyph side={marker} />
          {flipped && <g pointerEvents="none">
            <circle className={styles.flipHalo} r="17" />
            <circle cx="13" cy="-13" r="4"
              fill={marker === 'white' ? '#3f383b' : '#fff9ea'}
              stroke="#a28a74" strokeWidth="1" />
          </g>}
        </g>}
      {side && !dynamicRing && !dragged
        && <g transform={`translate(${point.x} ${point.y})`}>
          <g className={`${styles.ringLift} ${chosen || pressed === point.id ? styles.lifted : ''}`}>
            <RingGlyph side={side} />
          </g>
        </g>}
      {chosen && !dragged
        && <circle cx={point.x} cy={point.y - 3} r="3"
          fill="#874958" pointerEvents="none" />}
      {errorPoint === point.id
        && <circle cx={point.x} cy={point.y} r="25"
          className={styles.invalidPing} pointerEvents="none" />}
    </g>;
  }), [
    candidateRows,
    currentSide,
    drag?.active,
    drag?.from,
    errorPoint,
    focusID,
    hints,
    interactive,
    markers,
    motion?.id,
    moves,
    pressed,
    preview,
    returning?.from,
    rings,
    selected,
    status,
    zoomed,
  ]);

  return <div className={`${styles.scroll} ${zoomed ? styles.zoomed : ''}`}>
    <span id="yinsh-board-keyboard-help" className={styles.srOnly}>
      方向键在交点间移动，回车或空格选择，Escape 取消。也可使用主按钮按坐标精确选择。
    </span>
    <svg
      ref={svgRef}
      className={styles.board}
      viewBox="0 0 600 600"
      aria-label="YINSH 棋盘，85 个交点"
      aria-describedby="yinsh-board-keyboard-help"
      aria-busy={!!motion}
      role="group"
      data-testid="yinsh-board"
      data-yinsh-board
      data-motion={motion?.kind ?? 'idle'}
      onPointerMove={moveDrag}
      onPointerUp={event => endDrag(event)}
      onPointerCancel={event => endDrag(event, true)}
      onLostPointerCapture={event => {
        if (dragRef.current) endDrag(event, true);
      }}
    >
      <BoardGrid coordinates={coordinates} />
      {lastPath && !path && !motion && <g pointerEvents="none"
        className={styles.lastMove}>
        <line x1={lastPath.start.x} y1={lastPath.start.y}
          x2={lastPath.end.x} y2={lastPath.end.y} />
        <circle cx={lastPath.end.x} cy={lastPath.end.y} r="25" />
      </g>}
      {candidateRows.filter(row => row.id !== selectedRow?.id).map(row => {
        const start = BOARD_POINT_BY_ID[row.points[0]];
        const end = BOARD_POINT_BY_ID[row.points[4]];
        return <line key={row.id} className={styles.otherRow}
          x1={start.x} y1={start.y} x2={end.x} y2={end.y}
          pointerEvents="none" />;
      })}
      {selectedRow && <g pointerEvents="none" className={styles.selectedRow}>
        <line x1={BOARD_POINT_BY_ID[selectedRow.points[0]].x}
          y1={BOARD_POINT_BY_ID[selectedRow.points[0]].y}
          x2={BOARD_POINT_BY_ID[selectedRow.points[4]].x}
          y2={BOARD_POINT_BY_ID[selectedRow.points[4]].y} />
        <line x1={BOARD_POINT_BY_ID[selectedRow.points[0]].x}
          y1={BOARD_POINT_BY_ID[selectedRow.points[0]].y}
          x2={BOARD_POINT_BY_ID[selectedRow.points[4]].x}
          y2={BOARD_POINT_BY_ID[selectedRow.points[4]].y} />
      </g>}
      {path && !motion && <line className={styles.previewPath}
        x1={path.start.x} y1={path.start.y}
        x2={path.end.x} y2={path.end.y}
        markerEnd="url(#yinshRouteArrow)" pointerEvents="none" />}
      {pointNodes}
      {motion && <MovingPieces key={motion.id} motion={motion} />}
      {returning && rings[returning.from]
        && <ReturningRing key={`${returning.startX}:${returning.startY}`}
          drag={returning} side={rings[returning.from]}
          selected={selected === returning.from} reduced={reduced}
          onDone={() => setReturning(undefined)} />}
      {drag?.active && <g pointerEvents="none" data-testid="drag-preview">
        <circle cx={BOARD_POINT_BY_ID[drag.from].x}
          cy={BOARD_POINT_BY_ID[drag.from].y} r="22"
          className={styles.dragOrigin} />
        {drag.target && <circle cx={BOARD_POINT_BY_ID[drag.target].x}
          cy={BOARD_POINT_BY_ID[drag.target].y} r="24"
          className={drag.valid ? styles.dragValid : styles.dragInvalid} />}
        <ellipse cx={drag.x} cy={drag.y + 9} rx="23" ry="7"
          className={styles.dragShadow} />
        <g transform={`translate(${drag.x} ${drag.y - 9}) scale(1.12)`}>
          <RingGlyph side={rings[drag.from]} />
        </g>
        <g transform={`translate(${clamp(drag.x - 58, 6, 478)} ${clamp(drag.y - 81, 10, 526)})`}>
          <rect width="116" height="44" rx="6"
            className={drag.valid ? styles.dragBubbleValid : styles.dragBubble} />
          <text x="58" y="18" textAnchor="middle"
            className={styles.dragTitle}>
            {drag.from} → {drag.target ?? '—'}
          </text>
          <text x="58" y="34" textAnchor="middle"
            className={styles.dragCopy}>
            {drag.valid
              ? `松手提交 · 翻 ${preview?.flips.length ?? 0} 子`
              : '移到合法落点，或松手取消'}
          </text>
        </g>
      </g>}
      <text className={styles.signature} x="300" y="593"
        textAnchor="middle">THE ART OF BALANCE</text>
    </svg>
  </div>;
}
