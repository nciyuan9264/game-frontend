import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useLatestAsyncAction } from './useLatestAsyncAction';

afterEach(cleanup);

describe('useLatestAsyncAction', () => {
  it('only lets the latest action update state', async () => {
    let rejectFirst!: (reason: Error) => void;
    const hook = renderHook(() => useLatestAsyncAction());
    const first = hook.result.current.run(() => new Promise<string>(
      (_resolve, reject) => { rejectFirst = reject; }
    )).catch(() => 'rejected');
    const second = hook.result.current.run(() => Promise.resolve('latest'));

    await act(async () => {
      expect(await second).toBe('latest');
      rejectFirst(new Error('stale failure'));
      await first;
    });
    expect(hook.result.current.pending).toBe(false);
    expect(hook.result.current.error).toBe('');
  });

  it('captures a current failure and cancel clears it', async () => {
    const hook = renderHook(() => useLatestAsyncAction());
    await act(async () => {
      await hook.result.current.run(() => Promise.reject(new Error('failed'))).catch(() => undefined);
    });
    expect(hook.result.current.error).toBe('failed');
    act(() => hook.result.current.cancel());
    expect(hook.result.current.error).toBe('');
  });
});
