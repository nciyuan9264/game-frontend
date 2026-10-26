import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { Visibility, QuoridorRoom } from '../model/types';

export async function createQuoridorRoom(
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom(
    'quoridor',
    { visibility, maxPlayers: 2, turnTimeoutSeconds: 60 },
    { signal, authFailure: 'redirect' },
  );
}

export async function listQuoridorRooms(
  signal?: AbortSignal,
): Promise<{ rooms: QuoridorRoom[] }> {
  return listGameRooms<QuoridorRoom>(
    'quoridor',
    { signal, authFailure: 'redirect' },
  );
}

export async function lookupQuoridorRoom(
  roomID: string,
  signal?: AbortSignal,
): Promise<QuoridorRoom> {
  return lookupGameRoom<QuoridorRoom>(
    'quoridor',
    roomID,
    { signal, authFailure: 'redirect' },
  );
}
