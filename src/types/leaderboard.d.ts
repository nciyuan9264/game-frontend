import type { HistoryGameType } from './history';

export interface LeaderboardEntryBase {
  userID: number;
  playerID: string;
  totalGames: number;
}

export interface DavinciLeaderboardEntry extends LeaderboardEntryBase {
  wins: number;
  winRate: number;
}

export interface AcquireLeaderboardEntry extends LeaderboardEntryBase {
  avgRank: number;
}

export type LeaderboardEntry = DavinciLeaderboardEntry | AcquireLeaderboardEntry;

export interface LeaderboardData {
  gameType: HistoryGameType;
  entries: LeaderboardEntry[];
}

export type LeaderboardSortDim = 'totalGames' | 'metric';
