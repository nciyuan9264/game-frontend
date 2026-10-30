import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { CantStopRoom, Visibility } from '../model/types';

export const createCantStopRoom = (
  visibility: Visibility,
  signal?: AbortSignal,
) => createGameRoom('cantstop', {
  visibility,
  maxPlayers: 4,
  turnTimeoutSeconds: 60,
}, { signal, authFailure: 'redirect' });

export const listCantStopRooms = (signal?: AbortSignal) =>
  listGameRooms<CantStopRoom>(
    'cantstop',
    { signal, authFailure: 'redirect' },
  );

export const lookupCantStopRoom = (
  roomID: string,
  signal?: AbortSignal,
) => lookupGameRoom<CantStopRoom>(
  'cantstop',
  roomID,
  { signal, authFailure: 'redirect' },
);
