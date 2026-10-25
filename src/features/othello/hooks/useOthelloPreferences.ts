import { useSyncExternalStore } from 'react';

export interface OthelloPreferences {
  coordinates: boolean;
  hints: boolean;
  confirmMoves: boolean;
  reduceMotion: boolean;
}

const STORAGE_KEY = 'othello-display-preferences';
const defaults: OthelloPreferences = {
  coordinates: true,
  hints: true,
  confirmMoves: false,
  reduceMotion: false,
};
const listeners = new Set<() => void>();
let current = readPreferences();

function readPreferences(): OthelloPreferences {
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
      reduceMotion: typeof record.reduceMotion === 'boolean'
        ? record.reduceMotion
        : defaults.reduceMotion,
    };
  } catch {
    return defaults;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(patch: Partial<OthelloPreferences>) {
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
}

export function useOthelloPreferences() {
  const preferences = useSyncExternalStore(
    subscribe,
    () => current,
    () => defaults,
  );
  return {
    ...preferences,
    setCoordinates: (value: boolean) => update({ coordinates: value }),
    setHints: (value: boolean) => update({ hints: value }),
    setConfirmMoves: (value: boolean) => update({ confirmMoves: value }),
    setReduceMotion: (value: boolean) => update({ reduceMotion: value }),
  };
}
