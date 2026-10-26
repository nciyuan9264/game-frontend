import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import {
  confirmsCommand,
  wallSelectionCopy,
} from './selectors';
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

const roomData = {
  pawns: {
    south: { row: 7, column: 4 },
    north: { row: 0, column: 4 },
  },
  walls: [{
    row: 3,
    column: 3,
    orientation: 'h',
    side: 'south',
  }],
  wallStock: { south: 9, north: 10 },
  currentPlayer: 'ai_2',
  currentSide: 'north',
  southPlayerID: '7',
  northPlayerID: 'ai_2',
  firstPlayerID: '7',
  roundNo: 1,
  gameStatus: 'playing',
  legalMoves: [
    { row: 1, column: 4 },
    { row: 0, column: 3 },
  ],
  wallOptions: [
    { row: 2, column: 2, orientation: 'v', legal: true },
    {
      row: 3,
      column: 3,
      orientation: 'h',
      legal: false,
      reasonCode: 'overlap',
    },
  ],
  referencePaths: {
    south: [{ row: 7, column: 4 }, { row: 6, column: 4 }],
    north: [{ row: 0, column: 4 }, { row: 1, column: 4 }],
  },
  moveLog: [{
    id: 1,
    kind: 'move',
    playerID: '7',
    side: 'south',
    from: { row: 8, column: 4 },
    to: { row: 7, column: 4 },
    automatic: false,
  }],
  lastAction: {
    id: 1,
    kind: 'move',
    playerID: '7',
    side: 'south',
    from: { row: 8, column: 4 },
    to: { row: 7, column: 4 },
    automatic: false,
  },
  turnDeadline: '2026-10-26T10:01:00Z',
  turnTimeoutMs: '60000',
  players: {
    '7': player,
    ai_2: {
      ...player,
      userID: undefined,
      playerID: 'ai_2',
      displayName: '曲径',
      seatIndex: 1,
      ai: true,
    },
  },
  playerOrder: ['7', 'ai_2'],
};

describe('quoridor protocol', () => {
  it('parses the authoritative board, paths, and wall options', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'quoridor-room',
      matchID: 'quoridor-room-r1',
      seq: '4',
      view: {
        quoridor: {
          playerId: '7',
          ownerID: '7',
          visibility: 'private',
          playerData: {
            '7': { side: 'south', wallsRemaining: 9, distanceToGoal: 7 },
            ai_2: { side: 'north', wallsRemaining: 10, distanceToGoal: 8 },
          },
          roomData,
        },
      },
    }));

    expect(message?.type).toBe('ROOM_SYNC');
    const snapshot = message as GameSnapshot;
    expect(snapshot.seq).toBe(4);
    expect(snapshot.roomData.pawns.south).toEqual({ row: 7, column: 4 });
    expect(snapshot.roomData.walls).toEqual([{
      row: 3,
      column: 3,
      orientation: 'h',
      side: 'south',
    }]);
    expect(snapshot.roomData.referencePaths.north).toHaveLength(2);
    expect(snapshot.roomData.lastAction?.to).toEqual({ row: 7, column: 4 });
    expect(snapshot.roomData.turnTimeoutMs).toBe(60_000);
    expect(wallSelectionCopy(snapshot.roomData.wallOptions[1]))
      .toContain('重叠');
  });

  it('rejects invalid authoritative coordinates as a whole snapshot', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'quoridor-room',
      matchID: 'quoridor-room-r1',
      seq: 4,
      view: {
        quoridor: {
          playerId: '7',
          ownerID: '7',
          visibility: 'public',
          playerData: {
            '7': { side: 'south', wallsRemaining: 9, distanceToGoal: 7 },
            ai_2: { side: 'north', wallsRemaining: 10, distanceToGoal: 8 },
          },
          roomData: {
            ...roomData,
            pawns: {
              ...roomData.pawns,
              south: { row: 9, column: 4 },
            },
          },
        },
      },
    }));
    expect(message).toBeUndefined();
  });

  it('accepts an initial replay frame without a winner', () => {
    const snapshot = parseReplaySnapshot({
      seq: -1,
      roomData: {
        ...roomData,
        pawns: {
          south: { row: 8, column: 4 },
          north: { row: 0, column: 4 },
        },
        walls: [],
        wallStock: { south: 10, north: 10 },
        moveLog: [],
        lastAction: undefined,
      },
      playersData: {
        '7': { side: 'south', wallsRemaining: 10, distanceToGoal: 8 },
        ai_2: { side: 'north', wallsRemaining: 10, distanceToGoal: 8 },
      },
      result: {
        winnerID: '',
        winnerSide: '',
        reason: '',
        turnCount: 0,
        placedWallCount: 0,
      },
    }, '7', 'quoridor-room');

    expect(snapshot?.seq).toBe(-1);
    expect(snapshot?.result?.winnerID).toBeUndefined();
    expect(snapshot?.roomData.moveLog).toEqual([]);
  });

  it('serializes every public game command through the generated union', () => {
    expect(createClientCommand(
      'quoridor',
      'match-1',
      'cmd-1',
      'game_move_pawn',
      { to: { row: 7, column: 4 } },
    ).payload).toEqual({
      quoridor: { movePawn: { to: { row: 7, column: 4 } } },
    });
    expect(createClientCommand(
      'quoridor',
      'match-1',
      'cmd-2',
      'game_place_wall',
      { wall: { row: 3, column: 3, orientation: 'h' } },
    ).payload).toEqual({
      quoridor: {
        placeWall: { wall: { row: 3, column: 3, orientation: 'h' } },
      },
    });
    expect(createClientCommand(
      'quoridor',
      'match-1',
      'cmd-3',
      'game_resign',
      {},
    ).payload).toEqual({ quoridor: { resign: {} } });
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
      type: 'game_move_pawn' as const,
      payload: { to: { row: 7, column: 4 } },
      before,
      epoch: 1,
    };
    expect(confirmsCommand(command, { ...before, seq: 4 })).toBe(true);
    expect(confirmsCommand(command, before)).toBe(false);
  });
});
