import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { OthelloRoom } from './types';

export const OTHELLO_PUBLIC_URL = 'https://board.gamebus.online/game/othello';

export function othelloRoomInviteURL(roomID: string) {
  return gameInviteURL('othello', roomID);
}

export function roomOwnerName(room: OthelloRoom) {
  return sharedRoomOwnerName(room);
}

export function roomEntry(room: OthelloRoom, identity: RoomEntryIdentity) {
  return sharedRoomEntry(room, identity);
}
