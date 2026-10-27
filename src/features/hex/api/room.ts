import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { Visibility, HexRoom } from '../model/types';

export async function createHexRoom(
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom(
    'hex',
    { visibility, maxPlayers: 2, turnTimeoutSeconds: 60 },
    { signal, authFailure: 'redirect' },
  );
}

export async function listHexRooms(
  signal?: AbortSignal,
): Promise<{ rooms: HexRoom[] }> {
  return listGameRooms<HexRoom>(
    'hex',
    { signal, authFailure: 'redirect' },
  );
}

export async function lookupHexRoom(
  roomID: string,
  signal?: AbortSignal,
): Promise<HexRoom> {
  return lookupGameRoom<HexRoom>(
    'hex',
    roomID,
    { signal, authFailure: 'redirect' },
  );
}
