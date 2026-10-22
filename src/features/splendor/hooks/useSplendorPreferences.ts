import { useSyncExternalStore } from 'react';

export interface SplendorPreferences {
  highContrast: boolean;
  reduceMotion: boolean;
}

const STORAGE_KEY = 'splendor-display-preferences';
const defaults: SplendorPreferences = { highContrast: false, reduceMotion: false };
const listeners = new Set<() => void>();
let current = readPreferences();

function readPreferences(): SplendorPreferences {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return defaults;
    const record = value as Record<string, unknown>;
    if (typeof record.highContrast !== 'boolean' || typeof record.reduceMotion !== 'boolean') return defaults;
    return { highContrast: record.highContrast, reduceMotion: record.reduceMotion };
  } catch {
    return defaults;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(patch: Partial<SplendorPreferences>) {
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // The active tab still keeps the preference when storage is unavailable.
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

export function useSplendorPreferences() {
  const preferences = useSyncExternalStore(subscribe, () => current, () => defaults);
  return {
    ...preferences,
    setHighContrast: (value: boolean) => update({ highContrast: value }),
    setReduceMotion: (value: boolean) => update({ reduceMotion: value }),
  };
}
