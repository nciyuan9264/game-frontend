import type { ReactNode } from 'react';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';

export function Dialog({
  title,
  eyebrow,
  children,
  footer,
  onClose = () => {},
  wide,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  wide?: boolean;
  className?: string;
}) {
  return <ResponsiveDialog
    title={title}
    eyebrow={eyebrow}
    footer={footer}
    onClose={onClose}
    wide={wide}
    className={className}
  >{children}</ResponsiveDialog>;
}
