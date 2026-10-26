import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useQuoridorLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/quoridor');
}
