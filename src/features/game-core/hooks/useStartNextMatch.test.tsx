import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startNextGameMatch } from '../api/room';
import { useStartNextMatch } from './useStartNextMatch';

vi.mock('../api/room', () => ({
  startNextGameMatch: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(startNextGameMatch).mockReset();
});

describe('useStartNextMatch', () => {
  it('publishes the new match ID and rejects duplicate in-flight starts', async () => {
    let resolve!: (value: { matchID: string; roundNo: number }) => void;
    vi.mocked(startNextGameMatch).mockReturnValue(new Promise(value => {
      resolve = value;
    }));
    const hook = renderHook(() => useStartNextMatch('acquire', 'room-1'));

    let first!: Promise<boolean>;
    await act(async () => {
      first = hook.result.current.start();
      await expect(hook.result.current.start()).resolves.toBe(false);
      resolve({ matchID: 'match-2', roundNo: 2 });
      await expect(first).resolves.toBe(true);
    });

    expect(startNextGameMatch).toHaveBeenCalledTimes(1);
    expect(hook.result.current.matchID).toBe('match-2');
    expect(hook.result.current.pending).toBe(false);
  });

  it('ignores an in-flight result after the room changes', async () => {
    let resolve!: (value: { matchID: string; roundNo: number }) => void;
    vi.mocked(startNextGameMatch).mockReturnValue(new Promise(value => {
      resolve = value;
    }));
    const hook = renderHook(
      ({ roomID }) => useStartNextMatch('splendor', roomID),
      { initialProps: { roomID: 'room-1' } },
    );

    let request!: Promise<boolean>;
    act(() => {
      request = hook.result.current.start();
    });
    hook.rerender({ roomID: 'room-2' });
    await act(async () => {
      resolve({ matchID: 'stale-match', roundNo: 2 });
      await expect(request).resolves.toBe(false);
    });

    expect(hook.result.current.matchID).toBe('');
  });
});
