import { useEffect, useState } from 'react';

interface FugitivePreferences {
  contrast: boolean;
  reduced: boolean;
}

const STORAGE_KEY = 'fugitive-display-preferences';
const defaults: FugitivePreferences = {
  contrast: false,
  reduced: false,
};

function loadPreferences(): FugitivePreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return {
      contrast: Boolean(stored.contrast),
      reduced: Boolean(stored.reduced),
    };
  } catch {
    return defaults;
  }
}

export function useFugitivePreferences() {
  const [preferences, setPreferences] = useState(loadPreferences);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  return {
    ...preferences,
    className: [
      preferences.contrast ? 'high-contrast' : '',
      preferences.reduced ? 'reduce-motion' : '',
    ].filter(Boolean).join(' '),
    setContrast: (contrast: boolean) =>
      setPreferences(current => ({ ...current, contrast })),
    setReduced: (reduced: boolean) =>
      setPreferences(current => ({ ...current, reduced })),
  };
}
