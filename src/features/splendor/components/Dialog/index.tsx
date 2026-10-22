import type { ReactNode } from 'react';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

export function Dialog({
  title,
  eyebrow,
  children,
  footer,
  onClose,
  wide,
  className = '',
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  return <ResponsiveDialog
    title={title}
    eyebrow={eyebrow}
    footer={footer}
    onClose={onClose}
    wide={wide}
    themeClassName={rootStyles.root}
    className={`${styles.dialog} ${className}`}
  >
    {children}
  </ResponsiveDialog>;
}
