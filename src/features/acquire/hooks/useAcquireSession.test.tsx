import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MatchSnapshot, ServerMessage } from '../model/session';
import { useAcquireSession } from './useAcquireSession';

vi.mock('@/const/env', () => ({ acquireWsUrl: 'ws://localhost/api/acquire' }));
const transport = vi.hoisted(() => ({
  epoch: { current: 1 }, send: vi.fn(() => true), retry: vi.fn(),
  receive: undefined as undefined | ((message: ServerMessage, epoch: number) => void),
}));
vi.mock('./useAcquireConnection', () => ({
  useAcquireConnection: (_url: string, receive: typeof transport.receive) => {
    transport.receive = receive;
    return { status: 'connected', epoch: transport.epoch, send: transport.send, retry: transport.retry };
  },
}));
const snapshot = (): MatchSnapshot => ({
  type: 'MATCH_SYNC', roomID: 'room', ownerID: 'me', playerID: 'me', visibility: 'public',
  phaseVersion: 1, turnNumber: 0, status: 'match', maxPlayers: 6, playerOrder: ['me'],
  players: { me: { playerID: 'me', name: 'Me', online: true, ai: false, ready: false } },
});
const receive = (message: ServerMessage, epoch = transport.epoch.current) =>
  act(() => transport.receive?.(message, epoch));

describe('Acquire command acknowledgement', () => {
  beforeEach(() => { vi.useFakeTimers(); transport.epoch.current = 1; vi.clearAllMocks(); });
  afterEach(() => vi.useRealTimers());
  it('keeps the lock on unrelated updates and clears it only after the requested state arrives', () => {
    const { result } = renderHook(() => useAcquireSession('room'));
    receive(snapshot());
    act(() => { result.current.submit('match_ready', { ready: true }); });
    const pending = result.current.pending;
    act(() => { expect(result.current.submit('match_add_ai')).toBe(false); });
    receive({ type: 'command_result', requestId: pending?.id });
    receive(snapshot());
    expect(result.current.pending).toEqual(pending);
    const next = snapshot(); next.players.me.ready = true;
    receive(next);
    expect(result.current.pending).toBeUndefined();
    expect(transport.send).toHaveBeenCalledTimes(1);
  });
  it('preserves the last snapshot on a rejected operation and ignores another request’s error', () => {
    const { result } = renderHook(() => useAcquireSession('room'));
    const before = snapshot(); receive(before);
    act(() => { result.current.submit('match_add_ai'); });
    receive({ type: 'error', requestId: 'other', message: 'Other operation failed' });
    expect(result.current.pending).toBeDefined();
    receive({ type: 'error', requestId: result.current.pending?.id, message: '房间已满' });
    expect(result.current.pending).toBeUndefined();
    expect(result.current.snapshot).toEqual(before);
    expect(result.current.feedback).toBe('房间已满');
  });
  it('resynchronizes after timeout without resending and unlocks on the new connection snapshot', () => {
    const { result } = renderHook(() => useAcquireSession('room'));
    receive(snapshot());
    act(() => { result.current.submit('match_add_ai'); });
    act(() => vi.advanceTimersByTime(12000));
    expect(transport.retry).toHaveBeenCalledTimes(1);
    expect(transport.send).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBeDefined();
    transport.epoch.current = 2;
    receive(snapshot());
    expect(result.current.pending).toBeUndefined();
    expect(result.current.feedback).toContain('已恢复最新状态');
    expect(transport.send).toHaveBeenCalledTimes(1);
  });
  it('ignores snapshots from another room or an older phase', () => {
    const { result } = renderHook(() => useAcquireSession('room'));
    const current = { ...snapshot(), phaseVersion: 3 };
    receive(current);
    receive(snapshot());
    receive({ ...snapshot(), roomID: 'other', phaseVersion: 4 });
    expect(result.current.snapshot).toEqual(current);
  });
});
