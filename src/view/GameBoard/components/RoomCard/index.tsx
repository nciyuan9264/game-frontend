import React from 'react';
import styles from './index.module.less';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { ListRoomInfo } from '@/types/room';
import { BankOutlined, GoldOutlined, HourglassOutlined, LoginOutlined, PlayCircleOutlined, UnlockOutlined } from '@ant-design/icons';
import { backendName2FrontendName } from '@/util/user';
import { GameType } from '@/hooks/useGameType';
import { Button } from '@/components/Button';

interface RoomCardProps {
  data: ListRoomInfo;
  gameType: GameType;
  userID: string;
}

type RoomProgress = { text: string; percent: number };

const RoomCard: React.FC<RoomCardProps> = ({ data, gameType, userID }) => {
  const navigate = useNavigate();
  const aiCount = data.roomPlayer.filter(player => player.ai).length;
  const maxPlayers = data.maxPlayers || 6;
  const isMatching = data.status === 'match';
  const isEnded = data.status === 'end';
  const roomCardMetaMap: Record<GameType, {
    icon: React.ReactNode;
    progressLabel: string;
    progressBackground: string;
    footerText: string;
    getProgress: (room: ListRoomInfo) => RoomProgress;
  }> = {
    acquire: {
      icon: <BankOutlined />,
      progressLabel: '地块进度',
      progressBackground: 'linear-gradient(90deg, #0b3a3f, #00b3a6)',
      footerText: '公开房 · 无需密码',
      getProgress: (room) => {
        const empty = room.emptyTileCount ?? 0;
        return { text: `${108 - empty}/${108}`, percent: ((108 - empty) / 108) * 100 };
      },
    },
    davinci: {
      icon: <PlayCircleOutlined />,
      progressLabel: '对局状态',
      progressBackground: 'linear-gradient(90deg, #3b1d68, #f59e0b)',
      footerText: '推理房 · 无需密码',
      getProgress: (room) => {
        const board = room.boardCardCount ?? 0;
        return { text: `${26 - board}/${26}`, percent: ((26 - board) / 26) * 100 };
      },
    },
    splendor: {
      icon: <GoldOutlined />,
      progressLabel: '分数进度',
      progressBackground: 'linear-gradient(90deg, #4c1d95, #f5c451)',
      footerText: '宝石房 · 无需密码',
      getProgress: (room) => {
        const maxScore = room.maxScore ?? 0;
        return { text: `${maxScore}/15`, percent: Math.min(maxScore / 15, 1) * 100 };
      },
    },
  };
  const meta = roomCardMetaMap[gameType];

  const getProgress = (): RoomProgress => {
    if (isEnded) return { text: '已结束', percent: 100 };
    if (isMatching) return { text: '匹配中', percent: 0 };
    return meta.getProgress(data);
  };
  const { text: progressText, percent: progressPercent } = getProgress();
  return (
    <article className={styles.card}>
      {/* header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>
            {meta.icon}
            <span>
              房间 {data.roomID}
            </span>
          </div>
          <div className={styles.meta}>
            <span>房主 ID {backendName2FrontendName(data.ownerID)}</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span
            className={`${styles.chip} ${isMatching || isEnded ? styles.chipWaiting : styles.chipOngoing}`}
          >
            {isMatching || isEnded ? <HourglassOutlined /> : <PlayCircleOutlined />}
            {isMatching ? '待开始' : isEnded ? '已结束' : '进行中'}
          </span>
        </div>
      </div>

      {/* players */}
      <div className={styles.players}>
        <div className={styles.playersMain}>
          {data.roomPlayer.length} / {maxPlayers} 人 （{aiCount} 人机）
        </div>
      </div>

      {/* progress */}
      <div className={styles.progress}>
        <div className={styles.progressLabel}>
          <span>{meta.progressLabel}</span>
          <span>{progressText}</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{
              width: `${progressPercent}%`,
              background: meta.progressBackground,
            }}
          />
        </div>
      </div>

      {/* footer */}
      <div className={styles.footer}>
        <div className={styles.public}>
          <UnlockOutlined />
          {meta.footerText}
        </div>

        <div className={styles.actions}>
          <Button
            customType="primary"
            content="进入房间"
            style={{
              width: '6rem',
              height: '2rem',
            }}
            icon={<LoginOutlined className={styles.icon} />}
            onClick={() => {
              const hasPlayer = data.roomPlayer.find(player => player.playerID === userID);
              if (data.status !== 'match') {
                if (hasPlayer) {
                  navigate(`/game/${gameType}/match?roomID=${data.roomID}`);
                } else {
                  message.error('游戏已开始，无法加入');
                }
              } else {
                if (data.roomPlayer.length < maxPlayers) {
                  navigate(`/game/${gameType}/match?roomID=${data.roomID}`);
                } else {
                  message.error('房间已满');
                }
              }
            }}
          />
        </div>
      </div>
    </article>
  );
};

export default RoomCard;
