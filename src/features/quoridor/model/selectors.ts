import type {
  GameSnapshot,
  PendingCommand,
  Snapshot,
} from './session';
import { playerName } from './session';
import {
  actionLabel,
  coordinate,
  sideName,
  wallReasonCopy,
} from './board';
import type {
  ActionEntry,
  Cell,
  Side,
  WallOption,
  WallSpec,
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
  return side === 'south'
    ? data.roomData.southPlayerID
    : data.roomData.northPlayerID;
}

export function phaseCopy(data: GameSnapshot): [string, string] {
  const mine = data.roomData.currentPlayer === data.playerId;
  const actor = playerName(data.roomData.currentPlayer, data.roomData.players);
  switch (data.roomData.gameStatus) {
    case 'waiting':
      return ['正在布置棋台', '等待双方完成局内同步'];
    case 'playing':
      return mine
        ? ['轮到你了', '移动棋子，或留下一道围墙。']
        : [`${actor} 正在思考`, '对手也在寻找自己的去路。'];
    case 'end':
      return ['这一程，已经落定', data.result?.reason ?? '本局结果已经确认'];
    default:
      return ['同步棋局', '正在等待权威状态'];
  }
}

export function actionCopy(
  action: ActionEntry,
  players?: GameSnapshot['roomData']['players'],
) {
  const actor = action.playerID
    ? playerName(action.playerID, players)
    : sideName(action.side);
  return `${actor}${action.automatic ? ' 自动' : ''} · ${actionLabel(action)}`;
}

export function wallOptionAt(
  options: WallOption[],
  wall: WallSpec,
) {
  return options.find(option =>
    option.row === wall.row
    && option.column === wall.column
    && option.orientation === wall.orientation);
}

export function wallSelectionCopy(option?: WallOption) {
  return option?.legal
    ? '放置合法，双方仍有通路。确认后消耗 1 道围墙。'
    : wallReasonCopy(option?.reasonCode);
}

export function isLegalMove(data: GameSnapshot, cell: Cell) {
  return data.roomData.legalMoves.some(option =>
    option.row === cell.row && option.column === cell.column);
}

export function targetCopy(side?: Side) {
  return side === 'north' ? '第 9 行' : '第 1 行';
}

export function isInteractive(data: GameSnapshot) {
  return data.roomData.gameStatus === 'playing'
    && data.roomData.currentPlayer === data.playerId;
}

export function currentSide(data: GameSnapshot): Side {
  return data.roomData.currentSide || data.playerData[data.roomData.currentPlayer]?.side || 'south';
}

export function currentPosition(data: GameSnapshot) {
  return data.roomData.pawns[currentSide(data)];
}

export function actionCoordinate(action?: ActionEntry) {
  return action?.kind === 'move'
    ? coordinate(action.to)
    : action?.kind === 'wall'
      ? coordinate(action.wall)
      : '—';
}
