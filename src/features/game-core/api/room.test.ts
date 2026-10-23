import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CreateRoom,
  GetRoom,
  ListRooms,
  StartNextMatch,
  type RoomInfo,
} from '@/api/generated/game-platform';
import {
  createGameRoom,
  GameRoomRequestError,
  listGameRooms,
  lookupGameRoom,
  startNextGameMatch,
} from './room';

vi.mock('@/api/generated/game-platform', () => ({
  CreateRoom: vi.fn(),
  GetRoom: vi.fn(),
  ListRooms: vi.fn(),
  StartNextMatch: vi.fn(),
}));

const room: RoomInfo = {
  roomID: 'room-1',
  gameType: 'splendor',
  status: 'match',
  visibility: 'private',
  ownerUserID: 'user-1',
  ownerPlayerID: 'player-1',
  maxPlayers: 4,
  playerCount: 1,
  currentMatchID: 'match-1',
  currentMatchStatus: 'preparing',
  nextRoundNo: 1,
  createdAt: '2026-10-22T00:00:00Z',
  updatedAt: '2026-10-22T00:00:00Z',
  players: [{
    userID: 'user-1',
    playerID: 'player-1',
    displayName: 'Alice',
    seatIndex: 0,
    online: true,
    ai: false,
    ready: true,
  }],
  metrics: {
    splendor: {
      maxScore: 0,
      progressCurrent: 0,
      progressTotal: 15,
    },
  },
};

beforeEach(() => {
  vi.mocked(CreateRoom).mockReset();
  vi.mocked(GetRoom).mockReset();
  vi.mocked(ListRooms).mockReset();
  vi.mocked(StartNextMatch).mockReset();
});

describe('game room API', () => {
  it('maps generated room DTOs and forwards AbortSignal', async () => {
    const signal = new AbortController().signal;
    vi.mocked(ListRooms).mockResolvedValue({
      status_code: 200,
      message: 'ok',
      data: { rooms: [room] },
    });

    const result = await listGameRooms('splendor', { signal });

    expect(ListRooms).toHaveBeenCalledWith(
      { game_type: 'splendor' },
      { signal },
    );
    expect(result.rooms[0]).toMatchObject({
      roomID: 'room-1',
      ownerID: 'player-1',
      ownerName: 'Alice',
      maxScore: 0,
    });
  });

  it('passes create and lookup parameters to generated clients', async () => {
    vi.mocked(CreateRoom).mockResolvedValue({
      status_code: 200,
      message: 'ok',
      data: room,
    });
    vi.mocked(GetRoom).mockResolvedValue({
      status_code: 200,
      message: 'ok',
      data: room,
    });

    await createGameRoom('splendor', { visibility: 'private' });
    await lookupGameRoom('splendor', 'room / 1');

    expect(CreateRoom).toHaveBeenCalledWith(
      expect.objectContaining({
        game_type: 'splendor',
        visibility: 'private',
        request_id: expect.any(String),
      }),
      { signal: undefined },
    );
    expect(GetRoom).toHaveBeenCalledWith(
      { game_type: 'splendor', room_id: 'room / 1' },
      { signal: undefined },
    );
  });

  it('maps generated request failures to a stable domain error', async () => {
    vi.mocked(ListRooms).mockRejectedValue(new Error('service unavailable'));

    await expect(listGameRooms('splendor')).rejects.toMatchObject({
      name: 'GameRoomRequestError',
      message: 'service unavailable',
    });
    await expect(listGameRooms('splendor')).rejects.toBeInstanceOf(
      GameRoomRequestError,
    );
  });

  it('starts the next match with an idempotency request ID', async () => {
    vi.mocked(StartNextMatch).mockResolvedValue({
      status_code: 200,
      message: 'ok',
      data: { room, matchID: 'match-2', roundNo: 2 },
    });

    await expect(startNextGameMatch('splendor', 'room-1')).resolves.toEqual({
      matchID: 'match-2',
      roundNo: 2,
    });
    expect(StartNextMatch).toHaveBeenCalledWith({
      game_type: 'splendor',
      room_id: 'room-1',
      request_id: expect.any(String),
    }, { signal: undefined });
  });
});
