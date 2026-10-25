import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { FugitiveRoom } from './types';

export const FUGITIVE_PUBLIC_URL =
  'https://board.gamebus.online/game/fugitive';

export function fugitiveRoomInviteURL(roomID: string) {
  return gameInviteURL('fugitive', roomID);
}

export function roomOwnerName(room: FugitiveRoom) {
  return sharedRoomOwnerName(room);
}

export function roomEntry(
  room: FugitiveRoom,
  identity: RoomEntryIdentity,
) {
  return sharedRoomEntry(room, identity);
}
