import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useGameLeave(
  closeConnection: () => void,
  lobbyPath: string
) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);

  const request = useCallback(() => setVisible(true), []);
  const cancel = useCallback(() => setVisible(false), []);
  const confirm = useCallback(() => {
    leavingRef.current = true;
    closeConnection();
    navigate(lobbyPath, { replace: true });
  }, [closeConnection, lobbyPath, navigate]);

  return { visible, request, cancel, confirm };
}
