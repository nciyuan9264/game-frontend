import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type {
  FugitiveRoom,
  Visibility,
} from '../model/types';

export interface CreateFugitiveRoomInput {
  displayName: string;
  visibility: Visibility;
  turnTimeoutSeconds: number;
}

export async function createFugitiveRoom(
  input: CreateFugitiveRoomInput,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom(
    'fugitive',
    {
      ...input,
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
