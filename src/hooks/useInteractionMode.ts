import { useEffect, useState } from 'react';

type DropdownTrigger = ('click' | 'hover')[];

const finePointerQuery = '(hover: hover) and (pointer: fine)';

const getIsFinePointer = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(finePointerQuery).matches;
};

export function useInteractionMode() {
  const [isFinePointer, setIsFinePointer] = useState(getIsFinePointer);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(finePointerQuery);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsFinePointer(event.matches);
    };

    setIsFinePointer(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const dropdownTrigger: DropdownTrigger = isFinePointer ? ['hover'] : ['click'];

  return {
    isFinePointer,
    dropdownTrigger,
  };
}
