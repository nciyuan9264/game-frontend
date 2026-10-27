import type {
  CantStopActionEntry,
  CantStopPairingOption,
  CantStopPlayerState,
} from '@/api/generated/game-platform';
import type { GameSnapshot } from './session';

export type Progress = Record<number, number>;

export const COLUMNS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const COLUMN_HEIGHTS: Progress = {
  2: 3,
  3: 5,
  4: 7,
  5: 9,
  6: 11,
  7: 13,
  8: 11,
  9: 9,
  10: 7,
  11: 5,
  12: 3,
};
export const TARGET_COLUMNS = 3;
export const PLAYER_COLORS = ['#c56743', '#4b827b', '#b49a47', '#8b7b9e'];
export const PLAYER_SYMBOLS = ['1', '2', '3', '4'];

type ActionWithSource = CantStopActionEntry & {
  source?: 'manual' | 'ai' | 'timeout' | 'system';
};

const readNumber = (value: Progress | undefined, key: number) =>
  Number((value as Record<string, number | undefined> | undefined)?.[String(key)]
    ?? value?.[key]
    ?? 0);

const readOwner = (value: Record<number, string> | undefined, key: number) =>
  (value as Record<string, string | undefined> | undefined)?.[String(key)]
    ?? value?.[key]
    ?? '';

export const columnHeight = (column: number) => COLUMN_HEIGHTS[column] ?? 0;

export const progressAt = (progress: Progress | undefined, column: number) =>
  readNumber(progress, column);

export const ownerAt = (
  claimedBy: Record<number, string> | undefined,
  column: number,
) => readOwner(claimedBy, column);

export const sortedColumns = (progress?: Progress) =>
  Object.keys(progress ?? {})
    .map(Number)
    .filter(column => COLUMNS.includes(column as typeof COLUMNS[number]))
    .sort((a, b) => a - b);

export const playerColor = (seatIndex = 0) =>
  PLAYER_COLORS[((seatIndex % PLAYER_COLORS.length) + PLAYER_COLORS.length)
    % PLAYER_COLORS.length];

export const playerSymbol = (seatIndex = 0) =>
  PLAYER_SYMBOLS[((seatIndex % PLAYER_SYMBOLS.length) + PLAYER_SYMBOLS.length)
    % PLAYER_SYMBOLS.length];

export const savedProgress = (state?: CantStopPlayerState) =>
  state?.savedProgress ?? {};

export const savedStepCount = (state?: CantStopPlayerState) =>
  state?.savedStepCount ?? sortedColumns(state?.savedProgress)
    .reduce((total, column) => total + progressAt(state?.savedProgress, column), 0);

export const claimedColumns = (data: GameSnapshot, playerID: string) =>
  data.playerData[playerID]?.claimedColumns
    ?? COLUMNS.filter(column => ownerAt(data.roomData.claimedBy, column) === playerID);

export const claimedCount = (data: GameSnapshot, playerID: string) =>
  claimedColumns(data, playerID).length;

export const progressTotal = (progress?: Progress) =>
  sortedColumns(progress).reduce((total, column) =>
    total + progressAt(progress, column), 0);

export const turnGain = (data: GameSnapshot) =>
  data.roomData.turnGain ?? Math.max(
    0,
    progressTotal(data.roomData.runners)
      - progressTotal(savedProgress(data.playerData[data.roomData.currentPlayer])),
  );

export const peakColumns = (data: GameSnapshot) =>
  sortedColumns(data.roomData.runners).filter(column =>
    progressAt(data.roomData.runners, column) >= columnHeight(column));

export const bustRiskPercent = (data: GameSnapshot) =>
  Number(((data.roomData.bustRisk ?? 0) * 100).toFixed(1));

export const optionColumns = (option: CantStopPairingOption) =>
  sortedColumns(option.advances);

export const optionDeltaText = (option: CantStopPairingOption) =>
  optionColumns(option)
    .map(column => `${column} 号 +${progressAt(option.advances, column)}`)
    .join(' · ');

export const dicePairText = (
  option: CantStopPairingOption,
  dice: number[],
) => {
  const indexes = option.diceIndexes ?? [];
  if (indexes.length !== 4 || dice.length !== 4) return '';
  const pair = (left: number, right: number) =>
    `${dice[indexes[left]] ?? '?'}+${dice[indexes[right]] ?? '?'}`;
  return `${pair(0, 1)} / ${pair(2, 3)}`;
};

export const formatColumns = (columns: number[]) =>
  columns.length ? `${columns.join(' / ')} 号` : '未选择路线';

export const actionSourceLabel = (action: ActionWithSource) => {
  if (action.source === 'ai') return 'AI 操作';
  if (action.source === 'timeout') return '超时托管';
  if (action.source === 'system') return '系统推进';
  return action.automatic ? '自动处理' : '玩家操作';
};

export const actionSummary = (
  action: CantStopActionEntry,
  playerName: (id: string) => string,
) => {
  const actor = playerName(action.playerID);
  switch (action.kind) {
    case 'roll':
      return `${actor} 掷出 ${action.dice?.join('-') ?? '骰子'}`;
    case 'advance':
      return `${actor} 推进 ${formatColumns(action.columns)}`;
    case 'bank':
      return `${actor} 收手保存 ${action.gain} 步`;
    case 'bust':
      return `${actor} 失手，退回 ${Math.abs(action.gain)} 步`;
    case 'nextTurn':
      return `${actor} 开始下一回合`;
    default:
      return action.summary || `${actor} 更新了牌桌`;
  }
};

export const statusTitle = (data: GameSnapshot) => {
  const phase = data.roomData.gameStatus;
  if (phase === 'waiting') return '正在同步所有玩家';
  if (phase === 'roll') return '轮到当前玩家掷骰';
  if (phase === 'choose') return '选择一组点数前进';
  if (phase === 'decide') return '继续掷骰，还是收手';
  if (phase === 'bust') return '本回合失手';
  if (phase === 'banked') return '进度已保存';
  return '本局已经结束';
};
