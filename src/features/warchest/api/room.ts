import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { Visibility, WarChestRoom } from '../types';

export async function createWarChestRoom(
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom('warchest', {
    displayName: '雾谷前哨',
    visibility,
    maxPlayers: 2,
    turnTimeoutSeconds: 90,
  }, { signal, authFailure: 'redirect' });
}

export async function listWarChestRooms(
  signal?: AbortSignal,
): Promise<{ rooms: WarChestRoom[] }> {
  return listGameRooms<WarChestRoom>(
    'warchest',
    { signal, authFailure: 'redirect' },
  );
}

export async function lookupWarChestRoom(
  roomID: string,
  signal?: AbortSignal,
): Promise<WarChestRoom> {
  return lookupGameRoom<WarChestRoom>(
    'warchest',
    roomID,
    { signal, authFailure: 'redirect' },
  );
}
