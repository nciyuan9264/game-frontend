import { useGameLeave } from '@/features/game-core/hooks/useGameLeave';

export const useForSaleLeave = (close: () => void) =>
  useGameLeave(close, '/game/forsale');
