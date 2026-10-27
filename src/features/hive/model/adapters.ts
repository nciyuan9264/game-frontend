import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { HiveRoom } from './types';

export const HIVE_PUBLIC_URL = 'https://board.gamebus.online/game/hive';

export function hiveRoomInviteURL(roomID: string) {
  return gameInviteURL('hive', roomID);
}

export function roomOwnerName(room: HiveRoom) {
  return sharedRoomOwnerName(room);
}

export function roomEntry(room: HiveRoom, identity: RoomEntryIdentity) {
  return sharedRoomEntry(room, identity);
}
