import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export const useLoveLetterLeave = (closeConnection: () => void) =>
  useGameLeave(closeConnection, '/game/loveletter');
