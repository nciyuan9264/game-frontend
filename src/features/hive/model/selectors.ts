import {
  actionLabel,
  otherSide,
  pieceKindFromID,
  sameHex,
  sideName,
  topPiece,
} from './board';
import type {
  GameSnapshot,
  PendingCommand,
  Snapshot,
} from './session';
import { playerName } from './session';
import type {
  ActionEntry,
  Hex,
  MoveOption,
  PieceKind,
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
  return side === 'white'
    ? data.roomData.whitePlayerID
    : data.roomData.blackPlayerID;
}

export function currentSide(data: GameSnapshot): Side {
  return data.roomData.currentSide
    || data.playerData[data.roomData.currentPlayer]?.side
    || 'white';
}

export function phaseCopy(data: GameSnapshot): [string, string] {
  const mine = data.roomData.currentPlayer === data.playerId;
  const actor = playerName(data.roomData.currentPlayer, data.roomData.players);
  const state = data.playerData[data.roomData.currentPlayer];
  switch (data.roomData.gameStatus) {
    case 'waiting':
      return ['正在布置棋台', '等待双方完成局内同步。'];
    case 'playing':
      if (!data.roomData.legalActions.length) {
        return ['没有合法行动', '服务端将自动过手，无需手动操作。'];
      }
      if (mine) {
        return state && !state.queenPlaced && state.turnsTaken >= 3
          ? ['先让蜂后入场', '这是你的第 4 手，本手必须部署蜂后。']
          : ['轮到你了', '部署新虫，或移动蜂巢中的己方棋子。'];
      }
      return [`${actor} 正在思考`, '棋盘保持只读，等待对手行动。'];
    case 'end':
      return ['这一巢，已经落定', data.result?.reason ?? '本局结果已经确认。'];
    default:
      return ['同步棋局', '正在等待权威状态。'];
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

export function legalActionsForPiece(
  data: GameSnapshot,
  pieceID?: string,
) {
  return pieceID
    ? data.roomData.legalActions.filter(option => option.pieceID === pieceID)
    : [];
}

export function placementPieceForKind(
  data: GameSnapshot,
  kind: PieceKind,
) {
  return data.roomData.legalActions.find(option =>
    option.kind === 'place' && pieceKindFromID(option.pieceID) === kind)?.pieceID;
}

export function isLegalAction(
  options: MoveOption[],
  kind: 'place' | 'move',
  pieceID: string,
  to: Hex,
) {
  return options.some(option =>
    option.kind === kind
    && option.pieceID === pieceID
    && sameHex(option.to, to));
}

export function optionAt(
  options: MoveOption[],
  kind: 'place' | 'move',
  pieceID: string,
  to: Hex,
) {
  return options.find(option =>
    option.kind === kind
    && option.pieceID === pieceID
    && sameHex(option.to, to));
}

export function topPieceAt(data: GameSnapshot, position: Hex) {
  return topPiece(data.roomData.stacks.find(stack =>
    sameHex(stack.position, position)));
}

export function opponentSide(data: GameSnapshot) {
  return otherSide(currentSide(data));
}

export function isInteractive(data: GameSnapshot) {
  return data.roomData.gameStatus === 'playing'
    && data.roomData.currentPlayer === data.playerId;
}
