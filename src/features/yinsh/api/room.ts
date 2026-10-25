import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { Visibility, YinshRoom } from '../model/types';

export async function createYinshRoom(
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom(
    'yinsh',
    { visibility, maxPlayers: 2 },
    { signal, authFailure: 'redirect' },
  );
}

export async function listYinshRooms(
  signal?: AbortSignal,
): Promise<{ rooms: YinshRoom[] }> {
  return listGameRooms<YinshRoom>(
    'yinsh',
    { signal, authFailure: 'redirect' },
  );
}

export async function lookupYinshRoom(
  roomID: string,
  signal?: AbortSignal,
): Promise<YinshRoom> {
  return lookupGameRoom<YinshRoom>(
    'yinsh',
    roomID,
    { signal, authFailure: 'redirect' },
  );
}
