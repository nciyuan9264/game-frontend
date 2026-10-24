import type {
  AcquireCompanyState,
  AcquireEndGameState,
  AcquirePlayerResult,
  AcquirePlayerState,
  AcquireTile,
  HistoryStats,
  LeaderboardEntry as GeneratedLeaderboardEntry,
  ReplayEvent,
  RoomPlayer,
} from '@/api/generated/game-platform';

export type GameID = string | number;
export type HistoryGameType = 'acquire' | 'davinci' | 'splendor';
export type HistoryGameStatus = string;
export type CmdType = string;
export type Stats = HistoryStats;
export type LeaderboardSortDim = 'totalGames' | 'metric';

export interface GamePlayer {
  id: GameID;
  gameID: GameID;
  userID?: GameID;
  playerID: string;
  displayName: string;
  seatIndex: number;
  isAI: boolean;
  finalScore?: number;
  finalMoney?: number;
  finalStocks: number;
  finalRank?: number;
  isWinner: boolean;
  createdAt: string;
}

export interface Game {
  id: GameID;
  roomID: string;
  gameType: HistoryGameType;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  winnerUserID?: GameID;
  winnerPlayerID?: string;
  endReason?: string;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
  players?: GamePlayer[];
}

export interface EventMeta {
  seq: number;
  playerID: string;
  displayName: string;
  cmdType: CmdType;
}

export interface GameDetailData {
  game: Game;
  players: GamePlayer[];
  events: EventMeta[];
}

export interface ListGamesData {
  games: Game[];
}

export interface ReplayEventData extends Omit<ReplayEvent, 'payloadJSON'> {
  payload: unknown;
}

export interface Snapshot {
  seq: number;
  totalEvents: number;
  currentEvent?: ReplayEventData;
  roomData: {
    companyInfo: Record<string, AcquireCompanyState>;
    currentPlayer: string;
    gameStatus: HistoryGameStatus;
    tiles: Record<string, AcquireTile>;
    players: Record<string, Partial<RoomPlayer> & Pick<RoomPlayer, 'playerID' | 'online' | 'ai'>>;
    endGame?: AcquireEndGameState;
  };
  playersData: Record<string, AcquirePlayerState>;
  result: Record<string, AcquirePlayerResult>;
}

export interface SnapshotPageData<TSnapshot = Snapshot> {
  snapshots: TSnapshot[];
  totalEvents: number;
  totalSnapshots: number;
  offset: number;
  limit: number;
  nextOffset: number;
  hasMore: boolean;
}

export interface LeaderboardEntryBase {
  userID: GameID;
  playerID: string;
  displayName: string;
  totalGames: number;
}

export interface DavinciLeaderboardEntry extends LeaderboardEntryBase {
  wins: number;
  winRate: number;
}

export interface RankLeaderboardEntry extends LeaderboardEntryBase {
  avgRank: number;
}

export type AcquireLeaderboardEntry = RankLeaderboardEntry;
export type SplendorLeaderboardEntry = RankLeaderboardEntry;
export type LeaderboardEntry = DavinciLeaderboardEntry | RankLeaderboardEntry;

export interface LeaderboardData {
  gameType: HistoryGameType;
  entries: LeaderboardEntry[];
}

export function toLeaderboardEntry(
  entry: GeneratedLeaderboardEntry,
): LeaderboardEntry {
  if (entry.metric.davinci) {
    return {
      userID: entry.userID,
      playerID: entry.playerID,
      displayName: entry.displayName ?? `玩家 ${entry.playerID}`,
      totalGames: entry.totalGames,
      wins: entry.metric.davinci.wins,
      winRate: entry.metric.davinci.winRate,
    };
  }
  return {
    userID: entry.userID,
    playerID: entry.playerID,
    displayName: entry.displayName ?? `玩家 ${entry.playerID}`,
    totalGames: entry.totalGames,
    avgRank: entry.metric.rank.avgRank,
  };
}

export function parseReplayPayload(event?: ReplayEvent): ReplayEventData | undefined {
  if (!event) return undefined;
  let payload: unknown;
  if (event.payloadJSON) {
    try {
      payload = JSON.parse(event.payloadJSON);
    } catch {
      payload = undefined;
    }
  }
  return {
    seq: event.seq,
    playerID: event.playerID,
    displayName: event.displayName ?? `玩家 ${event.playerID}`,
    cmdType: event.cmdType,
    payload,
  };
}
