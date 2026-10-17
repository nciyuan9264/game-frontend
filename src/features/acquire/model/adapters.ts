import type { AcquireRoom } from './types';

export const ACQUIRE_PUBLIC_URL = 'https://board.gamebus.online/game/acquire';

export function acquireRoomInviteURL(roomID: string) {
  return `${ACQUIRE_PUBLIC_URL}/match?roomID=${encodeURIComponent(roomID)}`;
}

export function playerName(id: string) {
  // Historical IDs use name-userID; preserve hyphens inside the display name.
  return id.replace(/-\d+$/, '');
}
export function roomOwnerName(room: AcquireRoom) {
  return room.ownerName || room.roomPlayer.find(player => player.playerID === room.ownerID)?.name || playerName(room.ownerID);
}
export function roomEntry(room: AcquireRoom, playerID: string) {
  const member = room.isMember || room.roomPlayer.some(player => player.playerID === playerID);
  if (member) return { allowed: true, label: room.status === 'match' ? '返回房间' : '进入对局' };
  if (room.status !== 'match') return { allowed: false, label: '已开局' };
  if (room.roomPlayer.length >= room.maxPlayers) return { allowed: false, label: '房间已满' };
  return { allowed: true, label: '加入房间' };
}
