import { FC, useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './index.module.less';

export type GameMessageType = 'success' | 'error' | 'warning' | 'info';

export interface GameMessageItem {
  id: number;
  type: GameMessageType;
  content: string;
}

type Listener = (item: Omit<GameMessageItem, 'id'>) => void;
let listener: Listener | null = null;
let nextId = 1;

const push = (type: GameMessageType, content: string) => {
  if (listener) listener({ type, content });
};

export const gameMessage = {
  success: (content: string) => push('success', content),
  error: (content: string) => push('error', content),
  warning: (content: string) => push('warning', content),
  info: (content: string) => push('info', content),
};

const ICON_MAP: Record<GameMessageType, JSX.Element> = {
  success: <CheckCircle2 className={styles.icon} />,
  error: <XCircle className={styles.icon} />,
  warning: <AlertTriangle className={styles.icon} />,
  info: <Info className={styles.icon} />,
};

const DURATION = 2200;

export const GameMessageHost: FC = () => {
  const [items, setItems] = useState<GameMessageItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(it => it.id !== id));
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    listener = (item) => {
      const id = nextId++;
      setItems(prev => [...prev, { id, ...item }]);
      const timer = setTimeout(() => remove(id), DURATION);
      timersRef.current.set(id, timer);
    };
    return () => {
      listener = null;
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current.clear();
    };
  }, [remove]);

  return (
    <div className={styles.host}>
      <AnimatePresence>
        {items.map(it => (
          <motion.div
            key={it.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.92 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`${styles.toast} ${styles[it.type]}`}
          >
            <span className={styles.iconWrap}>{ICON_MAP[it.type]}</span>
            <span className={styles.content}>{it.content}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
