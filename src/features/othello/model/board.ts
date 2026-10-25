export const BOARD_SIZE = 8;
export const BOARD_CELLS = Array.from(
  { length: BOARD_SIZE * BOARD_SIZE },
  (_, index) => index,
);

export function coordinate(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_CELLS.length) {
    return '—';
  }
  return `${String.fromCharCode(65 + index % BOARD_SIZE)}${Math.floor(index / BOARD_SIZE) + 1}`;
}

export function row(index: number) {
  return Math.floor(index / BOARD_SIZE);
}

export function column(index: number) {
  return index % BOARD_SIZE;
}
