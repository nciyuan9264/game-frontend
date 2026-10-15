import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Rankings } from '.';
import type { LeaderboardEntry } from '@/types/leaderboard';

const api = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getLeaderboard: vi.fn(),
  getMyStats: vi.fn(),
  listMyGames: vi.fn(),
}));

vi.mock('@/api/room', () => ({ getProfile: api.getProfile }));
vi.mock('@/api/leaderboard', () => ({ getLeaderboard: api.getLeaderboard }));
vi.mock('@/api/history', () => ({
  getMyStats: api.getMyStats,
  listMyGames: api.listMyGames,
}));

function leaderboardEntry(index: number): LeaderboardEntry {
  return {
    userID: index,
    playerID: `玩家 ${index}-${index}`,
    totalGames: index,
    avgRank: 1 + index / 10,
  };
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('IntersectionObserver', class {
    private readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe() {
      this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }

    disconnect() {}
  });
  api.getProfile.mockResolvedValue({ id: 2, name: '玩家 2', email: '', avatar: '' });
  api.getLeaderboard.mockImplementation(({ offset }: { offset: number }) => Promise.resolve({
    gameType: 'acquire',
    entries: offset === 0
      ? Array.from({ length: 8 }, (_, index) => leaderboardEntry(index + 1))
      : [leaderboardEntry(9)],
  }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('Acquire community rankings', () => {
  it('loads the next ranking page automatically and hides rank explanation copy', async () => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Rankings />
    </MemoryRouter>);

    await screen.findByText('玩家 1');
    expect(screen.queryByText(/按平均名次/)).toBeNull();

    await waitFor(() => expect(api.getLeaderboard).toHaveBeenCalledTimes(2));
    expect(api.getLeaderboard).toHaveBeenNthCalledWith(1, { gameType: 'acquire', limit: 8, offset: 0 });
    expect(api.getLeaderboard).toHaveBeenNthCalledWith(2, { gameType: 'acquire', limit: 8, offset: 8 });
    expect(await screen.findByText('玩家 9')).toBeTruthy();
  });
});
