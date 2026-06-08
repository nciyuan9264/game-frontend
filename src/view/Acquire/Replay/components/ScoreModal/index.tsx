import React from 'react';
import { motion } from 'motion/react';
import Modal from '@/components/Modal';
import { backendName2FrontendName } from '@/util/user';
import type { PlayerResultMap } from '@/types/history';

import styles from './index.module.less';

interface ScoreModalProps {
  visible: boolean;
  result?: PlayerResultMap;
  onClose: () => void;
}

const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

const ScoreModal: React.FC<ScoreModalProps> = ({ visible, result, onClose }) => {
  const entries = result
    ? Object.entries(result).sort(
        ([, a], [, b]) => Number(b.total) - Number(a.total)
      )
    : [];

  return (
    <Modal visible={visible} onClose={onClose}>
      <div className={styles.header}>
        <div>
          <h2>📊 当前得分</h2>
          <p className={styles.subTitle}>查看实时排名</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.hint}>
          这是回放进度对应的玩家得分情况，会随时间轴变化。
        </div>

        <div className={styles.rankList}>
          {entries.length === 0 ? (
            <div className={styles.hint}>暂无得分数据</div>
          ) : (
            entries.map(([player, score], index) => {
              const bgColor = rankColors[index] || '#f0f2f5';
              const rankEmoji =
                index === 0
                  ? '🥇'
                  : index === 1
                  ? '🥈'
                  : index === 2
                  ? '🥉'
                  : '';

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
                    <span className={`${styles.money} ${styles.hideOnMobile}`}>
                      现金：${score.money}
                    </span>
                    <span className={`${styles.stocks} ${styles.hideOnMobile}`}>
                      股票：${score.stocks}
                    </span>
                    <span className={styles.total}>总得分：${score.total}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <motion.button
          type="button"
          className={styles.btn}
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          关闭弹窗
        </motion.button>
      </div>
    </Modal>
  );
};

export default ScoreModal;
