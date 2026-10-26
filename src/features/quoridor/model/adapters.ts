import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { QuoridorRoom } from './types';

export const QUORIDOR_PUBLIC_URL = 'https://board.gamebus.online/game/quoridor';

export function quoridorRoomInviteURL(roomID: string) {
  return gameInviteURL('quoridor', roomID);
}

export function roomOwnerName(room: QuoridorRoom) {
  return sharedRoomOwnerName(room);
}

export function roomEntry(room: QuoridorRoom, identity: RoomEntryIdentity) {
  return sharedRoomEntry(room, identity);
}
