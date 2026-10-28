import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import { confirmsCommand } from './selectors';
import { parseServerMessage, type MatchSnapshot } from './session';

describe('Six Nimmt realtime model', () => {
  it('serializes all authoritative game commands', () => {
    expect(createClientCommand('sixnimmt', 'm1', 'c1', 'game_lock_card', { card: 55 }).payload)
      .toEqual({ sixnimmt: { lockCard: { card: 55 } } });
    expect(createClientCommand('sixnimmt', 'm1', 'c2', 'game_unlock_card', {}).payload)
      .toEqual({ sixnimmt: { unlockCard: {} } });
    expect(createClientCommand('sixnimmt', 'm1', 'c3', 'game_choose_row', { rowIndex: 2 }).payload)
      .toEqual({ sixnimmt: { chooseRow: { rowIndex: 2 } } });
    expect(createClientCommand('sixnimmt', 'm1', 'c4', 'game_next_round', {}).payload)
      .toEqual({ sixnimmt: { nextRound: {} } });
  });

  it('parses a player-scoped snapshot without opponent hands or locks', () => {
    const parsed = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'r1',
      matchID: 'm1',
      seq: '8',
      view: {
        sixnimmt: {
          playerId: 'p1',
          ownerID: 'p1',
          visibility: 'private',
          playerData: {
            p1: { roundPenalty: 0, totalPenalty: 3, handCount: 2, takenCount: 1, locked: true },
            p2: { roundPenalty: 5, totalPenalty: 9, handCount: 2, takenCount: 4, locked: true },
          },
          privateData: { hand: [55, 88], legalCards: [55, 88], lockedCard: 55 },
          roomData: {
            gameStatus: 'selecting', roundNo: 1, turnNo: 9,
            rows: [
              { index: 0, cards: [12, 23], bullheads: 2 },
              { index: 1, cards: [30, 44], bullheads: 8 },
              { index: 2, cards: [61, 64], bullheads: 2 },
              { index: 3, cards: [79, 90], bullheads: 4 },
            ],
            lockedPlayerIDs: ['p1', 'p2'], activityLog: [], turnTimeoutMs: '60000',
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
    expect(parsed.privateData).toEqual({ hand: [55, 88], legalCards: [55, 88], lockedCard: 55 });
    expect(parsed.playerData.p2).not.toHaveProperty('hand');
    expect(parsed.playerData.p2).not.toHaveProperty('lockedCard');
  });

  it('parses waiting snapshots with empty setup rows and nullable transient fields', () => {
    const parsed = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'sixnimmt-room',
      matchID: 'sixnimmt-room-r1',
      seq: '3',
      view: {
        sixnimmt: {
          playerId: '3',
          ownerID: '3',
          visibility: 'public',
          playerData: {
            '3': {
              roundPenalty: 0,
              totalPenalty: 0,
              handCount: 0,
              takenCount: 0,
              locked: false,
            },
            ai_2: {
              roundPenalty: 0,
              totalPenalty: 0,
              handCount: 0,
              takenCount: 0,
              locked: false,
            },
          },
          privateData: { hand: [], legalCards: [], lockedCard: null },
          result: null,
          roomData: {
            gameStatus: 'waiting',
            roundNo: 0,
            turnNo: 0,
            rows: [],
            lockedPlayerIDs: [],
            activityLog: null,
            lastResolution: null,
            pendingChoice: null,
            roundResult: null,
            turnDeadline: null,
            turnTimeoutMs: 0,
            roundTransitionDeadline: null,
            players: {
              '3': {
                playerID: '3',
                displayName: 'N次元',
                seatIndex: 0,
                online: true,
                ai: false,
                ready: false,
                userID: '3',
              },
              ai_2: {
                playerID: 'ai_2',
                displayName: '栗子',
                seatIndex: 1,
                online: true,
                ai: true,
                ready: true,
                userID: '',
              },
            },
            playerOrder: ['3', 'ai_2'],
          },
        },
      },
    }));

    expect(parsed?.type).toBe('ROOM_SYNC');
    if (parsed?.type !== 'ROOM_SYNC') throw new Error('room sync expected');
    expect(parsed.roomData.gameStatus).toBe('waiting');
    expect(parsed.roomData.rows).toEqual([]);
    expect(parsed.roomData.activityLog).toEqual([]);
    expect(parsed.privateData).toEqual({
      hand: [],
      legalCards: [],
      lockedCard: undefined,
    });
    expect(parsed.result).toBeUndefined();
  });

  it('confirms explicit match state changes', () => {
    const before: MatchSnapshot = {
      schemaVersion: 2, type: 'MATCH_SYNC', roomID: 'r1', matchID: 'm1', seq: 1,
      phaseVersion: 1, turnNumber: 1, ownerID: 'p1', playerID: 'p2', visibility: 'public',
      maxPlayers: 10, playerOrder: ['p1', 'p2'], status: 'match',
      players: {
        p1: { playerID: 'p1', displayName: 'Alice', name: 'Alice', seatIndex: 0, online: true, ai: false, ready: true },
        p2: { playerID: 'p2', displayName: 'Bob', name: 'Bob', seatIndex: 1, online: true, ai: false, ready: false },
      },
    };
    const next = { ...before, seq: 2, phaseVersion: 2, turnNumber: 2,
      players: { ...before.players, p2: { ...before.players.p2, ready: true } } };
    expect(confirmsCommand({ commandID: 'c1', type: 'match_ready', payload: { ready: true }, before, epoch: 1 }, next)).toBe(true);
  });
});
