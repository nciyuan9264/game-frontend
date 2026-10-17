import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Guide, My, Rankings } from '.';
import type { LeaderboardEntry, LeaderboardSortDim } from '@/types/leaderboard';

const api = vi.hoisted(() => ({
  getProfile: vi.fn(),
  logout: vi.fn(),
  getLeaderboard: vi.fn(),
  getMyStats: vi.fn(),
  listMyGames: vi.fn(),
}));

vi.mock('@/api/room', () => ({ getProfile: api.getProfile, logout: api.logout }));
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
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() { this.setAttribute('open', ''); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() { this.removeAttribute('open'); },
  });
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
  api.logout.mockReturnValue(new Promise(() => {}));
  api.getMyStats.mockResolvedValue({ totalGames: 3, wins: 1, avgScore: 7200 });
  api.listMyGames.mockResolvedValue({ games: [] });
  api.getLeaderboard.mockImplementation(({ offset }: { offset: number; sort?: LeaderboardSortDim }) => Promise.resolve({
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

describe('Acquire profile', () => {
  it('opens the project contact panel from the bottom entry', async () => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <My />
    </MemoryRouter>);

    fireEvent.click(await screen.findByRole('button', { name: /关于与联系/ }));

    const dialog = screen.getByRole('dialog', { name: '关于 Acquire Online' });
    fireEvent.click(screen.getByRole('button', { name: /QQ 联系作者/ }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('1522457543'));
    expect(screen.getByRole('button', { name: /QQ 已复制/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /查看项目源码/ }).getAttribute('href')).toBe('https://github.com/nciyuan9264/game-frontend');

    fireEvent.click(screen.getByText(/本项目是非官方在线实现/), { button: 0, clientX: 100, clientY: 100, detail: 1 });
    await waitFor(() => expect(dialog.querySelectorAll('i')).toHaveLength(7));

    fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    expect(screen.queryByRole('dialog', { name: '关于 Acquire Online' })).toBeNull();
  });

  it('calls logout from the profile page after confirmation', async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal('confirm', confirm);

    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <My />
    </MemoryRouter>);

    const logoutButton = await screen.findByRole('button', { name: /退出登录/ });
    fireEvent.click(logoutButton);

    expect(confirm).toHaveBeenCalledWith('确定要退出登录吗？');
    expect(api.logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(logoutButton.getAttribute('aria-busy')).toBe('true'));
  });

  it('keeps the session when profile logout is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));

    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <My />
    </MemoryRouter>);

    fireEvent.click(await screen.findByRole('button', { name: /退出登录/ }));

    expect(api.logout).not.toHaveBeenCalled();
  });
});

describe('Acquire community rankings', () => {
  it('loads the next ranking page automatically and hides rank explanation copy', async () => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Rankings />
    </MemoryRouter>);

    await screen.findByText('玩家 1');
    expect(screen.queryByText(/按平均名次/)).toBeNull();

    await waitFor(() => expect(api.getLeaderboard).toHaveBeenCalledTimes(2));
    expect(api.getLeaderboard).toHaveBeenNthCalledWith(1, { gameType: 'acquire', limit: 8, offset: 0, sort: 'metric' });
    expect(api.getLeaderboard).toHaveBeenNthCalledWith(2, { gameType: 'acquire', limit: 8, offset: 8, sort: 'metric' });
    expect(await screen.findByText('玩家 9')).toBeTruthy();
  });

  it('reloads from the first page with total games sort when switching ranking mode', async () => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Rankings />
    </MemoryRouter>);

    await screen.findByText('玩家 1');
    fireEvent.click(screen.getByRole('button', { name: '场次榜' }));

    await waitFor(() => expect(api.getLeaderboard).toHaveBeenCalledWith({
      gameType: 'acquire',
      limit: 8,
      offset: 0,
      sort: 'totalGames',
    }));
  });
});

describe('Acquire guide', () => {
  it('uses the primary action to advance guide tabs before creating a room', async () => {
    render(<MemoryRouter initialEntries={['/game/acquire/guide']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/game/acquire/guide" element={<Guide />} />
        <Route path="/game/acquire" element={<p>游戏大厅</p>} />
      </Routes>
    </MemoryRouter>);

    await screen.findByRole('tab', { name: '01 开始' });
    expect(screen.getByRole('tab', { name: '01 开始' }).getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }));
    expect(screen.getByRole('tab', { name: '02 建造' }).getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }));
    expect(screen.getByRole('tab', { name: '03 并购' }).getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }));
    expect(screen.getByRole('tab', { name: '04 结束' }).getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /创建房间/ }));
    expect(screen.getByText('游戏大厅')).toBeTruthy();
  });
});
