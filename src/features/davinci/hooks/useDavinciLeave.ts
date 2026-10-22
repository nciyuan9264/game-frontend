import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export function useDavinciLeave(closeConnection: () => void) {
  return useGameLeave(closeConnection, '/game/davinci');
}
