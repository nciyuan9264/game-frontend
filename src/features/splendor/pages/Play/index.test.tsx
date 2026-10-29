import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SplendorSession } from '../../hooks/useSplendorSession';
import type { GameSnapshot } from '../../model/session';
import { Play } from '.';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function snapshot(currentPlayer: string): GameSnapshot {
  const playerState = {
    normalCard: [],
    nobleCard: [],
    reserveCard: [],
    gem: {},
    score: 0,
  };
  return {
    type: 'ROOM_SYNC',
    roomID: 'room',
    matchID: 'match',
    seq: 1,
    phaseVersion: 1,
    turnNumber: 1,
    ownerID: 'me',
    visibility: 'public',
    playerId: 'me',
    playerData: { me: playerState, guest: playerState },
    roomData: {
      card: {},
      gems: { White: 4, Blue: 4, Green: 4, Red: 4, Black: 4, Gold: 5 },
      nobles: [],
      currentPlayer,
      gameStatus: 'playing',
      players: {
        me: { playerID: 'me', name: 'Me', online: true, ai: false, ready: true },
        guest: { playerID: 'guest', name: 'Guest', online: true, ai: false, ready: true },
      },
      playerOrder: ['me', 'guest'],
      turnDeadline: '2026-10-25T10:00:30Z',
    },
  } as unknown as GameSnapshot;
}

describe('Splendor turn countdown', () => {
  it('shows the countdown only during the local player turn', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T10:00:00Z'));
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit: vi.fn(),
    } as unknown as SplendorSession;

    const { rerender } = render(<Play session={session} data={snapshot('me')} onLeave={vi.fn()} />);
    expect(screen.getAllByText('30s')).toHaveLength(2);
    expect(screen.getAllByRole('group', { name: '宝石银行与我的资源对照' })).toHaveLength(2);

    rerender(<Play session={session} data={snapshot('guest')} onLeave={vi.fn()} />);
    expect(screen.queryByText('30s')).toBeNull();
    expect(screen.getAllByText('--').length).toBeGreaterThan(0);
  });
});
