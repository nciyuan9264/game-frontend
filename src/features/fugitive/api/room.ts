import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type {
  FugitiveRoom,
  Visibility,
} from '../model/types';

export async function createFugitiveRoom(
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom(
    'fugitive',
    {
      displayName: '午夜追缉',
      visibility,
      turnTimeoutSeconds: 120,
      maxPlayers: 2,
    },
    { signal, authFailure: 'redirect' },
  );
}

export async function listFugitiveRooms(
  signal?: AbortSignal,
): Promise<{ rooms: FugitiveRoom[] }> {
  return listGameRooms<FugitiveRoom>(
    'fugitive',
    { signal, authFailure: 'redirect' },
  );
}

export async function lookupFugitiveRoom(
  roomID: string,
  signal?: AbortSignal,
): Promise<FugitiveRoom> {
  return lookupGameRoom<FugitiveRoom>(
    'fugitive',
    roomID,
    { signal, authFailure: 'redirect' },
  );
}
