import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useOnitamaLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/onitama');
}
