import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useFugitiveLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/fugitive');
}
