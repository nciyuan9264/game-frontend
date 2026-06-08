import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/Button';

import styles from './index.module.less';

export interface ConfirmDialogProps {
  visible: boolean;
  title: ReactNode;
  content?: ReactNode;
  okText?: ReactNode;
  cancelText?: ReactNode;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  visible,
  title,
  content,
  okText = '确认',
  cancelText = '取消',
  danger,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div className={styles.wrapper} key="confirm-dialog" onClick={(event) => event.stopPropagation()}>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          >
            <div className={styles.body}>
              <h3 id="confirm-dialog-title" className={styles.title}>
                {title}
              </h3>
              {content && <div className={styles.content}>{content}</div>}
            </div>
            <div className={styles.actions}>
              <Button className={styles.cancelButton} onClick={onCancel} disabled={loading}>
                {cancelText}
              </Button>
              <Button
                className={`${styles.confirmButton} ${danger ? styles.dangerButton : ''}`}
                customType={danger ? 'default' : 'primary'}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? '处理中...' : okText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
