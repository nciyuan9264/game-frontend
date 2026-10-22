import { useCallback } from 'react';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { getMyStats } from '../api/history';
import type { HistoryGameType } from '../model/history';

export function useGameStats(gameType: HistoryGameType) {
  const load = useCallback(() => getMyStats(gameType), [gameType]);
  return useAsyncResource(load);
}
