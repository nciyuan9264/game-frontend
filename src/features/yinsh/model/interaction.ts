import {
  BOARD_POINT_BY_COORD,
  BOARD_POINT_BY_ID,
  DIRECTIONS,
} from './board';
import type { MoveOption, Side } from './types';

export function invalidMoveReason({
  from,
  to,
  rings,
  markers,
  legalMoves,
}: {
  from?: string;
  to: string;
  rings: Record<string, Side>;
  markers: Record<string, Side>;
  legalMoves: Record<string, MoveOption[]>;
}) {
  if (!from) return '先选择一枚己方圆环，再选择落点。';
  if (rings[to]) return `${to} 已有圆环，不能叠放或跨越圆环。`;
  if (markers[to]) return `${to} 被棋子占用，圆环必须停在空交点。`;
  const start = BOARD_POINT_BY_ID[from];
  const end = BOARD_POINT_BY_ID[to];
  if (!start || !end) return '请在棋盘上的空交点落环。';

  const direction = DIRECTIONS.find(([dq, dr]) => {
    const q = end.q - start.q;
    const r = end.r - start.r;
    return dq * r === dr * q && q * dq + r * dr > 0;
  });
  if (!direction) return '圆环只能沿一条直线移动，不能在途中转弯。';

  const [dq, dr] = direction;
  for (
    let q = start.q + dq, r = start.r + dr, step = 0;
    step < 11;
    q += dq, r += dr, step += 1
  ) {
    const point = BOARD_POINT_BY_COORD[`${q},${r}`];
    if (!point) break;
    if (rings[point.id]) {
      return `${point.id} 的圆环挡住了这条路线，不能跨环。`;
    }
    if (point.id === to) break;
  }

  const stop = legalMoves[from]?.find(option => {
    if (!option.flips.length) return false;
    const point = BOARD_POINT_BY_ID[option.to];
    return point
      && (point.q - start.q) * dr === (point.r - start.r) * dq
      && (point.q - start.q) * dq + (point.r - start.r) * dr > 0;
  });
  return stop
    ? `跨过连续棋子后，必须停在第一个空位 ${stop.to}。`
    : '这里不是合法落点，请选择高亮交点。';
}
