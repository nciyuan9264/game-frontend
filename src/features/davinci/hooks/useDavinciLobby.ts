import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listDavinciRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { DavinciRoom, LobbyFilter } from '../model/types';

const sortRooms = (rooms: DavinciRoom[]) =>
  [...rooms].sort((left, right) => right.roomID.localeCompare(left.roomID));

export function useDavinciLobby() {
  const [rooms, setRooms] = useState<DavinciRoom[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LobbyFilter>('all');
  const refreshRef = useRef<() => void>(() => {});
  const sequence = useRef(0);

  useEffect(() => {
    let stopped = false;
    let active: AbortController | undefined;
    let timer: number | undefined;
    const refresh = async () => {
      if (stopped || active || document.hidden) return;
      clearTimeout(timer);
      const requestID = ++sequence.current;
      const controller = new AbortController();
      active = controller;
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      setRefreshing(true);
      try {
        const result = await listDavinciRooms(controller.signal);
        if (stopped || requestID !== sequence.current) return;
        setRooms(sortRooms(result.rooms ?? []));
        setHasLoaded(true);
        setError('');
      } catch (reason) {
        if (stopped || requestID !== sequence.current) return;
        setError(controller.signal.aborted
          ? '大厅请求超时，正在尝试重新连接。'
          : reason instanceof Error ? reason.message : '暂时无法连接大厅');
      } finally {
        window.clearTimeout(timeout);
        active = undefined;
        if (!stopped && requestID === sequence.current) {
          setRefreshing(false);
          timer = window.setTimeout(refresh, 3000);
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
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const refresh = useCallback(() => refreshRef.current(), []);
  const filteredRooms = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rooms.filter(room => {
      const joinable = room.status === 'match' && room.roomPlayer.length < room.maxPlayers;
      const matchesFilter = filter === 'all' || (filter === 'joinable' ? joinable : room.status !== 'match');
      return matchesFilter && `${room.roomID} ${roomOwnerName(room)}`.toLowerCase().includes(search);
    });
  }, [filter, query, rooms]);

  return {
    rooms,
    filteredRooms,
    hasLoaded,
    refreshing,
    error,
    query,
    setQuery,
    filter,
    setFilter,
    refresh,
  };
}
