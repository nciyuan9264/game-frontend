import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useOthelloLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/othello');
}
