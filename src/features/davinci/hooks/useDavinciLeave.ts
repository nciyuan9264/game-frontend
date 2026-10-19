import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useDavinciLeave(closeConnection: () => void) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const leaving = useRef(false);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (leaving.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  const confirm = useCallback(() => {
    leaving.current = true;
    closeConnection();
    navigate('/game/davinci');
  }, [closeConnection, navigate]);

  return {
    visible,
    request: () => setVisible(true),
    cancel: () => setVisible(false),
    confirm,
  };
}
