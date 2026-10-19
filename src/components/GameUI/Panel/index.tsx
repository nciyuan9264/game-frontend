import type { HTMLAttributes, ReactNode } from 'react';
import styles from './index.module.less';

export function Panel({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`${styles.panel} ${className}`} />;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>;
}

export function Feedback({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <p className={`${styles.feedback} ${error ? styles.error : ''}`} role={error ? 'alert' : 'status'}>{children}</p>;
}
