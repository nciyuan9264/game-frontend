import type { ButtonHTMLAttributes } from 'react';
import styles from './index.module.less';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  pending?: boolean;
}

export function ActionButton({ variant = 'secondary', pending, disabled, className = '', children, ...props }: Props) {
  return <button {...props} type={props.type ?? 'button'} disabled={disabled || pending}
    aria-busy={pending || undefined} className={`${styles.button} ${styles[variant]} ${className}`}>
    {pending && <span className={styles.spinner} aria-hidden="true" />}{children}
  </button>;
}
