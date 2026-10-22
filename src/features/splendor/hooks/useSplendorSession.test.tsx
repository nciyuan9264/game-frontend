import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MatchSnapshot,
  ServerMessage,
} from '../model/session';
import { useSplendorSession } from './useSplendorSession';

vi.mock('@/const/env', () => ({ gameWsUrl: 'ws://localhost/ws' }));
const transport = vi.hoisted(() => ({
  epoch: { current: 1 },
  send: vi.fn(() => true),
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
      retry: vi.fn(),
      close: vi.fn(),
    };
  },
}));

const snapshot = (): MatchSnapshot => ({
  schemaVersion: 2,
  type: 'MATCH_SYNC',
  roomID: 'room',
  matchID: 'match',
  seq: 1,
  ownerID: 'me',
  playerID: 'me',
  phaseVersion: 1,
  turnNumber: 1,
  status: 'match',
  visibility: 'public',
  maxPlayers: 4,
  playerOrder: ['me'],
  players: {
    me: {
      playerID: 'me',
      name: 'Me',
      online: true,
      ai: false,
      ready: true,
    },
  },
});
const receive = (message: ServerMessage) =>
  act(() => transport.receive?.(message, transport.epoch.current));

beforeEach(() => {
  transport.receive = undefined;
  vi.clearAllMocks();
});
afterEach(cleanup);

describe('Splendor v2 session', () => {
  it('normalizes scalar card IDs into generated payloads', () => {
    const hook = renderHook(() => useSplendorSession('room', 'match'));
    receive(snapshot());
    act(() => {
      hook.result.current.submit('game_buy_card', 9);
    });

    expect(transport.send).toHaveBeenCalledWith({
      schemaVersion: 2,
      commandID: expect.any(String),
      matchID: 'match',
      type: 'game_buy_card',
      payload: {
        splendor: {
          buyCard: { cardID: 9 },
        },
      },
    });
  });
});
