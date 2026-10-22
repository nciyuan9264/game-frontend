import type { ButtonHTMLAttributes } from 'react';
import styles from './index.module.less';

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  pending?: boolean;
}

export function ActionButton({
  variant = 'secondary',
  pending,
  disabled,
  className = '',
  children,
  ...props
}: ActionButtonProps) {
  return <button {...props} data-game-action-button type={props.type ?? 'button'} disabled={disabled || pending}
    aria-busy={pending || undefined} className={`${styles.button} ${styles[variant]} ${className}`}>
    {pending && <span className={styles.spinner} aria-hidden="true" />}{children}
  </button>;
}
