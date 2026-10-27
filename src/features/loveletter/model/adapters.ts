import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { LoveLetterRoom } from './types';

export const LOVELETTER_PUBLIC_URL =
  'https://board.gamebus.online/game/loveletter';

export const loveLetterRoomInviteURL = (roomID: string) =>
  gameInviteURL('loveletter', roomID);

export const roomOwnerName = (room: LoveLetterRoom) =>
  sharedRoomOwnerName(room);

export const roomEntry = (
  room: LoveLetterRoom,
  identity: RoomEntryIdentity,
) => sharedRoomEntry(room, identity);
