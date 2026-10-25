import { useSyncExternalStore } from 'react';

export interface YinshPreferences {
  coordinates: boolean;
  hints: boolean;
  confirmMoves: boolean;
  quickMotion: boolean;
  motionMode: 'system' | 'full' | 'reduced';
}

const STORAGE_KEY = 'yinsh-display-preferences';
const defaults: YinshPreferences = {
  coordinates: true,
  hints: true,
  confirmMoves: false,
  quickMotion: false,
  motionMode: 'system',
};
const listeners = new Set<() => void>();
const mediaListeners = new Set<() => void>();
let current = readPreferences();

function readPreferences(): YinshPreferences {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return defaults;
    const record = value as Record<string, unknown>;
    return {
      coordinates: typeof record.coordinates === 'boolean'
        ? record.coordinates
        : defaults.coordinates,
      hints: typeof record.hints === 'boolean' ? record.hints : defaults.hints,
      confirmMoves: typeof record.confirmMoves === 'boolean'
        ? record.confirmMoves
        : defaults.confirmMoves,
      quickMotion: typeof record.quickMotion === 'boolean'
        ? record.quickMotion
        : defaults.quickMotion,
      motionMode: record.motionMode === 'system'
        || record.motionMode === 'full'
        || record.motionMode === 'reduced'
        ? record.motionMode
        : typeof record.reduceMotion === 'boolean'
          ? record.reduceMotion ? 'reduced' : 'full'
          : defaults.motionMode,
    };
  } catch {
    return defaults;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(patch: Partial<YinshPreferences>) {
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Keep the active tab preference when storage is unavailable.
  }
  listeners.forEach(listener => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return;
    current = readPreferences();
    listeners.forEach(listener => listener());
  });
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  media?.addEventListener('change', () => {
    mediaListeners.forEach(listener => listener());
  });
}

export function useYinshPreferences() {
  const preferences = useSyncExternalStore(
    subscribe,
    () => current,
    () => defaults,
  );
  const systemReduced = useSyncExternalStore(
    listener => {
      mediaListeners.add(listener);
      return () => mediaListeners.delete(listener);
    },
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    () => false,
  );
  const reduceMotion = preferences.motionMode === 'system'
    ? systemReduced
    : preferences.motionMode === 'reduced';
  return {
    ...preferences,
    reduceMotion,
    followsSystemMotion: preferences.motionMode === 'system',
    systemReducedMotion: systemReduced,
    setCoordinates: (value: boolean) => update({ coordinates: value }),
    setHints: (value: boolean) => update({ hints: value }),
    setConfirmMoves: (value: boolean) => update({ confirmMoves: value }),
    setQuickMotion: (value: boolean) => update({ quickMotion: value }),
    setReduceMotion: (value: boolean) => update({
      motionMode: value ? 'reduced' : 'full',
    }),
    followSystemMotion: () => update({ motionMode: 'system' }),
  };
}
