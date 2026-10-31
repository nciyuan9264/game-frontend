import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { playGameSound } from '@/components/GameUI/GameAudio';
import type { DavinciSession } from '../../hooks/useDavinciSession';
import type { GameSnapshot } from '../../model/session';
import { Play } from '.';

vi.mock('@/components/GameUI/GameAudio', () => ({
  playGameSound: vi.fn(),
}));

vi.mock('@/components/GameUI/ResponsiveDialog', () => ({
  ResponsiveDialog: ({ title, children }: { title: string; children: ReactNode }) =>
    <div role="dialog" aria-label={title}>{children}</div>,
}));

vi.mock('../../components/GameCanvas', async () => {
  const { forwardRef } = await import('react');
  return {
    GameCanvas: forwardRef(({
      onTileClick,
    }: {
      onTileClick: (tileID: string) => void;
    }, _ref) => <div data-testid="game-canvas">
      <button type="button" onClick={() => onTileClick('opponent-card')}>opponent card</button>
      <button type="button" onClick={() => onTileClick('empty-position')}>empty position</button>
    </div>),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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

function initializationSnapshot(ready = false): GameSnapshot {
  return {
    ...snapshot(''),
    cardData: {
      self: [{ id: 'two', color: 0, num: 2, index: 0 }],
      opponents: [{ id: 'hidden', color: 1, index: 0 }],
      initialHandReady: ready,
    },
    roomData: {
      ...snapshot('').roomData,
      currentPlayer: '',
      gameStatus: 'initialize',
      turnDeadline: '2026-10-25T10:00:15Z',
    },
  } as GameSnapshot;
}

function guessSnapshot(): GameSnapshot {
  return {
    ...snapshot('me'),
    cardData: {
      self: [],
      opponents: [{ id: 'opponent-card', color: 1, index: 0, isRevealed: false }],
    },
    roomData: {
      ...snapshot('me').roomData,
      gameStatus: 'guessCard',
    },
  } as GameSnapshot;
}

function endedSnapshot(): GameSnapshot {
  return {
    ...snapshot('me'),
    roomData: {
      ...snapshot('me').roomData,
      gameStatus: 'end',
    },
  } as GameSnapshot;
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

    const { container, rerender } = render(
      <Play session={session} data={snapshot('me')} onLeave={vi.fn()} />
    );
    expect(screen.getAllByText('30s')).toHaveLength(2);

    rerender(<Play session={session} data={snapshot('guest')} onLeave={vi.fn()} />);
    expect(screen.queryByText('30s')).toBeNull();
    expect(container.querySelector('[data-game-mobile-topbar-status]')).toBeNull();
    expect(screen.getAllByText('--').length).toBeGreaterThan(0);
  });

  it('shows the shared initialization timer and requires a no-Joker confirmation', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T10:00:00Z'));
    const submit = vi.fn(() => true);
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit,
    } as unknown as DavinciSession;

    const { rerender } = render(<Play session={session} data={initializationSnapshot()} onLeave={vi.fn()} />);
    expect(screen.getAllByText('15s')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /确认牌序/ }));
    expect(submit).toHaveBeenCalledWith('game_initialize_hand', { jokerPlacements: [] });

    rerender(<Play session={session} data={initializationSnapshot(true)} onLeave={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /确认牌序/ })).toBeNull();
    expect(document.querySelector('[data-game-mobile-topbar-status]')).toBeNull();
    expect(screen.getAllByText('牌序已确认，等待对手').length).toBeGreaterThan(0);
  });

  it('hides the mobile status after returning to the final board', () => {
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit: vi.fn(),
    } as unknown as DavinciSession;

    const { container } = render(<Play session={session} data={endedSnapshot()} onLeave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '查看终局牌面' }));

    expect(container.querySelector('[data-game-mobile-topbar-status]')).toBeNull();
  });
});

describe('DaVinci opponent card selection', () => {
  it('plays the selection sound only for a valid opponent card', () => {
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit: vi.fn(),
    } as unknown as DavinciSession;

    render(<Play session={session} data={guessSnapshot()} onLeave={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'empty position' }));
    expect(playGameSound).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'opponent card' }));
    expect(playGameSound).toHaveBeenCalledOnce();
    expect(playGameSound).toHaveBeenCalledWith('game-select');
    expect(screen.getByRole('dialog', { name: '猜测这张密码牌' })).not.toBeNull();
  });
});
