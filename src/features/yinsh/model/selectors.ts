import type {
  GameSnapshot,
  PendingCommand,
  Snapshot,
} from './session';
import { playerName } from './session';
import type { LastAction, Side } from './types';

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
  return side === 'black' ? '黑方' : '白方';
}

export function opponentSide(side: Side): Side {
  return side === 'white' ? 'black' : 'white';
}

export function playerForSide(data: GameSnapshot, side: Side) {
  return data.roomData.playerOrder.find(id => data.playerData[id]?.side === side) ?? '';
}

export function phaseCopy(data: GameSnapshot) {
  const mine = data.roomData.currentPlayer === data.playerId;
  const actor = playerName(data.roomData.currentPlayer, data.roomData.players);
  switch (data.roomData.gameStatus) {
    case 'waiting':
      return ['正在布置棋台', '等待双方完成局内同步'];
    case 'placement': {
      const side = data.playerData[data.roomData.currentPlayer]?.side;
      const placed = data.roomData.placedRings[side] ?? 0;
      return mine
        ? ['轮到你布环', `选择空交点，放置第 ${placed + 1} 枚圆环`]
        : [`${actor} 正在布环`, `已放置 ${placed} / 5 枚圆环`];
    }
    case 'move':
      return mine
        ? ['选择你的下一步', '先选圆环，再选择服务端标记的合法落点']
        : [`等待 ${actor}`, '对手正在寻找下一次翻转'];
    case 'remove_row':
      return mine
        ? ['连成五子了', '选择一条高亮五连，将五枚棋子放回公共池']
        : [`${actor} 正在移除五连`, '结算完成后还需取走一枚圆环'];
    case 'remove_ring':
      return mine
        ? ['收起一枚圆环', '选择任意一枚己方圆环计分']
        : [`${actor} 正在取环`, '第三枚圆环将立即结束对局'];
    case 'end':
      return ['对局已结束', data.result?.reason ?? '本局结果已经确认'];
    default:
      return ['同步棋局', '正在等待权威状态'];
  }
}

export function actionCopy(
  action: LastAction,
  players?: GameSnapshot['roomData']['players'],
) {
  const actor = action.playerID
    ? playerName(action.playerID, players)
    : '系统';
  const payload = action.payload ?? {};
  switch (action.action) {
    case 'game_started':
      return `第 ${String(payload.roundNo ?? 1)} 局开始，白方先布环`;
    case 'place_ring':
      return `${actor} 在 ${String(payload.pointID ?? '')} 放置圆环`;
    case 'move_ring': {
      const flips = Array.isArray(payload.flips) ? payload.flips.length : 0;
      return `${actor} ${String(payload.from ?? '')} → ${String(payload.to ?? '')}，翻转 ${flips} 子`;
    }
    case 'remove_row':
      return `${actor} 移除五连 ${String(payload.rowID ?? '')}`;
    case 'remove_ring':
      return `${actor} 取走圆环 ${String(payload.pointID ?? '')}`;
    case 'resign':
      return `${actor} 认输`;
    case 'pass':
      return `${actor} 无合法移动，自动跳过`;
    default:
      return `${actor} 完成一步操作`;
  }
}

export function winnerID(data: GameSnapshot) {
  return data.roomData.gameStatus === 'end'
    ? data.result?.winnerID ?? ''
    : '';
}

export function isInteractive(data: GameSnapshot) {
  return data.roomData.currentPlayer === data.playerId
    && data.roomData.gameStatus !== 'waiting'
    && data.roomData.gameStatus !== 'end';
}
