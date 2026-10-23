import { useEffect, useRef, type ButtonHTMLAttributes } from 'react';
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const button = buttonRef.current;
    if (!button?.textContent?.includes('创建并入座')) return;
    const rect = button.getBoundingClientRect();
    // #region debug-point A:create-button-size
    void fetch('https://api.gamebus.online/__trae-debug/room-loading-jitter/event', { method: 'POST', body: JSON.stringify({ sessionId: 'room-loading-jitter', runId: 'pre-fix', hypothesisId: 'A', location: 'components/GameUI/ActionButton', msg: '[DEBUG] Create button rendered', data: { pending: !!pending, width: rect.width, height: rect.height, childCount: button.children.length, text: button.textContent }, ts: Date.now() }) }).catch(() => {});
    // #endregion
  }, [pending]);
  return <button {...props} ref={buttonRef} data-game-action-button type={props.type ?? 'button'} disabled={disabled || pending}
    aria-busy={pending || undefined} className={`${styles.button} ${styles[variant]} ${className}`}>
    {pending && <span className={styles.spinner} aria-hidden="true" />}{children}
  </button>;
}
