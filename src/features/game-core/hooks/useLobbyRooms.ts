import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  filterLobbyRooms,
  sortLobbyRooms,
  type LobbyFilter,
  type LobbyRoomLike,
} from '../model/room';

interface LobbyError {
  message: string;
  code?: string;
}

interface UseLobbyRoomsOptions<TRoom extends LobbyRoomLike> {
  loadRooms: (signal: AbortSignal) => Promise<readonly TRoom[]>;
  getOwnerName: (room: TRoom) => string;
  pollIntervalMs?: number;
  timeoutMs?: number;
  mapError?: (reason: unknown, timedOut: boolean) => LobbyError;
}

const defaultError = (reason: unknown, timedOut: boolean): LobbyError => ({
  message: timedOut
    ? '大厅请求超时，正在尝试重新连接。'
    : reason instanceof Error ? reason.message : '暂时无法连接大厅',
});

export function useLobbyRooms<TRoom extends LobbyRoomLike>({
  loadRooms,
  getOwnerName,
  pollIntervalMs = 3000,
  timeoutMs = 10000,
  mapError = defaultError,
}: UseLobbyRoomsOptions<TRoom>) {
  const [rooms, setRooms] = useState<TRoom[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LobbyFilter>('all');
  const refreshRef = useRef<() => void>(() => undefined);
  const sequenceRef = useRef(0);
  const mapErrorRef = useRef(mapError);
  mapErrorRef.current = mapError;

  useEffect(() => {
    let stopped = false;
    let active: AbortController | undefined;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    const refresh = async () => {
      if (stopped || active || document.hidden) return;
      clearTimeout(pollTimer);

      const requestID = ++sequenceRef.current;
      const controller = new AbortController();
      active = controller;
      const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);
      setRefreshing(true);

      try {
        const nextRooms = await loadRooms(controller.signal);
        if (stopped || requestID !== sequenceRef.current) return;
        setRooms(sortLobbyRooms(nextRooms));
        setHasLoaded(true);
        setError('');
        setErrorCode('');
      } catch (reason) {
        if (stopped || requestID !== sequenceRef.current) return;
        const mapped = mapErrorRef.current(reason, controller.signal.aborted);
        setError(mapped.message);
        setErrorCode(mapped.code ?? '');
      } finally {
        clearTimeout(timeoutTimer);
        active = undefined;
        if (!stopped && requestID === sequenceRef.current) {
          setRefreshing(false);
          pollTimer = setTimeout(refresh, pollIntervalMs);
        }
      }
    };

    refreshRef.current = () => { void refresh(); };
    const onVisibilityChange = () => {
      if (!document.hidden) void refresh();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    void refresh();

    return () => {
      stopped = true;
      ++sequenceRef.current;
      active?.abort();
      clearTimeout(pollTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadRooms, pollIntervalMs, timeoutMs]);

  const refresh = useCallback(() => refreshRef.current(), []);
  const filteredRooms = useMemo(
    () => filterLobbyRooms(rooms, filter, query, getOwnerName),
    [filter, getOwnerName, query, rooms]
  );

  return {
    rooms,
    filteredRooms,
    hasLoaded,
    refreshing,
    error,
    errorCode,
    query,
    setQuery,
    filter,
    setFilter,
    refresh,
  };
}
