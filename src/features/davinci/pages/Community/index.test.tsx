import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Guide, My, Rankings } from '.';

const api = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getLeaderboard: vi.fn(),
  getMyStats: vi.fn(),
  listMyGames: vi.fn(),
}));

vi.mock('@/features/game-core/api/auth', () => ({
  getProfile: api.getProfile,
  logout: vi.fn(),
}));
vi.mock('@/features/game-core/api/history', () => ({
  getLeaderboard: api.getLeaderboard,
  getMyStats: api.getMyStats,
  listMyGames: api.listMyGames,
}));

beforeEach(() => {
  api.getProfile.mockResolvedValue({ id: '1', name: 'Alice', email: '', avatar: '' });
  api.getLeaderboard.mockResolvedValue({
    gameType: 'davinci',
    entries: [{ userID: 1, playerID: '1', displayName: 'Alice-1', totalGames: 2, wins: 1, winRate: .5 }],
  });
  api.getMyStats.mockResolvedValue({ totalGames: 2, wins: 1, winRate: .5, avgScore: 1 });
  api.listMyGames.mockResolvedValue({ games: [] });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() { this.setAttribute('open', ''); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() { this.removeAttribute('open'); },
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

  it('opens the aligned project contact from the profile footer', async () => {
    render(<MemoryRouter><My /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /关于与联系/ }));

    expect(screen.getByRole('dialog', { name: '关于 DaVinci Code Online' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /查看项目源码/ })).toBeTruthy();
  });
});
