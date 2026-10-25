import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { YinshRoom } from './types';

export const YINSH_PUBLIC_URL = 'https://board.gamebus.online/game/yinsh';

export function yinshRoomInviteURL(roomID: string) {
  return gameInviteURL('yinsh', roomID);
}

export function roomOwnerName(room: YinshRoom) {
  return sharedRoomOwnerName(room);
}

export function roomEntry(room: YinshRoom, identity: RoomEntryIdentity) {
  return sharedRoomEntry(room, identity);
}
