import type {
  DisplaySnapshot,
  GameSnapshot,
  LastAction,
  PendingCommand,
  Snapshot,
} from './session';
import {
  cardColors,
  gemColors,
  gemMeta,
  type CardColor,
  type DevelopmentCard,
  type GemCounts,
  type GemColor,
  type PlayerState,
} from './types';

export function boardCards(data: DisplaySnapshot) {
  return Object.values(data.roomData.card ?? {}).flat()
    .sort((left, right) => left.id - right.id);
}

export function boardNobles(data: DisplaySnapshot) {
  return [...(data.roomData.nobles ?? [])].sort((left, right) =>
    left.id.localeCompare(right.id, undefined, { numeric: true }));
}

export function discounts(player?: PlayerState): Record<CardColor, number> {
  const result = Object.fromEntries(cardColors.map(color => [color, 0])) as Record<CardColor, number>;
  player?.normalCard.forEach(card => { result[card.bonus] += 1; });
  return result;
}

export function tokenTotal(player?: PlayerState) {
  return Object.values(player?.gem ?? {}).reduce((total, count) => total + (count ?? 0), 0);
}

export function canBuyCard(data: DisplaySnapshot, playerID: string, card: DevelopmentCard) {
  const player = data.playerData[playerID];
  return !!player && paymentPreview(player, card).missing === 0;
}

export interface PaymentLine {
  color: CardColor;
  cost: number;
  discount: number;
  required: number;
  tokens: number;
  gold: number;
  missing: number;
}

export function paymentPreview(player: PlayerState, card: DevelopmentCard) {
  const bonus = discounts(player);
  let goldLeft = player.gem.Gold ?? 0;
  const payment: GemCounts = {};
  const lines = cardColors.map<PaymentLine>(color => {
    const cost = card.cost[color] ?? 0;
    const discount = Math.min(cost, bonus[color]);
    const required = Math.max(0, cost - discount);
    const tokens = Math.min(required, player.gem[color] ?? 0);
    const gold = Math.min(required - tokens, goldLeft);
    goldLeft -= gold;
    const missing = required - tokens - gold;
    if (tokens) payment[color] = tokens;
    if (gold) payment.Gold = (payment.Gold ?? 0) + gold;
    return { color, cost, discount, required, tokens, gold, missing };
  }).filter(line => line.cost > 0);
  return {
    lines,
    payment,
    gold: payment.Gold ?? 0,
    missing: lines.reduce((total, line) => total + line.missing, 0),
    total: Object.values(payment).reduce((total, count) => total + (count ?? 0), 0),
  };
}

export function canReserve(data: DisplaySnapshot, playerID: string) {
  const player = data.playerData[playerID];
  return !!player && player.reserveCard.length < 3 && boardCards(data).length > 0;
}

export function canTakeAnyGem(data: DisplaySnapshot, playerID: string) {
  const player = data.playerData[playerID];
  return !!player && cardColors.some(color => (data.roomData.gems[color] ?? 0) > 0);
}

export function canPass(data: DisplaySnapshot, playerID: string) {
  const player = data.playerData[playerID];
  if (!player || canTakeAnyGem(data, playerID) || canReserve(data, playerID)) return false;
  return ![...boardCards(data), ...player.reserveCard].some(card => canBuyCard(data, playerID, card));
}

