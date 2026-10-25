import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { YinshSession } from '../../hooks/useYinshSession';
import type { GameSnapshot } from '../../model/session';
import { Play } from '.';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

function snapshot(currentPlayer = 'me'): GameSnapshot {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'yinsh-room',
    matchID: 'yinsh-room-r1',
    seq: 11,
    phaseVersion: 11,
    turnNumber: 11,
    ownerID: 'me',
    visibility: 'private',
    playerId: 'me',
    playerData: {
      me: { side: 'white', ringsRemoved: 1 },
      ai_2: { side: 'black', ringsRemoved: 1 },
    },
    roomData: {
      rings: {
        E4: 'white', C5: 'white', G3: 'white', I8: 'white',
        D3: 'black', F9: 'black', H9: 'black', I6: 'black',
      },
      markers: { E5: 'black', E6: 'white' },
      currentPlayer,
      gameStatus: 'move',
      placedRings: { white: 5, black: 5 },
      markerPool: 49,
      legalMoves: currentPlayer === 'me'
        ? { E4: [{ to: 'E7', flips: ['E5', 'E6'] }] }
        : {},
      candidateRows: [],
      activity: [],
      turnDeadline: '2026-10-25T10:01:00Z',
      turnTimeoutMs: 60_000,
      players: {
        me: { playerID: 'me', displayName: 'Alice', online: true, ai: false, ready: true, seatIndex: 0 },
        ai_2: { playerID: 'ai_2', displayName: '墨白', online: true, ai: true, ready: true, seatIndex: 1 },
      },
      playerOrder: ['me', 'ai_2'],
      roundNo: 1,
    },
  };
}

describe('YINSH play', () => {
  it('submits a service-provided legal move and only shows own countdown', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T10:00:30Z'));
    const submit = vi.fn(() => true);
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit,
    } as unknown as YinshSession;
    const { rerender } = render(<Play session={session} data={snapshot()} onLeave={vi.fn()} />);
    expect(screen.getByText('30s')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '选择白环 E4' }));
    fireEvent.click(screen.getByRole('button', { name: '移动到 E7' }));
    expect(submit).toHaveBeenCalledWith('game_move_ring', { from: 'E4', to: 'E7' });

    rerender(<Play session={session} data={snapshot('ai_2')} onLeave={vi.fn()} />);
    expect(screen.queryByText('30s')).toBeNull();
    expect(screen.getByText('--')).toBeTruthy();
  });
});
