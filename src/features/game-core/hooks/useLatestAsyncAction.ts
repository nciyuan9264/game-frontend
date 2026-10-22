import { useCallback, useEffect, useRef, useState } from 'react';

const errorMessage = (reason: unknown) =>
  reason instanceof Error ? reason.message : '操作失败，请稍后重试';

export function useLatestAsyncAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const sequenceRef = useRef(0);
  const controllerRef = useRef<AbortController>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      ++sequenceRef.current;
      controllerRef.current?.abort();
    };
  }, []);

  const run = useCallback(async <TResult,>(
    action: (signal: AbortSignal) => Promise<TResult>
  ): Promise<TResult> => {
    const requestID = ++sequenceRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setPending(true);
    setError('');

    try {
      return await action(controller.signal);
    } catch (reason) {
      if (mountedRef.current && requestID === sequenceRef.current && !controller.signal.aborted) {
        setError(errorMessage(reason));
      }
      throw reason;
    } finally {
      if (mountedRef.current && requestID === sequenceRef.current) {
        controllerRef.current = undefined;
        setPending(false);
      }
    }
  }, []);

  const reset = useCallback(() => setError(''), []);
  const cancel = useCallback(() => {
    ++sequenceRef.current;
    controllerRef.current?.abort();
    controllerRef.current = undefined;
    setPending(false);
    setError('');
  }, []);

  return { run, pending, error, reset, cancel };
}
