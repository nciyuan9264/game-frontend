import {
  gameInviteURL,
  roomEntry as sharedRoomEntry,
  roomOwnerName as sharedRoomOwnerName,
  type RoomEntryIdentity,
} from '@/features/game-core/model/room';
import type { CantStopRoom } from './types';

export const CANTSTOP_PUBLIC_URL =
  'https://board.gamebus.online/game/cantstop';

export const cantStopRoomInviteURL = (roomID: string) =>
  gameInviteURL('cantstop', roomID);

export const roomOwnerName = (room: CantStopRoom) =>
  sharedRoomOwnerName(room);

export const roomEntry = (
  room: CantStopRoom,
  identity: RoomEntryIdentity,
) => sharedRoomEntry(room, identity);
