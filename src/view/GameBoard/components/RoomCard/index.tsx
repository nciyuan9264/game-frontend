import React from 'react';
import styles from './index.module.less';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { ListRoomInfo } from '@/types/room';
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
  const leavePlayerCount = data.roomPlayer.filter(player => !player.online).length;
  return (
    <article className={styles.card}>
      {/* header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>
            <BankOutlined />
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
            className={`${styles.chip} ${data.status === 'match' || leavePlayerCount ? styles.chipWaiting : styles.chipOngoing}`}
          >
            {data.status === 'match' || leavePlayerCount ? <HourglassOutlined /> : <PlayCircleOutlined />}
            {data.status === 'match' ? '待开始' : leavePlayerCount ? '暂停中' : '进行中'}
          </span>
        </div>
      </div>

      {/* players */}
      <div className={styles.players}>
        <div className={styles.playersMain}>
          {data.roomPlayer.length} / {6} 人 （{aiCount} 人机）
        </div>
      </div>

      {/* progress */}
      <div className={styles.progress}>
        <div className={styles.progressLabel}>
          <span>回合进度</span>
          <span>{data.status === 'match' ? '暂未开始' : `${108 - data.emptyTileCount}/${108}`}</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: data.status === 'match' ? '0%' : `${(108 - data.emptyTileCount) / 108 * 100}%` }}
          />
        </div>
      </div>

      {/* footer */}
      <div className={styles.footer}>
        <div className={styles.public}>
          <UnlockOutlined />
          公开房 · 无需密码
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
