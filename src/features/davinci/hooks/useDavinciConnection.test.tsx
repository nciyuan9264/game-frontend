import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDavinciConnection } from './useDavinciConnection';

class Socket {
  static OPEN = 1;
  static instances: Socket[] = [];
  readyState = 1;
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  onerror?: () => void;
  sent: string[] = [];

  constructor() { Socket.instances.push(this); }
  close() { this.readyState = 3; this.onclose?.(); }
  send(value: string) { this.sent.push(value); }
  sync() {
    this.onmessage?.({ data: JSON.stringify({
      type: 'MATCH_SYNC', roomID: 'room', phaseVersion: 1, turnNumber: 0,
      status: 'match', ownerID: 'me', players: {}, playerID: 'me', maxPlayers: 2, playerOrder: [],
    }) });
  }
}

describe('DaVinci connection lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Socket.instances = [];
    vi.stubGlobal('WebSocket', Socket);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('requires a snapshot and never replays commands after reconnecting', () => {
    const receive = vi.fn();
    const { result, unmount } = renderHook(() => useDavinciConnection('ws://example', receive));
    const first = Socket.instances[0];
    expect(result.current.send({ type: 'match_ready' })).toBe(false);
    act(() => first.sync());
    expect(result.current.send({ type: 'match_ready' })).toBe(true);
    act(() => first.close());
    act(() => vi.advanceTimersByTime(1000));
    const second = Socket.instances[1];
    act(() => second.sync());
    expect(result.current.status).toBe('connected');
    expect(second.sent).toHaveLength(0);
    unmount();
  });

  it('stops retrying on a terminal identity conflict', () => {
    const { result, unmount } = renderHook(() => useDavinciConnection('ws://example', vi.fn()));
    act(() => Socket.instances[0].onmessage?.({
      data: JSON.stringify({ type: 'error', code: 'identity_conflict', message: '身份已连接' }),
    }));
    expect(result.current.status).toBe('closed');
    act(() => {
      result.current.retry();
      vi.advanceTimersByTime(30000);
    });
    expect(Socket.instances).toHaveLength(1);
    unmount();
  });
});
