import { useEffect, useRef } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';

export const useWebSocket = (url: string, onMessage: (msg: MessageEvent) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  function sendWhenReady(data: any) {
    const message = JSON.stringify(data);
    const trySend = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current?.send(message);
      } else {
        setTimeout(trySend, 50); // 每 50ms 检查一次
      }
    };
    trySend();
  }
  const close = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }
  }
  useEffect(() => {
    if (wsRef.current !== null) return;
    let ws = new WebSocket(url);
    wsRef.current = ws;

    let reconnectTimeout: NodeJS.Timeout;

    ws.onopen = () => {
      console.log('WebSocket connected');
      sendWhenReady({ type: 'ready' });
    };

    ws.onmessage = onMessage;

    ws.onerror = err => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = event => {
      console.log('WebSocket closed:', event.code, event.reason);
      // 自动重连（可选）
      if (event.code !== 1000) {
        reconnectTimeout = setTimeout(() => {
          ws = new WebSocket(url);
          wsRef.current = ws;
        }, 1000);
      }
    };
    window.addEventListener('popstate', close);

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [url]);

  const sendMessage = (msg: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    } else {
      console.warn('WebSocket not ready, message not sent');
    }
  };

  return { wsRef, sendMessage };
};
