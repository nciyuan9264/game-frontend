import React from 'react';
import { motion } from 'motion/react';
import Modal from '@/components/Modal';

import styles from './index.module.less';

interface PlaceTileConfirmProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tileKey: string;
}

const PlaceTileConfirm: React.FC<PlaceTileConfirmProps> = ({
  visible,
  onClose,
  onConfirm,
  tileKey,
}) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
    >
      <div className={styles.header}>
        <div>
          <h2>🎯 确认操作</h2>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.hint}>
          你确定要放置这个 tile 吗？
        </div>
        <div className={styles.tileKey}>
          {tileKey}
        </div>
      </div>

      <div className={styles.footer}>
        <motion.button
          className={styles.btn}
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          取消
        </motion.button>
        <motion.button
          className={`${styles.btn} ${styles.primaryBtn}`}
          onClick={onConfirm}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          确认
        </motion.button>
      </div>
    </Modal>
  );
};

export default PlaceTileConfirm;
