import type { KeyboardEvent, ReactNode } from 'react';
import {
  BOARD_POINT_BY_COORD,
  BOARD_POINT_BY_ID,
  BOARD_POINTS,
  DIRECTIONS,
} from '../../model/board';
import type {
  GameStatus,
  LastAction,
  MoveOption,
  Row,
  Side,
} from '../../model/types';
import styles from './index.module.less';

export function Board({
  rings,
  markers,
  status,
  currentSide,
  selected,
  moves,
  preview,
  candidateRows,
  selectedRow,
  lastAction,
  interactive,
  coordinates,
  hints,
  onPoint,
  onHover,
}: {
  rings: Record<string, Side>;
  markers: Record<string, Side>;
  status: GameStatus;
  currentSide?: Side;
  selected?: string;
  moves: MoveOption[];
  preview?: MoveOption;
  candidateRows: Row[];
  selectedRow?: Row;
  lastAction?: LastAction;
  interactive: boolean;
  coordinates: boolean;
  hints: boolean;
  onPoint: (pointID: string) => void;
  onHover: (pointID?: string) => void;
}) {
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
  const path = selected && preview
    ? { start: BOARD_POINT_BY_ID[selected], end: BOARD_POINT_BY_ID[preview.to] }
    : undefined;
  const lastFrom = String(lastAction?.payload?.from ?? '');
  const lastTo = String(lastAction?.payload?.to ?? '');
  const lastPath = BOARD_POINT_BY_ID[lastFrom] && BOARD_POINT_BY_ID[lastTo]
    ? { start: BOARD_POINT_BY_ID[lastFrom], end: BOARD_POINT_BY_ID[lastTo] }
    : undefined;

  return <div className={styles.scroll}><svg
    className={styles.board}
    viewBox="0 0 600 600"
    aria-label="YINSH 棋盘，85 个交点"
    role="group"
  >
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
        const point = points.reduce((top, current) => top.y < current.y ? top : current);
        return <text key={index} x={point.x} y={point.y - 24} textAnchor="middle">
          {String.fromCharCode(65 + index)}
        </text>;
      })}
      {Array.from({ length: 11 }, (_, index) => {
        const points = BOARD_POINTS.filter(point => Number(point.id.slice(1)) === index + 1);
        if (!points.length) return null;
        const point = points.reduce((left, current) => left.x < current.x ? left : current);
        return <text key={`row-${index}`} x={point.x - 25} y={point.y + 4} textAnchor="middle">
          {index + 1}
        </text>;
      })}
    </g>}
    {lastPath && !path && <g pointerEvents="none" className={styles.lastMove}>
      <line x1={lastPath.start.x} y1={lastPath.start.y} x2={lastPath.end.x} y2={lastPath.end.y} />
      <circle cx={lastPath.end.x} cy={lastPath.end.y} r="25" />
    </g>}
    {candidateRows.filter(row => row.id !== selectedRow?.id).map(row => {
      const start = BOARD_POINT_BY_ID[row.points[0]];
      const end = BOARD_POINT_BY_ID[row.points[4]];
      return <line key={row.id} className={styles.otherRow}
        x1={start.x} y1={start.y} x2={end.x} y2={end.y} pointerEvents="none" />;
    })}
    {selectedRow && <g pointerEvents="none" className={styles.selectedRow}>
      <line x1={BOARD_POINT_BY_ID[selectedRow.points[0]].x} y1={BOARD_POINT_BY_ID[selectedRow.points[0]].y}
        x2={BOARD_POINT_BY_ID[selectedRow.points[4]].x} y2={BOARD_POINT_BY_ID[selectedRow.points[4]].y} />
      <line x1={BOARD_POINT_BY_ID[selectedRow.points[0]].x} y1={BOARD_POINT_BY_ID[selectedRow.points[0]].y}
        x2={BOARD_POINT_BY_ID[selectedRow.points[4]].x} y2={BOARD_POINT_BY_ID[selectedRow.points[4]].y} />
    </g>}
    {path && <line className={styles.previewPath}
      x1={path.start.x} y1={path.start.y} x2={path.end.x} y2={path.end.y}
      markerEnd="url(#yinshRouteArrow)" pointerEvents="none" />}
    {BOARD_POINTS.map(point => {
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
            : `交点 ${point.id}`;
      const flipped = preview?.flips.includes(point.id);
      const handleKey = (event: KeyboardEvent<SVGGElement>) => {
        if (interactive && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onPoint(point.id);
        }
      };
      return <g
        key={point.id}
        className={`${styles.point} ${active ? styles.interactive : ''} ${chosen ? styles.chosen : ''}`}
        role="button"
        aria-label={label}
        aria-disabled={!active}
        aria-pressed={chosen}
        data-testid={`point-${point.id}`}
        tabIndex={active ? 0 : -1}
        onClick={() => active && onPoint(point.id)}
        onKeyDown={handleKey}
        onMouseEnter={() => onHover(move ? point.id : undefined)}
        onMouseLeave={() => onHover(undefined)}
      >
        <circle cx={point.x} cy={point.y} r="25.5" className={styles.hitArea} />
        {status === 'placement' && interactive && !side && !marker
          && <circle className={styles.placementDot} cx={point.x} cy={point.y} r="4" />}
        {(chosen || removable) && <circle className={styles.selectionHalo}
          cx={point.x} cy={point.y} r="26" data-removable={removable || undefined} />}
        {move && hints && <g className={styles.moveHint}>
          <circle cx={point.x} cy={point.y} r="12" />
          <circle cx={point.x} cy={point.y} r="4.5" />
          {preview?.to === point.id && <circle cx={point.x} cy={point.y} r="19" />}
        </g>}
        {marker && <g className={flipped ? styles.willFlip : ''} pointerEvents="none">
          <circle cx={point.x} cy={point.y} r="12.5"
            fill={`url(#yinsh${marker === 'white' ? 'White' : 'Black'}Marker)`}
            stroke={marker === 'white' ? '#b3aa97' : '#3e3b3b'} strokeWidth=".8"
            filter="url(#yinshPieceShadow)" />
          <circle cx={point.x} cy={point.y - 1} r="9.8" fill="none"
            stroke={marker === 'white' ? '#fffaf0' : '#837a70'} strokeWidth=".7" opacity=".55" />
          {flipped && <circle className={styles.flipHalo} cx={point.x} cy={point.y} r="17" />}
        </g>}
        {side && <g pointerEvents="none" filter="url(#yinshPieceShadow)">
          <circle cx={point.x} cy={point.y + 1} r="15.5" fill="none"
            stroke={side === 'white' ? '#c2b8a3' : '#292628'} strokeWidth="11.3" />
          <circle cx={point.x} cy={point.y - 1} r="15.4" fill="none"
            stroke={`url(#yinsh${side === 'white' ? 'Ivory' : 'Charcoal'}Ring)`} strokeWidth="9.5" />
          <circle cx={point.x} cy={point.y - 1} r="20.1" fill="none"
            stroke={side === 'white' ? '#fffcf2' : '#888078'} strokeWidth=".8" />
          <circle cx={point.x} cy={point.y - 1} r="10.7" fill="none"
            stroke={side === 'white' ? '#b7ad96' : '#17181b'} strokeWidth="1" />
        </g>}
        {chosen && <circle cx={point.x} cy={point.y - 1} r="4" fill="#874958" pointerEvents="none" />}
      </g>;
    })}
    <text className={styles.signature} x="300" y="593" textAnchor="middle">THE ART OF BALANCE</text>
  </svg></div>;
}
