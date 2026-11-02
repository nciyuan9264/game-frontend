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
  'ui-click': { url: '/game-sounds/ui-click.mp3', volume: 0.3 },
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

const canUseAudio = () => (
  typeof Audio !== 'undefined'
  && !(typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom'))
);

const getOrCreateAudio = (definition: SoundDefinition) => {
  const cachedAudio = audioCache.get(definition.url);
  if (cachedAudio) return cachedAudio;

  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = definition.url;
  audio.volume = definition.volume;
  audioCache.set(definition.url, audio);
  audio.load();
  return audio;
};

const preloadGameSounds = () => {
  if (!canUseAudio()) return;

  const definitionsByUrl = new Map(
    Object.values(soundDefinitions).map((definition) => [definition.url, definition]),
  );
  definitionsByUrl.forEach((definition) => {
    try {
      getOrCreateAudio(definition);
    } catch {
      // A failed preload should not prevent the application from starting.
    }
  });
};

export const playGameSound: ClickSoundPlayer = (sound: ClickSound) => {
  if (!canUseAudio()) return;
  const definition = soundDefinitions[sound as GameSound];
  if (!definition) return;
  try {
    const audio = getOrCreateAudio(definition);
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
    preloadGameSounds();

    const handleClick = (event: Event) => {
      const sound = resolveClickEventSound(event);
      if (sound) soundPlayer(sound);
    };
    document.addEventListener('click', handleClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [soundPlayer]);

  return null;
}
