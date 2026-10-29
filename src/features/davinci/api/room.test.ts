import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGameRoom } from '@/features/game-core/api/room';
import { createDavinciRoom } from './room';

vi.mock('@/features/game-core/api/room', () => ({
  createGameRoom: vi.fn(),
  listGameRooms: vi.fn(),
}));

describe('createDavinciRoom', () => {
  beforeEach(() => vi.mocked(createGameRoom).mockReset());

  it('forwards explicit visibility and the fixed player count', async () => {
    vi.mocked(createGameRoom).mockResolvedValue({
      roomID: 'room-1',
      room: {} as never,
    });
    const controller = new AbortController();

    await createDavinciRoom('public', controller.signal);

    expect(createGameRoom).toHaveBeenCalledWith(
      'davinci',
      { visibility: 'public', maxPlayers: 2 },
      { signal: controller.signal, authFailure: 'redirect' },
    );
  });
});
