import APIClient from './apiClient';
import type {
  GameID,
  HistoryGameType,
  ListGamesData,
  GameDetailData,
  Snapshot,
  SnapshotPageData,
  Stats,
} from '@/types/history';

export interface ListGamesParams {
  gameType: HistoryGameType;
  limit?: number;
  offset?: number;
}

export const listMyGames = async (
  params: ListGamesParams
): Promise<ListGamesData> => {
  const { gameType, limit = 20, offset = 0 } = params;
  return APIClient.get({
    url: `/api/${gameType}/history/games`,
    params: { limit, offset },
  });
};

export const getGameDetail = async (
  id: GameID,
  gameType: HistoryGameType
): Promise<GameDetailData> => {
  return APIClient.get({
    url: `/api/${gameType}/history/game/${id}`,
  });
};

export const getSnapshot = async (
  id: GameID,
  seq: number,
  gameType: HistoryGameType
): Promise<Snapshot> => {
  return APIClient.get({
    url: `/api/${gameType}/history/game/${id}/snapshot`,
    params: { seq },
  });
};

export interface SnapshotPageParams {
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}

export const getSnapshotPage = async (
  id: GameID,
  gameType: HistoryGameType,
  params: SnapshotPageParams = {}
): Promise<SnapshotPageData> => {
  const { offset = 0, limit = 20, signal } = params;
  const result = await APIClient.get<SnapshotPageData>({
    url: `/api/${gameType}/history/game/${id}/snapshots`,
    params: { offset, limit },
    signal,
  });
  const numericFields: Array<keyof SnapshotPageData> = [
    'totalEvents', 'totalSnapshots', 'offset', 'limit', 'nextOffset',
  ];
  if (
    !result ||
    !Array.isArray(result.snapshots) ||
    typeof result.hasMore !== 'boolean' ||
    numericFields.some(field => !Number.isInteger(result[field]))
  ) {
    throw new Error('回放分页响应格式无效');
  }
  return result;
};

export const getMyStats = async (
  gameType: HistoryGameType
): Promise<Stats> => {
  return APIClient.get({
    url: `/api/${gameType}/history/stats`,
  });
};
