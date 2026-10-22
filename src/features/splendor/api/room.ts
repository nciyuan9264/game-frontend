import { createGameRoom, listGameRooms, lookupGameRoom } from '@/features/game-core/api/room';
import type { SplendorRoom, Visibility } from '../model/types';

export async function createSplendorRoom(visibility: Visibility, signal?: AbortSignal): Promise<{ roomID: string }> {
  return createGameRoom('splendor', { visibility }, { signal, authFailure: 'redirect' });
}

export async function listSplendorRooms(signal?: AbortSignal): Promise<{ rooms: SplendorRoom[] }> {
  return listGameRooms<SplendorRoom>('splendor', { signal, authFailure: 'redirect' });
}

export async function lookupSplendorRoom(roomID: string, signal?: AbortSignal): Promise<SplendorRoom> {
  return lookupGameRoom<SplendorRoom>('splendor', roomID, { signal, authFailure: 'redirect' });
}
