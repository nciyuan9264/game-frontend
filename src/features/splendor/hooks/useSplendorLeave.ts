import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useSplendorLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/splendor');
}
