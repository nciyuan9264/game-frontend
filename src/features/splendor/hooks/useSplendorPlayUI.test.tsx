import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GameSnapshot } from '../model/session';
import { useSplendorPlayUI } from './useSplendorPlayUI';

function snapshot(phaseVersion = 1): GameSnapshot {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'room',
    matchID: 'match',
    seq: phaseVersion,
    ownerID: 'me',
    visibility: 'public',
    phaseVersion,
    turnNumber: phaseVersion,
    playerId: 'me',
    playerData: {
      me: { normalCard: [], nobleCard: [], reserveCard: [], gem: {}, score: 0 },
    },
    result: null,
    roomData: {
      card: {},
      gems: { White: 4, Blue: 4, Green: 4, Red: 4, Black: 4, Gold: 5 },
      nobles: [],
      currentPlayer: 'me',
      gameStatus: 'playing',
      lastData: {
        action: 'get_gem',
        playerID: 'me',
        payload: { take: { White: 1 } },
      },
      players: {},
      playerOrder: ['me'],
      phaseVersion,
      turnNumber: phaseVersion,
    },
  };
}

describe('useSplendorPlayUI', () => {
  it('clears stale action state when the phase advances', () => {
    const { result, rerender } = renderHook(({ data }) => useSplendorPlayUI(data), {
      initialProps: { data: snapshot(1) },
    });
    act(() => {
      result.current.openCard(9);
      result.current.toggleGem('White');
      result.current.prepareReturn({ kind: 'take', take: { White: 1 } });
      result.current.setReturns({ White: 1 });
    });
    rerender({ data: snapshot(2) });
    expect(result.current.panel).toBeUndefined();
    expect(result.current.selectedCardID).toBeUndefined();
    expect(result.current.selectedGems).toEqual({});
    expect(result.current.pendingAction).toBeUndefined();
    expect(result.current.returns).toEqual({});
  });

  it('deduplicates activity per authoritative phase', () => {
    const { result, rerender } = renderHook(({ data }) => useSplendorPlayUI(data), {
      initialProps: { data: snapshot(1) },
    });
    expect(result.current.activities).toHaveLength(1);
    rerender({ data: snapshot(1) });
    expect(result.current.activities).toHaveLength(1);
    rerender({ data: snapshot(2) });
    expect(result.current.activities).toHaveLength(2);
  });

  it('does not let a stale action key close a newer panel', () => {
    const { result } = renderHook(() => useSplendorPlayUI(snapshot()));
    let staleKey = 0;
    act(() => {
      staleKey = result.current.openPanel('rules');
      result.current.openPanel('activity');
    });
    act(() => result.current.closePanel(staleKey));
    expect(result.current.panel?.type).toBe('activity');
  });
});
