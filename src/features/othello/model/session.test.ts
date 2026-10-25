import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import { confirmsCommand } from './selectors';
import { parseServerMessage, type GameSnapshot } from './session';

const player = {
  userID: '7',
  playerID: '7',
  displayName: 'Alice',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};

function opening() {
  const board = Array.from({ length: 64 }, () => '');
  board[27] = 'white';
  board[28] = 'black';
  board[35] = 'black';
  board[36] = 'white';
  return board;
}

describe('othello protocol', () => {
  it('parses the authoritative room view and structured move log', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'othello-room',
      matchID: 'othello-room-r1',
      seq: '4',
      view: {
        othello: {
          playerId: '7',
          ownerID: '7',
          visibility: 'private',
          playerData: {
            '7': { side: 'black', discCount: 4 },
            ai_2: { side: 'white', discCount: 1 },
          },
          roomData: {
            board: opening().map((disc, index) => index === 19 ? 'black' : disc),
            currentPlayer: 'ai_2',
            currentSide: 'white',
            blackPlayerID: '7',
            whitePlayerID: 'ai_2',
            roundNo: 1,
            gameStatus: 'playing',
            legalMoves: [{ index: 18, flips: [19], lines: [[19]] }],
            moveLog: [{
              id: 1,
              kind: 'move',
              playerID: '7',
              side: 'black',
              index: 19,
              flips: [27],
              automatic: false,
            }],
            lastData: {
              id: 1,
              kind: 'move',
              playerID: '7',
              side: 'black',
              index: 19,
              flips: [27],
              automatic: false,
            },
            turnDeadline: '2026-10-25T10:01:00Z',
            turnTimeoutMs: '60000',
            players: {
              '7': player,
              ai_2: {
                ...player,
                userID: undefined,
                playerID: 'ai_2',
                displayName: '墨白',
                seatIndex: 1,
                ai: true,
              },
            },
            playerOrder: ['7', 'ai_2'],
          },
        },
      },
    }));
    expect(message?.type).toBe('ROOM_SYNC');
    const snapshot = message as GameSnapshot;
    expect(snapshot.seq).toBe(4);
    expect(snapshot.roomData.board).toHaveLength(64);
    expect(snapshot.roomData.lastData?.index).toBe(19);
    expect(snapshot.roomData.legalMoves[0].lines).toEqual([[19]]);
    expect(snapshot.roomData.turnTimeoutMs).toBe(60_000);
  });

  it('normalizes nullable transport lists after a forced pass', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'othello-room',
      matchID: 'othello-room-r1',
      seq: '59',
      view: {
        othello: {
          playerId: '7',
          ownerID: '7',
          visibility: 'private',
          playerData: {
            '7': { side: 'black', discCount: 24 },
            ai_2: { side: 'white', discCount: 38 },
          },
          roomData: {
            board: opening(),
            currentPlayer: 'ai_2',
            currentSide: 'white',
            blackPlayerID: '7',
            whitePlayerID: 'ai_2',
            roundNo: 1,
            gameStatus: 'playing',
            legalMoves: [{ index: 1, flips: [10, 19], lines: [[10, 19]] }],
            moveLog: [{
              id: 59,
              kind: 'pass',
              playerID: '7',
              side: 'black',
              flips: null,
              automatic: false,
            }],
            lastData: {
              id: 59,
              kind: 'pass',
              playerID: '7',
              side: 'black',
              flips: null,
              automatic: false,
            },
            players: {
              '7': player,
              ai_2: {
                ...player,
                userID: undefined,
                playerID: 'ai_2',
                displayName: '墨白',
                seatIndex: 1,
                ai: true,
              },
            },
            playerOrder: ['7', 'ai_2'],
          },
        },
      },
    }));
    expect(message?.type).toBe('ROOM_SYNC');
    const snapshot = message as GameSnapshot;
    expect(snapshot.roomData.moveLog[0].flips).toEqual([]);
    expect(snapshot.roomData.lastData?.flips).toEqual([]);
    expect(snapshot.roomData.legalMoves[0].lines).toEqual([[10, 19]]);
  });

  it('serializes every public othello command through the generated union', () => {
    expect(createClientCommand('othello', 'match-1', 'cmd-1', 'game_place_disc', {
      index: 19,
    }).payload).toEqual({ othello: { placeDisc: { index: 19 } } });
    expect(createClientCommand('othello', 'match-1', 'cmd-2', 'game_pass', {}).payload)
      .toEqual({ othello: { pass: {} } });
    expect(createClientCommand('othello', 'match-1', 'cmd-3', 'game_resign', {}).payload)
      .toEqual({ othello: { resign: {} } });
  });

  it('confirms a game command only after sequence advancement', () => {
    const before = {
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'room',
      matchID: 'match',
      seq: 3,
      phaseVersion: 3,
      turnNumber: 3,
    } as GameSnapshot;
    expect(confirmsCommand({
      commandID: 'cmd',
      type: 'game_place_disc',
      payload: { index: 19 },
      before,
      epoch: 1,
    }, { ...before, seq: 4 })).toBe(true);
    expect(confirmsCommand({
      commandID: 'cmd',
      type: 'game_place_disc',
      payload: { index: 19 },
      before,
      epoch: 1,
    }, before)).toBe(false);
  });
});
