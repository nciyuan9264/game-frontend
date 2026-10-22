import { useCallback, useEffect, useRef, useState } from 'react';

export interface LoadPageParams {
  offset: number;
  limit: number;
  signal: AbortSignal;
}

interface UsePagedCollectionOptions<T> {
  queryKey: string | number;
  pageSize: number;
  loadPage: (params: LoadPageParams) => Promise<readonly T[]>;
  getKey: (item: T) => string | number;
}

function messageFrom(reason: unknown) {
  return reason instanceof Error ? reason.message : '加载失败，请重试';
}

export function usePagedCollection<T>({
  queryKey,
  pageSize,
  loadPage,
  getKey,
}: UsePagedCollectionOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [revision, setRevision] = useState(0);
  const [collectionKey, setCollectionKey] = useState(queryKey);
  const sequenceRef = useRef(0);
  const controllerRef = useRef<AbortController>();
  const nextOffsetRef = useRef(0);
  const loadingRef = useRef(false);
  const errorRef = useRef('');
  const hasMoreRef = useRef(true);
  const mountedRef = useRef(true);
  const loadPageRef = useRef(loadPage);
  const getKeyRef = useRef(getKey);
  loadPageRef.current = loadPage;
  getKeyRef.current = getKey;

  const performLoad = useCallback(async (offset: number, replace: boolean) => {
    if (loadingRef.current) return;

    const requestID = ++sequenceRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    errorRef.current = '';
    setError('');

    try {
      const nextItems = [...await loadPageRef.current({
        offset,
        limit: pageSize,
        signal: controller.signal,
      })];
      if (!mountedRef.current || requestID !== sequenceRef.current) return;

      setItems(current => {
        const base = replace ? [] : current;
        const seen = new Set(base.map(getKeyRef.current));
        return [
          ...base,
          ...nextItems.filter(item => {
            const key = getKeyRef.current(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }),
        ];
      });
      nextOffsetRef.current = offset + nextItems.length;
      hasMoreRef.current = nextItems.length === pageSize;
      setHasMore(hasMoreRef.current);
    } catch (reason) {
      if (!mountedRef.current || requestID !== sequenceRef.current || controller.signal.aborted) return;
      errorRef.current = messageFrom(reason);
      setError(errorRef.current);
    } finally {
      if (mountedRef.current && requestID === sequenceRef.current) {
        controllerRef.current = undefined;
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [pageSize]);

  useEffect(() => {
    mountedRef.current = true;
    ++sequenceRef.current;
    controllerRef.current?.abort();
    controllerRef.current = undefined;
    nextOffsetRef.current = 0;
    loadingRef.current = false;
    errorRef.current = '';
    hasMoreRef.current = true;
    setCollectionKey(queryKey);
    setItems([]);
    setError('');
    setHasMore(true);
    void performLoad(0, true);

    return () => {
      mountedRef.current = false;
      ++sequenceRef.current;
      controllerRef.current?.abort();
      controllerRef.current = undefined;
      loadingRef.current = false;
    };
  }, [performLoad, queryKey, revision]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || errorRef.current || !hasMoreRef.current) return;
    void performLoad(nextOffsetRef.current, false);
  }, [performLoad]);

  const retry = useCallback(() => {
    if (loadingRef.current) return;
    void performLoad(nextOffsetRef.current, nextOffsetRef.current === 0);
  }, [performLoad]);

  const reset = useCallback(() => setRevision(value => value + 1), []);
  const queryChanged = collectionKey !== queryKey;

  return {
    items: queryChanged ? [] : items,
    loading: queryChanged || loading,
    error: queryChanged ? '' : error,
    hasMore: queryChanged || hasMore,
    loadMore,
    retry,
    reset,
  };
}
