import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { SixNimmtRoom, Visibility } from '../model/types';

export const createSixNimmtRoom = (
  visibility: Visibility,
  signal?: AbortSignal,
) => createGameRoom('sixnimmt', {
  visibility,
  displayName: '牧场牌桌',
  maxPlayers: 10,
  turnTimeoutSeconds: 60,
}, { signal, authFailure: 'redirect' });

export const listSixNimmtRooms = (signal?: AbortSignal) =>
  listGameRooms<SixNimmtRoom>(
    'sixnimmt',
    { signal, authFailure: 'redirect' },
  );

export const lookupSixNimmtRoom = (
  roomID: string,
  signal?: AbortSignal,
) => lookupGameRoom<SixNimmtRoom>(
  'sixnimmt',
  roomID,
  { signal, authFailure: 'redirect' },
);
