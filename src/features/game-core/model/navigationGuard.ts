type BackGuard = (event: PopStateEvent) => void;

let activeGuard: BackGuard | undefined;

/** Install before BrowserRouter so the active match can intercept Back first. */
export function installGameNavigationGuard() {
  const listener = (event: PopStateEvent) => activeGuard?.(event);
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
}

export function registerGameBackGuard(guard: BackGuard) {
  activeGuard = guard;
  return () => {
    if (activeGuard === guard) activeGuard = undefined;
  };
}
