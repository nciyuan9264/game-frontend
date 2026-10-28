import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import { confirmsCommand } from './selectors';
import { parseServerMessage, type MatchSnapshot } from './session';

describe('Cant Stop realtime model', () => {
  it('serializes all authoritative game commands', () => {
    expect(createClientCommand('cantstop', 'm1', 'c1', 'game_roll_dice', {}).payload)
      .toEqual({ cantstop: { rollDice: {} } });
    expect(createClientCommand('cantstop', 'm1', 'c2', 'game_advance', { actionID: 'a1' }).payload)
      .toEqual({ cantstop: { advance: { actionID: 'a1' } } });
    expect(createClientCommand('cantstop', 'm1', 'c3', 'game_bank', {}).payload)
      .toEqual({ cantstop: { bank: {} } });
    expect(createClientCommand('cantstop', 'm1', 'c4', 'game_next_turn', {}).payload)
      .toEqual({ cantstop: { nextTurn: {} } });
  });

  it('parses a player-scoped route snapshot', () => {
    const parsed = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'r1',
      matchID: 'm1',
      seq: '8',
      view: {
        cantstop: {
          playerId: 'p1',
          ownerID: 'p1',
          visibility: 'private',
          playerData: {
            p1: { savedProgress: { 7: 3 }, claimedColumns: [], savedStepCount: 3 },
            p2: { savedProgress: { 6: 2 }, claimedColumns: [2], savedStepCount: 5 },
          },
          roomData: {
            gameStatus: 'choose',
            currentPlayer: 'p1',
            nextPlayer: 'p2',
            turnNumber: 2,
            rollNumber: 1,
            dice: [1, 2, 3, 4],
            pairingOptions: [{
              actionID: 'a1',
              pairingIndex: 0,
              variantIndex: 0,
              sums: [3, 7],
              diceIndexes: [0, 1, 2, 3],
              advances: { 3: 1, 7: 1 },
              runnerPositions: { 3: 1, 7: 4 },
              stepCount: 2,
            }],
            runners: { 7: 3 },
            claimedBy: { 2: 'p2' },
            activityLog: [],
            bustRisk: 0.12,
            turnGain: 1,
            lostGain: 0,
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
    expect(parsed.roomData.gameStatus).toBe('choose');
    expect(parsed.roomData.turnTimeoutMs).toBe(60000);
    expect(parsed.roomData.pairingOptions[0].actionID).toBe('a1');
    expect(parsed.playerData.p2.claimedColumns).toEqual([2]);
  });

  it('parses waiting snapshots with nullable transient fields', () => {
    const parsed = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'cantstop-room',
      matchID: 'cantstop-room-r1',
      seq: '5',
      view: {
        cantstop: {
          playerId: '3',
          ownerID: '3',
          visibility: 'public',
          playerData: {
            '3': {
              savedProgress: {},
              claimedColumns: [],
              savedStepCount: 0,
              busts: 0,
            },
            ai_2: {
              savedProgress: {},
              claimedColumns: [],
              savedStepCount: 0,
              busts: 0,
            },
          },
          result: null,
          roomData: {
            gameStatus: 'waiting',
            currentPlayer: '',
            nextPlayer: '',
            turnNumber: 0,
            rollNumber: 0,
            dice: null,
            pairingOptions: [],
            runners: {},
            claimedBy: {},
            activityLog: null,
            lastAction: null,
            bustRisk: 0,
            turnGain: 0,
            lostGain: 0,
            turnDeadline: null,
            turnTimeoutMs: null,
            turnTransitionDeadline: null,
            turnTransitionTimeoutMs: null,
            columnHeights: { 2: 3, 3: 5, 4: 7 },
            targetColumns: 3,
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
                displayName: '阿橙',
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
    expect(parsed.roomData.dice).toEqual([]);
    expect(parsed.roomData.activityLog).toEqual([]);
    expect(parsed.roomData.turnTimeoutMs).toBeUndefined();
    expect(parsed.result).toBeUndefined();
  });

  it('confirms explicit match state changes', () => {
    const before: MatchSnapshot = {
      schemaVersion: 2, type: 'MATCH_SYNC', roomID: 'r1', matchID: 'm1', seq: 1,
      phaseVersion: 1, turnNumber: 1, ownerID: 'p1', playerID: 'p2', visibility: 'public',
      maxPlayers: 4, playerOrder: ['p1', 'p2'], status: 'match',
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
