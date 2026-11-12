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
  aiDifficulty?: string;
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
  maxClaimedColumns?: number;
  targetColumns?: number;
  forSaleProgressCurrent?: number;
  forSaleProgressTotal?: number;
  placedPieceCount?: number;
}

export type LobbyFilter = 'all' | 'joinable' | 'playing';

export interface RoomEntryIdentity {
  userID: string;
}

export function orderGameRoomSeats<TPlayer extends { seatIndex?: number }>(
  players: Record<string, TPlayer>,
  playerOrder: readonly string[],
  seatCount: number,
) {
  const orderedIDs: string[] = [];
  const seenIDs = new Set<string>();
  for (const id of [...playerOrder, ...Object.keys(players)]) {
    if (!players[id] || seenIDs.has(id)) continue;
    seenIDs.add(id);
    orderedIDs.push(id);
  }

  const seats = Array<string | undefined>(seatCount).fill(undefined);
  const unassigned: string[] = [];
  orderedIDs.forEach(id => {
    const seatIndex = players[id].seatIndex;
    if (
      typeof seatIndex === 'number'
      && Number.isInteger(seatIndex)
      && seatIndex >= 0
      && seatIndex < seatCount
      && !seats[seatIndex]
    ) {
      seats[seatIndex] = id;
    } else {
      unassigned.push(id);
    }
  });
  unassigned.forEach(id => {
    const index = seats.findIndex(seat => !seat);
    if (index >= 0) seats[index] = id;
  });
  return seats;
}

export function playerDisplayName(
  player: Pick<LobbyPlayerLike, 'playerID' | 'displayName' | 'name' | 'ai'> | undefined,
  playerID = player?.playerID ?? '',
) {
  return player?.displayName
    || player?.name
    || (player?.ai ? 'AI' : playerID ? `玩家 ${playerID}` : '玩家');
}

export function playerDisplayLabel(
  player: Pick<LobbyPlayerLike, 'playerID' | 'displayName' | 'name' | 'ai'> | undefined,
  playerID = player?.playerID ?? '',
) {
  const name = playerDisplayName(player, playerID);
  return player?.ai ? `${name} · AI` : name;
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
      && `${room.roomID} ${getOwnerName(room)}`
        .toLowerCase()
        .includes(search);
  });
}

export function toLobbyRoom(room: RoomInfo): LobbyRoomLike {
  const owner = room.players.find(player => player.playerID === room.ownerPlayerID);
  const progress = (() => {
    switch (room.gameType) {
      case 'acquire': return room.metrics.acquire;
      case 'davinci': return room.metrics.davinci;
      case 'splendor': return room.metrics.splendor;
      case 'yinsh': return room.metrics.yinsh;
      case 'othello': return room.metrics.othello;
      case 'fugitive': return room.metrics.fugitive;
      case 'warchest': return room.metrics.warchest;
      case 'loveletter': return room.metrics.loveletter;
      case 'sixnimmt': return room.metrics.sixnimmt;
      case 'cantstop': return room.metrics.cantstop;
      case 'forsale': return room.metrics.forSale;
      case 'hive': return room.metrics.hive;
      default: return undefined;
    }
  })();
  return {
    roomID: room.roomID,
    gameType: room.gameType as GameType,
    ownerID: room.ownerPlayerID,
    maxPlayers: room.maxPlayers,
    status: room.status,
    visibility: room.visibility,
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
    turnCount: room.metrics.hex?.turnCount
      ?? room.metrics.quoridor?.turnCount
      ?? room.metrics.onitama?.turnCount
      ?? room.metrics.hive?.turnCount,
    placedPieceCount: room.metrics.hive?.placedPieceCount,
    currentRound: room.metrics.loveletter?.currentRound,
    maxFavor: room.metrics.loveletter?.maxFavor,
    targetFavor: room.metrics.loveletter?.targetFavor,
    maxPenalty: room.metrics.sixnimmt?.maxPenalty,
    targetPenalty: room.metrics.sixnimmt?.targetPenalty,
    maxClaimedColumns: room.metrics.cantstop?.maxClaimedColumns,
    targetColumns: room.metrics.cantstop?.targetColumns,
    forSaleProgressCurrent: room.metrics.forSale?.progressCurrent,
    forSaleProgressTotal: room.metrics.forSale?.progressTotal,
    progressCurrent: progress?.progressCurrent,
    progressTotal: progress?.progressTotal,
  };
}

export function gameInviteURL(gameType: GameType, roomID: string) {
  return `https://board.gamebus.online/game/${gameType}/match?roomID=${encodeURIComponent(roomID)}`;
}
