import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { WarChestRoom } from './types';

export const WARCHEST_PUBLIC_URL = 'https://board.gamebus.online/game/warchest';
export const warChestRoomInviteURL = (roomID: string) =>
  gameInviteURL('warchest', roomID);
export const roomOwnerName = (room: WarChestRoom) => sharedRoomOwnerName(room);
export const roomEntry = (room: WarChestRoom, identity: RoomEntryIdentity) =>
  sharedRoomEntry(room, identity);
