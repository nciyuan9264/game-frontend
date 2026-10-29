import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

const mediaQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_QUERY)
    : undefined;

const subscribe = (onChange: () => void) => {
  const media = mediaQuery();
  if (!media) return () => undefined;
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

const getSnapshot = () => mediaQuery()?.matches ?? false;

export function useMobileViewport() {
  return {
    isMobile: useSyncExternalStore(subscribe, getSnapshot, () => false),
  };
}
