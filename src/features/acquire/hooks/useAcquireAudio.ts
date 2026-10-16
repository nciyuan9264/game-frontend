export type AcquireSound = 'ui-click' | 'button-click' | 'tab-click' | 'tile-select' | 'tile-place' | 'create-company' | 'stock-buy';

const soundUrls: Record<AcquireSound, string> = {
  'ui-click': '/acquire-sounds/ui-click.mp3',
  'button-click': '/acquire-sounds/button-click.mp3',
  'tab-click': '/acquire-sounds/tab-click.mp3',
  'tile-select': '/acquire-sounds/tile-select.mp3',
  'tile-place': '/acquire-sounds/tile-place.mp3',
  'create-company': '/acquire-sounds/create-company.mp3',
  'stock-buy': '/acquire-sounds/stock-buy.mp3',
};

const soundVolumes: Record<AcquireSound, number> = {
  'ui-click': 0.36,
  'button-click': 0.5,
  'tab-click': 0.5,
  'tile-select': 0.5,
  'tile-place': 0.5,
  'create-company': 0.5,
  'stock-buy': 0.5,
};

const audioCache: Partial<Record<AcquireSound, HTMLAudioElement>> = {};

export function playAcquireSound(sound: AcquireSound) {
  if (typeof Audio === 'undefined') return;
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) return;
  try {
    const audio = audioCache[sound] ?? new Audio(soundUrls[sound]);
    audioCache[sound] = audio;
    audio.preload = 'auto';
    audio.volume = soundVolumes[sound];
    audio.currentTime = 0;
    const result = audio.play();
    void result.catch(() => undefined);
  } catch {
    // Browsers can reject audio until the user has interacted with the page.
  }
}
