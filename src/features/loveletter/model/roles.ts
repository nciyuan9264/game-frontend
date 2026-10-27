export const ROLES = [
  { rank: 0, name: '密探', en: 'SPY', count: 2, verb: '潜伏', short: '独自潜伏，额外好感', effect: '本轮结束时，若你是唯一使用过密探且仍未出局的玩家，额外获得 1 枚好感。' },
  { rank: 1, name: '卫兵', en: 'GUARD', count: 6, verb: '猜测', short: '猜中对手角色，令其出局', effect: '选择另一位未受保护的玩家，猜其手牌角色。不能猜卫兵，猜中则对方出局。' },
  { rank: 2, name: '神父', en: 'PRIEST', count: 2, verb: '窥见', short: '秘密查看一位对手的手牌', effect: '秘密查看另一位未受保护玩家的手牌。只有你能看到。' },
  { rank: 3, name: '男爵', en: 'BARON', count: 2, verb: '较量', short: '比较手牌点数，低者出局', effect: '与另一位未受保护玩家秘密比较手牌，点数较低者出局。' },
  { rank: 4, name: '侍女', en: 'HANDMAID', count: 2, verb: '守护', short: '获得保护，直到下回合', effect: '直到你的下个回合开始前，其他玩家不能以你为卡牌效果目标。' },
  { rank: 5, name: '王子', en: 'PRINCE', count: 2, verb: '重写', short: '令一人弃牌重摸，可选自己', effect: '选择任一未受保护玩家，令其弃掉手牌并重新摸一张。' },
  { rank: 6, name: '大臣', en: 'CHANCELLOR', count: 2, verb: '斟酌', short: '再摸两张，留一张，其余沉底', effect: '额外摸两张牌，保留其中一张，其余按自选顺序放回牌堆底。' },
  { rank: 7, name: '国王', en: 'KING', count: 1, verb: '交换', short: '与一位对手交换手牌', effect: '与另一位未受保护玩家交换手牌。交换不算弃牌。' },
  { rank: 8, name: '伯爵夫人', en: 'COUNTESS', count: 1, verb: '隐忍', short: '与王子或国王同持，必须打出', effect: '若同时持有王子或国王，必须打出伯爵夫人。' },
  { rank: 9, name: '公主', en: 'PRINCESS', count: 1, verb: '托付', short: '弃掉即出局；轮末点数最高', effect: '无论出于什么原因弃掉公主，你都会立即出局。' },
] as const;

export type Rank = typeof ROLES[number]['rank'];

export const role = (rank: number) => ROLES[rank] ?? ROLES[0];

export const goalFor = (players: number) =>
  players === 2 ? 6 : players === 3 ? 5 : players === 4 ? 4 : 3;
