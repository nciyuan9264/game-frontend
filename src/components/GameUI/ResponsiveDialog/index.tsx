import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { ClickFeedback } from '../ClickFeedback';
import rootStyles from '../styles/root.module.less';
import styles from './index.module.less';

export interface ResponsiveDialogProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
  themeClassName?: string;
}

export function ResponsiveDialog({
  title,
  eyebrow,
  children,
  footer,
  onClose,
  wide,
  className = '',
  themeClassName = '',
}: ResponsiveDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog?.showModal();
    dialog?.focus({ preventScroll: true });
    return () => {
      if (dialog?.open) dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={dialogRef} aria-labelledby={titleId} tabIndex={-1}
    className={`${rootStyles.root} ${themeClassName} ${styles.dialog} ${wide ? styles.wide : ''} ${className}`}
    onCancel={event => { event.preventDefault(); closeRef.current(); }}>
    <header className={styles.header}>
      <div>{eyebrow && <small>{eyebrow}</small>}<h2 id={titleId}>{title}</h2></div>
      <button type="button" aria-label="关闭面板" onClick={onClose}><X size={21} /></button>
    </header>
    <div className={styles.body}>{children}</div>
    {footer && <footer className={styles.footer}>{footer}</footer>}
    <ClickFeedback scopeRef={dialogRef} playSound={false} className={styles.feedbackLayer} />
  </dialog>;
}
