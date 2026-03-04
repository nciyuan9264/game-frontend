import React from 'react';
import { Modal as AntModal } from 'antd';
import { WsRoomSyncData } from '@/types/room';
import { backendName2FrontendName } from '@/util/user';
import { motion } from 'motion/react';
import Modal from '@/components/Modal';

import styles from './index.module.less';

interface GameEndProps {
  visible: boolean;
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  data?: WsRoomSyncData;
  sendMessage: (message: string) => void;
  userID: string;
}

const GameEnd: React.FC<GameEndProps> = ({
  visible,
  setGameEndModalVisible,
  data,
  sendMessage,
  userID
}) => {
  const isOwner = data?.ownerID === userID;

  const handleRestart = () => {
    setGameEndModalVisible(false);
    AntModal.confirm({
      title: '游戏即将重启',
      content: '游戏即将重启，是否确认？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        sendMessage(JSON.stringify({
          type: 'game_restart_game',
        }));
      },
    });
  };

  const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

  if (!data?.result) return null;

  return (
    <Modal
      visible={visible}
    >
      <div className={styles.header}>
        <div>
          <h2>🏁 游戏结算</h2>
          <p className={styles.subTitle}>
            查看最终排名
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.hint}>
          {isOwner ? '游戏已结束，请查看您的排名。\n 确认玩家无异议后可点击再来一局按钮。' : '游戏已结束，请查看您的排名。\n 请等待房主开启下一局游戏。'}
        </div>

        <div className={styles.rankList}>
          {Object.entries(data.result)
            .sort(([, scoreA], [, scoreB]) => Number(scoreB.total) - Number(scoreA.total))
            .map(([player, score], index) => {
              const bgColor = rankColors[index] || '#f0f2f5';
              const rankEmoji =
                index === 0 ? '🥇' :
                  index === 1 ? '🥈' :
                    index === 2 ? '🥉' : '';

              return (
                <motion.div
                  key={player}
                  layout
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                  className={styles.rankItem}
                  style={{ backgroundColor: bgColor }}
                >
                  <div className={styles.rankInfo}>
                    {rankEmoji && (
                      <span className={styles.rankEmoji}>{rankEmoji}</span>
                    )}
                    <span className={styles.rankText}>
                      第{index + 1}名：
                      <span className={styles.playerName}>
                        {backendName2FrontendName(player)}
                      </span>
                    </span>
                  </div>
                  <div className={styles.score}>
                    <span className={`${styles.money} ${styles.hideOnMobile}`}>现金：${score.money}</span>
                    <span className={`${styles.stocks} ${styles.hideOnMobile}`}>股票：${score.stocks}</span>
                    <span className={styles.total}>总得分：${score.total}</span>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>

      <div className={styles.footer}>
        <motion.button
          className={styles.btn}
          onClick={() => setGameEndModalVisible(false)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          关闭弹窗
        </motion.button>
        {isOwner && (
          <motion.button
            className={`${styles.btn} ${styles.primaryBtn}`}
            onClick={handleRestart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            再来一局
          </motion.button>
        )}
      </div>
    </Modal>
  );
};

export default GameEnd;
