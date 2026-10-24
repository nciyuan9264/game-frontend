import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DavinciSession } from '../../hooks/useDavinciSession';
import type { GameSnapshot } from '../../model/session';
import { Play } from '.';

vi.mock('../../components/GameCanvas', async () => {
  const { forwardRef } = await import('react');
  return {
    GameCanvas: forwardRef(() => <div data-testid="game-canvas" />),
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function snapshot(currentPlayer: string): GameSnapshot {
  return {
    type: 'ROOM_SYNC',
    roomID: 'room',
    matchID: 'match',
    seq: 1,
    phaseVersion: 1,
    turnNumber: 1,
    ownerID: 'me',
    playerId: 'me',
    cardData: { self: [], opponents: [] },
    roomData: {
      boardCards: {},
      currentPlayer,
      gameStatus: 'getCard',
      players: {
        me: { playerID: 'me', name: 'Me', online: true, ai: false, ready: true },
        guest: { playerID: 'guest', name: 'Guest', online: true, ai: false, ready: true },
      },
      turnDeadline: '2026-10-25T10:00:30Z',
    },
  } as unknown as GameSnapshot;
}

describe('DaVinci turn countdown', () => {
  it('shows the countdown only during the local player turn', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T10:00:00Z'));
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit: vi.fn(),
    } as unknown as DavinciSession;

    const { rerender } = render(<Play session={session} data={snapshot('me')} onLeave={vi.fn()} />);
    expect(screen.getByText('30s')).toBeTruthy();

    rerender(<Play session={session} data={snapshot('guest')} onLeave={vi.fn()} />);
    expect(screen.queryByText('30s')).toBeNull();
    expect(screen.getByText('--')).toBeTruthy();
  });
});
