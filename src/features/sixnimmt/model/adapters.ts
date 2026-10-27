import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { SixNimmtRoom } from './types';

export const SIXNIMMT_PUBLIC_URL =
  'https://board.gamebus.online/game/sixnimmt';

export const sixNimmtRoomInviteURL = (roomID: string) =>
  gameInviteURL('sixnimmt', roomID);

export const roomOwnerName = (room: SixNimmtRoom) =>
  sharedRoomOwnerName(room);

export const roomEntry = (
  room: SixNimmtRoom,
  identity: RoomEntryIdentity,
) => sharedRoomEntry(room, identity);
