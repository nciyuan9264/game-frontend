import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import { toLeaderboardEntry } from '@/features/game-core/model/history';
import { confirmsCommand } from './selectors';
import {
  parseReplaySnapshot,
  parseServerMessage,
  type GameSnapshot,
} from './session';

const player = {
  userID: '7',
  playerID: '7',
  displayName: 'Alice',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};

const reserves = {
  queen: 1,
  ant: 2,
  beetle: 2,
  grasshopper: 3,
  spider: 2,
};

const roomData = {
  stacks: [{
    position: { q: 0, r: 0 },
    pieces: [{
      pieceID: 'wA1',
      side: 'white',
      kind: 'ant',
      number: 1,
    }],
  }, {
    position: { q: 1, r: 0 },
    pieces: [{
      pieceID: 'bA1',
      side: 'black',
      kind: 'ant',
      number: 1,
    }],
  }],
  currentPlayer: 'ai_2',
  currentSide: 'black',
  whitePlayerID: '7',
  blackPlayerID: 'ai_2',
  firstPlayerID: '7',
  roundNo: 1,
  gameStatus: 'playing',
  legalActions: [{
    kind: 'place',
    pieceID: 'bQ1',
    to: { q: 2, r: 0 },
    path: [{ q: 2, r: 0 }],
  }],
  moveLog: [{
    id: 1,
    kind: 'place',
    playerID: '7',
    side: 'white',
    pieceID: 'wA1',
    to: { q: 0, r: 0 },
    path: [{ q: 0, r: 0 }],
    automatic: false,
  }],
  lastAction: {
    id: 2,
    kind: 'place',
    playerID: 'ai_2',
    side: 'black',
    pieceID: 'bA1',
    to: { q: 1, r: 0 },
    path: [{ q: 1, r: 0 }],
    automatic: false,
  },
  turnDeadline: '2026-10-27T10:02:00Z',
  turnTimeoutMs: '120000',
  players: {
    '7': player,
    ai_2: {
      ...player,
      userID: undefined,
      playerID: 'ai_2',
      displayName: '行舟',
      seatIndex: 1,
      ai: true,
    },
  },
  playerOrder: ['7', 'ai_2'],
};

const playerData = {
  '7': {
    side: 'white',
    turnsTaken: 1,
    queenPlaced: false,
    queenPressure: 0,
    reserveByKind: reserves,
  },
  ai_2: {
    side: 'black',
    turnsTaken: 1,
    queenPlaced: false,
    queenPressure: 0,
    reserveByKind: reserves,
  },
};

describe('hive protocol', () => {
  it('parses authoritative stacks, legal actions, and timeout', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'hive-room',
      matchID: 'hive-room-r1',
      seq: '4',
      view: {
        hive: {
          playerId: '7',
          ownerID: '7',
          visibility: 'private',
          playerData,
          roomData,
        },
      },
    }));

    expect(message?.type).toBe('ROOM_SYNC');
    const snapshot = message as GameSnapshot;
    expect(snapshot.seq).toBe(4);
    expect(snapshot.roomData.stacks[0].pieces[0]).toMatchObject({
      pieceID: 'wA1',
      kind: 'ant',
    });
    expect(snapshot.roomData.legalActions[0]).toEqual({
      kind: 'place',
      pieceID: 'bQ1',
      to: { q: 2, r: 0 },
      path: [{ q: 2, r: 0 }],
    });
    expect(snapshot.roomData.turnTimeoutMs).toBe(120_000);
  });

  it('rejects an invalid piece kind as a whole snapshot', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'hive-room',
      matchID: 'hive-room-r1',
      seq: 4,
      view: {
        hive: {
          playerId: '7',
          ownerID: '7',
          visibility: 'public',
          playerData,
          roomData: {
            ...roomData,
            stacks: [{
              position: { q: 0, r: 0 },
              pieces: [{
                pieceID: 'wM1',
                side: 'white',
                kind: 'mosquito',
                number: 1,
              }],
            }],
          },
        },
      },
    }));
    expect(message).toBeUndefined();
  });

  it('accepts an initial replay frame without a result', () => {
    const snapshot = parseReplaySnapshot({
      seq: -1,
      roomData: {
        ...roomData,
        stacks: [],
        legalActions: [],
        moveLog: [],
        lastAction: undefined,
      },
      playersData: {
        '7': {
          side: 'white',
          turnsTaken: 0,
          queenPlaced: false,
          queenPressure: 0,
          reserveByKind: {
            queen: 1,
            ant: 3,
            beetle: 2,
            grasshopper: 3,
            spider: 2,
          },
        },
        ai_2: {
          side: 'black',
          turnsTaken: 0,
          queenPlaced: false,
          queenPressure: 0,
          reserveByKind: {
            queen: 1,
            ant: 3,
            beetle: 2,
            grasshopper: 3,
            spider: 2,
          },
        },
      },
      result: undefined,
    }, '7', 'hive-room');

    expect(snapshot?.seq).toBe(-1);
    expect(snapshot?.result).toBeUndefined();
    expect(snapshot?.roomData.stacks).toEqual([]);
  });

  it('serializes every public game command through the generated union', () => {
    expect(createClientCommand(
      'hive',
      'match-1',
      'cmd-1',
      'game_place_piece',
      { pieceID: 'wA1', to: { q: 0, r: 0 } },
    ).payload).toEqual({
      hive: { placePiece: { pieceID: 'wA1', to: { q: 0, r: 0 } } },
    });
    expect(createClientCommand(
      'hive',
      'match-1',
      'cmd-2',
      'game_move_piece',
      { pieceID: 'wA1', to: { q: -1, r: 1 } },
    ).payload).toEqual({
      hive: { movePiece: { pieceID: 'wA1', to: { q: -1, r: 1 } } },
    });
    expect(createClientCommand(
      'hive',
      'match-1',
      'cmd-3',
      'game_resign',
      {},
    ).payload).toEqual({ hive: { resign: {} } });
  });

  it('confirms game commands only after sequence advancement', () => {
    const before = {
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'room',
      matchID: 'match',
      seq: 3,
      phaseVersion: 3,
      turnNumber: 3,
    } as GameSnapshot;
    const command = {
      commandID: 'cmd',
      type: 'game_place_piece' as const,
      payload: { pieceID: 'wA1', to: { q: 0, r: 0 } },
      before,
      epoch: 1,
    };
    expect(confirmsCommand(command, { ...before, seq: 4 })).toBe(true);
    expect(confirmsCommand(command, before)).toBe(false);
  });

  it('maps Hive leaderboard metrics to win-rate entries', () => {
    expect(toLeaderboardEntry({
      userID: '7',
      playerID: '7',
      displayName: '织巢棋手',
      totalGames: 12,
      metric: { hive: { wins: 8, winRate: 2 / 3 } },
    })).toEqual({
      userID: '7',
      playerID: '7',
      displayName: '织巢棋手',
      totalGames: 12,
      wins: 8,
      winRate: 2 / 3,
    });
  });
});
