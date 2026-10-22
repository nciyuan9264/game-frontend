import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MatchSnapshot,
  ServerMessage,
} from '../model/session';
import { useAcquireSession } from './useAcquireSession';

vi.mock('@/const/env', () => ({ gameWsUrl: 'ws://localhost/ws' }));
const transport = vi.hoisted(() => ({
  epoch: { current: 1 },
  send: vi.fn(() => true),
  retry: vi.fn(),
  receive: undefined as undefined | ((
    message: ServerMessage,
    epoch: number,
  ) => void),
}));
vi.mock('@/features/game-core/hooks/useGameConnection', () => ({
  useGameConnection: (
    _url: string,
    receive: typeof transport.receive,
  ) => {
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

const snapshot = (seq = 1): MatchSnapshot => ({
  schemaVersion: 2,
  type: 'MATCH_SYNC',
  roomID: 'room',
  matchID: 'match',
  seq,
  ownerID: 'me',
  playerID: 'me',
  visibility: 'public',
  phaseVersion: seq,
  turnNumber: seq,
  status: 'match',
  maxPlayers: 6,
  playerOrder: ['me'],
  players: {
    me: {
      playerID: 'me',
      name: 'Me',
      online: true,
      ai: false,
      ready: false,
    },
  },
});
const receive = (message: ServerMessage) =>
  act(() => transport.receive?.(message, transport.epoch.current));

beforeEach(() => {
  transport.epoch.current = 1;
  transport.receive = undefined;
  vi.clearAllMocks();
});

describe('Acquire v2 session', () => {
  it('sends generated acquire payloads with the active match ID', () => {
    const { result } = renderHook(() => useAcquireSession('room', 'match'));
    receive(snapshot());
    act(() => {
      result.current.submit('game_place_tile', { tileKey: '1A' });
    });

    expect(transport.send).toHaveBeenCalledWith({
      schemaVersion: 2,
      commandID: expect.any(String),
      matchID: 'match',
      type: 'game_place_tile',
      payload: { acquire: { placeTile: { tileKey: '1A' } } },
    });
  });

  it('keeps the last snapshot when a matching command is rejected', () => {
    const { result } = renderHook(() => useAcquireSession('room', 'match'));
    const before = snapshot();
    receive(before);
    act(() => {
      result.current.submit('match_add_ai');
    });
    receive({
      schemaVersion: 2,
      type: 'ERROR',
      roomID: 'room',
      matchID: 'match',
      seq: 1,
      commandID: result.current.pending?.commandID,
      code: 'room_full',
      message: '房间已满',
    });

    expect(result.current.pending).toBeUndefined();
    expect(result.current.snapshot).toEqual(before);
    expect(result.current.feedback).toBe('房间已满');
  });
});
