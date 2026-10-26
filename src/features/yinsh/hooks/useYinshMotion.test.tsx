import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameSnapshot } from '../model/session';
import { useYinshMotion } from './useYinshMotion';

let reduced = false;
const mediaListeners = new Set<() => void>();

function snapshot(seq: number): GameSnapshot {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'room',
    matchID: 'room-r1',
    seq,
    phaseVersion: seq,
    turnNumber: seq,
    ownerID: 'white-player',
    visibility: 'private',
    playerId: 'white-player',
    playerData: {
      'white-player': { side: 'white', ringsRemoved: 0 },
      'black-player': { side: 'black', ringsRemoved: 0 },
    },
    roomData: {
      rings: { E4: 'white', D3: 'black' },
      markers: { E5: 'black', E6: 'white' },
      currentPlayer: 'white-player',
      gameStatus: 'move',
      placedRings: { white: 5, black: 5 },
      markerPool: 49,
      legalMoves: {},
      candidateRows: [],
      activity: [],
      players: {},
      playerOrder: ['white-player', 'black-player'],
      roundNo: 1,
    },
  };
}

function movedSnapshot() {
  const value = snapshot(11);
  value.roomData.rings = { E7: 'white', D3: 'black' };
  value.roomData.markers = {
    E4: 'white',
    E5: 'white',
    E6: 'black',
  };
  value.roomData.lastAction = {
    action: 'move_ring',
    playerID: 'white-player',
    payload: {
      from: 'E4',
      to: 'E7',
      side: 'white',
      flips: ['E5', 'E6'],
    },
  };
  return value;
}

beforeEach(() => {
  vi.useFakeTimers();
  reduced = false;
  mediaListeners.clear();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_: string, listener: () => void) => {
        mediaListeners.add(listener);
      },
      removeEventListener: (_: string, listener: () => void) => {
        mediaListeners.delete(listener);
      },
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useYinshMotion', () => {
  it('plays the standard authoritative motion by default', () => {
    const hook = renderHook(
      ({ data }) => useYinshMotion(data),
      { initialProps: { data: snapshot(10) } },
    );

    hook.rerender({ data: movedSnapshot() });

    expect(hook.result.current.reduced).toBe(false);
    expect(hook.result.current.motion?.kind).toBe('move');
    expect(hook.result.current.busy).toBe(true);

    act(() => vi.runAllTimers());
    expect(hook.result.current.busy).toBe(false);
  });

  it('settles immediately when the system requests reduced motion', () => {
    reduced = true;
    const hook = renderHook(
      ({ data }) => useYinshMotion(data),
      { initialProps: { data: snapshot(10) } },
    );

    hook.rerender({ data: movedSnapshot() });

    expect(hook.result.current.reduced).toBe(true);
    expect(hook.result.current.motion).toBeUndefined();
    expect(hook.result.current.busy).toBe(false);
  });
});
