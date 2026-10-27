import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useCantStopLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/cantstop');
}
