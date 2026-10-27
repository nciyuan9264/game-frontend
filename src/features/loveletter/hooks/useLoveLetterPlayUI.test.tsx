import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LoveLetterSession } from './useLoveLetterSession';
import { useLoveLetterPlayUI } from './useLoveLetterPlayUI';
import type { GameSnapshot } from '../model/session';

const snapshot = (seq: number): GameSnapshot => ({
  schemaVersion: 2,
  type: 'ROOM_SYNC',
  roomID: 'r1',
  matchID: 'm1',
  seq,
  phaseVersion: seq,
  turnNumber: seq,
  playerId: 'p1',
  ownerID: 'p1',
  visibility: 'private',
  playerData: {
    p1: { favors: 0, alive: true, protected: false, spyUsed: false, handCount: 2, discards: [] },
    p2: { favors: 0, alive: true, protected: false, spyUsed: false, handCount: 1, discards: [] },
  },
  privateData: {
    hand: [{ cardID: 'guard', rank: 1 }, { cardID: 'princess', rank: 9 }],
    legalCardIDs: ['guard', 'princess'],
    legalTargets: { guard: ['p2'], princess: [] },
    guardGuessRanks: [0, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  roomData: {
    currentPlayer: 'p1',
    gameStatus: 'play',
    roundNo: 1,
    goal: 6,
    deckCount: 10,
    reserveCount: 1,
    burnCards: [],
    activityLog: [],
    players: {
      p1: { playerID: 'p1', displayName: 'Alice', name: 'Alice', seatIndex: 0, online: true, ai: false, ready: true },
      p2: { playerID: 'p2', displayName: 'Bob', name: 'Bob', seatIndex: 1, online: true, ai: false, ready: true },
    },
    playerOrder: ['p1', 'p2'],
  },
});

describe('useLoveLetterPlayUI', () => {
  it('keeps a complete draft and clears it on an authoritative phase change', () => {
    const session = { submit: vi.fn(() => true) } as unknown as LoveLetterSession;
    const { result, rerender } = renderHook(
      ({ data }) => useLoveLetterPlayUI(session, data),
      { initialProps: { data: snapshot(1) } },
    );
    act(() => {
      result.current.chooseCard(snapshot(1).privateData.hand[0], true);
      result.current.setTargetPlayerID('p2');
      result.current.setGuessRank(9);
    });
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.panel).toBe('action');

    rerender({ data: snapshot(2) });
    expect(result.current.selectedCard).toBeUndefined();
    expect(result.current.targetPlayerID).toBe('');
    expect(result.current.guessRank).toBeUndefined();
    expect(result.current.panel).toBeUndefined();
  });

  it('submits one atomic play payload from the current draft', () => {
    const submit = vi.fn(() => true);
    const session = { submit } as unknown as LoveLetterSession;
    const data = snapshot(1);
    const { result } = renderHook(() => useLoveLetterPlayUI(session, data));
    act(() => {
      result.current.chooseCard(data.privateData.hand[0], false);
      result.current.setTargetPlayerID('p2');
      result.current.setGuessRank(8);
    });
    act(() => {
      expect(result.current.submitCard()).toBe(true);
    });
    expect(submit).toHaveBeenCalledWith('game_play_card', {
      cardID: 'guard',
      targetPlayerID: 'p2',
      guessRank: 8,
    });
    expect(result.current.selectedCard).toBeUndefined();
  });
});
