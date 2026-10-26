import type { GameSnapshot, PendingCommand, Snapshot } from './session';
import type { Card } from './types';

export function confirmsCommand(command: PendingCommand, next: Snapshot): boolean {
  const before = command.before;
  if (command.type === 'match_begin') return before.type === 'MATCH_SYNC' && next.type === 'ROOM_SYNC';
  if (next.type === 'MATCH_SYNC' && before.type === 'MATCH_SYNC') {
    switch (command.type) {
      case 'match_ready':
        return next.players[next.playerID]?.ready === command.payload.ready;
      case 'match_add_ai':
        return Object.keys(next.players).some(id => !before.players[id] && next.players[id].ai);
      case 'match_remove_player':
        return !next.players[String(command.payload.playerID)];
      case 'room_update_settings':
        return next.visibility === command.payload.visibility;
      default:
        return false;
    }
  }
  if (next.type === 'ROOM_SYNC' && before.type === 'ROOM_SYNC') {
    switch (command.type) {
      case 'game_ready':
        return next.roomData.gameStatus !== 'waiting';
      case 'game_get_card': {
        const cardID = String(command.payload.id);
        return !next.roomData.boardCards[cardID]
          && next.cardData.self.some(card => card.id === cardID && card.index === -1);
      }
      case 'game_guess_card': {
        const action = next.roomData.lastData;
        const payload = action?.payload;
        if (!payload) return false;
        return action?.action === 'guess_card'
          && action.playerID === next.playerId
          && payload.targetCardID === command.payload.id
          && payload.guessNum === command.payload.num;
      }
      case 'game_set_card':
        return next.cardData.self.some(card =>
          card.id === command.payload.id && card.index === command.payload.index);
      case 'game_initialize_hand':
        return next.cardData.initialHandReady === true
          || next.roomData.gameStatus !== 'initialize';
      default:
        return false;
    }
  }
  return false;
}

export function winner(data: GameSnapshot): string {
  if (data.roomData.gameStatus !== 'end') return '';
  if (data.cardData.self.some(card => !card.isRevealed)) return data.playerId;
  return Object.keys(data.roomData.players).find(playerID => playerID !== data.playerId) ?? '';
}

export function phaseCopy(data: GameSnapshot) {
  const mine = data.roomData.currentPlayer === data.playerId;
  switch (data.roomData.gameStatus) {
    case 'initialize':
      return ['确认初始密码', '双方正在同时确认密码牌序'];
    case 'getCard':
      return mine ? ['抽取新牌', '从公共牌池选择一张黑牌或白牌'] : ['等待对手抽牌', '留意牌池颜色与剩余数量'];
    case 'guessCard':
      return mine ? ['破解密码', '选择对手尚未公开的牌并猜测数字'] : ['对手正在猜牌', '你的密码序列仍处于保护状态'];
    case 'setCard':
      return mine ? ['继续或收手', '继续猜测，或将本回合新牌放回序列'] : ['对手正在抉择', '等待对手继续猜测或结束回合'];
    case 'end':
      return ['密码已揭晓', '本局对决已经结束'];
    default:
      return ['同步牌桌', '正在等待双方进入对局'];
  }
}

export function lastGuess(data: GameSnapshot) {
  const action = data.roomData.lastData;
  const payload = action?.payload;
  if (
    action?.action !== 'guess_card'
    || !payload
    || typeof payload.targetCardID !== 'string'
    || typeof payload.guessNum !== 'number'
  ) return;
  return {
    correct: payload.correct,
    actor: action.playerID,
    target: payload.targetPlayerID,
    value: payload.guessNum === -1 ? 'JOKER' : String(payload.guessNum),
  };
}

export function sortCards(cards: Card[]) {
  return [...cards].sort((left, right) => (left.index ?? Number.MAX_SAFE_INTEGER) - (right.index ?? Number.MAX_SAFE_INTEGER));
}
