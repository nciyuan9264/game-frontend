import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

interface Props {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}

/** Native top layer retains the Acquire theme and supplies focus trapping/inert background. */
export function ResponsiveDialog({ title, eyebrow, children, footer, onClose, wide, className = '' }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={dialogRef} aria-labelledby={titleId}
    className={`${rootStyles.root} ${styles.dialog} ${wide ? styles.wide : ''} ${className}`}
    onCancel={event => { event.preventDefault(); closeRef.current(); }}>
    <header className={styles.header}>
      <div>{eyebrow && <small>{eyebrow}</small>}<h2 id={titleId}>{title}</h2></div>
      <button type="button" aria-label="关闭面板" onClick={onClose}><X size={21} /></button>
    </header>
    <div className={styles.body}>{children}</div>
    {footer && <footer className={styles.footer}>{footer}</footer>}
  </dialog>;
}
