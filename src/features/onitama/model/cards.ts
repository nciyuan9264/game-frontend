import type {
  ActionEntry,
  CardDefinition,
  CardID,
  Cell,
  Side,
} from './types';

export const BOARD_SIZE = 5;

export const CARD_CATALOG = [
  {
    id: 'tiger',
    name: '虎式',
    englishName: 'TIGER',
    glyph: '虎',
    mark: 'blue',
    moves: [{ x: 0, y: -2 }, { x: 0, y: 1 }],
    summary: '前跃两格，退后一步。',
    description: '向前跃两格，或向后退一格。只判断落点，可以越过途经的棋子。',
  },
  {
    id: 'dragon',
    name: '龙式',
    englishName: 'DRAGON',
    glyph: '龙',
    mark: 'red',
    moves: [
      { x: -2, y: -1 },
      { x: 2, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ],
    summary: '展翼前行，斜身而退。',
    description: '向左前或右前横移两格，也可向左后或右后斜行一格。',
  },
  {
    id: 'frog',
    name: '蛙式',
    englishName: 'FROG',
    glyph: '蛙',
    mark: 'red',
    moves: [{ x: -2, y: 0 }, { x: -1, y: -1 }, { x: 1, y: 1 }],
    summary: '左跃两格，斜进斜退。',
    description: '向左横跃两格，向左前进一格，或向右后退一格。',
  },
  {
    id: 'rabbit',
    name: '兔式',
    englishName: 'RABBIT',
    glyph: '兔',
    mark: 'blue',
    moves: [{ x: 2, y: 0 }, { x: 1, y: -1 }, { x: -1, y: 1 }],
    summary: '右跃两格，斜进斜退。',
    description: '向右横跃两格，向右前进一格，或向左后退一格。',
  },
  {
    id: 'crab',
    name: '蟹式',
    englishName: 'CRAB',
    glyph: '蟹',
    mark: 'blue',
    moves: [{ x: -2, y: 0 }, { x: 0, y: -1 }, { x: 2, y: 0 }],
    summary: '横行两格，向前一步。',
    description: '向前一格，或向左、向右横移两格，以宽阔步幅展开阵形。',
  },
  {
    id: 'elephant',
    name: '象式',
    englishName: 'ELEPHANT',
    glyph: '象',
    mark: 'red',
    moves: [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ],
    summary: '稳进左右，舒展阵形。',
    description: '向左、向右一格，或向左前、右前各斜行一格。',
  },
  {
    id: 'goose',
    name: '鹅式',
    englishName: 'GOOSE',
    glyph: '鹅',
    mark: 'blue',
    moves: [
      { x: -1, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
    summary: '左前右后，两翼平移。',
    description: '向左前或右后斜行一格，也可向左、向右横移一格。',
  },
  {
    id: 'rooster',
    name: '鸡式',
    englishName: 'ROOSTER',
    glyph: '鸡',
    mark: 'red',
    moves: [
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: 1, y: 0 },
    ],
    summary: '右前左后，两翼平移。',
    description: '向右前或左后斜行一格，也可向左、向右横移一格。',
  },
  {
    id: 'monkey',
    name: '猴式',
    englishName: 'MONKEY',
    glyph: '猴',
    mark: 'blue',
    moves: [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ],
    summary: '四方斜跃，进退灵动。',
    description: '向四个斜角各移动一格，适合在紧密阵形间灵活穿梭。',
  },
  {
    id: 'mantis',
    name: '螳螂式',
    englishName: 'MANTIS',
    glyph: '螳',
    mark: 'red',
    moves: [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 0, y: 1 }],
    summary: '双臂斜进，守中而退。',
    description: '向左前、右前斜行一格，或沿中线向后退一格。',
  },
  {
    id: 'horse',
    name: '马式',
    englishName: 'HORSE',
    glyph: '马',
    mark: 'red',
    moves: [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }],
    summary: '前后直行，向左侧步。',
    description: '向前或向后移动一格，也可向左横移一格。',
  },
  {
    id: 'ox',
    name: '牛式',
    englishName: 'OX',
    glyph: '牛',
    mark: 'blue',
    moves: [{ x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }],
    summary: '前后直行，向右侧步。',
    description: '向前或向后移动一格，也可向右横移一格。',
  },
  {
    id: 'crane',
    name: '鹤式',
    englishName: 'CRANE',
    glyph: '鹤',
    mark: 'blue',
    moves: [{ x: 0, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }],
    summary: '轻进一格，斜退而守。',
    description: '向前一格，或向左后、右后各斜行一格，进退之间留有余地。',
  },
  {
    id: 'boar',
    name: '野猪式',
    englishName: 'BOAR',
    glyph: '猪',
    mark: 'red',
    moves: [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }],
    summary: '正面推进，两侧展开。',
    description: '向前一格，或向左、向右横移一格，保持稳固的正面压力。',
  },
  {
    id: 'eel',
    name: '鳗式',
    englishName: 'EEL',
    glyph: '鳗',
    mark: 'blue',
    moves: [{ x: -1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 0 }],
    summary: '左侧斜游，向右摆尾。',
    description: '向左前或左后斜行一格，也可向右横移一格。',
  },
  {
    id: 'cobra',
    name: '蛇式',
    englishName: 'COBRA',
    glyph: '蛇',
    mark: 'red',
    moves: [{ x: -1, y: 0 }, { x: 1, y: -1 }, { x: 1, y: 1 }],
    summary: '右侧斜行，向左摆尾。',
    description: '向右前或右后斜行一格，也可向左横移一格。',
  },
] satisfies ReadonlyArray<CardDefinition>;

export const ALL_CARD_IDS = CARD_CATALOG.map(card => card.id);

export const CARDS = Object.fromEntries(CARD_CATALOG.map(card => [
  card.id,
  card,
])) as unknown as Record<CardID, CardDefinition>;

const cardIDs = new Set<string>(ALL_CARD_IDS);

export function isCardID(value: unknown): value is CardID {
  return typeof value === 'string' && cardIDs.has(value);
}

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
  return `${'ABCDE'[cell.column]}${BOARD_SIZE - cell.row}`;
}

export function sideName(side?: Side) {
  return side === 'red' ? '红方' : '蓝方';
}

export function sideColorName(side?: Side) {
  return side === 'red' ? '朱砂' : '靛青';
}

export function otherSide(side: Side): Side {
  return side === 'blue' ? 'red' : 'blue';
}

export function actionLabel(action: ActionEntry) {
  if (action.kind === 'pass') {
    return `${action.cardID ? CARDS[action.cardID].name : '招式'}换牌跳过`;
  }
  if (action.kind === 'resign') return '主动认输';
  const card = action.cardID ? CARDS[action.cardID].name : '招式';
  const capture = action.capturedPieceID
    ? ` · 擒${action.capturedKind === 'master' ? '宗师' : '弟子'}`
    : '';
  return `${card} ${coordinate(action.from)} → ${coordinate(action.to)}${capture}`;
}
