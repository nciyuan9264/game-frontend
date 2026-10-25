import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { Visibility, OthelloRoom } from '../model/types';

export async function createOthelloRoom(
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom(
    'othello',
    { visibility, maxPlayers: 2 },
    { signal, authFailure: 'redirect' },
  );
}

export async function listOthelloRooms(
  signal?: AbortSignal,
): Promise<{ rooms: OthelloRoom[] }> {
  return listGameRooms<OthelloRoom>(
    'othello',
    { signal, authFailure: 'redirect' },
  );
}

export async function lookupOthelloRoom(
  roomID: string,
  signal?: AbortSignal,
): Promise<OthelloRoom> {
  return lookupGameRoom<OthelloRoom>(
    'othello',
    roomID,
    { signal, authFailure: 'redirect' },
  );
}
