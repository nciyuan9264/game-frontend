import { BOARD_POINT_BY_ID } from './board';
import type { GameSnapshot } from './session';
import type { Side } from './types';

export type YinshMotionKind = 'place' | 'move' | 'clear' | 'score';

export interface YinshMotionFlip {
  id: string;
  before: Side;
  after: Side;
  at: number;
}

export interface YinshMotion {
  id: number;
  kind: YinshMotionKind;
  before: GameSnapshot;
  after: GameSnapshot;
  side: Side;
  from?: string;
  to?: string;
  affected: string[];
  flips: YinshMotionFlip[];
  lead: number;
  travel: number;
  flipDuration: number;
  duration: number;
  startedAt: number;
  replay: boolean;
}

let motionSequence = 0;

const stringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const stringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const sideValue = (value: unknown): Side | undefined =>
  value === 'white' || value === 'black' ? value : undefined;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const inverseSmooth = (value: number) =>
  0.5 - Math.sin(Math.asin(1 - 2 * clamp(value, 0, 1)) / 3);

export function buildYinshMotion(
  before: GameSnapshot,
  after: GameSnapshot,
  quick = false,
  replay = false,
): YinshMotion | undefined {
  if (before.matchID !== after.matchID || after.seq <= before.seq) return;
  const action = after.roomData.lastAction;
  const payload = action?.payload ?? {};
  const speed = quick ? 0.62 : 1;
  const side = sideValue(payload.side)
    ?? after.playerData[action?.playerID ?? '']?.side
    ?? before.playerData[action?.playerID ?? '']?.side;
  if (!action || !side) return;

  let kind: YinshMotionKind;
  let from: string | undefined;
  let to: string | undefined;
  let affected: string[] = [];
  let flipIDs: string[] = [];

  switch (action.action) {
    case 'place_ring':
      kind = 'place';
      to = stringValue(payload.pointID);
      if (!to || before.roomData.rings[to] || after.roomData.rings[to] !== side) {
        return;
      }
      affected = [to];
      break;
    case 'move_ring':
      kind = 'move';
      from = stringValue(payload.from);
      to = stringValue(payload.to);
      if (
        !from
        || !to
        || before.roomData.rings[from] !== side
        || after.roomData.rings[to] !== side
      ) {
        return;
      }
      flipIDs = stringArray(payload.flips);
      if (!flipIDs.length) {
        flipIDs = Object.keys(before.roomData.markers).filter(pointID =>
          before.roomData.markers[pointID] !== after.roomData.markers[pointID]);
      }
      affected = [from, ...flipIDs];
      break;
    case 'remove_row':
      kind = 'clear';
      affected = stringArray(payload.points);
      if (!affected.length) {
        affected = Object.keys(before.roomData.markers).filter(pointID =>
          !after.roomData.markers[pointID]);
      }
      if (!affected.length) return;
      break;
    case 'remove_ring':
      kind = 'score';
      from = stringValue(payload.pointID);
      if (!from || before.roomData.rings[from] !== side || after.roomData.rings[from]) {
        return;
      }
      affected = [from];
      break;
    default:
      return;
  }

  const start = from ? BOARD_POINT_BY_ID[from] : undefined;
  const end = to ? BOARD_POINT_BY_ID[to] : undefined;
  const distance = start && end
    ? Math.hypot(end.x - start.x, end.y - start.y)
    : 0;
  const lead = kind === 'move' ? 90 * speed : 0;
  const travel = kind === 'move'
    ? clamp(360 + distance * 0.95, 460, 760) * speed
    : 0;
  const flipDuration = 300 * speed;
  const flips = flipIDs.flatMap(id => {
    const point = BOARD_POINT_BY_ID[id];
    if (!point || !start || !distance) return [];
    const progress = Math.hypot(point.x - start.x, point.y - start.y) / distance;
    return [{
      id,
      before: before.roomData.markers[id],
      after: after.roomData.markers[id],
      at: lead + travel * inverseSmooth(progress),
    }];
  }).filter((flip): flip is YinshMotionFlip =>
    !!flip.before && !!flip.after);
  const duration = kind === 'move'
    ? Math.max(
      lead + travel + 190 * speed,
      ...flips.map(flip => flip.at + flipDuration + 100 * speed),
    )
    : kind === 'clear'
      ? 810 * speed
      : kind === 'score'
        ? 770 * speed
        : 360 * speed;

  return {
    id: ++motionSequence,
    kind,
    before,
    after,
    side,
    from,
    to,
    affected,
    flips,
    lead,
    travel,
    flipDuration,
    duration,
    startedAt: performance.now(),
    replay,
  };
}

export const motionReceipt = (motion: YinshMotion) => {
  if (motion.replay) return '上一步回放完成，棋局状态未改变';
  switch (motion.kind) {
    case 'place':
      return `${motion.to ?? ''} 的圆环已落稳`;
    case 'move':
      return `${motion.from ?? ''} → ${motion.to ?? ''}，翻转 ${motion.flips.length} 子`;
    case 'clear':
      return '五枚棋子已回到公共池';
    case 'score':
      return '圆环已收入得分区';
  }
};
