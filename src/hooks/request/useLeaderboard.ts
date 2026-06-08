import { useRequest } from 'ahooks';
import { message } from 'antd';
import { getLeaderboard, GetLeaderboardParams } from '@/api/leaderboard';

export const useLeaderboard = () => {
  const { data, run, loading } = useRequest(
    async (params: GetLeaderboardParams) => getLeaderboard(params),
    {
      manual: true,
      onError: () => {
        message.error('获取排行榜失败');
      },
    }
  );

  return { data, run, loading };
};
