import type { DavinciRoom } from './types';

export const DAVINCI_PUBLIC_URL = 'https://board.gamebus.online/game/davinci';

export function davinciRoomInviteURL(roomID: string) {
  return `${DAVINCI_PUBLIC_URL}/match?roomID=${encodeURIComponent(roomID)}`;
}

export function legacyPlayerName(playerID: string) {
  return playerID.replace(/-\d+$/, '');
}

export function roomOwnerName(room: DavinciRoom) {
  return room.ownerName
    || room.roomPlayer.find(player => player.playerID === room.ownerID)?.name
    || legacyPlayerName(room.ownerID);
}

export function roomEntry(room: DavinciRoom, playerID: string) {
  const member = room.isMember || room.roomPlayer.some(player => player.playerID === playerID);
  if (member) return { allowed: true, label: room.status === 'match' ? '返回房间' : '进入对局' };
  if (room.status !== 'match') return { allowed: false, label: '已开局' };
  if (room.roomPlayer.length >= room.maxPlayers) return { allowed: false, label: '房间已满' };
  return { allowed: true, label: '加入房间' };
}
