type BackGuard = (event: PopStateEvent) => void;
let activeGuard: BackGuard | undefined;

/** Install before BrowserRouter: window-target popstate uses listener registration order. */
export function installAcquireNavigationGuard() {
  const listener = (event: PopStateEvent) => activeGuard?.(event);
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
}

export function registerAcquireBackGuard(guard: BackGuard) {
  activeGuard = guard;
  return () => { if (activeGuard === guard) activeGuard = undefined; };
}
