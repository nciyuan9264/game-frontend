import { describe, expect, it } from 'vitest';
import { actionPanel, buyPreview, confirmsCommand, mergeCompanies, mergePreview, pendingMergePlayers, settledMergeCompanies, tilePreview } from './selectors';
import type { GameSnapshot, PendingCommand } from './session';
import { companyKeys } from './types';

export function gameFixture(): GameSnapshot {
  return {
    type: 'ROOM_SYNC', roomID: 'test-room', visibility: 'public', phaseVersion: 3, turnNumber: 1,
    playerId: 'me-1', ownerID: 'me-1',
    playerData: { money: 6000, stocks: Object.fromEntries(companyKeys.map(key => [key, 0])), tiles: ['1A', '2B'] },
    roomData: {
      gameStatus: 'setTile', currentPlayer: 'me-1', currentStep: '', playerOrder: ['me-1'], players: {},
      companyInfo: Object.fromEntries(companyKeys.map(key => [key, { name: key, tiles: 0, stockPrice: 200, stockTotal: 25, valuation: '' }])),
      tiles: { '1A': { id: '1A', belong: '' }, '2B': { id: '2B', belong: '' } },
    },
    tempData: { last_tile_key: '', merge_main_company_temp: 'Tower', merge_selection_temp: { mainCompany: [], otherCompany: [] }, mergeSettleData: {} },
  } as unknown as GameSnapshot; // Legacy DTO marks sparse runtime maps and blank tiles as exhaustive.
}
describe('authoritative transaction previews', () => {
  it('permits zero cash and explicit skip but rejects overspending, over three and inventory', () => {
    const game = gameFixture();
    game.roomData.companyInfo.Tower.tiles = 2;
    game.playerData.money = 0;
    expect(buyPreview(game, {}).valid).toBe(true);
    expect(buyPreview(game, { Tower: 1 }).valid).toBe(false);
    game.playerData.money = 6000;
    expect(buyPreview(game, { Tower: 4 }).valid).toBe(false);
    game.roomData.companyInfo.Tower.stockTotal = 1;
    expect(buyPreview(game, { Tower: 2 }).valid).toBe(false);
  });
  it('shares survivor stock across all acquired companies and enforces two-for-one', () => {
    const game = gameFixture();
    game.tempData.mergeSettleData.American = { hoders: ['me-1'], dividends: {} };
    game.tempData.mergeSettleData.Festival = { hoders: ['me-1'], dividends: {} };
    game.playerData.stocks.American = 4; game.playerData.stocks.Festival = 4;
    game.roomData.companyInfo.Tower.stockTotal = 3;
    expect(mergePreview(game, { American: { groups: 2, sell: 0 }, Festival: { groups: 2, sell: 0 } }).valid).toBe(false);
    expect(mergePreview(game, { American: { groups: 1, sell: 2 }, Festival: { groups: 2, sell: 0 } }).valid).toBe(true);
    expect(mergePreview(game, { American: { groups: 1.5, sell: 0 } }).valid).toBe(false);
  });
  it('does not treat unrelated repeated snapshots as transaction confirmation', () => {
    const game = gameFixture();
    const command: PendingCommand = { id: '1', type: 'game_buy_stock', payload: { stocks: { Tower: 1 } }, before: game, epoch: 1 };
    expect(confirmsCommand(command, structuredClone(game))).toBe(false);
    expect(confirmsCommand(command, { ...game, phaseVersion: 4 })).toBe(true);
  });
  it('confirms both approval and revocation from the authoritative vote map', () => {
    const game = gameFixture();
    game.roomData.endGame = {
      eligible: true, condition: 'company_size', company: 'Tower', tileCount: 41, votes: { 'me-1': false },
    };
    const approval: PendingCommand = {
      id: 'vote-1', type: 'game_end_vote', payload: { allow: true }, before: structuredClone(game), epoch: 1,
    };
    const approved = structuredClone(game);
    approved.roomData.endGame!.votes['me-1'] = true;
    expect(confirmsCommand(approval, approved)).toBe(true);

    const revocation: PendingCommand = {
      id: 'vote-2', type: 'game_end_vote', payload: { allow: false }, before: approved, epoch: 1,
    };
    const revoked = structuredClone(approved);
    revoked.roomData.endGame!.votes['me-1'] = false;
    expect(confirmsCommand(revocation, revoked)).toBe(true);
  });
  it('allows placing a tile between two safe companies as an independent tile', () => {
    const game = gameFixture();
    game.roomData.tiles['2A'] = { id: '2A', belong: 'Blank' };
    game.roomData.tiles['3A'] = { id: '3A', belong: 'Tower' };
    game.roomData.tiles['1B'] = { id: '1B', belong: 'American' };
    game.roomData.companyInfo.Tower.tiles = 11; game.roomData.companyInfo.American.tiles = 11;
    expect(tilePreview(game, '1A')).toEqual({
      valid: true,
      text: '连接两家安全公司，本次作为独立地块放置',
    });
  });
  it('allows connecting neutral tiles when all seven companies are established', () => {
    const game = gameFixture();
    game.roomData.tiles['2A'] = { id: '2A', belong: 'Blank' };
    companyKeys.forEach(company => {
      game.roomData.companyInfo[company].tiles = 2;
    });

    expect(tilePreview(game, '1A')).toEqual({
      valid: true,
      text: '连接独立地块，本回合不创建新公司',
    });
  });
  it('opens merger settlement for every acquired company held by this player', () => {
    const game = gameFixture();
    game.roomData.gameStatus = 'mergingSettle';
    game.tempData.mergeSettleData.American = { hoders: ['me-1'], dividends: {} };
    game.tempData.mergeSettleData.Festival = { hoders: ['guest', 'me-1'], dividends: {} };

    expect(actionPanel(game)).toBe('merge');
    expect(mergeCompanies(game)).toEqual(['American', 'Festival']);
  });
  it('opens merger waiting after this player submits while another holder is pending', () => {
    const game = gameFixture();
    game.roomData.gameStatus = 'mergingSettle';
    game.roomData.playerOrder = ['me-1', 'guest'];
    game.roomData.players = { 'me-1': { playerID: 'me-1' }, guest: { playerID: 'guest' } } as never;
    game.tempData.mergeSettleData.American = {
      hoders: ['guest'], dividends: { 'me-1': 3000 },
      settled: { 'me-1': { holdingBefore: 4, sellAmount: 2, exchangeAmount: 2 } },
    };

    expect(actionPanel(game)).toBe('merge-wait');
    expect(settledMergeCompanies(game)).toEqual(['American']);
    expect(pendingMergePlayers(game)).toEqual(['guest']);
  });
});
