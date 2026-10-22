import {
  createGameRoom,
  GameRoomRequestError,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { AcquireRoom, Visibility } from '../model/types';

export { GameRoomRequestError as AcquireRequestError };

export const listRooms = (signal: AbortSignal) =>
  listGameRooms<AcquireRoom>('acquire', { signal });

export const createAcquireRoom = (
  visibility: Visibility,
  signal?: AbortSignal
) => createGameRoom('acquire', { visibility }, { signal });

export const lookupRoom = (
  roomID: string,
  signal?: AbortSignal
) => lookupGameRoom<AcquireRoom>('acquire', roomID, { signal });
