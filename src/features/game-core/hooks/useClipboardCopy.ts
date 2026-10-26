import { useCallback, useState } from 'react';

export function useClipboardCopy() {
  const [copiedValue, setCopiedValue] = useState('');

  const copy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      return true;
    } catch {
      setCopiedValue('');
      return false;
    }
  }, []);

  const reset = useCallback(() => setCopiedValue(''), []);

  return {
    copiedValue,
    copy,
    reset,
  };
}
