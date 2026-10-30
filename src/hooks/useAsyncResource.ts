import { useCallback, useEffect, useRef, useState } from 'react';

/** Keep the previous result on refresh failure and ignore superseded requests. */
export function useAsyncResource<T>(load: () => Promise<T>) {
  const sequence = useRef(0);
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failure, setFailure] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const requestID = ++sequence.current;
    setLoading(true);
    setError('');
    setFailure(undefined);
    load()
      .then(result => { if (requestID === sequence.current) setData(result); })
      .catch(reason => {
        if (requestID === sequence.current) {
          setFailure(reason);
          setError(reason instanceof Error ? reason.message : '加载失败，请重试');
        }
      })
      .finally(() => { if (requestID === sequence.current) setLoading(false); });
    return () => { sequence.current = requestID + 1; };
  }, [load, revision]);

  return { data, loading, error, failure, retry };
}
