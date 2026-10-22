import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useAcquireLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/acquire');
}
