import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAcquireRoom,
  listRooms,
  lookupRoom,
} from '@/features/acquire/api/room';
import {
  createDavinciRoom,
  listDavinciRooms,
} from '@/features/davinci/api/room';
import {
  createSplendorRoom,
  listSplendorRooms,
  lookupSplendorRoom,
} from '@/features/splendor/api/room';
import {
  createOthelloRoom,
  listOthelloRooms,
  lookupOthelloRoom,
} from '@/features/othello/api/room';

const shared = vi.hoisted(() => ({
  createGameRoom: vi.fn(),
  listGameRooms: vi.fn(),
  lookupGameRoom: vi.fn(),
}));

vi.mock('@/features/game-core/api/room', () => ({
  ...shared,
  GameRoomRequestError: class GameRoomRequestError extends Error {},
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('game room API wrappers', () => {
  it('injects Acquire capabilities without redirect policy', () => {
    const signal = new AbortController().signal;
    listRooms(signal);
    createAcquireRoom('private', signal);
    lookupRoom('room-1', signal);

    expect(shared.listGameRooms).toHaveBeenCalledWith('acquire', { signal });
    expect(shared.createGameRoom).toHaveBeenCalledWith(
      'acquire',
      { visibility: 'private' },
      { signal }
    );
    expect(shared.lookupGameRoom).toHaveBeenCalledWith(
      'acquire',
      'room-1',
      { signal }
    );
  });

  it('injects DaVinci fixed creation and redirect policy', () => {
    const signal = new AbortController().signal;
    createDavinciRoom(signal);
    listDavinciRooms(signal);

    expect(shared.createGameRoom).toHaveBeenCalledWith(
      'davinci',
      {},
      { signal, authFailure: 'redirect' }
    );
    expect(shared.listGameRooms).toHaveBeenCalledWith(
      'davinci',
      { signal, authFailure: 'redirect' }
    );
  });

  it('injects Splendor visibility, lookup, and redirect policy', () => {
    const signal = new AbortController().signal;
    createSplendorRoom('public', signal);
    listSplendorRooms(signal);
    lookupSplendorRoom('room-2', signal);

    const options = { signal, authFailure: 'redirect' };
    expect(shared.createGameRoom).toHaveBeenCalledWith(
      'splendor',
      { visibility: 'public' },
      options
    );
    expect(shared.listGameRooms).toHaveBeenCalledWith('splendor', options);
    expect(shared.lookupGameRoom).toHaveBeenCalledWith(
      'splendor',
      'room-2',
      options
    );
  });

  it('injects Othello fixed seats, visibility, and redirect policy', () => {
    const signal = new AbortController().signal;
    createOthelloRoom('private', signal);
    listOthelloRooms(signal);
    lookupOthelloRoom('room-3', signal);

    const options = { signal, authFailure: 'redirect' };
    expect(shared.createGameRoom).toHaveBeenCalledWith(
      'othello',
      { visibility: 'private', maxPlayers: 2 },
      options
    );
    expect(shared.listGameRooms).toHaveBeenCalledWith('othello', options);
    expect(shared.lookupGameRoom).toHaveBeenCalledWith(
      'othello',
      'room-3',
      options
    );
  });
});
