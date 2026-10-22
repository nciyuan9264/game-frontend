import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  GameDetailData,
  Snapshot,
  SnapshotPageData,
} from '@/features/game-core/model/history';
import { useProgressiveReplay } from './useProgressiveReplay';

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

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function snapshot(seq: number, totalEvents: number): Snapshot {
  return {
    seq,
    totalEvents,
    currentEvent: seq >= 0
      ? { seq, playerID: 'me', cmdType: 'turn_timeout', payload: null }
      : undefined,
    roomData: {
      companyInfo: {},
      currentPlayer: 'me',
      gameStatus: 'setTile',
      tiles: {},
      players: { me: { playerID: 'me', online: true, ai: false } },
    },
    playersData: { me: { money: 6000, stocks: {}, tiles: [] } },
    result: { me: { money: 6000, stocks: 0, total: 6000 } },
  };
}

function page(offset: number, totalSnapshots: number): SnapshotPageData {
  const count = Math.min(20, Math.max(0, totalSnapshots - offset));
  const snapshots = Array.from(
    { length: count },
    (_, index) => snapshot(offset + index - 1, totalSnapshots - 1)
  );
  const nextOffset = Math.min(totalSnapshots, offset + count);
  return {
    snapshots,
    totalEvents: totalSnapshots - 1,
    totalSnapshots,
    offset,
    limit: 20,
    nextOffset,
    hasMore: nextOffset < totalSnapshots,
  };
}

function detail(gameID: number): GameDetailData {
  return {
    game: {
      id: gameID,
      roomID: `room-${gameID}`,
      gameType: 'acquire',
      startedAt: '',
      durationSeconds: 0,
      maxPlayers: 6,
      createdAt: '',
      updatedAt: '',
    },
    players: [{
      id: 1,
      gameID,
      userID: 7,
      playerID: 'me',
      seatIndex: 0,
      isAI: false,
      finalStocks: 0,
      isWinner: true,
      createdAt: '',
    }],
    events: [],
  };
}

beforeEach(() => {
  api.getProfile.mockResolvedValue({ id: '7', name: 'Player', email: '', avatar: '' });
  api.getGameDetail.mockImplementation((gameID: number) => Promise.resolve(detail(gameID)));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useProgressiveReplay', () => {
  it('loads one page at a time and moves a requested page to the queue front', async () => {
    const pending = new Map<number, Deferred<SnapshotPageData>>();
    api.getSnapshotPage.mockImplementation((
      _gameID: number,
      _gameType: string,
      params: { offset: number }
    ) => {
      if (params.offset === 0) return Promise.resolve(page(0, 101));
      const request = deferred<SnapshotPageData>();
      pending.set(params.offset, request);
      return request.promise;
    });

    const hook = renderHook(() => useProgressiveReplay(1));
    await waitFor(() => expect(hook.result.current.loadedCount).toBe(20));
    await waitFor(() => expect(pending.has(20)).toBe(true));

    act(() => hook.result.current.selectIndex(85));
    expect(hook.result.current.pendingIndex).toBe(85);
    await act(async () => pending.get(20)?.resolve(page(20, 101)));

    await waitFor(() => expect(pending.has(80)).toBe(true));
    const offsets = api.getSnapshotPage.mock.calls.map(call => call[2].offset);
    expect(offsets).toEqual([0, 20, 80]);
    expect(hook.result.current.loadedCount).toBe(40);
    hook.unmount();
  });

  it('keeps loaded snapshots after a failed page and resumes from that offset', async () => {
    const retry = deferred<SnapshotPageData>();
    let offset20Calls = 0;
    api.getSnapshotPage.mockImplementation((
      _gameID: number,
      _gameType: string,
      params: { offset: number }
    ) => {
      if (params.offset === 0) return Promise.resolve(page(0, 40));
      offset20Calls += 1;
      if (offset20Calls === 1) return Promise.reject(new Error('network down'));
      return retry.promise;
    });

    const hook = renderHook(() => useProgressiveReplay(1));
    await waitFor(() => expect(hook.result.current.progressError?.offset).toBe(20));
    expect(hook.result.current.loadedCount).toBe(20);
    expect(hook.result.current.currentSnapshot?.seq).toBe(-1);

    act(() => hook.result.current.retryProgress());
    await act(async () => retry.resolve(page(20, 40)));
    await waitFor(() => expect(hook.result.current.loadedCount).toBe(40));
    expect(hook.result.current.progressError).toBeUndefined();
  });

  it('ignores an initial page that resolves after switching games', async () => {
    const stalePage = deferred<SnapshotPageData>();
    api.getSnapshotPage.mockImplementation((
      gameID: number,
      _gameType: string,
      params: { offset: number }
    ) => {
      if (gameID === 1 && params.offset === 0) return stalePage.promise;
      return Promise.resolve(page(params.offset, 1));
    });

    const hook = renderHook(
      ({ gameID }) => useProgressiveReplay(gameID),
      { initialProps: { gameID: 1 } }
    );
    hook.rerender({ gameID: 2 });
    await waitFor(() => expect(hook.result.current.detail?.game.roomID).toBe('room-2'));

    await act(async () => stalePage.resolve(page(0, 21)));
    expect(hook.result.current.detail?.game.roomID).toBe('room-2');
    expect(hook.result.current.totalSnapshots).toBe(1);
  });
});
