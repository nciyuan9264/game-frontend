import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listLoveLetterRooms } from '../api/room';
import { useLoveLetterLobby } from './useLoveLetterLobby';
import type { LoveLetterRoom } from '../model/types';

vi.mock('../api/room', () => ({
  listLoveLetterRooms: vi.fn(),
}));

const room: LoveLetterRoom = {
  roomID: 'loveletter_room',
  ownerID: 'owner-1',
  maxPlayers: 6,
  visibility: 'public',
  status: 'match',
  roomPlayer: [{
    playerID: 'owner-1',
    displayName: 'Owner',
    seatIndex: 0,
    online: true,
    ai: false,
    ready: false,
  }],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(listLoveLetterRooms).mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useLoveLetterLobby', () => {
  it('does not restart the room-list request after its loading state render', async () => {
    let complete!: (result: { rooms: LoveLetterRoom[] }) => void;
    vi.mocked(listLoveLetterRooms).mockImplementation(
      () => new Promise(resolve => { complete = resolve; }),
    );

    const hook = renderHook(useLoveLetterLobby);
    await act(async () => undefined);

    const signal = vi.mocked(listLoveLetterRooms).mock.calls[0][0];
    expect(listLoveLetterRooms).toHaveBeenCalledTimes(1);
    expect(signal?.aborted).toBe(false);

    await act(async () => { complete({ rooms: [room] }); });
    expect(hook.result.current.rooms).toEqual([room]);
    expect(listLoveLetterRooms).toHaveBeenCalledTimes(1);
  });
});
