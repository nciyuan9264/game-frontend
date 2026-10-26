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
  api.getMyStats.mockResolvedValue({ totalGames: 2, wins: 1, winRate: .5, avgScore: 12 });
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

  it('opens the aligned project contact from the profile footer', async () => {
    render(<MemoryRouter><My /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /关于与联系/ }));

    expect(screen.getByRole('dialog', { name: '关于 Splendor Online' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /查看项目源码/ })).toBeTruthy();
  });
});
