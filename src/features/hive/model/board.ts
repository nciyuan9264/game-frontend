import type {
  ActionEntry,
  Hex,
  MoveOption,
  Piece,
  PieceKind,
  Side,
  Stack,
} from './types';

export const DIRECTIONS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

export const PIECE_KINDS: readonly PieceKind[] = [
  'queen',
  'ant',
  'beetle',
  'grasshopper',
  'spider',
];

export const PIECE_COUNTS: Record<PieceKind, number> = {
  queen: 1,
  ant: 3,
  beetle: 2,
  grasshopper: 3,
  spider: 2,
};

export const PIECE_INFO: Record<PieceKind, {
  name: string;
  english: string;
  color: string;
  move: string;
  detail: string;
}> = {
  queen: {
    name: '蜂后',
    english: 'QUEEN BEE',
    color: '#ae8030',
    move: '滑行一格',
    detail: '第 2 至第 4 手入场。蜂后入场后，己方棋子才能移动。',
  },
  ant: {
    name: '蚂蚁',
    english: 'SOLDIER ANT',
    color: '#507f9b',
    move: '外围任意步',
    detail: '沿蜂巢外围滑行任意步，途中持续接触蜂巢。',
  },
  beetle: {
    name: '甲虫',
    english: 'BEETLE',
    color: '#8469a0',
    move: '一格，可登顶',
    detail: '移动一格，可以爬上或离开叠层；被压住的棋子不能移动。',
  },
  grasshopper: {
    name: '蚱蜢',
    english: 'GRASSHOPPER',
    color: '#648455',
    move: '直线跳跃',
    detail: '沿一个方向跳过连续棋子，落在该方向第一个空位。',
  },
  spider: {
    name: '蜘蛛',
    english: 'SPIDER',
    color: '#b86451',
    move: '恰好滑三步',
    detail: '沿蜂巢外围恰好滑行三步，不能重访路径位置。',
  },
};

export function hexKey(value: Hex) {
  return `${value.q},${value.r}`;
}

export function parseHexKey(value: string): Hex | undefined {
  const [q, r, ...rest] = value.split(',').map(Number);
  return rest.length === 0 && Number.isSafeInteger(q) && Number.isSafeInteger(r)
    ? { q, r }
    : undefined;
}

export function sameHex(left?: Hex, right?: Hex) {
  return !!left && !!right && left.q === right.q && left.r === right.r;
}

export function addHex(left: Hex, right: Hex): Hex {
  return { q: left.q + right.q, r: left.r + right.r };
}

export function neighbors(value: Hex) {
  return DIRECTIONS.map(direction => addHex(value, direction));
}

export function coordinate(value?: Hex) {
  return value ? `(${value.q}, ${value.r})` : '—';
}

export function sideName(side?: Side) {
  return side === 'black' ? '黑方' : '白方';
}

export function otherSide(side: Side): Side {
  return side === 'white' ? 'black' : 'white';
}

export function pieceName(kind?: PieceKind) {
  return kind ? PIECE_INFO[kind].name : '棋子';
}

export function pieceKindFromID(pieceID?: string): PieceKind | undefined {
  const code = pieceID?.at(1)?.toUpperCase();
  return code === 'Q'
    ? 'queen'
    : code === 'A'
      ? 'ant'
      : code === 'B'
        ? 'beetle'
        : code === 'G'
          ? 'grasshopper'
          : code === 'S'
            ? 'spider'
            : undefined;
}

export function stackMap(stacks: Stack[]) {
  return Object.fromEntries(stacks.map(stack => [hexKey(stack.position), stack]));
}

export function topPiece(stack?: Stack): Piece | undefined {
  return stack?.pieces.at(-1);
}

export function findPiece(stacks: Stack[], pieceID?: string) {
  if (!pieceID) return;
  for (const stack of stacks) {
    const level = stack.pieces.findIndex(piece => piece.pieceID === pieceID);
    if (level >= 0) return { stack, piece: stack.pieces[level], level };
  }
}

export function optionsForPiece(options: MoveOption[], pieceID?: string) {
  return pieceID ? options.filter(option => option.pieceID === pieceID) : [];
}

export function actionLabel(action: ActionEntry) {
  const kind = pieceKindFromID(action.pieceID);
  if (action.kind === 'place') {
    return `部署${pieceName(kind)} · ${coordinate(action.to)}`;
  }
  if (action.kind === 'move') {
    return `${pieceName(kind)} · ${coordinate(action.from)} → ${coordinate(action.to)}`;
  }
  if (action.kind === 'pass') return '无合法行动 · 自动过手';
  return '主动认输';
}
