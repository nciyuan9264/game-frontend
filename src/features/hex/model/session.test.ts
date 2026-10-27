import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import { confirmsCommand } from './selectors';
import {
  parseReplaySnapshot,
  parseServerMessage,
  selfID,
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

const roomData = {
  boardSize: 11,
  board: Array.from({ length: 121 }, (_, index) =>
    index === 60 ? 'red' : index === 61 ? 'teal' : ''),
  currentPlayer: '7',
  currentSide: 'red',
  redPlayerID: '7',
  tealPlayerID: 'ai_2',
  firstPlayerID: '7',
  roundNo: 1,
  gameStatus: 'playing',
  pieRule: true,
  swapAvailable: false,
  legalMoves: [{ row: 4, column: 4 }],
  winningPath: [],
  moveLog: [{
    id: 1,
    kind: 'place',
    playerID: '7',
    side: 'red',
    cell: { row: 5, column: 5 },
    automatic: false,
  }],
  lastAction: {
    id: 1,
    kind: 'place',
    playerID: '7',
    side: 'red',
    cell: { row: 5, column: 5 },
    automatic: false,
  },
  turnDeadline: '2026-10-27T10:01:00Z',
  turnTimeoutMs: '60000',
  players: {
    '7': player,
    ai_2: {
      ...player,
      userID: undefined,
      playerID: 'ai_2',
      displayName: '青岸',
      seatIndex: 1,
      ai: true,
    },
  },
  playerOrder: ['7', 'ai_2'],
};

function roomMessage(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'hex-room',
    matchID: 'hex-room-r1',
    seq: '4',
    view: {
      hex: {
        playerId: '7',
        ownerID: '7',
        visibility: 'private',
        playerData: {
          '7': { side: 'red', stoneCount: 1 },
          ai_2: { side: 'teal', stoneCount: 1 },
        },
        roomData,
        ...overrides,
      },
    },
  });
}

describe('Hex protocol', () => {
  it('parses the authoritative board, legal moves, and timeout', () => {
    const message = parseServerMessage(roomMessage());
    expect(message?.type).toBe('ROOM_SYNC');
    const snapshot = message as GameSnapshot;
    expect(snapshot.seq).toBe(4);
    expect(snapshot.roomData.board).toHaveLength(121);
    expect(snapshot.roomData.board[60]).toBe('red');
    expect(snapshot.roomData.legalMoves).toEqual([{ row: 4, column: 4 }]);
    expect(snapshot.roomData.lastAction?.cell).toEqual({ row: 5, column: 5 });
    expect(snapshot.roomData.turnTimeoutMs).toBe(60_000);
    expect(selfID(snapshot)).toBe('7');
  });

  it('rejects an invalid board or out-of-range authoritative coordinate', () => {
    expect(parseServerMessage(roomMessage({
      roomData: { ...roomData, board: roomData.board.slice(1) },
    }))).toBeUndefined();
    expect(parseServerMessage(roomMessage({
      roomData: { ...roomData, legalMoves: [{ row: 11, column: 0 }] },
    }))).toBeUndefined();
  });

  it('accepts the initial replay frame without a winner', () => {
    const snapshot = parseReplaySnapshot({
      seq: -1,
      roomData: {
        ...roomData,
        board: Array(121).fill(''),
        moveLog: [],
        lastAction: undefined,
        legalMoves: Array.from({ length: 121 }, (_, index) => ({
          row: Math.floor(index / 11),
          column: index % 11,
        })),
      },
      playersData: {
        '7': { side: 'red', stoneCount: 0 },
        ai_2: { side: 'teal', stoneCount: 0 },
      },
    }, '7', 'hex-room');

    expect(snapshot?.seq).toBe(-1);
    expect(snapshot?.result).toBeUndefined();
    expect(snapshot?.roomData.moveLog).toEqual([]);
  });

  it('serializes every public game command through the generated union', () => {
    expect(createClientCommand(
      'hex',
      'match-1',
      'cmd-1',
      'game_place_stone',
      { cell: { row: 5, column: 5 } },
    ).payload).toEqual({
      hex: { placeStone: { cell: { row: 5, column: 5 } } },
    });
    expect(createClientCommand(
      'hex', 'match-1', 'cmd-2', 'game_swap', {},
    ).payload).toEqual({ hex: { swap: {} } });
    expect(createClientCommand(
      'hex', 'match-1', 'cmd-3', 'game_resign', {},
    ).payload).toEqual({ hex: { resign: {} } });
  });

  it('confirms a game command only after sequence advancement', () => {
    const before = parseServerMessage(roomMessage()) as GameSnapshot;
    const command = {
      commandID: 'cmd',
      type: 'game_place_stone' as const,
      payload: { cell: { row: 4, column: 4 } },
      before,
      epoch: 1,
    };
    expect(confirmsCommand(command, { ...before, seq: 5 })).toBe(true);
    expect(confirmsCommand(command, before)).toBe(false);
  });
});
