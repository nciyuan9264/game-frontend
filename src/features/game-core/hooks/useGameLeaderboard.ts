import { useCallback } from 'react';
import { getLeaderboard } from '../api/history';
import type {
  HistoryGameType,
  LeaderboardEntry,
  LeaderboardSortDim,
} from '../model/history';
import { usePagedCollection } from './usePagedCollection';

interface UseGameLeaderboardOptions<TEntry extends LeaderboardEntry> {
  gameType: HistoryGameType;
  pageSize: number;
  sort: LeaderboardSortDim;
  isEntry?: (entry: LeaderboardEntry) => entry is TEntry;
}

const allEntries = <TEntry extends LeaderboardEntry>(
  entry: LeaderboardEntry
): entry is TEntry => Boolean(entry);

export function useGameLeaderboard<TEntry extends LeaderboardEntry = LeaderboardEntry>({
  gameType,
  pageSize,
  sort,
  isEntry = allEntries,
}: UseGameLeaderboardOptions<TEntry>) {
  const loadPage = useCallback(async ({
    offset,
    limit,
    signal,
  }: {
    offset: number;
    limit: number;
    signal: AbortSignal;
  }) => {
    const result = await getLeaderboard({ gameType, limit, offset, sort, signal });
    return (result.entries ?? []).filter(isEntry);
  }, [gameType, isEntry, sort]);
  const getKey = useCallback((entry: TEntry) => entry.userID, []);
  const collection = usePagedCollection({
    queryKey: `${gameType}:${sort}`,
    pageSize,
    loadPage,
    getKey,
  });

  return { ...collection, entries: collection.items };
}
