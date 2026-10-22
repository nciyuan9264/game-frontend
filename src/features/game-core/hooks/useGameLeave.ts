import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerGameBackGuard } from '../model/navigationGuard';

export function useGameLeave(
  closeConnection: () => void,
  lobbyPath: string
) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const leavingRef = useRef(false);
  const sentinelRef = useRef(`game-leave-${Date.now()}`);

  useEffect(() => {
    const mark = sentinelRef.current;
    const matchURL = window.location.href;
    const originalState = window.history.state;
    const guarded = originalState?.gameLeaveGuard === mark;
    const matchState = guarded
      ? originalState
      : {
        ...originalState,
        idx: (originalState?.idx ?? 0) + 1,
        gameLeaveGuard: mark,
      };
    const restoreMatchEntry = () => {
      window.history.pushState(matchState, '', matchURL);
    };

    if (!guarded) {
      window.history.replaceState(
        { ...originalState, key: `${mark}-lobby` },
        '',
        lobbyPath
      );
      restoreMatchEntry();
    }
    const onBack = (event: PopStateEvent) => {
      if (leavingRef.current) return;
      event.stopImmediatePropagation();
      restoreMatchEntry();
      setVisible(true);
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    const unregisterBackGuard = registerGameBackGuard(onBack);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      unregisterBackGuard();
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [lobbyPath]);

  const request = useCallback(() => setVisible(true), []);
  const cancel = useCallback(() => setVisible(false), []);
  const confirm = useCallback(() => {
    leavingRef.current = true;
    closeConnection();
    navigate(-1);
  }, [closeConnection, navigate]);

  return { visible, request, cancel, confirm };
}
