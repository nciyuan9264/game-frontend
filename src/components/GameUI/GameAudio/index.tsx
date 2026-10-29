import { useEffect } from 'react';
import {
  resolveClickEventSound,
  type ClickSound,
  type ClickSoundPlayer,
} from '../ClickFeedback';

export type GameSound =
  | 'ui-click'
  | 'button-click'
  | 'tab-click'
  | 'game-select'
  | 'game-place'
  | 'game-confirm'
  | 'game-resource'
  | 'tile-select'
  | 'tile-place'
  | 'create-company'
  | 'stock-buy';

interface SoundDefinition {
  url: string;
  volume: number;
}

const soundDefinitions: Record<GameSound, SoundDefinition> = {
  'ui-click': { url: '/game-sounds/ui-click.mp3', volume: 0.36 },
  'button-click': { url: '/game-sounds/button-click.mp3', volume: 0.5 },
  'tab-click': { url: '/game-sounds/tab-click.mp3', volume: 0.5 },
  'game-select': { url: '/game-sounds/tile-select.mp3', volume: 0.5 },
  'game-place': { url: '/game-sounds/tile-place.mp3', volume: 0.5 },
  'game-confirm': { url: '/game-sounds/create-company.mp3', volume: 0.5 },
  'game-resource': { url: '/game-sounds/stock-buy.mp3', volume: 0.5 },
  'tile-select': { url: '/game-sounds/tile-select.mp3', volume: 0.5 },
  'tile-place': { url: '/game-sounds/tile-place.mp3', volume: 0.5 },
  'create-company': { url: '/game-sounds/create-company.mp3', volume: 0.5 },
  'stock-buy': { url: '/game-sounds/stock-buy.mp3', volume: 0.5 },
};

const audioCache = new Map<string, HTMLAudioElement>();

export const playGameSound: ClickSoundPlayer = (sound: ClickSound) => {
  if (typeof Audio === 'undefined') return;
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) return;
  const definition = soundDefinitions[sound as GameSound];
  if (!definition) return;
  try {
    const audio = audioCache.get(definition.url) ?? new Audio(definition.url);
    audioCache.set(definition.url, audio);
    audio.preload = 'auto';
    audio.volume = definition.volume;
    audio.currentTime = 0;
    const result = audio.play();
    void result.catch(() => undefined);
  } catch {
    // Browsers can reject audio until the user has interacted with the page.
  }
};

export function GameAudio({
  soundPlayer = playGameSound,
}: {
  soundPlayer?: ClickSoundPlayer;
}) {
  useEffect(() => {
    const handleClick = (event: Event) => {
      const sound = resolveClickEventSound(event);
      if (sound) soundPlayer(sound);
    };
    document.addEventListener('click', handleClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [soundPlayer]);

  return null;
}
