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
  gameRole?: string;
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
  displayName?: string;
  turnTimeoutSeconds?: number;
  currentMatchID?: string;
  currentMatchStatus?: string;
  nextRoundNo?: number;
  roomPlayer: LobbyPlayerLike[];
  ownerName?: string;
  ownerAvatar?: string;
  emptyTileCount?: number;
  boardCardCount?: number;
  maxScore?: number;
  ringsRemoved?: number;
  occupiedCount?: number;
  highestRevealed?: number;
  hiddenHideoutCount?: number;
  progressCurrent?: number;
  progressTotal?: number;
  maxControlledLocations?: number;
  turnCount?: number;
  currentRound?: number;
  maxFavor?: number;
  targetFavor?: number;
  maxPenalty?: number;
  targetPenalty?: number;
}

export type LobbyFilter = 'all' | 'joinable' | 'playing';

export interface RoomEntryIdentity {
  userID: string;
}

export function playerDisplayName(
  player: Pick<LobbyPlayerLike, 'playerID' | 'displayName' | 'name' | 'ai'> | undefined,
  playerID = player?.playerID ?? '',
) {
  return player?.displayName
    || player?.name
    || (player?.ai ? 'AI' : playerID ? `玩家 ${playerID}` : '玩家');
}

export function roomOwnerProfile(room: LobbyRoomLike) {
  const owner = room.roomPlayer.find(player => player.playerID === room.ownerID);
  return {
    player: owner,
    name: room.ownerName || playerDisplayName(owner, room.ownerID),
    avatar: room.ownerAvatar || owner?.avatar,
  };
}

export function roomOwnerName(room: LobbyRoomLike) {
  return roomOwnerProfile(room).name;
}

export function roomEntry(room: LobbyRoomLike, identity: RoomEntryIdentity) {
  const member = room.roomPlayer.some(player =>
    !!identity.userID
    && (player.userID === identity.userID || player.playerID === identity.userID)
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
      || (filter === 'joinable' ? joinable : room.status === 'playing');
    return matchesFilter
      && `${room.roomID} ${room.displayName ?? ''} ${getOwnerName(room)}`
        .toLowerCase()
        .includes(search);
  });
}

export function toLobbyRoom(room: RoomInfo): LobbyRoomLike {
  const owner = room.players.find(player => player.playerID === room.ownerPlayerID);
  return {
    roomID: room.roomID,
    gameType: room.gameType as GameType,
    ownerID: room.ownerPlayerID,
    maxPlayers: room.maxPlayers,
    status: room.status,
    visibility: room.visibility,
    displayName: room.displayName,
    turnTimeoutSeconds: room.turnTimeoutSeconds,
    currentMatchID: room.currentMatchID,
    currentMatchStatus: room.currentMatchStatus,
    nextRoundNo: room.nextRoundNo,
    roomPlayer: room.players.map(player => ({
      ...player,
      name: player.displayName,
    })),
    ownerName: owner?.displayName,
    ownerAvatar: owner?.avatar,
    emptyTileCount: room.metrics.acquire?.emptyTileCount,
    boardCardCount: room.metrics.davinci?.boardCardCount,
    maxScore: room.metrics.splendor?.maxScore,
    ringsRemoved: room.metrics.yinsh?.ringsRemoved,
    occupiedCount: room.metrics.othello?.occupiedCount,
    highestRevealed: room.metrics.fugitive?.highestRevealed,
    hiddenHideoutCount: room.metrics.fugitive?.hiddenHideoutCount,
    maxControlledLocations: room.metrics.warchest?.maxControlledLocations,
    turnCount: room.metrics.quoridor?.turnCount,
    currentRound: room.metrics.loveletter?.currentRound,
    maxFavor: room.metrics.loveletter?.maxFavor,
    targetFavor: room.metrics.loveletter?.targetFavor,
    maxPenalty: room.metrics.sixnimmt?.maxPenalty,
    targetPenalty: room.metrics.sixnimmt?.targetPenalty,
    progressCurrent: room.metrics.fugitive?.progressCurrent
      ?? room.metrics.warchest?.progressCurrent
      ?? room.metrics.othello?.progressCurrent
      ?? room.metrics.loveletter?.progressCurrent
      ?? room.metrics.sixnimmt?.progressCurrent,
    progressTotal: room.metrics.fugitive?.progressTotal
      ?? room.metrics.warchest?.progressTotal
      ?? room.metrics.othello?.progressTotal
      ?? room.metrics.loveletter?.progressTotal
      ?? room.metrics.sixnimmt?.progressTotal,
  };
}

export function gameInviteURL(gameType: GameType, roomID: string) {
  return `https://board.gamebus.online/game/${gameType}/match?roomID=${encodeURIComponent(roomID)}`;
}
