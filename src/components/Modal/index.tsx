import styles from './index.module.less';
import { AnimatePresence, motion } from 'motion/react';

const Modal = ({
  children,
  visible,
  onClose
}: {
  children: React.ReactNode,
  visible: boolean,
  onClose?: () => void,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="modal-wrapper" style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          {/* 背景遮罩 */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
