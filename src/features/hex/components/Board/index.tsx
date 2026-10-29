import { useId, type KeyboardEvent } from 'react';
import {
  BOARD_SIZE,
  cellAt,
  cellIndex,
  coordinate,
  sameCell,
} from '../../model/board';
import type {
  ActionEntry,
  Cell,
  Side,
  Stone as StoneType,
} from '../../model/types';

export interface BoardProps {
  board: StoneType[];
  currentSide?: Side;
  legalMoves?: Cell[];
  winningPath?: Cell[];
  lastAction?: ActionEntry;
  selected?: Cell;
  hovered?: Cell;
  interactive?: boolean;
  coordinates?: boolean;
  compact?: boolean;
  testPrefix?: string;
  onSelect?: (cell: Cell) => void;
  onHover?: (cell?: Cell) => void;
}

export function Board({
  board,
  currentSide = 'red',
  legalMoves = [],
  winningPath = [],
  lastAction,
  selected,
  hovered,
  interactive = false,
  coordinates = true,
  compact = false,
  testPrefix = '',
  onSelect,
  onHover,
}: BoardProps) {
  const uid = useId().replace(/:/g, '');
  const radius = 23;
  const horizontal = Math.sqrt(3) * radius;
  const padding = 56;
  const point = (index: number) => {
    const row = Math.floor(index / BOARD_SIZE);
    const column = index % BOARD_SIZE;
    return {
      x: padding + (column + row / 2) * horizontal,
      y: padding + row * radius * 1.5,
    };
  };
  const width = 2 * padding + (BOARD_SIZE - 1) * horizontal * 1.5;
  const height = 2 * padding + (BOARD_SIZE - 1) * radius * 1.5;
  const polygon = (x: number, y: number, size: number) =>
    Array.from({ length: 6 }, (_, index) => {
      const angle = (60 * index - 30) * Math.PI / 180;
      return `${x + Math.cos(angle) * size},${y + Math.sin(angle) * size}`;
    }).join(' ');
  const legal = new Set(legalMoves.map(cell => cellIndex(cell)));
  const path = new Set(winningPath.map(cell => cellIndex(cell)));
  const preview = selected ?? hovered;
  const topLeft = point(0);
  const topRight = point(BOARD_SIZE - 1);
  const bottomLeft = point(BOARD_SIZE * (BOARD_SIZE - 1));
  const bottomRight = point(BOARD_SIZE * BOARD_SIZE - 1);

  const onKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    index: number,
  ) => {
    const cell = cellAt(index);
    let next = index;
    if (event.key === 'ArrowLeft' && cell.column > 0) next--;
    if (event.key === 'ArrowRight' && cell.column < BOARD_SIZE - 1) next++;
    if (event.key === 'ArrowUp' && cell.row > 0) next -= BOARD_SIZE;
    if (event.key === 'ArrowDown' && cell.row < BOARD_SIZE - 1) {
      next += BOARD_SIZE;
    }
    if (next !== index) {
      event.preventDefault();
      event.currentTarget.ownerSVGElement
        ?.querySelector<SVGGElement>(`[data-cell="${next}"]`)
        ?.focus();
    }
    if ((event.key === 'Enter' || event.key === ' ') && legal.has(index)) {
      event.preventDefault();
      onSelect?.(cell);
    }
  };

  return <svg
    className={`hex-board ${compact ? 'compact' : ''}`}
    viewBox={`0 0 ${width} ${height}`}
    role="group"
    aria-label="十一乘十一连边棋棋盘，陶红连接南北，湖绿连接东西"
  >
    <defs>
      <radialGradient id={`${uid}-red`} cx="33%" cy="25%" r="80%">
        <stop offset="0" stopColor="#e0a18a" />
        <stop offset=".65" stopColor="#bc705b" />
        <stop offset="1" stopColor="#98503c" />
      </radialGradient>
      <radialGradient id={`${uid}-teal`} cx="33%" cy="25%" r="80%">
        <stop offset="0" stopColor="#82a7a0" />
        <stop offset=".6" stopColor="#3a7973" />
        <stop offset="1" stopColor="#275851" />
      </radialGradient>
      <filter id={`${uid}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.8"
          floodColor="#4c4535" floodOpacity=".2" />
      </filter>
    </defs>
    <path
      d={`M${topLeft.x - 18},${topLeft.y - 31} L${topRight.x + 11},${topRight.y - 31}
        M${bottomLeft.x - 11},${bottomLeft.y + 31} L${bottomRight.x + 18},${bottomRight.y + 31}`}
      stroke="#b46a54" strokeWidth="5" strokeLinecap="round" fill="none"
    />
    <path
      d={`M${topLeft.x - 31},${topLeft.y - 11} L${bottomLeft.x - 31},${bottomLeft.y + 11}
        M${topRight.x + 31},${topRight.y - 11} L${bottomRight.x + 31},${bottomRight.y + 11}`}
      stroke="#327870" strokeWidth="5" strokeLinecap="round" fill="none"
    />
    {coordinates && !compact && Array.from({ length: BOARD_SIZE }, (_, index) => {
      const top = point(index);
      const left = point(index * BOARD_SIZE);
      return <g key={index} className="hex-coordinates">
        <text x={top.x} y={top.y - 40} textAnchor="middle">
          {String.fromCharCode(65 + index)}
        </text>
        <text x={left.x - 42} y={left.y + 4} textAnchor="middle">
          {index + 1}
        </text>
      </g>;
    })}
    {board.map((stone, index) => {
      const cell = cellAt(index);
      const { x, y } = point(index);
      const chosen = sameCell(selected, cell);
      const ghost = !stone && sameCell(preview, cell);
      const allowed = legal.has(index);
      const last = lastAction?.kind === 'place'
        && sameCell(lastAction.cell, cell);
      const shownSide = stone || (ghost ? currentSide : '');
      return <g
        key={index}
        data-cell={index}
        data-testid={`${testPrefix}cell-${coordinate(cell)}`}
        role={!compact ? 'button' : undefined}
        tabIndex={!compact && interactive && allowed ? 0 : -1}
        className={[
          'hex-cell',
          allowed ? 'legal' : '',
          chosen ? 'selected' : '',
          interactive ? '' : 'readonly',
        ].filter(Boolean).join(' ')}
        aria-label={!compact
          ? stone
            ? `${coordinate(cell)}，${stone === 'red' ? '陶红' : '湖绿'}棋子`
            : `落子 ${coordinate(cell)}`
          : undefined}
        aria-disabled={!interactive || !allowed}
        data-click-sound={interactive && allowed ? 'game-select' : 'false'}
        onClick={() => interactive && allowed && onSelect?.(cell)}
        onPointerEnter={event => {
          if (event.pointerType === 'mouse' && interactive && allowed) {
            onHover?.(cell);
          }
        }}
        onPointerLeave={() => onHover?.()}
        onKeyDown={event => onKeyDown(event, index)}
      >
        <polygon
          points={polygon(x, y, radius - 1.5)}
          fill={path.has(index)
            ? '#eee0c5'
            : ghost
              ? currentSide === 'red' ? '#eed5c9' : '#d5e4df'
              : '#f8f5ec'}
          stroke={chosen
            ? currentSide === 'red' ? '#b46a54' : '#327870'
            : '#d7d0c0'}
          strokeWidth={chosen ? 2.3 : 1.2}
        />
        {shownSide && <>
          <circle cx={x} cy={y + 1} r={radius * .71}
            fill={`url(#${uid}-${shownSide})`}
            opacity={ghost ? .55 : 1}
            filter={`url(#${uid}-shadow)`}
          />
          {shownSide === 'red'
            ? <circle cx={x} cy={y} r="4.2" fill="none"
              stroke="#fff8ed" strokeOpacity=".5" strokeWidth="1.4" />
            : <path d={`M${x - 3},${y + 2} L${x + 3},${y - 3}
                M${x - 3},${y - 3} L${x + 3},${y + 2}`}
              stroke="#fff8ed" strokeOpacity=".5" strokeWidth="1.25" />}
          {last && stone && <circle cx={x} cy={y} r={radius * .83}
            fill="none" stroke={stone === 'red' ? '#b46a54' : '#327870'}
            strokeWidth="1.4" />}
        </>}
      </g>;
    })}
    {winningPath.length > 0 && <polyline
      points={winningPath.map(cell => {
        const value = point(cellIndex(cell));
        return `${value.x},${value.y}`;
      }).join(' ')}
      fill="none" stroke="#f8e8b1" strokeWidth="4"
      strokeLinecap="round" strokeLinejoin="round" pointerEvents="none"
    />}
  </svg>;
}

export function MiniBoard(props: BoardProps) {
  return <div className="mini-board-wrap" aria-hidden="true">
    <Board {...props} compact interactive={false} coordinates={false} />
  </div>;
}
