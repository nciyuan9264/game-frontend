import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { LoveLetterRoom, Visibility } from '../model/types';

export const createLoveLetterRoom = (
  visibility: Visibility,
  signal?: AbortSignal,
) => createGameRoom('loveletter', {
  visibility,
  displayName: '掌心密信',
  maxPlayers: 6,
  turnTimeoutSeconds: 60,
}, { signal, authFailure: 'redirect' });

export const listLoveLetterRooms = (signal?: AbortSignal) =>
  listGameRooms<LoveLetterRoom>(
    'loveletter',
    { signal, authFailure: 'redirect' },
  );

export const lookupLoveLetterRoom = (
  roomID: string,
  signal?: AbortSignal,
) => lookupGameRoom<LoveLetterRoom>(
  'loveletter',
  roomID,
  { signal, authFailure: 'redirect' },
);
