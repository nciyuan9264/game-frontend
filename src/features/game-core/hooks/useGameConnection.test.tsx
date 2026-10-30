import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseRealtimeEnvelope } from '../model/realtime';
import { useGameConnection } from './useGameConnection';

class Socket {
  static readonly OPEN = 1;
  static instances: Socket[] = [];

  readyState = Socket.OPEN;
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  onerror?: () => void;
  send = vi.fn();

  constructor(public readonly url: string) {
    Socket.instances.push(this);
  }

  close() {
    this.readyState = 3;
  }

  serverClose() {
    this.readyState = 3;
    this.onclose?.();
  }

  message(value: unknown) {
    this.onmessage?.({ data: JSON.stringify(value) });
  }
}

const sync = (seq: number) => ({
  schemaVersion: 2,
  type: 'MATCH_SYNC',
  roomID: 'room',
  matchID: 'match',
  seq,
  ownerID: 'owner',
  status: 'match',
  playerID: 'me',
  visibility: 'public',
  maxPlayers: 4,
  players: {},
  playerOrder: [],
});

beforeEach(() => {
  vi.useFakeTimers();
  Socket.instances = [];
  vi.stubGlobal('WebSocket', Socket);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useGameConnection', () => {
  it('waits for a non-empty URL and then creates one connection', () => {
    const receive = vi.fn();
    const hook = renderHook(
      ({ url }) => useGameConnection(url, receive, parseRealtimeEnvelope),
      { initialProps: { url: '' } },
    );
    expect(Socket.instances).toHaveLength(0);

    hook.rerender({ url: 'ws://localhost/ws?roomID=room&matchID=match' });

    expect(Socket.instances).toHaveLength(1);
  });

  it('reconnects with the last accepted snapshot sequence', () => {
    const receive = vi.fn();
    renderHook(() => useGameConnection(
      'ws://localhost/ws?roomID=room&matchID=match',
      receive,
      parseRealtimeEnvelope,
    ));
    expect(Socket.instances[0].url).toContain('lastSeq=0');

    act(() => Socket.instances[0].message(sync(5)));
    expect(receive).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MATCH_SYNC', seq: 5 }),
      expect.any(Number),
    );

    act(() => Socket.instances[0].serverClose());
    act(() => vi.advanceTimersByTime(1000));
    expect(Socket.instances[1].url).toContain('lastSeq=5');
  });

  it('stops reconnecting and preserves the normalized terminal code', () => {
    const receive = vi.fn();
    const hook = renderHook(() => useGameConnection(
      'ws://localhost/ws?roomID=room&matchID=match',
      receive,
      parseRealtimeEnvelope,
    ));
    act(() => Socket.instances[0].message(sync(1)));
    act(() => Socket.instances[0].message({
      schemaVersion: 2,
      type: 'ERROR',
      roomID: 'room',
      matchID: 'match',
      seq: 1,
      code: 'IDENTITY_CONFLICT',
      message: '当前对局已在另一台设备接管，此设备已停止操作。',
    }));

    expect(hook.result.current.status).toBe('closed');
    expect(hook.result.current.fatalCode).toBe('identity_conflict');
    expect(hook.result.current.fatal).toBe('当前对局已在另一台设备接管，此设备已停止操作。');
    act(() => vi.runAllTimers());
    expect(Socket.instances).toHaveLength(1);
  });
});
