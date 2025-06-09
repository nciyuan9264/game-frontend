import { useEffect, useRef } from 'react';

export const useWebSocket = (
  url: string,
  onMessage: (msg: MessageEvent) => void
) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = onMessage;

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      ws.close();
    };
  }, [url]);

  // 新增一个发送函数，确保 readyState === OPEN
  const sendMessage = (msg: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    } else {
      console.warn('WebSocket not ready, message not sent');
    }
  };

  return { wsRef, sendMessage };
};
