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

describe('yinsh protocol', () => {
  it('parses the authoritative room view and activity payloads', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'yinsh-room',
      matchID: 'yinsh-room-r1',
      seq: '4',
      view: {
        yinsh: {
          playerId: '7',
          ownerID: '7',
          visibility: 'private',
          playerData: {
            '7': { side: 'white', ringsRemoved: 0 },
            ai_2: { side: 'black', ringsRemoved: 0 },
          },
          roomData: {
            rings: { E4: 'white' },
            markers: {},
            currentPlayer: 'ai_2',
            gameStatus: 'placement',
            placedRings: { white: 1, black: 0 },
            markerPool: 51,
            legalMoves: {},
            candidateRows: [],
            lastAction: {
              action: 'place_ring',
              playerID: '7',
              payloadJSON: '{"pointID":"E4"}',
            },
            activity: [{
              action: 'place_ring',
              playerID: '7',
              payloadJSON: '{"pointID":"E4"}',
            }],
            players: {
              '7': player,
              ai_2: { ...player, userID: undefined, playerID: 'ai_2', displayName: '墨白', seatIndex: 1, ai: true },
            },
            playerOrder: ['7', 'ai_2'],
            roundNo: 1,
          },
        },
      },
    }));
    expect(message?.type).toBe('ROOM_SYNC');
    const snapshot = message as GameSnapshot;
    expect(snapshot.seq).toBe(4);
    expect(snapshot.roomData.rings.E4).toBe('white');
    expect(snapshot.roomData.activity[0].payload).toEqual({ pointID: 'E4' });
  });

  it('serializes every public yinsh command through the generated union', () => {
    expect(createClientCommand('yinsh', 'match-1', 'cmd-1', 'game_place_ring', {
      pointID: 'E4',
    }).payload).toEqual({ yinsh: { placeRing: { pointID: 'E4' } } });
    expect(createClientCommand('yinsh', 'match-1', 'cmd-2', 'game_move_ring', {
      from: 'E4',
      to: 'E8',
    }).payload).toEqual({ yinsh: { moveRing: { from: 'E4', to: 'E8' } } });
    expect(createClientCommand('yinsh', 'match-1', 'cmd-3', 'game_remove_row', {
      rowID: 'F3-F4-F5-F6-F7',
    }).payload).toEqual({ yinsh: { removeRow: { rowID: 'F3-F4-F5-F6-F7' } } });
    expect(createClientCommand('yinsh', 'match-1', 'cmd-4', 'game_remove_ring', {
      pointID: 'C5',
    }).payload).toEqual({ yinsh: { removeRing: { pointID: 'C5' } } });
    expect(createClientCommand('yinsh', 'match-1', 'cmd-5', 'game_resign', {}).payload)
      .toEqual({ yinsh: { resign: {} } });
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
      type: 'game_place_ring',
      payload: { pointID: 'E4' },
      before,
      epoch: 1,
    }, { ...before, seq: 4 })).toBe(true);
    expect(confirmsCommand({
      commandID: 'cmd',
      type: 'game_place_ring',
      payload: { pointID: 'E4' },
      before,
      epoch: 1,
    }, before)).toBe(false);
  });
});
