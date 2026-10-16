import APIClient from './apiClient';
import type { HistoryGameType } from '@/types/history';
import type { LeaderboardData, LeaderboardSortDim } from '@/types/leaderboard';

export interface GetLeaderboardParams {
  gameType: HistoryGameType;
  limit?: number;
  offset?: number;
  sort?: LeaderboardSortDim;
}

export const getLeaderboard = async (
  params: GetLeaderboardParams
): Promise<LeaderboardData> => {
  const { gameType, limit = 50, offset = 0, sort = 'metric' } = params;
  return APIClient.get({
    url: `/api/${gameType}/ranking/leaderboard`,
    params: { limit, offset, sort },
  });
};
