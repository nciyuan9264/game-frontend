import { useEffect, useState } from 'react';

export type UIState = 'idle' | 'adding' | 'success';

export function useSeatUIState() {
  const [uiState, setUIState] = useState<UIState>('idle');

  // success 状态 2 秒后自动回 idle
  useEffect(() => {
    if (uiState === 'success') {
      const timer = setTimeout(() => {
        setUIState('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [uiState]);

  return {
    uiState,
    setIdle: () => setUIState('idle'),
    setAdding: () => setUIState('adding'),
    setSuccess: () => setUIState('success'),
  };
}
