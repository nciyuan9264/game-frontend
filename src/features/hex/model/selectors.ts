import type {
  GameSnapshot,
  PendingCommand,
  Snapshot,
} from './session';
import { playerName } from './session';
import {
  actionLabel,
  direction,
  sideName,
} from './board';
import type {
  ActionEntry,
  Cell,
  Side,
} from './types';

export function confirmsCommand(command: PendingCommand, next: Snapshot) {
  const before = command.before;
  if (command.type === 'match_begin') {
    return before.type === 'MATCH_SYNC' && next.type === 'ROOM_SYNC';
  }
  if (next.type === 'MATCH_SYNC' && before.type === 'MATCH_SYNC') {
    const payload = command.payload as Record<string, unknown> | undefined;
    switch (command.type) {
      case 'match_ready':
        return next.players[next.playerID]?.ready === payload?.ready;
      case 'match_add_ai':
        return Object.keys(next.players).some(id =>
          !before.players[id] && next.players[id].ai);
      case 'match_remove_player':
        return !next.players[String(payload?.playerID ?? '')];
      case 'room_update_settings':
        return next.visibility === payload?.visibility;
      default:
        return false;
    }
  }
  return next.seq > before.seq;
}

export function playerForSide(data: GameSnapshot, side: Side) {
  return side === 'red'
    ? data.roomData.redPlayerID
    : data.roomData.tealPlayerID;
}

export function phaseCopy(data: GameSnapshot): [string, string] {
  const mine = data.roomData.currentPlayer === data.playerId;
  const actor = playerName(data.roomData.currentPlayer, data.roomData.players);
  const side = currentSide(data);
  switch (data.roomData.gameStatus) {
    case 'waiting':
      return ['正在布置棋台', '等待双方完成局内同步'];
    case 'playing':
      return mine
        ? ['轮到你了', `${sideName(side)} · ${direction(side)}`]
        : [`${actor} 正在思考`, '对手也在寻找自己的连接。'];
    case 'end':
      return ['两岸已经相连', data.result?.reason ?? '本局结果已经确认'];
    default:
      return ['同步棋局', '正在等待权威状态'];
  }
}

export function actionCopy(
  action: ActionEntry,
  players?: GameSnapshot['roomData']['players'],
) {
  const actor = playerName(action.playerID, players);
  const source = players?.[action.playerID]?.ai
    ? 'AI 操作'
    : action.automatic
      ? '超时托管'
      : '';
  return `${actor}${source ? ` · ${source}` : ''} · ${actionLabel(action)}`;
}

export function isLegalMove(data: GameSnapshot, cell: Cell) {
  return data.roomData.legalMoves.some(option =>
    option.row === cell.row && option.column === cell.column);
}

export function isInteractive(data: GameSnapshot) {
  return data.roomData.gameStatus === 'playing'
    && data.roomData.currentPlayer === data.playerId;
}

export function currentSide(data: GameSnapshot): Side {
  return data.roomData.currentSide
    || data.playerData[data.roomData.currentPlayer]?.side
    || 'red';
}
