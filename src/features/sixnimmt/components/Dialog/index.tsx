import type { ReactNode } from 'react';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';

export function Dialog({
  title,
  eyebrow,
  children,
  footer,
  onClose = () => {},
  dismissible,
  wide,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
  wide?: boolean;
  className?: string;
}) {
  return <ResponsiveDialog
    title={title}
    eyebrow={eyebrow}
    footer={footer}
    onClose={onClose}
    dismissible={dismissible}
    wide={wide}
    className={className}
  >{children}</ResponsiveDialog>;
}
