import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  buildYinshMotion,
  motionReceipt,
  type YinshMotion,
} from '../model/motion';
import type { GameSnapshot } from '../model/session';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => undefined;
  }
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.(reducedMotionQuery).matches === true;
}

export function useYinshMotion(data: GameSnapshot) {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false,
  );
  const previousRef = useRef(data);
  const currentRef = useRef<YinshMotion>();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const receiptTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [motion, setMotion] = useState<YinshMotion>();
  const [lastMotion, setLastMotion] = useState<YinshMotion>();
  const [receipt, setReceipt] = useState<string>();

  const clearMotionTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }, []);

  const finish = useCallback(() => {
    const active = currentRef.current;
    if (!active) return;
    clearMotionTimer();
    currentRef.current = undefined;
    setMotion(undefined);
    setReceipt(motionReceipt(active));
    clearTimeout(receiptTimerRef.current);
    receiptTimerRef.current = setTimeout(() => setReceipt(undefined), 4500);
  }, [clearMotionTimer]);

  const start = useCallback((next: YinshMotion) => {
    clearMotionTimer();
    clearTimeout(receiptTimerRef.current);
    setReceipt(undefined);
    currentRef.current = next;
    setMotion(next);
    if (!next.replay) setLastMotion(next);
    timerRef.current = setTimeout(finish, next.duration);
  }, [clearMotionTimer, finish]);

  useLayoutEffect(() => {
    const previous = previousRef.current;
    previousRef.current = data;
    if (previous === data || previous.seq === data.seq) return;

    if (
      reduced
      || previous.matchID !== data.matchID
      || data.seq !== previous.seq + 1
    ) {
      clearMotionTimer();
      currentRef.current = undefined;
      setMotion(undefined);
      setLastMotion(undefined);
      return;
    }

    const next = buildYinshMotion(previous, data, false);
    if (next) start(next);
    else {
      clearMotionTimer();
      currentRef.current = undefined;
      setMotion(undefined);
      setLastMotion(undefined);
    }
  }, [clearMotionTimer, data, reduced, start]);

  useEffect(() => {
    if (reduced) finish();
  }, [finish, reduced]);

  useEffect(() => {
    const settleHiddenMotion = () => {
      if (document.hidden) finish();
    };
    document.addEventListener('visibilitychange', settleHiddenMotion);
    window.addEventListener('resize', finish);
    return () => {
      document.removeEventListener('visibilitychange', settleHiddenMotion);
      window.removeEventListener('resize', finish);
      clearMotionTimer();
      clearTimeout(receiptTimerRef.current);
    };
  }, [clearMotionTimer, finish]);

  const replay = useCallback(() => {
    if (
      currentRef.current
      || !lastMotion
      || lastMotion.after.seq !== previousRef.current.seq
    ) {
      return false;
    }
    const next = buildYinshMotion(
      lastMotion.before,
      lastMotion.after,
      false,
      true,
    );
    if (!next) return false;
    if (reduced) {
      setReceipt(motionReceipt(next));
      return true;
    }
    start(next);
    return true;
  }, [lastMotion, reduced, start]);

  return {
    motion,
    reduced,
    busy: !!motion,
    receipt,
    canReplay: !!lastMotion
      && !motion
      && lastMotion.after.seq === data.seq,
    replay,
    finish,
  };
}
