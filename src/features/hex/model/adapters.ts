import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { HexRoom } from './types';

export const HEX_PUBLIC_URL = 'https://board.gamebus.online/game/hex';

export function hexRoomInviteURL(roomID: string) {
  return gameInviteURL('hex', roomID);
}

export function roomOwnerName(room: HexRoom) {
  return sharedRoomOwnerName(room);
}

export function roomEntry(room: HexRoom, identity: RoomEntryIdentity) {
  return sharedRoomEntry(room, identity);
}
