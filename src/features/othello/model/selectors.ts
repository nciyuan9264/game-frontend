import { coordinate } from './board';
import type {
  GameSnapshot,
  PendingCommand,
  Snapshot,
} from './session';
import { playerName } from './session';
import type { MoveEntry, Side } from './types';

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

export function sideName(side?: Side) {
  return side === 'white' ? '白方' : '黑方';
}

export function opponentSide(side: Side): Side {
  return side === 'white' ? 'black' : 'white';
}

export function playerForSide(data: GameSnapshot, side: Side) {
  return side === 'black'
    ? data.roomData.blackPlayerID
    : data.roomData.whitePlayerID;
}

export function phaseCopy(data: GameSnapshot): [string, string] {
  const mine = data.roomData.currentPlayer === data.playerId;
  const actor = playerName(data.roomData.currentPlayer, data.roomData.players);
  switch (data.roomData.gameStatus) {
    case 'waiting':
      return ['正在布置棋台', '等待双方完成局内同步'];
    case 'playing':
      return mine
        ? ['轮到你了', '点击服务端标记的合法空格，夹住并翻转对方棋子']
        : [`${actor} 正在思考`, '对手正在寻找下一处落点'];
    case 'pass':
      return mine
        ? ['当前无子可下', '没有合法落点，本回合必须跳过']
        : [`${actor} 无子可下`, '对手跳过后将由你继续行棋'];
    case 'end':
      return ['这一局，已落定', data.result?.reason ?? '本局结果已经确认'];
    default:
      return ['同步棋局', '正在等待权威状态'];
  }
}

export function actionCopy(
  action: MoveEntry,
  players?: GameSnapshot['roomData']['players'],
) {
  const actor = action.playerID
    ? playerName(action.playerID, players)
    : sideName(action.side);
  const automatic = action.automatic ? '自动' : '';
  switch (action.kind) {
    case 'move':
      return `${actor}${automatic ? ` ${automatic}` : ''}落在 ${coordinate(action.index ?? -1)}，翻转 ${action.flips.length} 枚`;
    case 'pass':
      return `${actor}${automatic ? ` ${automatic}` : ''}跳过回合`;
    case 'resign':
      return `${actor}认输`;
    default:
      return `${actor}完成一步操作`;
  }
}

export function winnerID(data: GameSnapshot) {
  return data.roomData.gameStatus === 'end'
    ? data.result?.winnerID ?? ''
    : '';
}

export function isInteractive(data: GameSnapshot) {
  return data.roomData.currentPlayer === data.playerId
    && (data.roomData.gameStatus === 'playing'
      || data.roomData.gameStatus === 'pass');
}
