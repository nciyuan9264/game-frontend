import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react';
import { Pawn } from '../Artwork';
import {
  BOARD_CELLS,
  BOARD_SIZE,
  WALL_GRID_SIZE,
  coordinate,
  sameCell,
  wallStyle,
} from '../../model/board';
import { wallOptionAt } from '../../model/selectors';
import type {
  ActionEntry,
  ActionMode,
  Cell,
  Orientation,
  PendingAction,
  Side,
  Wall,
  WallOption,
  WallSpec,
} from '../../model/types';

export interface BoardProps {
  pawns: Record<Side, Cell>;
  walls: Wall[];
  currentSide: Side;
  legalMoves?: Cell[];
  wallOptions?: WallOption[];
  referencePaths?: Record<Side, Cell[]>;
  lastAction?: ActionEntry;
  mode?: ActionMode;
  orientation?: Orientation;
  selected?: PendingAction;
  hovered?: PendingAction;
  interactive?: boolean;
  showMoves?: boolean;
  showPath?: boolean;
  coordinates?: boolean;
  compact?: boolean;
  testPrefix?: string;
  onSelect?: (action: PendingAction) => void;
  onHover?: (action?: PendingAction) => void;
  onRotate?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export function Board({
  pawns,
  walls,
  currentSide,
  legalMoves = [],
  wallOptions = [],
  referencePaths = { south: [], north: [] },
  lastAction,
  mode = 'move',
  orientation = 'h',
  selected,
  hovered,
  interactive = false,
  showMoves = true,
  showPath = false,
  coordinates = true,
  compact = false,
  testPrefix = '',
  onSelect,
  onHover,
  onRotate,
  onCancel,
  onConfirm,
}: BoardProps) {
  const [cursor, setCursor] = useState<Cell>(pawns[currentSide]);
  const [wallCursor, setWallCursor] = useState<Cell>({ row: 3, column: 3 });
  const preview = selected ?? hovered;
  const canAct = interactive && !!onSelect;
  const legalKeys = useMemo(
    () => new Set(legalMoves.map(cell => `${cell.row}:${cell.column}`)),
    [legalMoves],
  );
  const path = showPath ? referencePaths[currentSide] ?? [] : [];

  useEffect(() => {
    setCursor(pawns[currentSide]);
  }, [currentSide, pawns]);

  useEffect(() => {
    if (selected?.kind === 'wall') {
      setWallCursor({
        row: selected.wall.row,
        column: selected.wall.column,
      });
    }
  }, [selected]);

  const moveFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    position: Cell,
    wall: boolean,
  ) => {
    if (!canAct) return;
    const direction = ({
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    } as Record<string, [number, number]>)[event.key];
    if (direction) {
      event.preventDefault();
      const maximum = wall ? WALL_GRID_SIZE - 1 : BOARD_SIZE - 1;
      const next = {
        row: Math.max(0, Math.min(maximum, position.row + direction[0])),
        column: Math.max(0, Math.min(maximum, position.column + direction[1])),
      };
      if (wall) {
        setWallCursor(next);
        if (selected?.kind === 'wall') {
          onSelect?.({
            kind: 'wall',
            wall: { ...next, orientation },
          });
        }
      } else {
        setCursor(next);
      }
      event.currentTarget
        .closest('[data-board]')
        ?.querySelector<HTMLButtonElement>(
          `[data-testid="${testPrefix}${wall ? 'wall' : 'cell'}-${coordinate(next)}"]`,
        )
        ?.focus();
      return;
    }
    if (event.key.toLowerCase() === 'r' && mode === 'wall') {
      event.preventDefault();
      onRotate?.();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel?.();
    } else if (event.key === 'Enter') {
      if (selected && onConfirm) {
        event.preventDefault();
        onConfirm();
      } else if (
        mode === 'move'
        && legalKeys.has(`${position.row}:${position.column}`)
      ) {
        event.preventDefault();
        onSelect?.({ kind: 'move', to: position });
      } else if (mode === 'wall') {
        event.preventDefault();
        onSelect?.({
          kind: 'wall',
          wall: { ...position, orientation },
        });
      }
    }
  };

