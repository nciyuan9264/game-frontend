import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LobbyRoomLike } from '../model/room';
import { useLobbyRooms } from './useLobbyRooms';

const room: LobbyRoomLike = {
  roomID: '1021_140000',
  ownerID: 'owner-1',
  maxPlayers: 2,
  status: 'match',
  roomPlayer: [{
    playerID: 'owner-1',
    name: 'Owner',
    online: true,
    ai: false,
    ready: false,
  }],
};
const ownerName = (value: LobbyRoomLike) => value.roomPlayer[0]?.name ?? '';
const mapError = (reason: unknown, timedOut: boolean) => ({
  message: timedOut ? 'timed out' : reason instanceof Error ? reason.message : 'failed',
  code: timedOut ? 'TIMEOUT' : 'FAILED',
});

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useLobbyRooms', () => {
  it('does not overlap polling and keeps the last successful rooms on failure', async () => {
    const loadRooms = vi.fn()
      .mockResolvedValueOnce([room])
      .mockRejectedValueOnce(new Error('offline'));
    const hook = renderHook(() => useLobbyRooms({ loadRooms, getOwnerName: ownerName }));
    await act(async () => undefined);
    expect(hook.result.current.rooms).toEqual([room]);

    act(() => {
      hook.result.current.refresh();
      hook.result.current.refresh();
    });
    await act(async () => undefined);
    expect(loadRooms).toHaveBeenCalledTimes(2);
    expect(hook.result.current.rooms).toEqual([room]);
    expect(hook.result.current.error).toBe('offline');
  });

  it('does not restart an active request when presentation callbacks change', async () => {
    let resolveRequest: (rooms: readonly LobbyRoomLike[]) => void = () => undefined;
    const loadRooms = vi.fn((signal: AbortSignal) => new Promise<readonly LobbyRoomLike[]>(
      resolve => {
        resolveRequest = resolve;
        signal.addEventListener('abort', () => resolve([]));
      }
    ));
    const hook = renderHook(({ prefix }: { prefix: string }) => useLobbyRooms({
      loadRooms,
      getOwnerName: value => `${prefix}${ownerName(value)}`,
      mapError: reason => ({
        message: reason instanceof Error ? reason.message : `${prefix} failed`,
      }),
    }), { initialProps: { prefix: 'first' } });

    await act(async () => undefined);
    const signal = loadRooms.mock.calls[0][0];
    hook.rerender({ prefix: 'second' });

    expect(loadRooms).toHaveBeenCalledTimes(1);
    expect(signal.aborted).toBe(false);

    await act(async () => {
      resolveRequest([room]);
    });
    expect(hook.result.current.rooms).toEqual([room]);
  });

  it('pauses while hidden and refreshes immediately after visibility returns', async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    const loadRooms = vi.fn().mockResolvedValue([room]);
    renderHook(() => useLobbyRooms({ loadRooms, getOwnerName: ownerName }));
    await act(async () => undefined);
    expect(loadRooms).not.toHaveBeenCalled();

    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(loadRooms).toHaveBeenCalledTimes(1);
  });

  it('aborts a timed-out request and exposes the mapped code', async () => {
    const loadRooms = vi.fn((signal: AbortSignal) => new Promise<readonly LobbyRoomLike[]>(
      (_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))
    ));
    const hook = renderHook(() => useLobbyRooms({
      loadRooms,
      getOwnerName: ownerName,
      timeoutMs: 100,
      mapError,
    }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(loadRooms.mock.calls[0][0].aborted).toBe(true);
    expect(hook.result.current.error).toBe('timed out');
    expect(hook.result.current.errorCode).toBe('TIMEOUT');
  });

  it('filters and sorts the successful result', async () => {
    const full = {
      ...room,
      roomID: '1021_150000',
      roomPlayer: [...room.roomPlayer, {
        playerID: 'other-2',
        online: true,
        ai: false,
        ready: false,
      }],
    };
    const loadRooms = vi.fn().mockResolvedValue([room, full]);
    const hook = renderHook(() => useLobbyRooms({ loadRooms, getOwnerName: ownerName }));
    await act(async () => undefined);
    expect(hook.result.current.rooms.map(item => item.roomID)).toEqual([
      '1021_150000',
      '1021_140000',
    ]);
    act(() => {
      hook.result.current.setFilter('joinable');
      hook.result.current.setQuery('owner');
    });
    expect(hook.result.current.filteredRooms).toEqual([room]);
  });
});
