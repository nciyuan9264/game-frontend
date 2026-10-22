import { useEffect, useRef, type RefObject } from 'react';

function findScrollParent(element: HTMLElement): HTMLElement | Window {
  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

export function useInfiniteLoad(
  anchorRef: RefObject<HTMLElement>,
  enabled: boolean,
  loadMore: () => void,
  margin = 180
) {
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || !enabled) return;

    let frame = 0;
    const checkNearEnd = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        if (anchor.getBoundingClientRect().top <= viewportHeight + margin) {
          loadMoreRef.current();
        }
      });
    };
    const observer = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) loadMoreRef.current();
      }, { rootMargin: `${margin}px 0px` });

    observer?.observe(anchor);
    const scrollParent = findScrollParent(anchor);
    scrollParent.addEventListener('scroll', checkNearEnd, { passive: true });
    window.addEventListener('resize', checkNearEnd);
    checkNearEnd();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      scrollParent.removeEventListener('scroll', checkNearEnd);
      window.removeEventListener('resize', checkNearEnd);
    };
  }, [anchorRef, enabled, margin]);
}
