import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useSixNimmtLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/sixnimmt');
}
