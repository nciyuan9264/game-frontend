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
import {
  createFugitiveRoom,
  listFugitiveRooms,
  lookupFugitiveRoom,
} from '@/features/fugitive/api/room';
import {
  createWarChestRoom,
  listWarChestRooms,
  lookupWarChestRoom,
} from '@/features/warchest/api/room';
import {
  createQuoridorRoom,
  listQuoridorRooms,
  lookupQuoridorRoom,
} from '@/features/quoridor/api/room';
import {
  createOnitamaRoom,
  listOnitamaRooms,
  lookupOnitamaRoom,
} from '@/features/onitama/api/room';

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
      { visibility: 'private', maxPlayers: 2 },
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

  it('injects Fugitive metadata, fixed seats, and redirect policy', () => {
    const signal = new AbortController().signal;
    createFugitiveRoom('private', signal);
    listFugitiveRooms(signal);
    lookupFugitiveRoom('room-4', signal);

    const options = { signal, authFailure: 'redirect' };
    expect(shared.createGameRoom).toHaveBeenCalledWith(
      'fugitive',
      {
        displayName: '午夜追缉',
        visibility: 'private',
        turnTimeoutSeconds: 120,
        maxPlayers: 2,
      },
      options,
    );
    expect(shared.listGameRooms).toHaveBeenCalledWith('fugitive', options);
    expect(shared.lookupGameRoom).toHaveBeenCalledWith(
      'fugitive',
      'room-4',
      options,
    );
  });

  it('injects War Chest fixed seats, timeout, and metadata', () => {
    const signal = new AbortController().signal;
    createWarChestRoom({ displayName: '雾谷前哨', visibility: 'private' }, signal);
    listWarChestRooms(signal);
    lookupWarChestRoom('room-5', signal);

    const options = { signal, authFailure: 'redirect' };
    expect(shared.createGameRoom).toHaveBeenCalledWith(
      'warchest',
      {
        displayName: '雾谷前哨',
        visibility: 'private',
        maxPlayers: 2,
        turnTimeoutSeconds: 90,
      },
      options,
    );
    expect(shared.listGameRooms).toHaveBeenCalledWith('warchest', options);
    expect(shared.lookupGameRoom).toHaveBeenCalledWith(
      'warchest',
      'room-5',
      options,
    );
  });

  it('injects Quoridor fixed seats and authoritative timeout', () => {
    const signal = new AbortController().signal;
    createQuoridorRoom('private', signal);
    listQuoridorRooms(signal);
    lookupQuoridorRoom('room-6', signal);

    const options = { signal, authFailure: 'redirect' };
    expect(shared.createGameRoom).toHaveBeenCalledWith(
      'quoridor',
      {
        visibility: 'private',
        maxPlayers: 2,
        turnTimeoutSeconds: 60,
      },
      options,
    );
    expect(shared.listGameRooms).toHaveBeenCalledWith('quoridor', options);
    expect(shared.lookupGameRoom).toHaveBeenCalledWith(
      'quoridor',
      'room-6',
      options,
    );
  });

  it('injects Onitama fixed seats and authoritative timeout', () => {
    const signal = new AbortController().signal;
    createOnitamaRoom('private', signal);
    listOnitamaRooms(signal);
    lookupOnitamaRoom('room-7', signal);

    const options = { signal, authFailure: 'redirect' };
    expect(shared.createGameRoom).toHaveBeenCalledWith(
      'onitama',
      {
        visibility: 'private',
        maxPlayers: 2,
        turnTimeoutSeconds: 60,
      },
      options,
    );
    expect(shared.listGameRooms).toHaveBeenCalledWith('onitama', options);
    expect(shared.lookupGameRoom).toHaveBeenCalledWith(
      'onitama',
      'room-7',
      options,
    );
  });
});
