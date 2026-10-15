import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AcquireRequestError, listRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { AcquireRoom, LobbyFilter } from '../model/types';

export function useAcquireLobby() {
  const [rooms, setRooms] = useState<AcquireRoom[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LobbyFilter>('all');
  const refreshRef = useRef<() => void>(() => {});
  const sequence = useRef(0);
  useEffect(() => {
    let stopped = false;
    let active: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      if (stopped || active || document.hidden) return;
      clearTimeout(timer);
      const requestID = ++sequence.current;
      const controller = new AbortController();
      active = controller;
      const timeout = setTimeout(() => controller.abort(), 10000);
      setRefreshing(true);
      try {
        const result = await listRooms(controller.signal);
        if (stopped || requestID !== sequence.current) return;
        setRooms(result.rooms ?? []);
        setHasLoaded(true);
        setError('');
        setErrorCode('');
      } catch (reason) {
        if (stopped || requestID !== sequence.current) return;
        setErrorCode(reason instanceof AcquireRequestError ? reason.code ?? String(reason.status) : '');
        setError(controller.signal.aborted ? '大厅请求超时，正在尝试重新连接。' : reason instanceof Error ? reason.message : '暂时无法连接大厅');
      } finally {
        clearTimeout(timeout);
        active = undefined;
        if (!stopped && requestID === sequence.current) {
          setRefreshing(false);
          timer = setTimeout(refresh, 3000);
        }
      }
    };
    refreshRef.current = refresh;
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    void refresh();
    return () => {
      stopped = true;
      active?.abort();
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const refresh = useCallback(() => refreshRef.current(), []);
  const filteredRooms = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rooms.filter(room => {
      const joinable = room.status === 'match' && room.roomPlayer.length < room.maxPlayers;
      return (filter === 'all' || (filter === 'joinable' ? joinable : room.status !== 'match'))
        && `${room.roomID} ${roomOwnerName(room)}`.toLowerCase().includes(search);
    });
  }, [rooms, filter, query]);
  return { rooms, filteredRooms, hasLoaded, refreshing, error, errorCode, query, setQuery, filter, setFilter, refresh };
}
