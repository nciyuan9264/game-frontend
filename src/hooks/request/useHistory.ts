import { useRequest } from 'ahooks';
import { message } from 'antd';
import {
  listMyGames,
  getMyStats,
  getGameDetail,
  getSnapshot,
  getSnapshots,
  ListGamesParams,
} from '@/api/history';
import type { GameID, HistoryGameType, Snapshot } from '@/types/history';

export const useMyGames = () => {
  const {
    data: gamesData,
    run: runListMyGames,
    loading: gamesLoading,
  } = useRequest(
    async (params: ListGamesParams = {}) => {
      return await listMyGames(params);
    },
    {
      manual: true,
      onError: () => {
        message.error('获取历史对局列表失败');
      },
    }
  );

  return {
    games: gamesData?.games,
    runListMyGames,
    gamesLoading,
  };
};

export const useMyStats = () => {
  const {
    data: stats,
    run: runGetMyStats,
    loading: statsLoading,
  } = useRequest(
    async (gameType: HistoryGameType = 'acquire') => {
      return await getMyStats(gameType);
    },
    {
      manual: true,
      onError: () => {
        message.error('获取胜率统计失败');
      },
    }
  );

  return {
    stats,
    runGetMyStats,
    statsLoading,
  };
};

export const useGameDetail = () => {
  const {
    data: detail,
    run: runGetGameDetail,
    loading: detailLoading,
  } = useRequest(
    async (id: GameID, gameType: HistoryGameType = 'acquire') => {
      return await getGameDetail(id, gameType);
    },
    {
      manual: true,
      onError: () => {
        message.error('获取对局详情失败');
      },
    }
  );

  return {
    detail,
    runGetGameDetail,
    detailLoading,
  };
};

export const useSnapshot = () => {
  const {
    data: snapshot,
    run: runGetSnapshot,
    loading: snapshotLoading,
  } = useRequest(
    async (id: GameID, seq: number, gameType: HistoryGameType = 'acquire') => {
      return await getSnapshot(id, seq, gameType);
    },
    {
      manual: true,
      onError: () => {
        message.error('获取快照失败');
      },
    }
  );

  return {
    snapshot,
    runGetSnapshot,
    snapshotLoading,
  };
};

export const useSnapshots = () => {
  const {
    data: snapshots,
    run: runGetSnapshots,
    loading: snapshotsLoading,
  } = useRequest(
    async (id: GameID, gameType: HistoryGameType = 'acquire') => {
      const res = await getSnapshots(id, gameType);
      return (Array.isArray(res) ? res : (res as { snapshots: Snapshot[] }).snapshots) ?? [];
    },
    {
      manual: true,
      onError: () => {
        message.error('获取快照失败');
      },
    }
  );

  return {
    snapshots,
    runGetSnapshots,
    snapshotsLoading,
  };
};
