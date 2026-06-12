import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { CloseOutlined, UserOutlined } from '@ant-design/icons';
import Modal from '@/components/Modal';
import { useMyGames, useMyStats } from '@/hooks/request/useHistory';
import { backendName2FrontendName } from '@/util/user';
import type { Game, GameID, HistoryGameType } from '@/types/history';

import styles from './index.module.less';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userID: string;
  gameType: HistoryGameType;
}

const formatDate = (iso?: string) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
};

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '-';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
};

const getAcquireRank = (game: Game, currentPlayerID: string) => {
  const me = game.players?.find((player) => player.playerID === currentPlayerID);
  if (!me || !game.finalResult || typeof game.finalResult !== 'object') return '-';

  const entries = Object.entries(game.finalResult as Record<string, { total?: number }>)
    .map(([playerID, result]) => ({
      playerID,
      total: typeof result?.total === 'number' ? result.total : Number.NEGATIVE_INFINITY,
    }))
    .sort((a, b) => b.total - a.total);

  const rankIndex = entries.findIndex((entry) => entry.playerID === me.playerID);
  return rankIndex >= 0 ? `第${rankIndex + 1}名` : '-';
};

const getWinnerName = (game: Game) =>
  game.winnerPlayerID ? backendName2FrontendName(game.winnerPlayerID) : '-';

const getWinLoseText = (game: Game, currentPlayerID: string) => {
  const me = game.players?.find((p) => p.playerID === currentPlayerID);
  if (!me) return '-';
  return me.isWinner ? '胜利' : '失败';
};

const formatMoneyScore = (score?: number | null) =>
  score === undefined || score === null ? '-' : `$${score}`;

const formatPointScore = (score?: number | null) =>
  score === undefined || score === null ? '-' : `${score}`;

const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  userID,
  gameType,
}) => {
  const navigate = useNavigate();
  const { games, runListMyGames, gamesLoading } = useMyGames();
  const { stats, runGetMyStats, statsLoading } = useMyStats();
  const profileMetaMap: Record<HistoryGameType, {
    name: string;
    themeClass: string;
    avgScoreFormatter: (score?: number | null) => string;
    rowClickableClass: string;
    metaLabel: string;
    getMetaValue: (game: Game, currentPlayerID: string) => string;
    secondaryLabel: string;
    getSecondaryValue: (game: Game, currentPlayerID: string) => string;
    replayPath?: (gameId: GameID) => string;
  }> = {
    acquire: {
      name: 'Acquire',
      themeClass: styles.themeAcquire,
      avgScoreFormatter: formatMoneyScore,
      rowClickableClass: styles.rowClickable,
      metaLabel: '排名',
      getMetaValue: getAcquireRank,
      secondaryLabel: '我的得分',
      getSecondaryValue: (game, currentPlayerID) =>
        formatMoneyScore(game.players?.find((p) => p.playerID === currentPlayerID)?.finalScore),
      replayPath: (gameId) => `/game/acquire/replay/${gameId}`,
    },
    davinci: {
      name: '达芬奇密码',
      themeClass: styles.themeDavinci,
      avgScoreFormatter: () => '-',
      rowClickableClass: styles.rowStatic,
      metaLabel: '胜者',
      getMetaValue: getWinnerName,
      secondaryLabel: '结果',
      getSecondaryValue: getWinLoseText,
    },
    splendor: {
      name: '璀璨宝石',
      themeClass: styles.themeSplendor,
      avgScoreFormatter: formatPointScore,
      rowClickableClass: styles.rowStatic,
      metaLabel: '胜者',
      getMetaValue: getWinnerName,
      secondaryLabel: '我的得分',
      getSecondaryValue: (game, currentPlayerID) =>
        formatPointScore(game.players?.find((p) => p.playerID === currentPlayerID)?.finalScore),
    },
  };
  const meta = profileMetaMap[gameType];

  useEffect(() => {
    if (visible) {
      runListMyGames({ gameType, limit: 20, offset: 0 });
      runGetMyStats(gameType);
    }
  }, [visible, gameType]);

  const winRatePct = stats ? `${(stats.winRate * 100).toFixed(1)}%` : '-';
  const avgScoreText = meta.avgScoreFormatter(stats?.avgScore);

  const handleRowClick = (gameId: GameID) => {
    if (!meta.replayPath) return;
    onClose();
    navigate(meta.replayPath(gameId));
  };

  const renderGameRow = (game: Game) => {
    const me = game.players?.find((p) => p.playerID === userID);
    const isWin = !!me?.isWinner;
    return (
      <div
        key={game.id}
        className={`${styles.row} ${meta.rowClickableClass}`}
        onClick={() => handleRowClick(game.id)}
      >
        <div className={`${styles.col} ${styles.colTime}`}>
          <span className={styles.label}>开始时间</span>
          <span className={styles.value}>{formatDate(game.startedAt)}</span>
        </div>
        <div className={`${styles.col} ${styles.colDuration}`}>
          <span className={styles.label}>时长</span>
          <span className={styles.value}>
            {formatDuration(game.durationSeconds)}
          </span>
        </div>
        <div className={`${styles.col} ${styles.colMeta}`}>
          <span className={styles.label}>{meta.metaLabel}</span>
          <span className={styles.value}>{meta.getMetaValue(game, userID)}</span>
        </div>
        <div className={`${styles.col} ${styles.colSecondary}`}>
          <span className={styles.label}>{meta.secondaryLabel}</span>
          <span className={styles.value}>{meta.getSecondaryValue(game, userID)}</span>
        </div>
        <div className={`${styles.col} ${styles.colTag}`}>
          <span
            className={`${styles.tag} ${isWin ? styles.tagWin : styles.tagLose}`}
          >
            {isWin ? '胜' : '负'}
          </span>
        </div>
      </div>
    );
  };

  const initialLoading =
    (statsLoading && !stats) || (gamesLoading && !games);

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className={`${styles.root} ${meta.themeClass}`}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <UserOutlined className={styles.headerIcon} />
            <span className={styles.headerTitle}>{meta.name} 个人主页</span>
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
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>总场次</div>
              <div className={styles.statValue}>{stats?.totalGames ?? '-'}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>胜场</div>
              <div className={styles.statValue}>{stats?.wins ?? '-'}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>胜率</div>
              <div className={styles.statValue}>{winRatePct}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>平均得分</div>
              <div className={styles.statValue}>{avgScoreText}</div>
            </div>
          </div>

          <div className={styles.listTitle}>{meta.name} 历史对局（最近 20 局）</div>

          {!games?.length ? (
            <div className={styles.empty}>
              {initialLoading ? '' : '暂无历史对局'}
            </div>
          ) : (
            <div className={styles.list}>{games.map(renderGameRow)}</div>
          )}

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

export default ProfileModal;
