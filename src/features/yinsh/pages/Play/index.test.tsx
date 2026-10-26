import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { YinshSession } from '../../hooks/useYinshSession';
import type { GameSnapshot } from '../../model/session';
import { Play } from '.';

vi.mock('../../components/Dialog', () => ({
  Dialog: ({
    title,
    children,
    footer,
  }: {
    title: string;
    children: ReactNode;
    footer?: ReactNode;
  }) => <section role="dialog" aria-label={title}>
    <h2>{title}</h2>{children}{footer}
  </section>,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

function snapshot(
  currentPlayer = 'me',
  status: 'move' | 'end' = 'move',
  ownerID = 'me',
): GameSnapshot {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'yinsh-room',
    matchID: 'yinsh-room-r1',
    seq: 11,
    phaseVersion: 11,
    turnNumber: 11,
    ownerID,
    visibility: 'private',
    playerId: 'me',
    playerData: {
      me: { side: 'white', ringsRemoved: 1 },
      ai_2: { side: 'black', ringsRemoved: 1 },
    },
    result: status === 'end'
      ? {
        winnerID: 'me',
        reason: '率先取走第三枚圆环',
        ringsRemoved: { white: 3, black: 1 },
      }
      : undefined,
    roomData: {
      rings: {
        E4: 'white', C5: 'white', G3: 'white', I8: 'white',
        D3: 'black', F9: 'black', H9: 'black', I6: 'black',
      },
      markers: { E5: 'black', E6: 'white' },
      currentPlayer,
      gameStatus: status,
      placedRings: { white: 5, black: 5 },
      markerPool: 49,
      legalMoves: status === 'move' && currentPlayer === 'me'
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

  it('submits an exact-coordinate destination without confirmation', () => {
    const submit = vi.fn(() => true);
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit,
    } as unknown as YinshSession;
    render(<Play session={session} data={snapshot()} onLeave={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '选择白环 E4' }));
    fireEvent.click(screen.getAllByRole('button', {
      name: '按坐标选择落点',
    })[0]);
    fireEvent.click(screen.getByRole('button', {
      name: '预选落点 E7',
    }));

    expect(submit).toHaveBeenCalledWith('game_move_ring', {
      from: 'E4',
      to: 'E7',
    });
    expect(screen.queryByRole('button', { name: '确认落子' })).toBeNull();
  });

  it('returns from the final board through the former timer slot', () => {
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit: vi.fn(() => true),
    } as unknown as YinshSession;
    render(<Play session={session} data={snapshot('me', 'end')}
      onLeave={vi.fn()} onStartNextMatch={vi.fn(async () => true)} />);

    expect(screen.getByRole('button', { name: '回到棋盘' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /再来一局/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /返回大厅/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '回到棋盘' }));
    expect(screen.getByRole('button', {
      name: '返回终局结算',
    })).toBeTruthy();
    expect(screen.queryByTestId('yinsh-mobile-dock')).toBeNull();

    fireEvent.click(screen.getByRole('button', {
      name: '返回终局结算',
    }));
    expect(screen.getByRole('button', { name: '回到棋盘' })).toBeTruthy();
  });

  it('keeps the rematch action disabled for non-owners', () => {
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit: vi.fn(() => true),
    } as unknown as YinshSession;
    render(<Play session={session}
      data={snapshot('me', 'end', 'ai_2')} onLeave={vi.fn()} />);

    const rematch = screen.getByRole('button', {
      name: '等待房主再来一局',
    }) as HTMLButtonElement;
    expect(rematch.disabled).toBe(true);
  });
});
