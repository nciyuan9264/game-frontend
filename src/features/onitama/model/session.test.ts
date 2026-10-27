import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
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

const pieces = ([
  ['red-0', 'red', 'student', 0, 0],
  ['red-1', 'red', 'student', 0, 1],
  ['red-master', 'red', 'master', 0, 2],
  ['red-3', 'red', 'student', 0, 3],
  ['red-4', 'red', 'student', 0, 4],
  ['blue-0', 'blue', 'student', 4, 0],
  ['blue-1', 'blue', 'student', 4, 1],
  ['blue-master', 'blue', 'master', 4, 2],
  ['blue-3', 'blue', 'student', 4, 3],
  ['blue-4', 'blue', 'student', 4, 4],
] as const).map(([id, side, kind, row, column]) => ({
  id,
  side,
  kind,
  cell: { row, column },
}));

const roomData = {
  pieces,
  hands: {
    blue: ['tiger', 'crane'],
    red: ['dragon', 'elephant'],
  },
  transitCardID: 'crab',
  currentPlayer: '7',
  currentSide: 'blue',
  bluePlayerID: '7',
  redPlayerID: 'ai_2',
  firstPlayerID: '7',
  roundNo: 1,
  gameStatus: 'playing',
  legalMoves: [{
    cardID: 'tiger',
    pieceID: 'blue-master',
    to: { row: 2, column: 2 },
    winning: false,
  }],
  canPass: false,
  moveLog: [],
  turnDeadline: '2026-10-27T10:01:00Z',
  turnTimeoutMs: '60000',
  players: {
    '7': player,
    ai_2: {
      ...player,
      userID: undefined,
      playerID: 'ai_2',
      displayName: '松风',
      seatIndex: 1,
      ai: true,
    },
  },
  playerOrder: ['7', 'ai_2'],
};

const playerData = {
  '7': { side: 'blue', pieceCount: 5, masterAlive: true },
  ai_2: { side: 'red', pieceCount: 5, masterAlive: true },
};

function roomMessage(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'onitama-room',
    matchID: 'onitama-room-r1',
    seq: '4',
    view: {
      onitama: {
        playerId: '7',
        ownerID: '7',
        visibility: 'private',
        playerData,
        roomData: { ...roomData, ...overrides },
      },
    },
  });
}

describe('onitama protocol', () => {
  it('parses the public board, five-card deal, and legal moves', () => {
    const message = parseServerMessage(roomMessage());
    expect(message?.type).toBe('ROOM_SYNC');
    const snapshot = message as GameSnapshot;
    expect(snapshot.seq).toBe(4);
    expect(snapshot.roomData.pieces).toHaveLength(10);
    expect(snapshot.roomData.hands.blue).toEqual(['tiger', 'crane']);
    expect(snapshot.roomData.transitCardID).toBe('crab');
    expect(snapshot.roomData.legalMoves[0]).toEqual({
      cardID: 'tiger',
      pieceID: 'blue-master',
      to: { row: 2, column: 2 },
      capturedPieceID: undefined,
      winning: false,
    });
    expect(snapshot.roomData.turnTimeoutMs).toBe(60_000);
  });

  it('rejects invalid cells, cards, and duplicate dealt cards', () => {
    expect(parseServerMessage(roomMessage({
      pieces: pieces.map(piece => piece.id === 'blue-master'
        ? { ...piece, cell: { row: 5, column: 2 } }
        : piece),
    }))).toBeUndefined();
    expect(parseServerMessage(roomMessage({
      hands: { blue: ['unknown', 'crane'], red: ['dragon', 'elephant'] },
    }))).toBeUndefined();
    expect(parseServerMessage(roomMessage({
      hands: { blue: ['tiger', 'crane'], red: ['dragon', 'tiger'] },
    }))).toBeUndefined();
  });

  it('accepts a replay frame before the result exists', () => {
    const snapshot = parseReplaySnapshot({
      seq: -1,
      roomData: roomData as never,
      playersData: playerData,
    }, '7', 'onitama-room');
    expect(snapshot?.seq).toBe(-1);
    expect(snapshot?.result).toBeUndefined();
    expect(snapshot?.roomData.pieces).toHaveLength(10);
  });

  it('serializes all Onitama commands through the generated union', () => {
    expect(createClientCommand(
      'onitama',
      'match-1',
      'cmd-1',
      'game_move_piece',
      {
        cardID: 'tiger',
        pieceID: 'blue-master',
        to: { row: 2, column: 2 },
      },
    ).payload).toEqual({
      onitama: {
        movePiece: {
          cardID: 'tiger',
          pieceID: 'blue-master',
          to: { row: 2, column: 2 },
        },
      },
    });
    expect(createClientCommand(
      'onitama',
      'match-1',
      'cmd-2',
      'game_pass',
      { cardID: 'crane' },
    ).payload).toEqual({ onitama: { pass: { cardID: 'crane' } } });
    expect(createClientCommand(
      'onitama',
      'match-1',
      'cmd-3',
      'game_resign',
      {},
    ).payload).toEqual({ onitama: { resign: {} } });
  });

  it('confirms moves only from a matching authoritative log entry', () => {
    const before = parseServerMessage(roomMessage()) as GameSnapshot;
    const command = {
      commandID: 'cmd',
      type: 'game_move_piece' as const,
      payload: {
        cardID: 'tiger',
        pieceID: 'blue-master',
        to: { row: 2, column: 2 },
      },
      before,
      epoch: 1,
    };
    expect(confirmsCommand(command, { ...before, seq: 5 })).toBe(false);
    expect(confirmsCommand(command, {
      ...before,
      seq: 5,
      roomData: {
        ...before.roomData,
        moveLog: [{
          id: 1,
          kind: 'move',
          playerID: '7',
          side: 'blue',
          cardID: 'tiger',
          pieceID: 'blue-master',
          from: { row: 4, column: 2 },
          to: { row: 2, column: 2 },
          receivedCardID: 'crab',
          automatic: false,
        }],
      },
    })).toBe(true);
  });
});
