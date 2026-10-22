import {
  gameInviteURL,
  legacyPlayerName as sharedLegacyPlayerName,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
} from '@/features/game-core/model/room';
import type { DavinciRoom } from './types';

export const DAVINCI_PUBLIC_URL = 'https://board.gamebus.online/game/davinci';

export function davinciRoomInviteURL(roomID: string) {
  return gameInviteURL('davinci', roomID);
}

export const legacyPlayerName = sharedLegacyPlayerName;

export function roomOwnerName(room: DavinciRoom) {
  return sharedRoomOwnerName(room);
}

export function roomEntry(room: DavinciRoom, playerID: string) {
  return sharedRoomEntry(room, playerID);
}
