import { describe, expect, it } from 'vitest';
import {
  canBuyCard,
  canPass,
  canReserve,
  boardCards,
  boardNobles,
  gemSelectionValid,
  lastActionCopy,
  overflowCount,
  paymentPreview,
  returnSelectionValid,
  toggleGemSelection,
  walletAfterReserve,
  walletAfterTake,
} from './selectors';
import type { DisplaySnapshot } from './session';
import type { DevelopmentCard } from './types';

const card: DevelopmentCard = {
  id: 1,
  level: 1,
  bonus: 'Blue',
  points: 0,
  cost: { Red: 2 },
  state: 1,
};

function snapshot(): DisplaySnapshot {
  return {
    playerId: 'me',
    playerData: {
      me: {
        normalCard: [], nobleCard: [], reserveCard: [], score: 0,
        gem: { White: 2, Blue: 2, Green: 2, Red: 2, Black: 2, Gold: 0 },
      },
    },
    roomData: {
      card: { 1: [card] }, gems: { White: 0, Blue: 0, Green: 0, Red: 0, Black: 0, Gold: 0 },
      nobles: [], currentPlayer: 'me', gameStatus: 'playing', players: {}, playerOrder: [],
      phaseVersion: 1, turnNumber: 1,
    },
    result: null,
  };
}

describe('splendor action selectors', () => {
  it('keeps public cards and nobles in stable natural order', () => {
    const data = snapshot();
    data.roomData.card = {
      1: [{ ...card, id: 10 }, { ...card, id: 2 }],
      2: [{ ...card, id: 7, level: 2 }],
    };
    data.roomData.nobles = [
      { id: 'N10', cost: {}, points: 3, state: 1 },
      { id: 'N2', cost: {}, points: 3, state: 1 },
      { id: 'N1', cost: {}, points: 3, state: 1 },
    ];
    expect(boardCards(data).map(item => item.id)).toEqual([2, 7, 10]);
    expect(boardNobles(data).map(item => item.id)).toEqual(['N1', 'N2', 'N10']);
  });

  it('allows reserving at ten tokens and without gold in the bank', () => {
    const data = snapshot();
    expect(canReserve(data, 'me')).toBe(true);
    expect(canPass(data, 'me')).toBe(false);
  });

  it('only allows passing when take, buy, and reserve are all unavailable', () => {
    const data = snapshot();
    data.playerData.me.reserveCard = [card, { ...card, id: 2 }, { ...card, id: 3 }];
    data.playerData.me.gem = { White: 10 };
    expect(canBuyCard(data, 'me', card)).toBe(false);
    expect(canPass(data, 'me')).toBe(true);
  });

  it('validates distinct triples and same-color doubles against supply', () => {
    const data = snapshot();
    data.playerData.me.gem = {};
    data.roomData.gems = { White: 4, Blue: 1, Green: 1, Red: 0, Black: 0, Gold: 5 };
    expect(gemSelectionValid(data, 'me', { White: 2 })).toBe(true);
    expect(gemSelectionValid(data, 'me', { Blue: 2 })).toBe(false);
    expect(gemSelectionValid(data, 'me', { White: 1, Blue: 1, Green: 1 })).toBe(true);
    expect(gemSelectionValid(data, 'me', { White: 2, Blue: 1 })).toBe(false);
  });

  it('calculates discounts, colored tokens, gold, free purchases, and shortages', () => {
    const data = snapshot();
    const player = data.playerData.me;
    player.normalCard = [{ ...card, id: 9, bonus: 'Red' }];
    player.gem = { Red: 0, Gold: 1 };
    expect(paymentPreview(player, { ...card, cost: { Red: 2 } })).toMatchObject({
      payment: { Gold: 1 },
      gold: 1,
      missing: 0,
      total: 1,
    });
    player.gem = {};
    expect(paymentPreview(player, { ...card, cost: { Red: 3 } }).missing).toBe(2);
    player.normalCard.push({ ...card, id: 10, bonus: 'Red' });
    player.normalCard.push({ ...card, id: 11, bonus: 'Red' });
    expect(paymentPreview(player, { ...card, cost: { Red: 3 } }).total).toBe(0);
  });

  it('cycles same-color picks and still permits correcting a full distinct selection', () => {
    const bank = { White: 4, Blue: 2, Green: 2, Red: 2, Black: 0 };
    let picked = toggleGemSelection(bank, {}, 'White');
    expect(picked).toEqual({ White: 1 });
    picked = toggleGemSelection(bank, picked, 'White');
    expect(picked).toEqual({ White: 2 });
    picked = toggleGemSelection(bank, picked, 'White');
    expect(picked).toEqual({});
    picked = { White: 1, Blue: 1, Green: 1 };
    expect(toggleGemSelection(bank, picked, 'Red')).toEqual(picked);
    expect(toggleGemSelection(bank, picked, 'Blue')).toEqual({ White: 1, Green: 1 });
  });

  it('builds combined wallets and requires exact legal returns', () => {
    const player = snapshot().playerData.me;
    player.gem = { Red: 9 };
    const afterTake = walletAfterTake(player, { Blue: 2 });
    expect(overflowCount(afterTake)).toBe(1);
    expect(returnSelectionValid(afterTake, { Red: 1 })).toBe(true);
    expect(returnSelectionValid(afterTake, {})).toBe(false);
    expect(returnSelectionValid(afterTake, { Blue: 3 })).toBe(false);

    player.gem = { Red: 10 };
    const afterReserve = walletAfterReserve(player, true);
    expect(afterReserve.Gold).toBe(1);
    expect(returnSelectionValid(afterReserve, { Gold: 1 })).toBe(true);
  });

  it('describes legacy and structured action payloads', () => {
    expect(lastActionCopy({
      action: 'get_gem', playerID: 'owner-1', payload: { Blue: 1, Red: 1 },
    })).toContain('蓝×1');
    expect(lastActionCopy({
      action: 'get_gem',
      playerID: 'owner-1',
      payload: { take: { White: 2 }, returns: { Gold: 1 } },
    })).toContain('退还 1 枚筹码');
    expect(lastActionCopy({
      action: 'preserve_card',
      playerID: 'owner-1',
      payload: { card: { id: 1 }, returns: { Red: 1 } },
    })).toContain('退还 1 枚筹码');
  });
});
