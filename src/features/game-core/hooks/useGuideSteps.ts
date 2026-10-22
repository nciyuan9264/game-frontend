import { useCallback, useMemo, useState } from 'react';

export function useGuideSteps<T>(steps: readonly T[], initialIndex = 0) {
  const lastIndex = Math.max(0, steps.length - 1);
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), lastIndex)
  );
  const safeIndex = Math.min(index, lastIndex);

  const select = useCallback((nextIndex: number) => {
    setIndex(Math.min(Math.max(0, nextIndex), lastIndex));
  }, [lastIndex]);
  const next = useCallback(() => {
    setIndex(current => Math.min(current + 1, lastIndex));
  }, [lastIndex]);
  const previous = useCallback(() => {
    setIndex(current => Math.max(current - 1, 0));
  }, []);

  return useMemo(() => ({
    index: safeIndex,
    current: steps[safeIndex],
    isFirst: safeIndex === 0,
    isLast: safeIndex === lastIndex,
    select,
    next,
    previous,
  }), [lastIndex, next, previous, safeIndex, select, steps]);
}
