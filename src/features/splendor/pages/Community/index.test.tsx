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
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  api.getProfile.mockResolvedValue({ id: '1', name: 'Alice', email: '', avatar: '' });
  api.getLeaderboard.mockResolvedValue({
    gameType: 'splendor',
    entries: [{ userID: 1, playerID: '1', displayName: 'Alice-1', totalGames: 2, avgRank: 1.5 }],
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('Splendor community', () => {
  it('reloads leaderboard data when the ranking mode changes', async () => {
    render(<MemoryRouter><Rankings /></MemoryRouter>);
    await screen.findAllByText('Alice');
    fireEvent.click(screen.getByRole('tab', { name: '场次榜' }));

    await waitFor(() => expect(api.getLeaderboard).toHaveBeenCalledWith({
      gameType: 'splendor',
      limit: 50,
      offset: 0,
      sort: 'totalGames',
      signal: expect.any(AbortSignal),
    }));
  });

  it('keeps previous and next guide actions synchronized with tabs', async () => {
    render(<MemoryRouter><Guide /></MemoryRouter>);
    const secondTab = await screen.findByRole('tab', { name: '02 购买发展卡' });
    fireEvent.click(secondTab);
    expect(secondTab.getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /上一步/ }));
    expect(screen.getByRole('tab', { name: '01 拿取宝石' }).getAttribute('aria-selected')).toBe('true');
  });
});
