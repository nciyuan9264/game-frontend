import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { OnitamaRoom } from './types';

export const ONITAMA_PUBLIC_URL = 'https://board.gamebus.online/game/onitama';

export function onitamaRoomInviteURL(roomID: string) {
  return gameInviteURL('onitama', roomID);
}

export function roomOwnerName(room: OnitamaRoom) {
  return sharedRoomOwnerName(room);
}

export function roomEntry(room: OnitamaRoom, identity: RoomEntryIdentity) {
  return sharedRoomEntry(room, identity);
}
