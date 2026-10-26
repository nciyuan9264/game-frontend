import type {
  ActionEntry,
  Cell,
  Orientation,
  PendingAction,
  Side,
  WallReason,
  WallSpec,
} from './types';

export const BOARD_SIZE = 9;
export const WALL_GRID_SIZE = 8;
export const BOARD_CELLS = Array.from(
  { length: BOARD_SIZE * BOARD_SIZE },
  (_, index) => ({
    row: Math.floor(index / BOARD_SIZE),
    column: index % BOARD_SIZE,
  }),
);

export function sameCell(left?: Cell, right?: Cell) {
  return !!left && !!right
    && left.row === right.row
    && left.column === right.column;
}

export function coordinate(cell?: Cell) {
  if (
    !cell
    || !Number.isInteger(cell.row)
    || !Number.isInteger(cell.column)
    || cell.row < 0
    || cell.row >= BOARD_SIZE
    || cell.column < 0
    || cell.column >= BOARD_SIZE
  ) {
    return '—';
  }
  return `${String.fromCharCode(65 + cell.column)}${cell.row + 1}`;
}

export function wallLabel(wall?: WallSpec) {
  if (!wall) return '—';
  return `${coordinate(wall)} · ${wall.orientation === 'h' ? '横向' : '纵向'}`;
}

export function wallStyle(wall: WallSpec) {
  return wall.orientation === 'h'
    ? {
        left: `${wall.column / BOARD_SIZE * 100}%`,
        top: `${(wall.row + 1) / BOARD_SIZE * 100}%`,
        width: `${2 / BOARD_SIZE * 100}%`,
      }
    : {
        left: `${(wall.column + 1) / BOARD_SIZE * 100}%`,
        top: `${wall.row / BOARD_SIZE * 100}%`,
        height: `${2 / BOARD_SIZE * 100}%`,
      };
}

export function targetRow(side: Side) {
  return side === 'south' ? 0 : 8;
}

export function sideName(side?: Side) {
  return side === 'north' ? '北方' : '南方';
}

export function colorName(side?: Side) {
  return side === 'north' ? '象牙' : '绛红';
}

export function otherSide(side: Side): Side {
  return side === 'south' ? 'north' : 'south';
}

export function rotateOrientation(value: Orientation): Orientation {
  return value === 'h' ? 'v' : 'h';
}

export function wallReasonCopy(reason?: WallReason) {
  switch (reason) {
    case 'overlap':
      return '这里与已有围墙重叠，请换一个墙槽。';
    case 'crossing':
      return '这里会与已有围墙交叉，请换个位置或方向。';
    case 'blocks_path':
      return '这道墙会封死通路，双方都必须保留到达对边的路线。';
    case 'no_stock':
      return '围墙已经用完，这一回合只能移动棋子。';
    default:
      return reason ? '这个墙槽当前不可使用。' : '放置合法，双方仍有通路。';
  }
}

export function actionLabel(action: ActionEntry) {
  if (action.kind === 'move') {
    const distance = action.from && action.to
      ? Math.abs(action.from.row - action.to.row)
        + Math.abs(action.from.column - action.to.column)
      : 1;
    const diagonal = action.from && action.to
      && action.from.row !== action.to.row
      && action.from.column !== action.to.column;
    const name = diagonal ? '斜向绕行' : distance > 1 ? '越过对手' : '移动';
    return `${name} ${coordinate(action.from)} → ${coordinate(action.to)}`;
  }
  if (action.kind === 'wall') return `放墙 ${wallLabel(action.wall)}`;
  return '主动认输';
}

export function pendingKey(action?: PendingAction) {
  if (!action) return '';
  return action.kind === 'move'
    ? `move:${action.to.row}:${action.to.column}`
    : `wall:${action.wall.row}:${action.wall.column}:${action.wall.orientation}`;
}
