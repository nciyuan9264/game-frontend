import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const useWebSocket = (url: string, onMessage: (msg: MessageEvent) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const navigate = useNavigate();

  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!url) return;

    let disposed = false;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const close = () => {
      disposed = true;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Component unmounted');
      }
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

    ws.onopen = () => {
      if (disposed || wsRef.current !== ws) return;
      console.log('WebSocket connected');
    };

    ws.onmessage = event => {
      if (disposed || wsRef.current !== ws) return;
      onMessageRef.current(event);
    };

    ws.onerror = event => {
      if (disposed || wsRef.current !== ws) return;
      console.error('WebSocket error:', { url, readyState: ws.readyState, event });
      navigate('/game/acquire');
    };

    ws.onclose = event => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      if (disposed) return;
      console.log('WebSocket closed:', event.code, event.reason);
      console.log('reason:', event.reason);
      console.log('wasClean:', event.wasClean);
    };

    window.addEventListener('popstate', close);

    return () => {
      window.removeEventListener('popstate', close);
      close();
    };
  }, [navigate, url]);

  const sendMessage = (msg: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    } else {
      console.warn('WebSocket not ready, message not sent');
    }
  };

  return { wsRef, sendMessage };
};
