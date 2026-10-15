import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listRooms } from '../api/room';
import { useAcquireLobby } from './useAcquireLobby';
import type { AcquireRoom } from '../model/types';

vi.mock('../api/room', () => ({
  AcquireRequestError: class AcquireRequestError extends Error {
    constructor(message: string, public status: number, public code?: string) { super(message); }
  },
  listRooms: vi.fn(),
}));
const room: AcquireRoom = {
  roomID: '1013_140000', ownerID: 'a-b-1', maxPlayers: 6, visibility: 'public',
  status: 'match', roomPlayer: [{ playerID: 'a-b-1', online: true, ai: false, ready: false }],
};
beforeEach(() => { vi.useFakeTimers(); vi.mocked(listRooms).mockReset(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('lobby synchronization', () => {
  it('keeps the last successful list when a refresh fails', async () => {
    vi.mocked(listRooms).mockResolvedValueOnce({ rooms: [room], onlinePlayer: 1 }).mockRejectedValueOnce(new Error('offline'));
    const hook = renderHook(useAcquireLobby);
    await act(async () => {});
    expect(hook.result.current.rooms).toHaveLength(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(hook.result.current.rooms[0].roomID).toBe(room.roomID);
    expect(hook.result.current.error).toBe('offline');
  });
  it('does not overlap requests, and ignores completion after unmount', async () => {
    let complete!: (result: { rooms: AcquireRoom[]; onlinePlayer: number }) => void;
    vi.mocked(listRooms).mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    const hook = renderHook(useAcquireLobby);
    act(() => { hook.result.current.refresh(); hook.result.current.refresh(); });
    expect(listRooms).toHaveBeenCalledTimes(1);
    const signal = vi.mocked(listRooms).mock.calls[0][0];
    hook.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => { complete({ rooms: [room], onlinePlayer: 1 }); });
    await vi.advanceTimersByTimeAsync(3000);
    expect(listRooms).toHaveBeenCalledTimes(1);
  });
  it('filters full rooms out of joinable results and preserves full owner names', async () => {
    const full = { ...room, roomID: 'full', maxPlayers: 1 };
    vi.mocked(listRooms).mockResolvedValue({ rooms: [room, full], onlinePlayer: 1 });
    const hook = renderHook(useAcquireLobby);
    await act(async () => {});
    act(() => { hook.result.current.setFilter('joinable'); hook.result.current.setQuery('a-b'); });
    expect(hook.result.current.filteredRooms.map(value => value.roomID)).toEqual([room.roomID]);
  });
  it('keeps private rooms returned for the current owner', async () => {
    const privateRoom = { ...room, roomID: 'private-room', visibility: 'private' as const };
    vi.mocked(listRooms).mockResolvedValue({ rooms: [privateRoom], onlinePlayer: 1 });
    const hook = renderHook(useAcquireLobby);
    await act(async () => {});
    expect(hook.result.current.filteredRooms.map(value => value.roomID)).toEqual([privateRoom.roomID]);
  });
  it('keeps room order stable across refreshes with shuffled server responses', async () => {
    const older = { ...room, roomID: '1013_140000' };
    const newer = { ...room, roomID: '1013_150000' };
    vi.mocked(listRooms)
      .mockResolvedValueOnce({ rooms: [older, newer], onlinePlayer: 2 })
      .mockResolvedValueOnce({ rooms: [newer, older], onlinePlayer: 2 });
    const hook = renderHook(useAcquireLobby);
    await act(async () => {});
    expect(hook.result.current.rooms.map(value => value.roomID)).toEqual(['1013_150000', '1013_140000']);

    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(hook.result.current.rooms.map(value => value.roomID)).toEqual(['1013_150000', '1013_140000']);
  });
});
