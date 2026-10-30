import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameRoomPage } from './useGameRoomPage';

const players = {
  owner: {
    playerID: 'owner',
    seatIndex: 1,
    online: true,
    ai: false,
    ready: true,
  },
  guest: {
    playerID: 'guest',
    online: true,
    ai: false,
    ready: false,
  },
};

describe('useGameRoomPage', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('resets settings and tracks room copy feedback', async () => {
    const hook = renderHook(() => useGameRoomPage({
      roomID: 'room-1',
      inviteURL: 'https://example.com/room-1',
      visibility: 'private',
      ownerID: 'owner',
      playerID: 'owner',
      players,
    }));

    act(() => {
      hook.result.current.setVisibility('public');
      hook.result.current.open('settings');
    });
    expect(hook.result.current.visibility).toBe('private');
    expect(hook.result.current.owner).toBe(true);
    expect(hook.result.current.readyCount).toBe(1);

    await act(async () => {
      await hook.result.current.copyRoomID();
    });
    expect(hook.result.current.copyMessage).toBe('房间号已复制');
  });
});
