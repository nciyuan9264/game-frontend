import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getProfile } from '@/features/game-core/api/auth';
import {
  getGameDetail,
  getSnapshotPage,
} from '@/features/game-core/api/history';
import type {
  GameDetailData,
  HistoryGameType,
  SnapshotPageData,
} from '@/features/game-core/model/history';

export const REPLAY_PAGE_SIZE = 20;

type Profile = Awaited<ReturnType<typeof getProfile>>;

interface ReplaySnapshot {
  seq: number;
  totalEvents: number;
}

interface ProgressError {
  offset: number;
  message: string;
}

interface SnapshotWaiter<TSnapshot> {
  resolve: (snapshot: TSnapshot) => void;
  reject: (error: Error) => void;
}

const errorMessage = (reason: unknown) =>
  reason instanceof Error ? reason.message : '加载失败，请重试';

function validatePage<TSnapshot extends ReplaySnapshot>(
  page: SnapshotPageData<TSnapshot>,
  requestedOffset: number,
  knownTotal?: number,
) {
  const expectedNextOffset = Math.min(
    page.totalSnapshots,
    page.offset + page.snapshots.length,
  );
  if (
    page.offset !== requestedOffset
    || page.limit !== REPLAY_PAGE_SIZE
    || page.totalSnapshots !== page.totalEvents + 1
    || page.totalSnapshots < 1
    || page.snapshots.length > REPLAY_PAGE_SIZE
    || page.nextOffset !== expectedNextOffset
    || page.hasMore !== (expectedNextOffset < page.totalSnapshots)
    || (knownTotal != null && page.totalSnapshots !== knownTotal)
  ) {
    throw new Error('回放分页数据不一致');
  }
  page.snapshots.forEach((snapshot, index) => {
    const expectedSeq = page.offset + index - 1;
    if (snapshot.seq !== expectedSeq || snapshot.totalEvents !== page.totalEvents) {
      throw new Error('回放快照序号不连续');
    }
  });
}

