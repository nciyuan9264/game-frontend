import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OthelloSession } from '../../hooks/useOthelloSession';
import type { GameSnapshot } from '../../model/session';
import type { Disc } from '../../model/types';
import { Play } from '.';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

function opening(): Disc[] {
  const board: Disc[] = Array.from({ length: 64 }, () => '');
  board[27] = 'white';
  board[28] = 'black';
  board[35] = 'black';
  board[36] = 'white';
  return board;
}

function snapshot(
  currentPlayer = 'me',
  status: 'playing' | 'pass' | 'end' = 'playing',
  ownerID = 'me',
): GameSnapshot {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'othello-room',
    matchID: 'othello-room-r1',
    seq: 11,
    phaseVersion: 11,
    turnNumber: 11,
    ownerID,
    visibility: 'private',
    playerId: 'me',
    playerData: {
      me: { side: 'black', discCount: 2 },
      ai_2: { side: 'white', discCount: 2 },
    },
    result: status === 'end' ? {
      winnerID: 'me',
      draw: false,
      reason: '双方均无合法落点',
      blackCount: 36,
      whiteCount: 28,
    } : undefined,
    roomData: {
      board: opening(),
      currentPlayer,
      currentSide: currentPlayer === 'me' ? 'black' : 'white',
      blackPlayerID: 'me',
      whitePlayerID: 'ai_2',
      gameStatus: status,
      legalMoves: status === 'playing'
        ? [{ index: 19, flips: [27], lines: [[27]] }]
        : [],
      moveLog: [],
      turnDeadline: '2026-10-25T10:01:00Z',
      turnTimeoutMs: 60_000,
      players: {
        me: {
          playerID: 'me',
          displayName: 'Alice',
          online: true,
          ai: false,
          ready: true,
          seatIndex: 0,
        },
        ai_2: {
          playerID: 'ai_2',
          displayName: '墨白',
          online: true,
          ai: true,
          ready: true,
          seatIndex: 1,
        },
      },
      playerOrder: ['me', 'ai_2'],
      roundNo: 1,
    },
  };
}

describe('OTHELLO play', () => {
  it('submits a service-provided legal move and keeps the active countdown visible', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T10:00:30Z'));
    const submit = vi.fn(() => true);
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit,
    } as unknown as OthelloSession;
    const { rerender } = render(<Play session={session} data={snapshot()} onLeave={vi.fn()} />);
    expect(screen.getByText('30s')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {
      name: 'D3，可落子，翻转 1 枚',
    }));
    expect(submit).toHaveBeenCalledWith('game_place_disc', { index: 19 });

    rerender(<Play session={session} data={snapshot('ai_2')} onLeave={vi.fn()} />);
    expect(screen.getByText('30s')).toBeTruthy();
  });

  it('submits an explicit pass only in the server pass phase', () => {
    const submit = vi.fn(() => true);
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit,
    } as unknown as OthelloSession;
    render(<Play session={session} data={snapshot('me', 'pass')} onLeave={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: /跳过本回合/ })[0]);
    expect(submit).toHaveBeenCalledWith('game_pass');
  });

  it('returns from the final board to results through the former timer slot', () => {
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit: vi.fn(() => true),
    } as unknown as OthelloSession;
    render(<Play session={session} data={snapshot('me', 'end')}
      onLeave={vi.fn()} onStartNextMatch={vi.fn(async () => true)} />);

    expect(screen.getByRole('button', { name: '回到棋盘' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /再来一局/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /返回大厅/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '回到棋盘' }));
    expect(screen.getByRole('button', { name: '返回终局结算' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '返回终局结算' }));
    expect(screen.getByRole('button', { name: '回到棋盘' })).toBeTruthy();
  });

  it('keeps the rematch action visible but disabled for non-owners', () => {
    const session = {
      pending: undefined,
      connection: { status: 'connected' },
      submit: vi.fn(() => true),
    } as unknown as OthelloSession;
    render(<Play session={session}
      data={snapshot('me', 'end', 'ai_2')} onLeave={vi.fn()} />);

    const rematch = screen.getByRole('button', {
      name: '等待房主再来一局',
    }) as HTMLButtonElement;
    expect(rematch.disabled).toBe(true);
  });
});
