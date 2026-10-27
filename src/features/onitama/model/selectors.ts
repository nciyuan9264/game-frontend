import {
  actionLabel,
  coordinate,
  sameCell,
  sideName,
} from './cards';
import type {
  GameSnapshot,
  PendingCommand,
  Snapshot,
} from './session';
import { playerName } from './session';
import type {
  ActionEntry,
  CardID,
  Cell,
  LegalMove,
  Piece,
  Side,
} from './types';

function payload(command: PendingCommand) {
  return command.payload && typeof command.payload === 'object'
    ? command.payload as Record<string, unknown>
    : {};
}

function newActions(command: PendingCommand, next: GameSnapshot) {
  if (command.before.type !== 'ROOM_SYNC') return next.roomData.moveLog;
  return next.roomData.moveLog.slice(command.before.roomData.moveLog.length);
}

function matchingAction(command: PendingCommand, next: GameSnapshot) {
  const value = payload(command);
  return newActions(command, next).some(action => {
    if (
      command.type === 'game_move_piece'
      && action.kind === 'move'
      && action.cardID === value.cardID
      && action.pieceID === value.pieceID
    ) {
      return sameCell(action.to, value.to as Cell);
    }
    if (command.type === 'game_pass' && action.kind === 'pass') {
      return action.cardID === value.cardID;
    }
    return command.type === 'game_resign'
      && command.before.type === 'ROOM_SYNC'
      && action.kind === 'resign'
      && action.playerID === command.before.playerId;
  });
}

export function confirmsCommand(command: PendingCommand, next: Snapshot) {
  const before = command.before;
  if (next.matchID !== before.matchID || next.seq <= before.seq) return false;
  if (command.type === 'match_begin') {
    return before.type === 'MATCH_SYNC' && next.type === 'ROOM_SYNC';
  }
  if (next.type === 'MATCH_SYNC' && before.type === 'MATCH_SYNC') {
    const value = payload(command);
    switch (command.type) {
      case 'match_ready':
        return next.players[next.playerID]?.ready === value.ready;
      case 'match_add_ai':
        return Object.keys(next.players).some(id =>
          !before.players[id] && next.players[id].ai);
      case 'match_remove_player':
        return !next.players[String(value.playerID ?? '')];
      case 'room_update_settings':
        return next.visibility === value.visibility;
      default:
        return false;
    }
  }
  if (next.type !== 'ROOM_SYNC') return false;
  if (command.type === 'game_ready') {
    return before.type === 'ROOM_SYNC'
      && before.roomData.gameStatus === 'waiting'
      && next.roomData.gameStatus !== 'waiting';
  }
  return matchingAction(command, next);
}

export function playerForSide(data: GameSnapshot, side: Side) {
  return side === 'blue'
    ? data.roomData.bluePlayerID
    : data.roomData.redPlayerID;
}

export function sideForPlayer(
  data: GameSnapshot,
  playerID: string,
): Side | undefined {
  if (playerID === data.roomData.bluePlayerID) return 'blue';
  if (playerID === data.roomData.redPlayerID) return 'red';
  return data.playerData[playerID]?.side;
}

export function currentSide(data: GameSnapshot): Side {
  return data.roomData.currentSide
    || sideForPlayer(data, data.roomData.currentPlayer)
    || sideForPlayer(data, data.playerId)
    || 'blue';
}

export function viewerSide(data: GameSnapshot): Side {
  return sideForPlayer(data, data.playerId) || currentSide(data);
}

export function pieceByID(data: GameSnapshot, pieceID?: string) {
  return data.roomData.pieces.find(piece => piece.id === pieceID);
}

export function piecesForSide(data: GameSnapshot, owner: Side) {
  return data.roomData.pieces.filter(piece => piece.side === owner);
}

export function legalMovesFor(
  data: GameSnapshot,
  cardID?: CardID,
  pieceID?: string,
) {
  return data.roomData.legalMoves.filter(move =>
    (!cardID || move.cardID === cardID)
    && (!pieceID || move.pieceID === pieceID));
}

export function legalMoveAt(
  data: GameSnapshot,
  cardID: CardID | undefined,
  pieceID: string | undefined,
  target: Cell | undefined,
) {
  if (!cardID || !pieceID || !target) return;
  return data.roomData.legalMoves.find(move =>
    move.cardID === cardID
    && move.pieceID === pieceID
    && sameCell(move.to, target));
}

export function selectablePiece(
  data: GameSnapshot,
  piece: Piece,
  cardID?: CardID,
) {
  if (piece.side !== currentSide(data)) return false;
  return cardID
    ? legalMovesFor(data, cardID, piece.id).length > 0
    : legalMovesFor(data, undefined, piece.id).length > 0;
}

export function phaseCopy(data: GameSnapshot): [string, string] {
  const mine = data.roomData.currentPlayer === data.playerId;
  const actor = playerName(data.roomData.currentPlayer, data.roomData.players);
  switch (data.roomData.gameStatus) {
    case 'waiting':
      return ['正在布置山门', '五张招式已经落位，等待双方进入棋局。'];
    case 'playing':
      return mine
        ? ['轮到你了', '选一张招式、一枚棋子与服务端标出的落点。']
        : [`${actor} 正在思考`, '也留意这一式之后将流转到谁的手中。'];
    case 'end':
      return ['这一式，已经落定', resultReasonCopy(data.result?.reason)];
    default:
      return ['同步棋局', '正在等待权威状态。'];
  }
}

export function resultReasonCopy(reason?: string) {
  switch (reason) {
    case 'stone':
      return '擒获对方宗师，石之道成。';
    case 'stream':
      return '宗师进入对方山门，流水之道成。';
    case 'resign':
      return '对手认输，本局结束。';
    default:
      return reason || '本局结果已经确认。';
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

export function actionCoordinate(action?: ActionEntry) {
  return action?.kind === 'move' ? coordinate(action.to) : '—';
}

export function isInteractive(data: GameSnapshot) {
  return data.roomData.gameStatus === 'playing'
    && data.roomData.currentPlayer === data.playerId;
}

export function winningPreview(move?: LegalMove) {
  return move?.winning === true;
}
