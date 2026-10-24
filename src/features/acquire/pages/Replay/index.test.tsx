import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  GameDetailData,
  Snapshot,
} from '@/features/game-core/model/history';
import { companyKeys } from '../../model/types';
import Replay from '.';

const api = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getGameDetail: vi.fn(),
  getSnapshotPage: vi.fn(),
}));

vi.mock('@/features/game-core/api/auth', () => ({ getProfile: api.getProfile }));
vi.mock('@/features/game-core/api/history', () => ({
  getGameDetail: api.getGameDetail,
  getSnapshotPage: api.getSnapshotPage,
}));

function replaySnapshot(seq: number): Snapshot {
  return {
    seq,
    totalEvents: 1,
    currentEvent: seq >= 0 ? { seq, playerID: 'me', cmdType: 'game_place_tile', payload: {} } : undefined,
    roomData: {
      companyInfo: Object.fromEntries(companyKeys.map(company => [company, {
        name: company,
        tiles: company === 'Tower' ? 3 : 0,
        stockPrice: 200,
        stockTotal: 25,
      }])),
      currentPlayer: 'me',
      gameStatus: 'setTile',
      tiles: { '1A': { id: '1A', belong: seq >= 0 ? 'Blank' : '' } },
      players: { me: { playerID: 'me', online: true, ai: false } },
    },
    playersData: {
      me: {
        money: 6000,
        stocks: Object.fromEntries(companyKeys.map(company => [company, company === 'Tower' ? 2 : 0])),
        tiles: ['2B'],
      },
    },
    result: { me: { money: 6000, stocks: Math.max(0, seq) * 200, total: 6000 + Math.max(0, seq) * 200 } },
  };
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  api.getProfile.mockResolvedValue({ id: '7', name: 'Player', email: '', avatar: '' });
  api.getGameDetail.mockResolvedValue({
    game: { id: 1, roomID: 'replay-room', gameType: 'acquire', startedAt: '', durationSeconds: 0, maxPlayers: 6, createdAt: '', updatedAt: '' },
    players: [{ id: 1, gameID: 1, userID: 7, playerID: 'me', displayName: 'Player', seatIndex: 0, isAI: false, finalStocks: 0, isWinner: true, createdAt: '' }],
    events: [],
  } as GameDetailData);
  api.getSnapshotPage.mockResolvedValue({
    snapshots: [replaySnapshot(-1), replaySnapshot(0)],
    totalEvents: 1,
    totalSnapshots: 2,
    offset: 0,
    limit: 20,
    nextOffset: 2,
    hasMore: false,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('Acquire replay layout', () => {
  it('keeps market, board, and portfolio in distinct desktop columns', async () => {
    render(<MemoryRouter initialEntries={['/game/acquire/replay/1']}><Routes>
      <Route path="/game/acquire/replay/:gameId" element={<Replay />} />
    </Routes></MemoryRouter>);

    const board = await screen.findByRole('group', { name: '12 列 9 行，共 108 块地' });
    const layout = board.closest('section')?.parentElement;

    expect(layout?.children).toHaveLength(3);
    expect(layout?.children[0].textContent).toContain('公司行情');
    expect(layout?.children[2].textContent).toContain('我的持股');
    expect(screen.getByRole('table', { name: '公司行情与我的持股' })).toBeTruthy();
  });

  it('moves the dock with accessible keyboard controls', async () => {
    render(<MemoryRouter initialEntries={['/game/acquire/replay/1']}><Routes>
      <Route path="/game/acquire/replay/:gameId" element={<Replay />} />
    </Routes></MemoryRouter>);

    const handle = await screen.findByRole('button', { name: '移动回放面板' });
    const panel = handle.closest('section');
    expect(panel?.getAttribute('style')).toContain('--replay-panel-x: 0px');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    await waitFor(() => expect(panel?.getAttribute('style')).toContain('--replay-panel-x: 24px'));
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    await waitFor(() => expect(panel?.getAttribute('style')).toContain('--replay-panel-y: -24px'));
    fireEvent.keyDown(handle, { key: 'Home' });
    await waitFor(() => expect(panel?.getAttribute('style')).toContain('--replay-panel-x: 0px'));
  });

  it('does not jump upward when the mobile dock is already at the bottom edge', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 720, configurable: true });

    render(<MemoryRouter initialEntries={['/game/acquire/replay/1']}><Routes>
      <Route path="/game/acquire/replay/:gameId" element={<Replay />} />
    </Routes></MemoryRouter>);

    const handle = await screen.findByRole('button', { name: '移动回放面板' });
    const panel = handle.closest('section') as HTMLElement;
    panel.getBoundingClientRect = vi.fn(() => ({
      x: 14,
      y: 522,
      left: 14,
      top: 522,
      right: 376,
      bottom: 712,
      width: 362,
      height: 190,
      toJSON: () => ({}),
    } as DOMRect));

    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    await waitFor(() => expect(panel.getAttribute('style')).toContain('--replay-panel-y: 0px'));
  });

  it('toggles the mobile replay dock between expanded and collapsed controls', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    render(<MemoryRouter initialEntries={['/game/acquire/replay/1']}><Routes>
      <Route path="/game/acquire/replay/:gameId" element={<Replay />} />
    </Routes></MemoryRouter>);

    const collapse = await screen.findByRole('button', { name: '收起回放面板' });
    expect(collapse.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(collapse);
    const expand = await screen.findByRole('button', { name: '展开回放面板' });
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    const collapsedHandle = screen.getByRole('button', { name: '移动折叠回放面板' });
    const panel = collapsedHandle.closest('section');

    fireEvent.keyDown(collapsedHandle, { key: 'ArrowRight' });
    await waitFor(() => expect(panel?.getAttribute('style')).toContain('--replay-panel-x: 24px'));

    fireEvent.click(expand);
    await waitFor(() => expect(screen.getByRole('button', { name: '收起回放面板' }).getAttribute('aria-expanded')).toBe('true'));
  });
});