export function gemSelectionValid(
  data: DisplaySnapshot,
  playerID: string,
  selected: Partial<Record<CardColor, number>>,
) {
  const entries = Object.entries(selected).filter((entry): entry is [CardColor, number] => entry[1] > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const player = data.playerData[playerID];
  if (!player || total < 1 || total > 3) return false;
  if (entries.some(([color, count]) => count > (data.roomData.gems[color] ?? 0))) return false;
  const double = entries.find(([, count]) => count === 2);
  if (double) return entries.length === 1 && (data.roomData.gems[double[0]] ?? 0) >= 4;
  const available = cardColors.filter(color => (data.roomData.gems[color] ?? 0) > 0).length;
  return entries.every(([, count]) => count === 1) && entries.length === Math.min(3, available);
}

export function toggleGemSelection(
  bank: Partial<Record<CardColor, number>>,
  selected: Partial<Record<CardColor, number>>,
  color: CardColor,
) {
  const current = selected[color] ?? 0;
  const total = Object.values(selected).reduce((sum, count) => sum + (count ?? 0), 0);
  const selectedColors = Object.values(selected).filter(count => (count ?? 0) > 0).length;
  if (current >= 2) {
    const next = { ...selected };
    delete next[color];
    return next;
  }
  if (current === 1) {
    if (selectedColors === 1 && (bank[color] ?? 0) >= 4) return { [color]: 2 };
    const next = { ...selected };
    delete next[color];
    return next;
  }
  const available = cardColors.filter(item => (bank[item] ?? 0) > 0).length;
  const goal = Math.min(3, available);
  if (!(bank[color] ?? 0) || total >= goal || Object.values(selected).some(count => count === 2)) return selected;
  return { ...selected, [color]: 1 };
}

export function combinedWallet(player: PlayerState, additions: GemCounts): Record<GemColor, number> {
  return Object.fromEntries(gemColors.map(color =>
    [color, (player.gem[color] ?? 0) + (additions[color] ?? 0)])) as Record<GemColor, number>;
}

export function walletAfterTake(player: PlayerState, take: Partial<Record<CardColor, number>>) {
  return combinedWallet(player, take);
}

export function walletAfterReserve(player: PlayerState, goldAvailable: boolean) {
  return combinedWallet(player, goldAvailable ? { Gold: 1 } : {});
}

export function overflowCount(wallet: GemCounts) {
  return Math.max(0, Object.values(wallet).reduce((total, count) => total + (count ?? 0), 0) - 10);
}

export function returnSelectionValid(wallet: GemCounts, returns: GemCounts) {
  if (gemColors.some(color => (returns[color] ?? 0) < 0 || (returns[color] ?? 0) > (wallet[color] ?? 0))) return false;
  const count = Object.values(returns).reduce((total, value) => total + (value ?? 0), 0);
  return count === overflowCount(wallet);
}

export function nobleMissing(player: PlayerState | undefined, cost: Partial<Record<CardColor, number>>) {
  const bonus = discounts(player);
  return cardColors.reduce((total, color) => total + Math.max(0, (cost[color] ?? 0) - bonus[color]), 0);
}

export function deckCount(data: DisplaySnapshot, level: 1 | 2 | 3) {
  return data.roomData.deckCounts?.[level] ?? 0;
}

export function confirmsCommand(command: PendingCommand, next: Snapshot) {
  if (next.seq > command.before.seq) return true;
  if (next.type !== 'MATCH_SYNC' || command.before.type !== 'MATCH_SYNC') return false;
  if (command.type === 'match_ready') {
    return next.players[next.playerID]?.ready === (command.payload as { ready?: boolean })?.ready;
  }
  if (command.type === 'room_update_settings') {
    return next.visibility === (command.payload as { visibility?: string })?.visibility;
  }
  return false;
}

export function winnerIDs(data: GameSnapshot) {
  const entries = Object.entries(data.result ?? {}).sort((left, right) => {
    if (right[1].score !== left[1].score) return right[1].score - left[1].score;
    return left[1].cards - right[1].cards;
  });
  const best = entries[0];
  return best ? entries.filter(([, value]) => value.score === best[1].score && value.cards === best[1].cards).map(([id]) => id) : [];
}

export function phaseCopy(data: GameSnapshot) {
  if (data.roomData.gameStatus === 'end') return ['珠宝展落幕', '最终声望与发展卡数量已经结算'];
  if (data.roomData.gameStatus === 'waiting') return ['正在布置展台', '等待所有玩家完成局内同步'];
  const mine = data.roomData.currentPlayer === data.playerId;
  if (data.roomData.gameStatus === 'last_turn') {
    return mine ? ['你的最后一轮', '把握最后一次扩充收藏的机会'] : ['最后一轮', '观察当前玩家的最终选择'];
  }
  return mine ? ['轮到你选择', '拿宝石、购买发展卡或预留一张卡'] : ['等待其他收藏家', '你可以检查卡牌成本与自己的资源'];
}

export function lastActionCopy(action?: LastAction | null) {
  if (!action) return '';
  const actor = action.playerID.replace(/-\d+$/, '');
  switch (action.action) {
    case 'get_gem': {
      const payload = action.payload as {
        take?: Partial<Record<GemColor, number>>;
        returns?: GemCounts;
      } | Partial<Record<GemColor, number>> | undefined;
      const take = payload && 'take' in payload ? payload.take : payload as Partial<Record<GemColor, number>> | undefined;
      const returns = payload && 'take' in payload ? payload.returns : undefined;
      const picked = Object.entries(take ?? {}).filter(([, count]) => (count ?? 0) > 0)
        .map(([color, count]) => `${gemMeta[color as GemColor]?.short ?? color}×${count}`).join(' ');
      const returned = Object.values(returns ?? {}).reduce((total, count) => total + (count ?? 0), 0);
      return picked ? `${actor} 拿取 ${picked}${returned ? `，退还 ${returned} 枚筹码` : ''}` : `${actor} 跳过了回合`;
    }
    case 'buy_card': return `${actor} 购买了一张发展卡`;
    case 'preserve_card': {
      const payload = action.payload as { returns?: GemCounts } | undefined;
      const returned = Object.values(payload?.returns ?? {}).reduce((total, count) => total + (count ?? 0), 0);
      return `${actor} 预留了一张发展卡${returned ? `，退还 ${returned} 枚筹码` : ''}`;
    }
    case 'turn_timeout': return `${actor} 操作超时，回合已推进`;
    default: return '';
  }
}
