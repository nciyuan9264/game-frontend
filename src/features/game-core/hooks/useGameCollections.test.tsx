import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLeaderboard,
  listMyGames,
} from '../api/history';
import { useGameLeaderboard } from './useGameLeaderboard';
import { useGameHistory } from './useGameHistory';

vi.mock('../api/history', () => ({
  getLeaderboard: vi.fn(),
  listMyGames: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getLeaderboard).mockReset();
  vi.mocked(listMyGames).mockReset();
});
afterEach(cleanup);

describe('game collection hooks', () => {
  it('passes leaderboard sort and pagination parameters to the API', async () => {
    vi.mocked(getLeaderboard)
      .mockResolvedValueOnce({
        gameType: 'davinci',
        entries: [
          { userID: 1, playerID: '1', displayName: 'A-1', totalGames: 3, wins: 2, winRate: .67 },
          { userID: 2, playerID: '2', displayName: 'B-2', totalGames: 2, wins: 1, winRate: .5 },
        ],
      })
      .mockResolvedValueOnce({ gameType: 'davinci', entries: [] });
    const hook = renderHook(() => useGameLeaderboard({
      gameType: 'davinci',
      pageSize: 2,
      sort: 'totalGames',
    }));
    await act(async () => undefined);
    act(() => hook.result.current.loadMore());
    await act(async () => undefined);

    expect(getLeaderboard).toHaveBeenNthCalledWith(1, {
      gameType: 'davinci',
      limit: 2,
      offset: 0,
      sort: 'totalGames',
      signal: expect.any(AbortSignal),
    });
    expect(getLeaderboard).toHaveBeenNthCalledWith(2, {
      gameType: 'davinci',
      limit: 2,
      offset: 2,
      sort: 'totalGames',
      signal: expect.any(AbortSignal),
    });
  });

  it('uses game IDs for history deduplication and advances the raw offset', async () => {
    const game = {
      id: 1,
      roomID: 'room-1',
      gameType: 'splendor' as const,
      startedAt: '2026-01-01T00:00:00Z',
      durationSeconds: 60,
      maxPlayers: 4,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    vi.mocked(listMyGames)
      .mockResolvedValueOnce({ games: [game, { ...game, id: 2 }] })
      .mockResolvedValueOnce({ games: [{ ...game, id: 2 }, { ...game, id: 3 }] });
    const hook = renderHook(() => useGameHistory({
      gameType: 'splendor',
      pageSize: 2,
    }));
    await act(async () => undefined);
    act(() => hook.result.current.loadMore());
    await act(async () => undefined);

    expect(hook.result.current.games.map(item => item.id)).toEqual([1, 2, 3]);
    expect(listMyGames).toHaveBeenNthCalledWith(2, {
      gameType: 'splendor',
      limit: 2,
      offset: 2,
      signal: expect.any(AbortSignal),
    });
  });
});
