import { useLayoutEffect, useState } from 'react';
import type { PositionAnalysis } from '../model/types';

interface CachedAnalysis {
  scopeKey: string;
  value: PositionAnalysis;
}

export function useLastReadyPositionAnalysis(
  analysis: PositionAnalysis | undefined,
  scopeKey: string,
) {
  const [cached, setCached] = useState<CachedAnalysis>();

  useLayoutEffect(() => {
    if (analysis?.status === 'ready') {
      setCached({ scopeKey, value: analysis });
    }
  }, [analysis, scopeKey]);

  if (analysis?.status === 'ready') return analysis;
  return cached?.scopeKey === scopeKey ? cached.value : undefined;
}
