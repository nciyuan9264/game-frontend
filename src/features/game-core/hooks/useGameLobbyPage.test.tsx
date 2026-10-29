import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameLobbyPage } from './useGameLobbyPage';

describe('useGameLobbyPage', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('creates with the current draft and enters the result', async () => {
    const createRoom = vi.fn().mockResolvedValue({ roomID: 'room-1' });
    const enterCreated = vi.fn();
    const hook = renderHook(() => useGameLobbyPage({
      initialDraft: { visibility: 'public' },
      createRoom,
      enterCreated,
      enterRoom: vi.fn(),
    }));

    await act(async () => {
      await hook.result.current.create();
    });

    expect(createRoom).toHaveBeenCalledWith(
      { visibility: 'public' },
      expect.any(AbortSignal),
    );
    expect(enterCreated).toHaveBeenCalledWith({ roomID: 'room-1' });
  });

  it('clears stale room lookup when the code changes', async () => {
    const room = { roomID: 'room-2', allowed: true };
    const enterRoom = vi.fn();
    const hook = renderHook(() => useGameLobbyPage({
      initialDraft: {},
      createRoom: vi.fn(),
      enterCreated: vi.fn(),
      lookupRoom: vi.fn().mockResolvedValue(room),
      enterRoom,
      canEnter: value => value.allowed,
    }));

    act(() => hook.result.current.setCode(' room-2 '));
    await act(async () => {
      await hook.result.current.find();
    });
    expect(hook.result.current.foundRoom).toEqual(room);
    expect(hook.result.current.enterFound()).toBe(true);
    expect(enterRoom).toHaveBeenCalledWith(room);

    act(() => hook.result.current.setCode('room-3'));
    expect(hook.result.current.foundRoom).toBeUndefined();
  });
});
