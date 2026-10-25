export interface BoardPoint {
  id: string;
  q: number;
  r: number;
  x: number;
  y: number;
}

export const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
] as const;

const pointID = (q: number, r: number) =>
  `${String.fromCharCode(70 + q)}${r + q + 6}`;

export const BOARD_POINTS: BoardPoint[] = [];

for (let q = -5; q <= 5; q += 1) {
  for (let r = -5; r <= 5; r += 1) {
    if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > 5) continue;
    if (
      (q === 0 && Math.abs(r) === 5)
      || (r === 0 && Math.abs(q) === 5)
      || (q === -r && Math.abs(q) === 5)
    ) {
      continue;
    }
    BOARD_POINTS.push({
      id: pointID(q, r),
      q,
      r,
      x: 300 + q * 47,
      y: 300 + (r + q / 2) * 54.27,
    });
  }
}

export const BOARD_POINT_BY_ID = Object.fromEntries(
  BOARD_POINTS.map(point => [point.id, point]),
) as Record<string, BoardPoint>;

export const BOARD_POINT_BY_COORD = Object.fromEntries(
  BOARD_POINTS.map(point => [`${point.q},${point.r}`, point]),
) as Record<string, BoardPoint>;
