import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import { confirmsCommand } from './selectors';
import { parseServerMessage, type MatchSnapshot } from './session';

describe('Love Letter realtime model', () => {
  it('serializes all authoritative game commands', () => {
    expect(createClientCommand(
      'loveletter',
      'm1',
      'c1',
      'game_draw_card',
      {},
    ).payload).toEqual({ loveletter: { drawCard: {} } });
    expect(createClientCommand(
      'loveletter',
      'm1',
      'c2',
      'game_play_card',
      { cardID: 'card-1', targetPlayerID: 'p2', guessRank: 9 },
    ).payload).toEqual({
      loveletter: {
        playCard: {
          cardID: 'card-1',
          targetPlayerID: 'p2',
          guessRank: 9,
        },
      },
    });
    expect(createClientCommand(
      'loveletter',
      'm1',
      'c3',
      'game_settle_chancellor',
      { keepCardID: 'card-6', bottomCardIDs: ['card-1', 'card-9'] },
    ).payload).toEqual({
      loveletter: {
        settleChancellor: {
          keepCardID: 'card-6',
          bottomCardIDs: ['card-1', 'card-9'],
        },
      },
    });
    expect(createClientCommand(
      'loveletter',
      'm1',
      'c4',
      'game_next_round',
      {},
    ).payload).toEqual({ loveletter: { nextRound: {} } });
  });

  it('parses a player-scoped room snapshot without exposing another hand', () => {
    const parsed = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'r1',
      matchID: 'm1',
      seq: '8',
      view: {
        loveletter: {
          playerId: 'p1',
          ownerID: 'p1',
          visibility: 'private',
          playerData: {
            p1: { favors: 1, alive: true, protected: false, spyUsed: false, handCount: 2, discards: [] },
            p2: { favors: 0, alive: true, protected: false, spyUsed: false, handCount: 1, discards: [] },
          },
          privateData: {
            hand: [{ cardID: 'c1', rank: 1 }, { cardID: 'c9', rank: 9 }],
            legalCardIDs: ['c1', 'c9'],
            legalTargets: { c1: ['p2'], c9: [] },
            guardGuessRanks: [0, 2, 3, 4, 5, 6, 7, 8, 9],
          },
          roomData: {
            currentPlayer: 'p1',
            gameStatus: 'play',
            roundNo: 2,
            goal: 4,
            deckCount: 8,
            reserveCount: 1,
            burnCards: [],
            activityLog: [],
            turnTimeoutMs: '60000',
            players: {
              p1: { playerID: 'p1', displayName: 'Alice', seatIndex: 0, online: true, ai: false, ready: true },
              p2: { playerID: 'p2', displayName: 'Bob', seatIndex: 1, online: true, ai: false, ready: true },
            },
            playerOrder: ['p1', 'p2'],
          },
        },
      },
    }));

    expect(parsed?.type).toBe('ROOM_SYNC');
    if (parsed?.type !== 'ROOM_SYNC') throw new Error('room sync expected');
    expect(parsed.seq).toBe(8);
    expect(parsed.roomData.turnTimeoutMs).toBe(60000);
    expect(parsed.privateData.hand.map(card => card.cardID)).toEqual(['c1', 'c9']);
    expect(parsed.playerData.p2).not.toHaveProperty('hand');
    expect(parsed.roomData.players.p1.name).toBe('Alice');
  });

  it('confirms explicit match state changes', () => {
    const before: MatchSnapshot = {
      schemaVersion: 2,
      type: 'MATCH_SYNC',
      roomID: 'r1',
      matchID: 'm1',
      seq: 1,
      phaseVersion: 1,
      turnNumber: 1,
      ownerID: 'p1',
      playerID: 'p2',
      visibility: 'public',
      maxPlayers: 6,
      playerOrder: ['p1', 'p2'],
      status: 'match',
      players: {
        p1: { playerID: 'p1', displayName: 'Alice', name: 'Alice', seatIndex: 0, online: true, ai: false, ready: true },
        p2: { playerID: 'p2', displayName: 'Bob', name: 'Bob', seatIndex: 1, online: true, ai: false, ready: false },
      },
    };
    const next = {
      ...before,
      seq: 2,
      phaseVersion: 2,
      turnNumber: 2,
      players: {
        ...before.players,
        p2: { ...before.players.p2, ready: true },
      },
    };
    expect(confirmsCommand({
      commandID: 'c1',
      type: 'match_ready',
      payload: { ready: true },
      before,
      epoch: 1,
    }, next)).toBe(true);
  });
});