  return <div
    className={[
      'q-board',
      compact ? 'mini' : '',
      !coordinates ? 'no-coordinates' : '',
      canAct && mode === 'wall' ? 'wall-mode' : '',
    ].filter(Boolean).join(' ')}
    data-board="true"
    data-interactive={canAct ? 'true' : undefined}
    role="group"
    aria-label="Quoridor 九乘九棋盘"
  >
    <span className="goal-edge goal-north" />
    <span className="goal-edge goal-south" />
    {!compact && <>
      <div className="board-coords top">
        {'ABCDEFGHI'.split('').map(value => <span key={value}>{value}</span>)}
      </div>
      <div className="board-coords bottom">
        {'ABCDEFGHI'.split('').map(value => <span key={value}>{value}</span>)}
      </div>
      <div className="board-coords left">
        {Array.from({ length: 9 }, (_, index) => <span key={index}>{index + 1}</span>)}
      </div>
      <div className="board-coords right">
        {Array.from({ length: 9 }, (_, index) => <span key={index}>{index + 1}</span>)}
      </div>
    </>}
    <div className="board-matrix">
      <div className="tile-grid">
        {BOARD_CELLS.map(position => {
          const occupant = sameCell(position, pawns.south)
            ? 'south'
            : sameCell(position, pawns.north)
              ? 'north'
              : undefined;
          const allowed = legalKeys.has(`${position.row}:${position.column}`);
          const chosen = preview?.kind === 'move'
            && sameCell(position, preview.to);
          const last = lastAction?.kind === 'move'
            && sameCell(lastAction.to, position);
          const content = <>
            {occupant && <Pawn side={occupant} />}
            {!occupant && chosen && <Pawn side={currentSide} ghost />}
            {!occupant && allowed && showMoves && !chosen && <span className="move-dot" />}
            {chosen && <span className="selection-corner" />}
            {last && <span className="last-step-dot" />}
          </>;
          if (compact || !onSelect) {
            return <span
              key={`${position.row}:${position.column}`}
              className={`q-cell ${occupant ? 'occupied' : ''}`}
            >{content}</span>;
          }
          return <button
            key={`${position.row}:${position.column}`}
            data-testid={`${testPrefix}cell-${coordinate(position)}`}
            type="button"
            className={[
              'q-cell',
              allowed ? 'legal' : '',
              chosen ? 'chosen' : '',
              occupant ? 'occupied' : '',
            ].filter(Boolean).join(' ')}
            tabIndex={canAct && mode === 'move' && sameCell(cursor, position) ? 0 : -1}
            aria-disabled={!canAct || mode !== 'move' || !allowed}
            data-click-sound={canAct && mode === 'move' && allowed ? 'game-select' : 'false'}
            aria-label={`格 ${coordinate(position)}${occupant
              ? `，${occupant === 'south' ? '南方' : '北方'}棋子`
              : allowed ? '，可以到达' : ''}`}
            onFocus={() => {
              setCursor(position);
              onHover?.(allowed ? { kind: 'move', to: position } : undefined);
            }}
            onClick={() => {
              if (canAct && mode === 'move' && allowed) {
                onSelect({ kind: 'move', to: position });
              }
            }}
            onPointerEnter={event => {
              if (event.pointerType === 'mouse' && canAct && mode === 'move' && allowed) {
                onHover?.({ kind: 'move', to: position });
              }
            }}
            onPointerLeave={() => onHover?.()}
            onKeyDown={event => moveFocus(event, position, false)}
          >{content}</button>;
        })}
      </div>
      {path.length > 1 && <svg
        className="route-overlay"
        viewBox="0 0 900 900"
        aria-hidden="true"
      >
        <polyline points={path.map(position =>
          `${position.column * 100 + 50},${position.row * 100 + 50}`).join(' ')} />
        {path.slice(1).map((position, index) =>
          <circle
            key={`${position.row}:${position.column}:${index}`}
            cx={position.column * 100 + 50}
            cy={position.row * 100 + 50}
            r="7"
          />)}
      </svg>}
      {walls.map(wall => <span
        key={`${wall.orientation}-${wall.row}-${wall.column}`}
        className={[
          'q-wall',
          wall.orientation,
          'placed',
          lastAction?.kind === 'wall'
            && lastAction.wall?.orientation === wall.orientation
            && sameCell(lastAction.wall, wall)
            ? 'last-wall'
            : '',
        ].filter(Boolean).join(' ')}
        style={wallStyle(wall)}
        aria-label={`围墙 ${coordinate(wall)} ${wall.orientation === 'h' ? '横向' : '纵向'}`}
      ><i /></span>)}
      {canAct && mode === 'wall' && Array.from({ length: 64 }, (_, index) => {
        const position = {
          row: Math.floor(index / WALL_GRID_SIZE),
          column: index % WALL_GRID_SIZE,
        };
        const wall: WallSpec = { ...position, orientation };
        const option = wallOptionAt(wallOptions, wall);
        return <button
          key={`${position.row}:${position.column}`}
          type="button"
          data-testid={`${testPrefix}wall-${coordinate(position)}`}
          className={`wall-anchor ${option?.legal ? 'legal' : 'illegal'}`}
          tabIndex={sameCell(wallCursor, position) ? 0 : -1}
          style={{
            left: `${(position.column + 1) / BOARD_SIZE * 100}%`,
            top: `${(position.row + 1) / BOARD_SIZE * 100}%`,
          }}
          aria-label={`围墙位置 ${coordinate(position)}，${orientation === 'h' ? '横向' : '纵向'}${option?.legal ? '，可以放置' : '，当前不可放置'}`}
          data-click-sound={option?.legal ? 'game-select' : 'false'}
          onFocus={() => {
            setWallCursor(position);
            onHover?.({ kind: 'wall', wall });
          }}
          onClick={() => onSelect?.({ kind: 'wall', wall })}
          onPointerEnter={event => {
            if (event.pointerType === 'mouse') {
              onHover?.({ kind: 'wall', wall });
            }
          }}
          onPointerLeave={() => onHover?.()}
          onKeyDown={event => moveFocus(event, position, true)}
        ><i /></button>;
      })}
      {preview?.kind === 'wall' && (() => {
        const option = wallOptionAt(wallOptions, preview.wall);
        return <span
          className={`q-wall ${preview.wall.orientation} preview ${option?.legal ? 'valid' : 'invalid'}`}
          style={wallStyle(preview.wall)}
          aria-hidden="true"
        ><i /></span>;
      })()}
    </div>
  </div>;
}

export function MiniBoard({
  className = '',
  ...props
}: Omit<BoardProps, 'compact' | 'interactive' | 'onSelect'> & {
  className?: string;
}) {
  return <div className={`mini-board-wrap ${className}`} aria-hidden="true">
    <Board {...props} compact interactive={false} showMoves={false} coordinates={false} />
  </div>;
}
