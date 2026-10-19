import { useCallback, useEffect, useRef, useState } from 'react';
import { parseServerMessage, type ServerMessage } from '../model/session';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'closed';

const terminalCodes = new Set([
  'room_not_found', 'removed', 'identity_conflict', 'not_member',
  'game_started', 'room_full', 'unauthorized',
]);
const delays = [1000, 2000, 4000, 8000, 8000];

export function useDavinciConnection(url: string, onMessage: (message: ServerMessage, epoch: number) => void) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [attempt, setAttempt] = useState(0);
  const [fatal, setFatal] = useState('');
  const socket = useRef<WebSocket>();
  const epoch = useRef(0);
  const synchronized = useRef(false);
  const receive = useRef(onMessage);
  const retryRef = useRef<() => void>(() => {});
  const closeRef = useRef<() => void>(() => {});
  receive.current = onMessage;

  useEffect(() => {
    if (!url) return;
    let disposed = false;
    let stopped = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let handshake: ReturnType<typeof setTimeout> | undefined;

    const closeSocket = () => {
      clearTimeout(handshake);
      synchronized.current = false;
      ++epoch.current;
      const previous = socket.current;
      socket.current = undefined;
      previous?.close();
    };
    const connect = () => {
      if (disposed || stopped) return;
      clearTimeout(timer);
      closeSocket();
      const id = epoch.current;
      const ws = new WebSocket(url);
      socket.current = ws;
      setStatus(failures ? 'reconnecting' : 'connecting');
      const current = () => !disposed && epoch.current === id && socket.current === ws;
      handshake = setTimeout(() => { if (current()) ws.close(); }, 10000);
      ws.onmessage = event => {
        if (!current() || typeof event.data !== 'string') return;
        const message = parseServerMessage(event.data);
        if (!message) return;
        if (message.type === 'error' && terminalCodes.has(message.code ?? '')) {
          stopped = true;
          setFatal(message.message || '房间连接已失效');
          setStatus('closed');
          receive.current(message, id);
          closeSocket();
          return;
        }
        if (message.type === 'MATCH_SYNC' || message.type === 'ROOM_SYNC') {
          clearTimeout(handshake);
          synchronized.current = true;
          failures = 0;
          setAttempt(0);
          setStatus('connected');
        }
        receive.current(message, id);
      };
      ws.onclose = () => {
        if (!current()) return;
        clearTimeout(handshake);
        synchronized.current = false;
        if (stopped) {
          setStatus('closed');
          return;
        }
        if (failures >= delays.length) {
          setStatus('disconnected');
          return;
        }
        const delay = delays[failures++];
        setAttempt(failures);
        setStatus('reconnecting');
        timer = setTimeout(connect, delay);
      };
      ws.onerror = () => {};
    };
    const retry = () => {
      if (disposed || stopped) return;
      failures = 0;
      setAttempt(0);
      connect();
    };
    retryRef.current = retry;
    closeRef.current = () => {
      stopped = true;
      clearTimeout(timer);
      closeSocket();
      setStatus('closed');
    };
    const online = () => { if (!synchronized.current) retry(); };
    window.addEventListener('online', online);
    setFatal('');
    connect();
    return () => {
      disposed = true;
      clearTimeout(timer);
      closeSocket();
      window.removeEventListener('online', online);
    };
  }, [url]);

  const send = useCallback((data: unknown) => {
    if (!synchronized.current || socket.current?.readyState !== WebSocket.OPEN) return false;
    try {
      socket.current.send(JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    status,
    attempt,
    fatal,
    epoch,
    send,
    retry: useCallback(() => retryRef.current(), []),
    close: useCallback(() => closeRef.current(), []),
  };
}
