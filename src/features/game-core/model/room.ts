import type {
  RoomInfo,
} from '@/api/generated/game-platform';
import type { GameType } from '@/hooks/useGameType';

export interface LobbyPlayerLike {
  userID?: string;
  playerID: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  seatIndex?: number;
  online: boolean;
  ai: boolean;
  ready: boolean;
}

export interface LobbyRoomLike {
  roomID: string;
  gameType?: GameType;
  ownerID: string;
  maxPlayers: number;
  status: string;
  visibility?: string;
  currentMatchID?: string;
  currentMatchStatus?: string;
  nextRoundNo?: number;
  roomPlayer: LobbyPlayerLike[];
  ownerName?: string;
  ownerAvatar?: string;
  emptyTileCount?: number;
  boardCardCount?: number;
  maxScore?: number;
}

export type LobbyFilter = 'all' | 'joinable' | 'playing';

export interface RoomEntryIdentity {
  userID: string;
  playerID: string;
}

export function legacyPlayerName(playerID: string) {
  return playerID.replace(/-\d+$/, '');
}

export function roomOwnerName(room: LobbyRoomLike) {
  return room.ownerName
    || room.roomPlayer.find(player => player.playerID === room.ownerID)?.name
    || legacyPlayerName(room.ownerID);
}

export function roomEntry(room: LobbyRoomLike, identity: RoomEntryIdentity) {
  const member = room.roomPlayer.some(player =>
    player.playerID === identity.playerID
    || (!!identity.userID && player.userID === identity.userID)
  );
  if (member) {
    return { allowed: true, label: room.status === 'match' ? '返回房间' : '进入对局' };
  }
  if (room.status !== 'match') return { allowed: false, label: '已开局' };
  if (room.roomPlayer.length >= room.maxPlayers) return { allowed: false, label: '房间已满' };
  return { allowed: true, label: '加入房间' };
}

export function sortLobbyRooms<TRoom extends LobbyRoomLike>(rooms: readonly TRoom[]) {
  return [...rooms].sort((left, right) => right.roomID.localeCompare(left.roomID));
}

export function filterLobbyRooms<TRoom extends LobbyRoomLike>(
  rooms: readonly TRoom[],
  filter: LobbyFilter,
  query: string,
  getOwnerName: (room: TRoom) => string = roomOwnerName
) {
  const search = query.trim().toLowerCase();
  return rooms.filter(room => {
    const joinable = room.status === 'match' && room.roomPlayer.length < room.maxPlayers;
    const matchesFilter = filter === 'all'
      || (filter === 'joinable' ? joinable : room.status !== 'match');
    return matchesFilter
      && `${room.roomID} ${getOwnerName(room)}`.toLowerCase().includes(search);
  });
}

export function toLobbyRoom(room: RoomInfo): LobbyRoomLike {
  return {
    roomID: room.roomID,
    gameType: room.gameType as GameType,
    ownerID: room.ownerPlayerID,
    maxPlayers: room.maxPlayers,
    status: room.status,
    visibility: room.visibility,
    currentMatchID: room.currentMatchID,
    currentMatchStatus: room.currentMatchStatus,
    nextRoundNo: room.nextRoundNo,
    roomPlayer: room.players.map(player => ({
      ...player,
      name: player.displayName,
    })),
    ownerName: room.players.find(player => player.playerID === room.ownerPlayerID)?.displayName,
    ownerAvatar: room.players.find(player => player.playerID === room.ownerPlayerID)?.avatar,
    emptyTileCount: room.metrics.acquire?.emptyTileCount,
    boardCardCount: room.metrics.davinci?.boardCardCount,
    maxScore: room.metrics.splendor?.maxScore,
  };
}

export function gameInviteURL(gameType: GameType, roomID: string) {
  return `https://board.gamebus.online/game/${gameType}/match?roomID=${encodeURIComponent(roomID)}`;
}
