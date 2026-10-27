import type {
  ActionEntry,
  Cell,
  Side,
} from './types';

export const BOARD_SIZE = 11;
export const BOARD_CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const BOARD_CELLS = Array.from(
  { length: BOARD_CELL_COUNT },
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

export function cellIndex(cell: Cell) {
  return cell.row * BOARD_SIZE + cell.column;
}

export function cellAt(index: number): Cell {
  return {
    row: Math.floor(index / BOARD_SIZE),
    column: index % BOARD_SIZE,
  };
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

export function sideName(side?: Side) {
  return side === 'teal' ? '湖绿' : '陶红';
}

export function direction(side?: Side) {
  return side === 'teal' ? '连接东西两岸' : '连接南北两岸';
}

export function otherSide(side: Side): Side {
  return side === 'red' ? 'teal' : 'red';
}

export function actionLabel(action: ActionEntry) {
  if (action.kind === 'place') return `落子 ${coordinate(action.cell)}`;
  if (action.kind === 'swap') return '交换双方颜色';
  return '主动认输';
}
