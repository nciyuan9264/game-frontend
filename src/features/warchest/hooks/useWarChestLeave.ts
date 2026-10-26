import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useWarChestLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/warchest');
}
