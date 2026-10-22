import { useCallback } from 'react';
import { listMyGames } from '../api/history';
import type {
  Game,
  HistoryGameType,
} from '../model/history';
import { usePagedCollection } from './usePagedCollection';

interface UseGameHistoryOptions {
  gameType: HistoryGameType;
  pageSize: number;
}

export function useGameHistory({ gameType, pageSize }: UseGameHistoryOptions) {
  const loadPage = useCallback(async ({
    offset,
    limit,
    signal,
  }: {
    offset: number;
    limit: number;
    signal: AbortSignal;
  }) => {
    const result = await listMyGames({ gameType, limit, offset, signal });
    return result.games ?? [];
  }, [gameType]);
  const getKey = useCallback((game: Game) => game.id, []);
  const collection = usePagedCollection({
    queryKey: gameType,
    pageSize,
    loadPage,
    getKey,
  });

  return { ...collection, games: collection.items };
}
