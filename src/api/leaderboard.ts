import APIClient from './apiClient';
import type { HistoryGameType } from '@/types/history';
import type { LeaderboardData } from '@/types/leaderboard';

export interface GetLeaderboardParams {
  gameType: HistoryGameType;
  limit?: number;
  offset?: number;
}

export const getLeaderboard = async (
  params: GetLeaderboardParams
): Promise<LeaderboardData> => {
  const { gameType, limit = 50, offset = 0 } = params;
  return APIClient.get({
    url: `/api/${gameType}/ranking/leaderboard`,
    params: { limit, offset },
  });
};
