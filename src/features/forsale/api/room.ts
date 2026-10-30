import {
  createGameRoom,
  listGameRooms,
  lookupGameRoom,
} from '@/features/game-core/api/room';
import type { ForSaleRoom, Visibility } from '../model/types';

export const createForSaleRoom = (
  visibility: Visibility,
  signal?: AbortSignal,
) => createGameRoom('forsale', {
  visibility,
  maxPlayers: 6,
  turnTimeoutSeconds: 60,
}, { signal, authFailure: 'redirect' });

export const listForSaleRooms = (signal?: AbortSignal) =>
  listGameRooms<ForSaleRoom>(
    'forsale',
    { signal, authFailure: 'redirect' },
  );

export const lookupForSaleRoom = (
  roomID: string,
  signal?: AbortSignal,
) => lookupGameRoom<ForSaleRoom>(
  'forsale',
  roomID,
  { signal, authFailure: 'redirect' },
);
