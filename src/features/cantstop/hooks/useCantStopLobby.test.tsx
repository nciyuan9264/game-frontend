import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { listCantStopRooms } from '../api/room';
import { useCantStopLobby } from './useCantStopLobby';

vi.mock('../api/room', () => ({
  listCantStopRooms: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it('keeps the active room request alive across internal state updates', async () => {
  vi.mocked(listCantStopRooms).mockImplementation(
    () => new Promise<never>(() => undefined),
  );

  const hook = renderHook(() => useCantStopLobby());
  await act(async () => undefined);

  expect(listCantStopRooms).toHaveBeenCalledTimes(1);
  const signal = vi.mocked(listCantStopRooms).mock.calls[0][0];
  expect(signal?.aborted).toBe(false);

  hook.unmount();
  expect(signal?.aborted).toBe(true);
});
