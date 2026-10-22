import {
  gameInviteURL,
  legacyPlayerName as sharedLegacyPlayerName,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
} from '@/features/game-core/model/room';
import type { SplendorRoom } from './types';

export const SPLENDOR_PUBLIC_URL = 'https://board.gamebus.online/game/splendor';

export function splendorRoomInviteURL(roomID: string) {
  return gameInviteURL('splendor', roomID);
}

export const legacyPlayerName = sharedLegacyPlayerName;

export function roomOwnerName(room: SplendorRoom) {
  return sharedRoomOwnerName(room);
}

export function roomEntry(room: SplendorRoom, playerID: string) {
  return sharedRoomEntry(room, playerID);
}
