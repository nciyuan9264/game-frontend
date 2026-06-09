import APIClient from './apiClient';
import type {
  GameID,
  HistoryGameType,
  ListGamesData,
  GameDetailData,
  Snapshot,
  Stats,
} from '@/types/history';

export interface ListGamesParams {
  gameType?: HistoryGameType;
  limit?: number;
  offset?: number;
}

export const listMyGames = async (
  params: ListGamesParams = {}
): Promise<ListGamesData> => {
  const { gameType = 'acquire', limit = 20, offset = 0 } = params;
  return APIClient.get({
    url: `/api/${gameType}/history/games`,
    params: { limit, offset },
  });
};

export const getGameDetail = async (
  id: GameID,
  gameType: HistoryGameType = 'acquire'
): Promise<GameDetailData> => {
  return APIClient.get({
    url: `/api/${gameType}/history/game/${id}`,
  });
};

export const getSnapshot = async (
  id: GameID,
  seq: number,
  gameType: HistoryGameType = 'acquire'
): Promise<Snapshot> => {
  return APIClient.get({
    url: `/api/${gameType}/history/game/${id}/snapshot`,
    params: { seq },
  });
};

export const getSnapshots = async (
  id: GameID,
  gameType: HistoryGameType = 'acquire'
): Promise<Snapshot[]> => {
  return APIClient.get({
    url: `/api/${gameType}/history/game/${id}/snapshots`,
  });
};

export const getMyStats = async (
  gameType: HistoryGameType = 'acquire'
): Promise<Stats> => {
  return APIClient.get({
    url: `/api/${gameType}/history/stats`,
  });
};
