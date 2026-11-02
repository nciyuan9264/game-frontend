import { GetResultCard } from '@/api/generated/game-platform';
import type { GameType } from '@/hooks/useGameType';
import { toResultCardModel, type ResultCardModel } from './model';

export async function getResultCard(
  gameType: GameType,
  matchID: string,
  signal?: AbortSignal,
): Promise<ResultCardModel> {
  const response = await GetResultCard(
    { match_id: matchID, game_type: gameType },
    { signal },
  );
  return toResultCardModel(response.data, gameType);
}
