import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { ForSaleRoom } from './types';

export const FORSALE_PUBLIC_URL =
  'https://board.gamebus.online/game/forsale';

export const forSaleRoomInviteURL = (roomID: string) =>
  gameInviteURL('forsale', roomID);

export const roomEntry = (
  room: ForSaleRoom,
  identity: RoomEntryIdentity,
) => sharedRoomEntry(room, identity);
