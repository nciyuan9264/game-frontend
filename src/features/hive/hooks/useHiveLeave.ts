import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useHiveLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/hive');
}
