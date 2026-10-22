import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePagedCollection, type LoadPageParams } from './usePagedCollection';

interface Item {
  id: number;
}

afterEach(cleanup);

describe('usePagedCollection', () => {
  it('deduplicates pages and prevents concurrent loadMore requests', async () => {
    let resolveSecond!: (items: readonly Item[]) => void;
    const loadPage = vi.fn(({ offset }: LoadPageParams) => offset === 0
      ? Promise.resolve([{ id: 1 }, { id: 2 }])
      : new Promise<readonly Item[]>(resolve => { resolveSecond = resolve; }));
    const hook = renderHook(() => usePagedCollection({
      queryKey: 'metric',
      pageSize: 2,
      loadPage,
      getKey: item => item.id,
    }));
    await act(async () => undefined);

    act(() => {
      hook.result.current.loadMore();
      hook.result.current.loadMore();
    });
    expect(loadPage).toHaveBeenCalledTimes(2);
    await act(async () => resolveSecond([{ id: 2 }, { id: 3 }]));
    expect(hook.result.current.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('clears atomically when queryKey changes and ignores the old response', async () => {
    let resolveFirst!: (items: readonly Item[]) => void;
    const loadPage = vi.fn()
      .mockImplementationOnce(() => new Promise<readonly Item[]>(resolve => { resolveFirst = resolve; }))
      .mockResolvedValueOnce([{ id: 9 }]);
    const hook = renderHook(
      ({ queryKey }) => usePagedCollection<Item>({
        queryKey,
        pageSize: 2,
        loadPage,
        getKey: item => item.id,
      }),
      { initialProps: { queryKey: 'metric' } }
    );

    hook.rerender({ queryKey: 'totalGames' });
    await act(async () => undefined);
    expect(hook.result.current.items).toEqual([{ id: 9 }]);
    await act(async () => resolveFirst([{ id: 1 }]));
    expect(hook.result.current.items).toEqual([{ id: 9 }]);
  });

  it('retains successful pages after failure and retries the same offset', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ id: 3 }]);
    const hook = renderHook(() => usePagedCollection<Item>({
      queryKey: 'metric',
      pageSize: 2,
      loadPage,
      getKey: item => item.id,
    }));
    await act(async () => undefined);

    await act(async () => hook.result.current.loadMore());
    expect(hook.result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(hook.result.current.error).toBe('offline');
    await act(async () => hook.result.current.retry());
    expect(loadPage.mock.calls[2][0].offset).toBe(2);
    expect(hook.result.current.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(hook.result.current.hasMore).toBe(false);
  });
});
