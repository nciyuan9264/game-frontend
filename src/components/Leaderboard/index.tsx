import React, { useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { CloseOutlined, TrophyOutlined } from '@ant-design/icons';
import Modal from '@/components/Modal';
import { useLeaderboard } from '@/hooks/request/useLeaderboard';
import { useProfile } from '@/hooks/request/useProfile';
import { backendName2FrontendName } from '@/util/user';
import type { HistoryGameType } from '@/types/history';
import type {
  AcquireLeaderboardEntry,
  DavinciLeaderboardEntry,
  SplendorLeaderboardEntry,
  LeaderboardEntry,
  LeaderboardSortDim,
} from '@/types/leaderboard';

import styles from './index.module.less';

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  gameType: HistoryGameType;
}

const sortEntries = (
  entries: LeaderboardEntry[],
  gameType: HistoryGameType,
  dim: LeaderboardSortDim
): LeaderboardEntry[] => {
  const list = [...entries];
  if (dim === 'totalGames') {
    list.sort((a, b) => b.totalGames - a.totalGames);
    return list;
  }
  if (gameType === 'acquire') {
    list.sort(
      (a, b) =>
        ((a as AcquireLeaderboardEntry).avgRank ?? Number.POSITIVE_INFINITY) -
        ((b as AcquireLeaderboardEntry).avgRank ?? Number.POSITIVE_INFINITY)
    );
    return list;
  }
  list.sort((a, b) => {
    const aw = (a as DavinciLeaderboardEntry | SplendorLeaderboardEntry).winRate;
    const bw = (b as DavinciLeaderboardEntry | SplendorLeaderboardEntry).winRate;
    if (typeof aw === 'number' && typeof bw === 'number') {
      return bw - aw;
    }
    if (typeof bw === 'number') return 1;
    if (typeof aw === 'number') return -1;
    return b.totalGames - a.totalGames;
  });
  return list;
};

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  visible,
  onClose,
  gameType,
}) => {
  const isAcquire = gameType === 'acquire';
  const titleMap: Record<HistoryGameType, string> = {
    acquire: 'Acquire 排行榜',
    davinci: '达芬奇密码 排行榜',
    splendor: '璀璨宝石 排行榜',
  };
  const title = titleMap[gameType];
  const metricLabel = isAcquire ? '战绩（平均排名）' : '战绩（胜率）';
  const themeClass =
    gameType === 'acquire'
      ? styles.themeAcquire
      : gameType === 'davinci'
        ? styles.themeDavinci
        : styles.themeSplendor;

  const [sortDim, setSortDim] = useState<LeaderboardSortDim>('metric');
  const { data, run, loading } = useLeaderboard();
  const { userProfile } = useProfile();

  useEffect(() => {
    if (visible) {
      setSortDim('metric');
      run({ gameType, limit: 50, offset: 0 });
    }
  }, [visible, gameType]);

  const sortedEntries = useMemo(
    () => sortEntries(data?.entries ?? [], gameType, sortDim),
    [data, gameType, sortDim]
  );

  const renderHeaderCells = () => (
    <div className={`${styles.row} ${styles.headRow}`}>
      <div className={styles.colRank}>#</div>
      <div className={styles.colPlayer}>玩家</div>
      <div className={styles.colNum}>总场次</div>
      {isAcquire ? (
        <div className={styles.colNum}>平均排名</div>
      ) : (
        <>
          <div className={styles.colNum}>胜场</div>
          <div className={styles.colNum}>胜率</div>
        </>
      )}
    </div>
  );

  const renderRow = (entry: LeaderboardEntry, index: number) => {
    const rank = index + 1;
    const isMe = userProfile?.id && String(entry.userID) === userProfile.id;
    const topClass =
      rank === 1
        ? styles.rankGold
        : rank === 2
          ? styles.rankSilver
          : rank === 3
            ? styles.rankBronze
            : '';
    return (
      <div
        key={`${entry.userID}-${entry.playerID}`}
        className={`${styles.row} ${styles.dataRow} ${topClass} ${isMe ? styles.selfRow : ''}`}
      >
        <div className={styles.colRank}>
          {rank === 1 ? (
            <TrophyOutlined className={styles.trophyIcon} />
          ) : (
            <span className={styles.rankNum}>{rank}</span>
          )}
        </div>
        <div className={styles.colPlayer}>
          <span className={styles.playerName}>
            {backendName2FrontendName(entry.playerID)}
          </span>
          {isMe ? <span className={styles.meBadge}>我</span> : null}
        </div>
        <div className={styles.colNum}>{entry.totalGames}</div>
        {isAcquire ? (
          <div className={styles.colNum}>
            {typeof (entry as AcquireLeaderboardEntry).avgRank === 'number'
              ? (entry as AcquireLeaderboardEntry).avgRank.toFixed(2)
              : '-'}
          </div>
        ) : (
          <>
            <div className={styles.colNum}>
              {typeof (entry as DavinciLeaderboardEntry | SplendorLeaderboardEntry).wins === 'number'
                ? (entry as DavinciLeaderboardEntry | SplendorLeaderboardEntry).wins
                : '-'}
            </div>
            <div className={styles.colNum}>
              {typeof (entry as DavinciLeaderboardEntry | SplendorLeaderboardEntry).winRate === 'number'
                ? `${(((entry as DavinciLeaderboardEntry | SplendorLeaderboardEntry).winRate as number) * 100).toFixed(1)}%`
                : '-'}
            </div>
          </>
        )}
      </div>
    );
  };

  const initialLoading = loading && !data;

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className={`${styles.root} ${themeClass}`}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <TrophyOutlined className={styles.headerIcon} />
            <span className={styles.headerTitle}>{title}</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            <CloseOutlined />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.sortTabs}>
            <button
              type="button"
              className={`${styles.sortTab} ${sortDim === 'metric' ? styles.sortTabActive : ''}`}
              onClick={() => setSortDim('metric')}
            >
              {metricLabel}
            </button>
            <button
              type="button"
              className={`${styles.sortTab} ${sortDim === 'totalGames' ? styles.sortTabActive : ''}`}
              onClick={() => setSortDim('totalGames')}
            >
              场次
            </button>
          </div>

          <div className={styles.tableWrap}>
            {renderHeaderCells()}
            {!sortedEntries.length ? (
              <div className={styles.empty}>
                {initialLoading ? '' : '暂无数据'}
              </div>
            ) : (
              <div className={styles.list}>
                {sortedEntries.map(renderRow)}
              </div>
            )}
          </div>

          {initialLoading && (
            <div className={styles.loadingOverlay}>
              <Spin size="large" />
              <div className={styles.loadingText}>加载中...</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default LeaderboardModal;
