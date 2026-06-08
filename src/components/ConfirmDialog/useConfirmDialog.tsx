import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '.';

export interface ConfirmOptions {
  title: ReactNode;
  content?: ReactNode;
  okText?: ReactNode;
  cancelText?: ReactNode;
  danger?: boolean;
}

export function useConfirmDialog() {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const close = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    resolverRef.current?.(false);
    setOptions(nextOptions);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const ConfirmDialogHolder = useMemo(() => (
    <ConfirmDialog
      visible={Boolean(options)}
      title={options?.title}
      content={options?.content}
      okText={options?.okText}
      cancelText={options?.cancelText}
      danger={options?.danger}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    />
  ), [close, options]);

  return {
    confirm,
    ConfirmDialogHolder,
  };
}
