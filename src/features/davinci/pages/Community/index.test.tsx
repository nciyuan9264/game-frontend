import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Guide, Rankings } from '.';

const api = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getLeaderboard: vi.fn(),
}));

vi.mock('@/features/game-core/api/auth', () => ({
  getProfile: api.getProfile,
  logout: vi.fn(),
}));
vi.mock('@/features/game-core/api/history', () => ({
  getLeaderboard: api.getLeaderboard,
  getMyStats: vi.fn(),
  listMyGames: vi.fn(),
}));

beforeEach(() => {
  api.getProfile.mockResolvedValue({ id: '1', name: 'Alice', email: '', avatar: '' });
  api.getLeaderboard.mockResolvedValue({
    gameType: 'davinci',
    entries: [{ userID: 1, playerID: 'Alice-1', totalGames: 2, wins: 1, winRate: .5 }],
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DaVinci community', () => {
  it('reloads leaderboard data when the ranking mode changes', async () => {
    render(<MemoryRouter><Rankings /></MemoryRouter>);
    const gamesTab = await screen.findByRole('tab', { name: '场次榜' });
    fireEvent.click(gamesTab);

    await waitFor(() => expect(api.getLeaderboard).toHaveBeenCalledWith({
      gameType: 'davinci',
      limit: 20,
      offset: 0,
      sort: 'totalGames',
      signal: expect.any(AbortSignal),
    }));
  });

  it('switches guide content through shared tabs', async () => {
    render(<MemoryRouter><Guide /></MemoryRouter>);
    const tab = await screen.findByRole('tab', { name: '02 抽牌' });
    fireEvent.click(tab);

    expect(tab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('每一次抽牌，都会增加新的线索。')).toBeTruthy();
  });
});
