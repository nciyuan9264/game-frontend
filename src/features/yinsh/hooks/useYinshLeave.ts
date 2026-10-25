import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useYinshLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/yinsh');
}
