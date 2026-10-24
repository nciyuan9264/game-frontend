import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MatchSnapshot,
  ServerMessage,
} from '../model/session';
import { useDavinciSession } from './useDavinciSession';

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
  maxPlayers: 2,
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

describe('DaVinci v2 session', () => {
  it('serializes a generated game command payload', () => {
    const { result } = renderHook(() => useDavinciSession('room', 'match'));
    receive(snapshot());
    act(() => {
      result.current.submit('game_guess_card', { id: 'card-1', num: 7 });
    });

    expect(transport.send).toHaveBeenCalledWith({
      schemaVersion: 2,
      commandID: expect.any(String),
      matchID: 'match',
      type: 'game_guess_card',
      payload: {
        davinci: {
          guessCard: { id: 'card-1', num: 7 },
        },
      },
    });
  });

  it('serializes initial Joker placements through the generated union', () => {
    const { result } = renderHook(() => useDavinciSession('room', 'match'));
    receive(snapshot());
    act(() => {
      result.current.submit('game_initialize_hand', {
        jokerPlacements: [{ id: 'joker-1', index: 2 }],
      });
    });

    expect(transport.send).toHaveBeenCalledWith({
      schemaVersion: 2,
      commandID: expect.any(String),
      matchID: 'match',
      type: 'game_initialize_hand',
      payload: {
        davinci: {
          initializeHand: {
            jokerPlacements: [{ id: 'joker-1', index: 2 }],
          },
        },
      },
    });
  });
});
