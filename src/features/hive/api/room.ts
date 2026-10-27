import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { Visibility, HiveRoom } from '../model/types';

export async function createHiveRoom(
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<{ roomID: string }> {
  return createGameRoom(
    'hive',
    { visibility, maxPlayers: 2, turnTimeoutSeconds: 120 },
    { signal, authFailure: 'redirect' },
  );
}

export async function listHiveRooms(
  signal?: AbortSignal,
): Promise<{ rooms: HiveRoom[] }> {
  return listGameRooms<HiveRoom>(
    'hive',
    { signal, authFailure: 'redirect' },
  );
}

export async function lookupHiveRoom(
  roomID: string,
  signal?: AbortSignal,
): Promise<HiveRoom> {
  return lookupGameRoom<HiveRoom>(
    'hive',
    roomID,
    { signal, authFailure: 'redirect' },
  );
}
