import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MatchSnapshot, ServerMessage } from '../model/session';
import { useDavinciSession } from './useDavinciSession';

vi.mock('@/const/env', () => ({ davinciWsUrl: 'ws://localhost/api/davinci' }));
const transport = vi.hoisted(() => ({
  epoch: { current: 1 },
  send: vi.fn(() => true),
  retry: vi.fn(),
  receive: undefined as undefined | ((message: ServerMessage, epoch: number) => void),
}));
vi.mock('./useDavinciConnection', () => ({
  useDavinciConnection: (_url: string, receive: typeof transport.receive) => {
    transport.receive = receive;
    return {
      status: 'connected',
      attempt: 0,
      fatal: '',
      epoch: transport.epoch,
      send: transport.send,
      retry: transport.retry,
      close: vi.fn(),
    };
  },
}));

const snapshot = (): MatchSnapshot => ({
  type: 'MATCH_SYNC',
  roomID: 'room',
  ownerID: 'me',
  playerID: 'me',
  phaseVersion: 1,
  turnNumber: 0,
  status: 'match',
  maxPlayers: 2,
  playerOrder: ['me'],
  players: { me: { playerID: 'me', name: 'Me', online: true, ai: false, ready: true } },
});
const receive = (message: ServerMessage, epoch = transport.epoch.current) =>
  act(() => transport.receive?.(message, epoch));

describe('DaVinci command acknowledgement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    transport.epoch.current = 1;
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it('allows only one pending command and clears it for the matching acknowledgement', () => {
    const { result } = renderHook(() => useDavinciSession('room'));
    receive(snapshot());
    act(() => { result.current.submit('match_add_ai', { seatIndex: 1 }); });
    const pending = result.current.pending;
    expect(result.current.submit('match_begin')).toBe(false);
    receive({ ...snapshot(), phaseVersion: 2 });
    expect(result.current.pending).toEqual(pending);
    receive({ type: 'command_result', requestId: 'another-request' });
    expect(result.current.pending).toEqual(pending);
    receive({ type: 'command_result', requestId: pending?.id, phaseVersion: 2 });
    expect(result.current.pending).toBeUndefined();
    expect(transport.send).toHaveBeenCalledTimes(1);
  });

  it('keeps the last snapshot on rejection and resynchronizes without replay', () => {
    const { result } = renderHook(() => useDavinciSession('room'));
    const before = snapshot();
    receive(before);
    act(() => { result.current.submit('match_add_ai'); });
    receive({ type: 'error', requestId: result.current.pending?.id, message: '房间已满' });
    expect(result.current.snapshot).toEqual(before);
    expect(result.current.feedback).toBe('房间已满');

    act(() => { result.current.submit('match_add_ai'); });
    act(() => vi.advanceTimersByTime(12000));
    expect(transport.retry).toHaveBeenCalledTimes(1);
    transport.epoch.current = 2;
    receive({ ...snapshot(), phaseVersion: 2 });
    expect(result.current.pending).toBeUndefined();
    expect(result.current.feedback).toContain('已恢复最新状态');
    expect(transport.send).toHaveBeenCalledTimes(2);
  });

  it('ignores snapshots from another room or an older phase', () => {
    const { result } = renderHook(() => useDavinciSession('room'));
    const current = { ...snapshot(), phaseVersion: 3 };
    receive(current);
    receive(snapshot());
    receive({ ...snapshot(), roomID: 'other', phaseVersion: 4 });
    expect(result.current.snapshot).toEqual(current);
  });
});
