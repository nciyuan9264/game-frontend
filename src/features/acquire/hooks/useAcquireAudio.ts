import { playGameSound } from '@/components/GameUI/GameAudio';

export type AcquireSound =
  | 'ui-click'
  | 'button-click'
  | 'tab-click'
  | 'tile-select'
  | 'tile-place'
  | 'create-company'
  | 'stock-buy';

export const playAcquireSound = (sound: AcquireSound) => playGameSound(sound);
