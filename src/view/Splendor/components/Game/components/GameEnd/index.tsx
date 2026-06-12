import React from 'react';
import { motion } from 'motion/react';
import Modal from '@/components/Modal';
import { backendName2FrontendName } from '@/util/user';
import { useConfirmDialog } from '@/components/ConfirmDialog/useConfirmDialog';
import { SplendorPlayerData, SplendorWsRoomSyncData } from '@/types/SplendorRoom';
import { isOwner } from '../../utils/game';
import styles from './index.module.less';

interface GameEndProps {
  visible: boolean;
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  data?: SplendorWsRoomSyncData;
  sendMessage: (message: string) => void;
  userID: string;
}

const getNobleScore = (player: SplendorPlayerData) =>
  player.nobleCard.reduce((acc, card) => acc + card.points, 0);

const rankMedals = ['🥇', '🥈', '🥉'];

const GameEnd: React.FC<GameEndProps> = ({
  visible,
  setGameEndModalVisible,
  data,
  sendMessage,
  userID,
}) => {
  const { confirm, ConfirmDialogHolder } = useConfirmDialog();
  const canRestart = isOwner(data, userID);

  const ranked = Object.entries(data?.playerData ?? {}).sort(([, a], [, b]) => {
    if (a.score === b.score) {
      return getNobleScore(b) - getNobleScore(a);
    }
    return b.score - a.score;
  });

  const handleRestart = async () => {
    setGameEndModalVisible(false);
    const ok = await confirm({
      title: '游戏即将重启',
      content: '游戏即将重启，是否确认？',
      okText: '确认',
      cancelText: '取消',
      danger: true,
    });
    if (!ok) return;
    sendMessage(JSON.stringify({ type: 'game_restart_game' }));
  };

  if (!data || ranked.length === 0) return null;

  const [championID, champion] = ranked[0];

  return (
    <>
      <Modal visible={visible} onClose={() => setGameEndModalVisible(false)}>
        <div className={styles.root}>
          <div className={styles.header}>
            <h2 className={styles.title}>👑 游戏结算</h2>
            <p className={styles.subTitle}>最终荣耀排名</p>
          </div>

          <motion.div
            className={styles.champion}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <span className={styles.crown}>🏆</span>
            <div className={styles.championInfo}>
              <span className={styles.championLabel}>本局冠军</span>
              <span className={styles.championName}>
                {backendName2FrontendName(championID)}
              </span>
            </div>
            <span className={styles.championScore}>{champion.score}</span>
          </motion.div>

          <div className={styles.content}>
            <div className={styles.hint}>
              {canRestart
                ? '游戏已结束，确认玩家无异议后可点击「再来一局」。'
                : '游戏已结束，请等待房主开启下一局游戏。'}
            </div>

            <div className={styles.rankList}>
              {ranked.map(([playerID, player], index) => {
                const nobleScore = getNobleScore(player);
                const cardScore = player.score - nobleScore;
                return (
                  <motion.div
                    key={playerID}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                      delay: index * 0.08,
                    }}
                    className={`${styles.rankItem} ${index === 0 ? styles.first : ''}`}
                  >
                    <div className={styles.rankInfo}>
                      <span className={styles.medal}>
                        {rankMedals[index] || `#${index + 1}`}
                      </span>
                      <div className={styles.nameBlock}>
                        <span className={styles.rankNo}>第 {index + 1} 名</span>
                        <span className={styles.playerName}>
                          {backendName2FrontendName(playerID)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.metrics}>
                      <span className={styles.metric}>
                        发展卡 <em>{cardScore}</em> 分
                      </span>
                      <span className={styles.metric}>
                        贵族 <em>{nobleScore}</em> 分
                      </span>
                      <span className={styles.metric}>
                        卡牌 <em>{player.normalCard.length}</em> 张
                      </span>
                      <span className={styles.metric}>
                        贵族 <em>{player.nobleCard.length}</em> 位
                      </span>
                    </div>

                    <div className={styles.total}>
                      <span className={styles.totalValue}>{player.score}</span>
                      <span className={styles.totalLabel}>总分</span>
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
            {canRestart && (
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
        </div>
      </Modal>
      {ConfirmDialogHolder}
    </>
  );
};

export default GameEnd;
