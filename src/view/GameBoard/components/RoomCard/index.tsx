import React from 'react';
import styles from './index.module.less';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { ListRoomInfo } from '@/types/AcquireRoom';
import { BankOutlined, HourglassOutlined, LoginOutlined, PlayCircleOutlined, UnlockOutlined } from '@ant-design/icons';
import { backendName2FrontendName } from '@/util/user';
import { GameType } from '@/hooks/useGameType';
import { Button } from '@/components/Button';

interface RoomCardProps {
  data: ListRoomInfo;
  gameType: GameType;
  userID: string;
}

const RoomCard: React.FC<RoomCardProps> = ({ data, gameType, userID }) => {
  const navigate = useNavigate();
  const aiCount = data.roomPlayer.filter(player => player.ai).length;
  const maxPlayers = data.maxPlayers || 6;
  const isAcquire = gameType === 'acquire';
  const isMatching = data.status === 'match';
  const isEnded = data.status === 'end';
  const progressText = isEnded
    ? '已结束'
    : isAcquire
      ? isMatching
        ? '匹配中'
        : `${108 - data.emptyTileCount}/${108}`
      : isMatching
        ? '匹配中'
        : `${26 - data.boardCardCount}/${26}`;
  const progressPercent = isAcquire
    ? isMatching
      ? 0
      : ((108 - data.emptyTileCount) / 108) * 100
    : isMatching
      ? 0
      : ((26 - data.boardCardCount) / 26) * 100
  return (
    <article className={styles.card}>
      {/* header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>
            {isAcquire ? <BankOutlined /> : <PlayCircleOutlined />}
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
          <span>{isAcquire ? '地块进度' : '对局状态'}</span>
          <span>{progressText}</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{
              width: `${progressPercent}%`,
              background: isAcquire
                ? 'linear-gradient(90deg, #0b3a3f, #00b3a6)'
                : 'linear-gradient(90deg, #3b1d68, #f59e0b)',
            }}
          />
        </div>
      </div>

      {/* footer */}
      <div className={styles.footer}>
        <div className={styles.public}>
          <UnlockOutlined />
          {isAcquire ? '公开房 · 无需密码' : '推理房 · 无需密码'}
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
                if (data.roomPlayer.length < 6) {
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
