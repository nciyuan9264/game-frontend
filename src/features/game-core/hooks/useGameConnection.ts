import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { SessionServerMessageBase } from '../model/session';

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'closed';

const terminalCodes = new Set([
  'room_not_found',
  'removed',
  'identity_conflict',
  'not_member',
  'game_started',
  'room_full',
  'unauthorized',
]);
const reconnectDelays = [1000, 2000, 4000, 8000, 8000];

function reconnectURL(url: string, lastSeq: number) {
  const parsed = new URL(url);
  parsed.searchParams.set('lastSeq', String(lastSeq));
  return parsed.toString();
}

export function useGameConnection<TMessage extends SessionServerMessageBase>(
  url: string,
  receiveMessage: (message: TMessage, epoch: number) => void,
  parseMessage: (value: string) => TMessage | undefined,
) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [attempt, setAttempt] = useState(0);
  const [fatal, setFatal] = useState('');
  const socket = useRef<WebSocket>();
  const epoch = useRef(0);
  const synchronized = useRef(false);
  const lastSeq = useRef(0);
  const receive = useRef(receiveMessage);
  const parse = useRef(parseMessage);
  const retryRef = useRef<() => void>(() => {});
  const closeRef = useRef<() => void>(() => {});
  receive.current = receiveMessage;
  parse.current = parseMessage;

  useEffect(() => {
    if (!url) return;
    let disposed = false;
    let stopped = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let handshake: ReturnType<typeof setTimeout> | undefined;
    lastSeq.current = 0;

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
      const connectionEpoch = epoch.current;
      const ws = new WebSocket(reconnectURL(url, lastSeq.current));
      socket.current = ws;
      setStatus(failures ? 'reconnecting' : 'connecting');
      const current = () =>
        !disposed
        && epoch.current === connectionEpoch
        && socket.current === ws;
      handshake = setTimeout(() => {
        if (current()) ws.close();
      }, 10000);
      ws.onmessage = event => {
        if (!current() || typeof event.data !== 'string') return;
        const message = parse.current(event.data);
        if (!message) return;
        const errorCode = message.code?.toLowerCase() ?? '';
        if (message.type === 'ERROR' && terminalCodes.has(errorCode)) {
          stopped = true;
          setFatal(message.message || '房间连接已失效');
          setStatus('closed');
          receive.current(message, connectionEpoch);
          closeSocket();
          return;
        }
        if (message.type === 'MATCH_SYNC' || message.type === 'ROOM_SYNC') {
          lastSeq.current = Math.max(lastSeq.current, message.seq);
          clearTimeout(handshake);
          synchronized.current = true;
          failures = 0;
          setAttempt(0);
          setStatus('connected');
        }
        receive.current(message, connectionEpoch);
      };
      ws.onclose = () => {
        if (!current()) return;
        clearTimeout(handshake);
        synchronized.current = false;
        if (stopped) {
          setStatus('closed');
          return;
        }
        if (failures >= reconnectDelays.length) {
          setStatus('disconnected');
          return;
        }
        const delay = reconnectDelays[failures++];
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
    const online = () => {
      if (!synchronized.current) retry();
    };
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
    if (
      !synchronized.current
      || socket.current?.readyState !== WebSocket.OPEN
    ) {
      return false;
    }
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
