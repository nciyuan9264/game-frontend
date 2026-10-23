import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  SessionPendingCommand,
  SessionServerMessageBase,
  SessionSnapshotBase,
} from '../model/session';
import { useAuthoritativeSession } from './useAuthoritativeSession';

interface TestSnapshot extends SessionSnapshotBase {
  status: 'match' | 'waiting';
}

type TestCommand = 'ready' | 'act';
type TestPayload = Record<string, unknown>;
type TestMessage = TestSnapshot | (SessionServerMessageBase & {
  type: 'ERROR' | 'COMMAND_RESULT';
});

const transport = {
  epoch: { current: 1 },
  send: vi.fn((_message: unknown) => true),
  retry: vi.fn(),
  receive: undefined as undefined | ((message: TestMessage, epoch: number) => void),
};

function useTestConnection(
  _url: string,
  receive: (message: TestMessage, epoch: number) => void,
) {
  transport.receive = receive;
  return {
    status: 'connected',
    epoch: transport.epoch,
    send: transport.send,
    retry: transport.retry,
  };
}

const snapshot = (
  seq = 1,
  status: TestSnapshot['status'] = 'match',
): TestSnapshot => ({
  schemaVersion: 2,
  type: status === 'waiting' ? 'ROOM_SYNC' : 'MATCH_SYNC',
  roomID: 'room',
  matchID: 'match',
  seq,
  phaseVersion: seq,
  turnNumber: seq,
  status,
});

const result = (
  commandID: string,
  accepted = true,
): TestMessage => ({
  schemaVersion: 2,
  type: 'COMMAND_RESULT',
  roomID: 'room',
  matchID: 'match',
  seq: 1,
  commandID,
  accepted,
  message: accepted ? '' : 'not allowed',
});

const confirmsCommand = (
  command: SessionPendingCommand<TestSnapshot, TestCommand, TestPayload>,
  next: TestSnapshot,
) => next.seq > command.before.seq;

function useTestSession(url = 'ws://test') {
  return useAuthoritativeSession<
    TestSnapshot,
    TestMessage,
    TestCommand,
    TestPayload,
    ReturnType<typeof useTestConnection>
  >({
    roomID: 'room',
    url,
    useConnection: useTestConnection,
    confirmsCommand,
    createEmptyPayload: () => ({}),
    getWaitingKey: (value, epoch) =>
      value?.status === 'waiting'
        ? `${value.roomID}:${value.seq}:${epoch}`
        : '',
    readyCommand: 'ready',
    createCommand: (matchID, commandID, type, payload) => ({
      schemaVersion: 2,
      matchID,
      commandID,
      type,
      payload,
    }),
  });
}

const receive = (
  message: TestMessage,
  epoch = transport.epoch.current,
) => {
  act(() => transport.receive?.(message, epoch));
};

beforeEach(() => {
  vi.useFakeTimers();
  transport.epoch.current = 1;
  transport.receive = undefined;
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useAuthoritativeSession', () => {
  it('sends a v2 command and allows only one pending command', () => {
    const hook = renderHook(() => useTestSession());
    receive(snapshot());
    act(() => {
      expect(hook.result.current.submit('act', { value: 1 })).toBe(true);
    });
    const commandID = hook.result.current.pending?.commandID;
    expect(commandID).toBeTruthy();
    expect(transport.send).toHaveBeenCalledWith({
      schemaVersion: 2,
      matchID: 'match',
      commandID,
      type: 'act',
      payload: { value: 1 },
    });
    expect(hook.result.current.submit('act')).toBe(false);

    receive(result('other'));
    expect(hook.result.current.pending?.commandID).toBe(commandID);
    receive(result(commandID!));
    expect(hook.result.current.pending).toBeUndefined();
  });

  it('surfaces a matching rejected command result', () => {
    const hook = renderHook(() => useTestSession());
    receive(snapshot());
    act(() => {
      hook.result.current.submit('act');
    });
    receive(result(hook.result.current.pending!.commandID, false));

    expect(hook.result.current.pending).toBeUndefined();
    expect(hook.result.current.feedback).toBe('not allowed');
  });

  it('ignores stale, foreign, and mismatched-match snapshots', () => {
    const hook = renderHook(() => useTestSession());
    receive(snapshot(3));
    receive(snapshot(2));
    receive({ ...snapshot(4), roomID: 'other' });
    receive({ ...snapshot(4), matchID: 'other-match' });
    expect(hook.result.current.snapshot?.seq).toBe(3);
  });

  it('retries after confirmation timeout and unlocks on a new epoch', () => {
    const hook = renderHook(() => useTestSession());
    receive(snapshot());
    act(() => {
      hook.result.current.submit('act');
    });
    act(() => vi.advanceTimersByTime(12000));
    expect(transport.retry).toHaveBeenCalledTimes(1);

    transport.epoch.current = 2;
    receive(snapshot(2));
    expect(hook.result.current.pending).toBeUndefined();
    expect(hook.result.current.feedback).toContain('已恢复最新状态');
  });

  it('sends game ready once for each waiting seq and epoch', () => {
    const hook = renderHook(() => useTestSession());
    receive(snapshot(1, 'waiting'));
    expect(transport.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'ready',
      matchID: 'match',
    }));
    const commandID = hook.result.current.pending?.commandID;
    receive(result(commandID!));
    receive(snapshot(1, 'waiting'));
    expect(transport.send).toHaveBeenCalledTimes(1);
  });

  it('clears the old match boundary when the connection URL changes', () => {
    const hook = renderHook(
      ({ url }) => useTestSession(url),
      { initialProps: { url: 'ws://test?matchID=match' } },
    );
    receive(snapshot(3));
    act(() => {
      hook.result.current.submit('act');
    });

    hook.rerender({ url: 'ws://test?matchID=match-2' });
    expect(hook.result.current.snapshot).toBeUndefined();
    expect(hook.result.current.pending).toBeUndefined();

    receive({ ...snapshot(0), matchID: 'match-2' });
    expect(hook.result.current.snapshot?.matchID).toBe('match-2');
  });
});
