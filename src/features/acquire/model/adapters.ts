import {
  gameInviteURL,
  legacyPlayerName,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
} from '@/features/game-core/model/room';
import type { AcquireRoom } from './types';

export const ACQUIRE_PUBLIC_URL = 'https://board.gamebus.online/game/acquire';

export function acquireRoomInviteURL(roomID: string) {
  return gameInviteURL('acquire', roomID);
}

export const playerName = legacyPlayerName;
export function roomOwnerName(room: AcquireRoom) {
  return sharedRoomOwnerName(room);
}
export function roomEntry(room: AcquireRoom, playerID: string) {
  return sharedRoomEntry(room, playerID);
}
