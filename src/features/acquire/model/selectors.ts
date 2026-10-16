import { companyKeys, type Company } from './types';
import { endGameState, phaseKey, selfID, type BusinessPanel, type BuyDraft, type DisplaySnapshot, type GameSnapshot, type MergeDraft, type PendingCommand, type Snapshot } from './session';

export function mergeCompanies(data: GameSnapshot): Company[] {
  return companyKeys.filter(company => data.tempData.mergeSettleData?.[company]?.hoders?.includes(data.playerId));
}
export function settledMergeCompanies(data: GameSnapshot): Company[] {
  return companyKeys.filter(company => !!data.tempData.mergeSettleData?.[company]?.settled?.[data.playerId]);
}
export function pendingMergePlayers(data: GameSnapshot): string[] {
  const pending = new Set(companyKeys.flatMap(company => data.tempData.mergeSettleData?.[company]?.hoders ?? []));
  return (data.roomData.playerOrder ?? Object.keys(data.roomData.players)).filter(playerID => pending.has(playerID));
}
export function actionPanel(data?: GameSnapshot): BusinessPanel | undefined {
  if (!data) return;
  if (data.roomData.gameStatus === 'mergingSettle') {
    if (mergeCompanies(data).length) return 'merge';
    if (settledMergeCompanies(data).length && pendingMergePlayers(data).length) return 'merge-wait';
  }
  if (data.playerId !== data.roomData.currentPlayer) return;
  switch (data.roomData.gameStatus) {
    case 'buyStock': return 'buy';
    case 'createCompany': return 'found';
    case 'mergingSelection': return 'survivor';
  }
}
export const canPlace = (data?: GameSnapshot) =>
  !!data && data.roomData.gameStatus === 'setTile' && data.playerId === data.roomData.currentPlayer;

/** Traverse adjacent neutral tiles as the server does, so previews cover chains. */
export function tilePreview(data: DisplaySnapshot, tile: string): { valid: boolean; text: string } {
  if (!data.playerData.tiles.includes(tile) || data.roomData.tiles[tile]?.belong) return { valid: false, text: '这块地已不可用' };
  const queue = [tile], seen = new Set<string>(), neighbors = new Set<Company>();
  let neutralCount = 0;
  while (queue.length) {
    const key = queue.shift()!;
    if (seen.has(key)) continue;
    seen.add(key);
    const belong = data.roomData.tiles[key]?.belong;
    if (belong && belong !== 'Blank') { neighbors.add(belong); continue; }
    if (key !== tile && belong !== 'Blank') continue;
    if (belong === 'Blank') neutralCount++;
    const x = parseInt(key), y = key.charCodeAt(key.length - 1);
    for (const [col, row] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (col >= 1 && col <= 12 && row >= 65 && row <= 73) queue.push(`${col}${String.fromCharCode(row)}`);
    }
  }
  const companies = [...neighbors];
  if (companies.filter(key => data.roomData.companyInfo[key].tiles >= 11).length > 1)
    return { valid: true, text: '连接两家安全公司，本次作为独立地块放置' };
  if (!companies.length && neutralCount && companyKeys.every(key => data.roomData.companyInfo[key].tiles > 0))
    return { valid: true, text: '连接独立地块，本回合不创建新公司' };
  return { valid: true, text: companies.length > 1 ? `连接 ${companies.join('、')}，触发合并`
    : companies.length ? `扩张 ${companies[0]}` : neutralCount ? '连接独立地块，创建公司' : '成为一块独立地块' };
}
export function buyPreview(data: GameSnapshot, draft: BuyDraft) {
  let count = 0, cost = 0, valid = true;
  for (const key of companyKeys) {
    const amount = draft[key] ?? 0, company = data.roomData.companyInfo[key];
    count += amount; cost += amount * company.stockPrice;
    if (!Number.isInteger(amount) || amount < 0 || amount > company.stockTotal || (amount > 0 && !company.tiles)) valid = false;
  }
  return { count, cost, balance: data.playerData.money - cost, valid: valid && count <= 3 && cost <= data.playerData.money };
}
export function mergePreview(data: GameSnapshot, draft: MergeDraft) {
  let groups = 0, revenue = 0, retained = 0, valid = true;
  const companies = mergeCompanies(data);
  for (const key of companies) {
    const action = draft[key] ?? { sell: 0, groups: 0 };
    const held = data.playerData.stocks[key] ?? 0;
    if (!Number.isInteger(action.sell) || !Number.isInteger(action.groups) || action.sell < 0 || action.groups < 0
      || action.sell + action.groups * 2 > held) valid = false;
    groups += action.groups; revenue += action.sell * data.roomData.companyInfo[key].stockPrice;
    retained += held - action.sell - action.groups * 2;
  }
  const stock = data.roomData.companyInfo[data.tempData.merge_main_company_temp]?.stockTotal ?? 0;
  return { groups, revenue, retained, stock, valid: valid && groups <= stock && companies.length > 0 };
}

/** Only changes relevant to the submitted action constitute success. */
export function confirmsCommand(command: PendingCommand, next: Snapshot): boolean {
  const before = command.before, payload = command.payload;
  if (phaseKey(before) !== phaseKey(next)) return true;
  if (next.type === 'MATCH_SYNC' && before.type === 'MATCH_SYNC') {
    switch (command.type) {
      case 'match_ready': return next.players[selfID(next)]?.ready === payload.ready;
      case 'room_update_settings': return next.visibility === payload.visibility;
      case 'match_add_ai': return Object.keys(next.players).some(id => !before.players[id] && next.players[id].ai
        && (typeof payload.seatIndex !== 'number' || next.players[id].seatIndex === payload.seatIndex));
      case 'match_remove_player': return !next.players[String(payload.playerID)];
    }
  }
  if (next.type === 'ROOM_SYNC' && before.type === 'ROOM_SYNC') {
    if (command.type === 'game_end_vote') return endGameState(next).votes[next.playerId] === payload.allow;
    if (command.type === 'game_merging_settle') return mergeCompanies(next).length === 0;
    if (command.type === 'game_place_tile') return !!next.roomData.tiles[String(payload.tileKey)]?.belong;
    if (command.type === 'game_create_company') {
      const company = String(payload.company) as keyof typeof next.roomData.companyInfo;
      return (next.roomData.companyInfo[company]?.tiles ?? 0) > (before.roomData.companyInfo[company]?.tiles ?? 0);
    }
    if (command.type === 'game_buy_stock') return next.playerData.money !== before.playerData.money
      || companyKeys.some(key => next.playerData.stocks[key] !== before.playerData.stocks[key]);
  }
  return false;
}
