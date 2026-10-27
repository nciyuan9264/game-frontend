import { useSyncExternalStore } from 'react';

const mobileQuery = '(max-width: 759px)';
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const snapshot = () => window.matchMedia(mobileQuery).matches;

export function useOnitamaViewport() {
  return {
    isMobile: useSyncExternalStore(subscribe, snapshot, () => false),
  };
}
