import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { Visibility, WarChestRoom } from '../types';

export interface CreateWarChestRoomInput {
  displayName: string;
  visibility: Visibility;
}

export async function createWarChestRoom(
  input: CreateWarChestRoomInput,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom('warchest', {
    ...input,
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
