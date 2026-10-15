import type { AcquireRoom } from './types';

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
