import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { My } from '.';

const api = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getMyStats: vi.fn(),
  listMyGames: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/features/game-core/api/auth', () => ({
  getProfile: api.getProfile,
  logout: api.logout,
}));
vi.mock('@/features/game-core/api/history', () => ({
  getMyStats: api.getMyStats,
  listMyGames: api.listMyGames,
  getLeaderboard: vi.fn(),
}));

beforeEach(() => {
  api.getProfile.mockResolvedValue({
    id: 'player-1',
    name: '黑白棋手',
    email: 'player@example.com',
    avatar: '',
  });
  api.getMyStats.mockResolvedValue({
    totalGames: 8,
    wins: 5,
    winRate: .625,
    avgScore: 34,
  });
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

describe('Othello profile', () => {
  it('shows Acquire-aligned identity actions and project contact', async () => {
    render(<MemoryRouter><My /></MemoryRouter>);

    expect(await screen.findByText('PLAYER ID · player-1')).toBeTruthy();
    expect(screen.getByText('player@example.com')).toBeTruthy();
    expect(screen.getByRole('link', { name: /编辑资料/ }).getAttribute('href'))
      .toBe('https://auth.gamebus.online/profile');

    fireEvent.click(screen.getByRole('button', { name: /关于与联系/ }));
    expect(screen.getByRole('dialog', { name: '关于 Othello Online' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /查看项目源码/ })).toBeTruthy();
  });
});
