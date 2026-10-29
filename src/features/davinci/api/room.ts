import { createGameRoom, listGameRooms } from '@/features/game-core/api/room';
import type { DavinciRoom, Visibility } from '../model/types';

export async function createDavinciRoom(
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom(
    'davinci',
    { visibility, maxPlayers: 2 },
    { signal, authFailure: 'redirect' },
  );
}

export async function listDavinciRooms(signal?: AbortSignal): Promise<{ rooms: DavinciRoom[] }> {
  return listGameRooms<DavinciRoom>('davinci', { signal, authFailure: 'redirect' });
}
