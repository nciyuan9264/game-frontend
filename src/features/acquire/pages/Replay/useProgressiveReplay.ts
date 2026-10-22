import type { Snapshot } from '@/features/game-core/model/history';
import {
  REPLAY_PAGE_SIZE,
  useProgressiveReplay as useSharedProgressiveReplay,
} from '@/hooks/useProgressiveReplay';

export { REPLAY_PAGE_SIZE };

export function useProgressiveReplay(gameID: number) {
  return useSharedProgressiveReplay<Snapshot>(gameID, 'acquire');
}
