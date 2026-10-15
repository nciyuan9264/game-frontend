import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAcquireBackGuard } from '../model/navigationGuard';

/** A route-local history sentinel catches browser Back without changing router type. */
export function useAcquireLeave(closeConnection: () => void) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const leaving = useRef(false);
  const sentinel = useRef(`acquire-${Date.now()}`);
  useEffect(() => {
    const mark = sentinel.current;
    const matchURL = window.location.href;
    const original = window.history.state;
    const guarded = original?.acquireGuard === mark;
    const matchState = guarded ? original : { ...original, idx: (original?.idx ?? 0) + 1, acquireGuard: mark };
    const push = () => window.history.pushState(matchState, '', matchURL);
    if (!guarded) {
      // The entry behind the sentinel is the destination, not a second live match.
      window.history.replaceState({ ...original, key: `${mark}-lobby` }, '', '/game/acquire');
      push();
    }
    const onBack = (event: PopStateEvent) => {
      if (leaving.current) return;
      // Capture before BrowserRouter consumes popstate and unmounts this session.
      event.stopImmediatePropagation();
      push(); setVisible(true);
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!leaving.current) { event.preventDefault(); event.returnValue = ''; }
    };
    const unregister = registerAcquireBackGuard(onBack);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      unregister();
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);
  const confirm = useCallback(() => {
    leaving.current = true;
    closeConnection();
    navigate(-1);
  }, [closeConnection, navigate]);
  return { visible, request: () => setVisible(true), cancel: () => setVisible(false), confirm };
}
