import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { Visibility, OnitamaRoom } from '../model/types';

export async function createOnitamaRoom(
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom(
    'onitama',
    { visibility, maxPlayers: 2, turnTimeoutSeconds: 60 },
    { signal, authFailure: 'redirect' },
  );
}

export async function listOnitamaRooms(
  signal?: AbortSignal,
): Promise<{ rooms: OnitamaRoom[] }> {
  return listGameRooms<OnitamaRoom>(
    'onitama',
    { signal, authFailure: 'redirect' },
  );
}

export async function lookupOnitamaRoom(
  roomID: string,
  signal?: AbortSignal,
): Promise<OnitamaRoom> {
  return lookupGameRoom<OnitamaRoom>(
    'onitama',
    roomID,
    { signal, authFailure: 'redirect' },
  );
}