export function useProgressiveReplay<TSnapshot extends ReplaySnapshot>(
  gameID: number,
  gameType: HistoryGameType,
) {
  const [profile, setProfile] = useState<Profile>();
  const [detail, setDetail] = useState<GameDetailData>();
  const [viewer, setViewer] = useState('');
  const [snapshots, setSnapshots] = useState<Array<TSnapshot | undefined>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number>();
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState('');
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [inFlightOffset, setInFlightOffset] = useState<number>();
  const [progressError, setProgressError] = useState<ProgressError>();
  const [failedOffsets, setFailedOffsets] = useState<ReadonlySet<number>>(new Set());
  const [revision, setRevision] = useState(0);

  const generationRef = useRef(0);
  const snapshotsRef = useRef<Array<TSnapshot | undefined>>([]);
  const totalSnapshotsRef = useRef(0);
  const pendingIndexRef = useRef<number>();
  const queueRef = useRef<number[]>([]);
  const loadedOffsetsRef = useRef(new Set<number>());
  const pausedOffsetRef = useRef<number>();
  const inFlightOffsetRef = useRef<number>();
  const activeRef = useRef(false);
  const controllersRef = useRef(new Set<AbortController>());
  const waitersRef = useRef(new Map<number, Array<SnapshotWaiter<TSnapshot>>>());
  const enqueueRef = useRef<(offset: number, priority: boolean) => void>(() => {});
  const pumpRef = useRef<(allowWhilePaused?: boolean) => void>(() => {});

  const resolveWaiters = useCallback((nextSnapshots: Array<TSnapshot | undefined>) => {
    for (const [index, waiters] of waitersRef.current) {
      const snapshot = nextSnapshots[index];
      if (!snapshot) continue;
      waitersRef.current.delete(index);
      waiters.forEach(waiter => waiter.resolve(snapshot));
    }
  }, []);

  useEffect(() => {
    const generation = ++generationRef.current;
    const controllers = controllersRef.current;
    const waiters = waitersRef.current;
    controllers.forEach(controller => controller.abort());
    controllers.clear();
    waiters.forEach(snapshotWaiters => {
      snapshotWaiters.forEach(waiter => waiter.reject(new Error('回放已切换')));
    });
    waiters.clear();
    queueRef.current = [];
    loadedOffsetsRef.current.clear();
    pausedOffsetRef.current = undefined;
    inFlightOffsetRef.current = undefined;
    activeRef.current = false;
    snapshotsRef.current = [];
    totalSnapshotsRef.current = 0;
    pendingIndexRef.current = undefined;
    setProfile(undefined);
    setDetail(undefined);
    setViewer('');
    setSnapshots([]);
    setSelectedIndex(0);
    setPendingIndex(undefined);
    setInitialLoading(true);
    setInitialError('');
    setBackgroundLoading(false);
    setInFlightOffset(undefined);
    setProgressError(undefined);
    setFailedOffsets(new Set());

    const enqueue = (offset: number, priority: boolean) => {
      if (
        offset < 0
        || offset >= totalSnapshotsRef.current
        || loadedOffsetsRef.current.has(offset)
        || inFlightOffsetRef.current === offset
      ) {
        return;
      }
      const existingIndex = queueRef.current.indexOf(offset);
      if (existingIndex >= 0) {
        if (!priority) return;
        queueRef.current.splice(existingIndex, 1);
      }
      if (priority) queueRef.current.unshift(offset);
      else queueRef.current.push(offset);
    };
    enqueueRef.current = enqueue;

    const rejectPageWaiters = (offset: number, error: Error) => {
      const end = Math.min(totalSnapshotsRef.current, offset + REPLAY_PAGE_SIZE);
      for (let index = offset; index < end; index += 1) {
        const snapshotWaiters = waitersRef.current.get(index);
        if (!snapshotWaiters) continue;
        waitersRef.current.delete(index);
        snapshotWaiters.forEach(waiter => waiter.reject(error));
      }
    };

    const mergePage = (page: SnapshotPageData<TSnapshot>) => {
      const next = [...snapshotsRef.current];
      page.snapshots.forEach((snapshot, index) => {
        next[page.offset + index] = snapshot;
      });
      snapshotsRef.current = next;
      setSnapshots(next);
      loadedOffsetsRef.current.add(page.offset);
      setFailedOffsets(current => {
        const updated = new Set(current);
        updated.delete(page.offset);
        return updated;
      });
      if (pausedOffsetRef.current === page.offset) {
        pausedOffsetRef.current = undefined;
        setProgressError(undefined);
      }
      const target = pendingIndexRef.current;
      if (target != null && next[target]) {
        pendingIndexRef.current = undefined;
        setPendingIndex(undefined);
        setSelectedIndex(target);
      }
      resolveWaiters(next);
    };

    const pump = async (allowWhilePaused = false) => {
      if (
        generation !== generationRef.current
        || activeRef.current
        || (pausedOffsetRef.current != null && !allowWhilePaused)
      ) {
        return;
      }
      activeRef.current = true;
      setBackgroundLoading(true);
      let processedPrioritizedPage = false;
      try {
        while (generation === generationRef.current && queueRef.current.length > 0) {
          if (
            pausedOffsetRef.current != null
            && (!allowWhilePaused || processedPrioritizedPage)
          ) {
            break;
          }
          const offset = queueRef.current.shift();
          if (offset == null) break;
          if (loadedOffsetsRef.current.has(offset)) continue;

          const controller = new AbortController();
          controllersRef.current.add(controller);
          inFlightOffsetRef.current = offset;
          setInFlightOffset(offset);
          try {
            const page = await getSnapshotPage<TSnapshot>(gameID, gameType, {
              offset,
              limit: REPLAY_PAGE_SIZE,
              signal: controller.signal,
            });
            if (generation !== generationRef.current) return;
            validatePage(page, offset, totalSnapshotsRef.current);
            mergePage(page);
            processedPrioritizedPage = allowWhilePaused;
          } catch (reason) {
            if (generation !== generationRef.current || controller.signal.aborted) return;
            const error = new Error(errorMessage(reason));
            pausedOffsetRef.current = offset;
            setProgressError({ offset, message: error.message });
            setFailedOffsets(current => new Set(current).add(offset));
            rejectPageWaiters(offset, error);
            break;
          } finally {
            controllersRef.current.delete(controller);
            if (generation === generationRef.current) {
              inFlightOffsetRef.current = undefined;
              setInFlightOffset(undefined);
            }
          }
        }
      } finally {
        if (generation === generationRef.current) {
          activeRef.current = false;
          setBackgroundLoading(false);
        }
      }
    };
    pumpRef.current = allowWhilePaused => { void pump(allowWhilePaused); };

    const initialController = new AbortController();
    controllersRef.current.add(initialController);
    Promise.all([
      getProfile(),
      getGameDetail(gameID, gameType),
      getSnapshotPage<TSnapshot>(gameID, gameType, {
        offset: 0,
        limit: REPLAY_PAGE_SIZE,
        signal: initialController.signal,
      }),
    ]).then(([nextProfile, nextDetail, firstPage]) => {
      if (generation !== generationRef.current) return;
      validatePage(firstPage, 0);
      const nextViewer = nextDetail.players.find(
        player => player.userID != null
          && String(player.userID) === String(nextProfile.id),
      )?.playerID;
      if (!nextViewer) throw new Error('这段回放中没有找到你的玩家身份。');

      const nextSnapshots = Array.from<unknown, TSnapshot | undefined>(
        { length: firstPage.totalSnapshots },
        () => undefined,
      );
      firstPage.snapshots.forEach((snapshot, index) => {
        nextSnapshots[index] = snapshot;
      });
      snapshotsRef.current = nextSnapshots;
      totalSnapshotsRef.current = firstPage.totalSnapshots;
      loadedOffsetsRef.current.add(0);
      setProfile(nextProfile);
      setDetail(nextDetail);
      setViewer(nextViewer);
      setSnapshots(nextSnapshots);
      setInitialLoading(false);
      resolveWaiters(nextSnapshots);

      for (
        let offset = REPLAY_PAGE_SIZE;
        offset < firstPage.totalSnapshots;
        offset += REPLAY_PAGE_SIZE
      ) {
        enqueue(offset, false);
      }
      void pump();
    }).catch(reason => {
      if (generation !== generationRef.current || initialController.signal.aborted) return;
      setInitialError(errorMessage(reason));
      setInitialLoading(false);
    }).finally(() => {
      controllersRef.current.delete(initialController);
    });

    return () => {
      if (generationRef.current === generation) generationRef.current += 1;
      controllers.forEach(controller => controller.abort());
      controllers.clear();
      waiters.forEach(snapshotWaiters => {
        snapshotWaiters.forEach(waiter => waiter.reject(new Error('回放已关闭')));
      });
      waiters.clear();
    };
  }, [gameID, gameType, resolveWaiters, revision]);

  const retryInitial = useCallback(() => setRevision(value => value + 1), []);

  const selectIndex = useCallback((requestedIndex: number) => {
    const total = totalSnapshotsRef.current;
    if (total === 0) return;
    const index = Math.min(Math.max(Math.round(requestedIndex), 0), total - 1);
    if (snapshotsRef.current[index]) {
      pendingIndexRef.current = undefined;
      setPendingIndex(undefined);
      setSelectedIndex(index);
      return;
    }
    pendingIndexRef.current = index;
    setPendingIndex(index);
    const offset = Math.floor(index / REPLAY_PAGE_SIZE) * REPLAY_PAGE_SIZE;
    enqueueRef.current(offset, true);
    pumpRef.current(true);
  }, []);

  const retryProgress = useCallback(() => {
    const offset = pausedOffsetRef.current;
    if (offset == null) return;
    enqueueRef.current(offset, true);
    pumpRef.current(true);
  }, []);

  const ensureFinalSnapshot = useCallback(() => {
    const index = totalSnapshotsRef.current - 1;
    if (index < 0) return Promise.reject(new Error('回放尚未载入'));
    const existing = snapshotsRef.current[index];
    if (existing) return Promise.resolve(existing);
    const promise = new Promise<TSnapshot>((resolve, reject) => {
      const snapshotWaiters = waitersRef.current.get(index) ?? [];
      snapshotWaiters.push({ resolve, reject });
      waitersRef.current.set(index, snapshotWaiters);
    });
    const offset = Math.floor(index / REPLAY_PAGE_SIZE) * REPLAY_PAGE_SIZE;
    enqueueRef.current(offset, true);
    pumpRef.current(true);
    return promise;
  }, []);

  const contiguousSnapshots = useMemo(() => {
    const prefix: TSnapshot[] = [];
    for (const snapshot of snapshots) {
      if (!snapshot) break;
      prefix.push(snapshot);
    }
    return prefix;
  }, [snapshots]);
  const loadedCount = useMemo(
    () => snapshots.reduce((count, snapshot) => count + (snapshot ? 1 : 0), 0),
    [snapshots],
  );

  return {
    profile,
    detail,
    viewer,
    snapshots,
    currentSnapshot: snapshots[selectedIndex],
    selectedIndex,
    totalSnapshots: snapshots.length,
    loadedCount,
    contiguousSnapshots,
    initialLoading,
    initialError,
    backgroundLoading,
    inFlightOffset,
    pendingIndex,
    progressError,
    failedOffsets,
    selectIndex,
    retryInitial,
    retryProgress,
    ensureFinalSnapshot,
  };
}
