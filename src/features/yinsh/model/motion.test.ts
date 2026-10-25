import { describe, expect, it } from 'vitest';
import { buildYinshMotion } from './motion';
import type { GameSnapshot } from './session';

function snapshot(seq: number): GameSnapshot {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'room',
    matchID: 'room-r1',
    seq,
    phaseVersion: seq,
    turnNumber: seq,
    ownerID: 'white-player',
    visibility: 'private',
    playerId: 'white-player',
    playerData: {
      'white-player': { side: 'white', ringsRemoved: 0 },
      'black-player': { side: 'black', ringsRemoved: 0 },
    },
    roomData: {
      rings: { E4: 'white', D3: 'black' },
      markers: { E5: 'black', E6: 'white' },
      currentPlayer: 'white-player',
      gameStatus: 'move',
      placedRings: { white: 5, black: 5 },
      markerPool: 49,
      legalMoves: {},
      candidateRows: [],
      activity: [],
      players: {},
      playerOrder: ['white-player', 'black-player'],
      roundNo: 1,
    },
  };
}

describe('YINSH authoritative motion', () => {
  it('builds a move from two accepted snapshots without changing either one', () => {
    const before = snapshot(10);
    const after = snapshot(11);
    after.roomData.rings = { E7: 'white', D3: 'black' };
    after.roomData.markers = { E4: 'white', E5: 'white', E6: 'black' };
    after.roomData.lastAction = {
      action: 'move_ring',
      playerID: 'white-player',
      payload: {
        from: 'E4',
        to: 'E7',
        side: 'white',
        flips: ['E5', 'E6'],
      },
    };

    const motion = buildYinshMotion(before, after);

    expect(motion).toMatchObject({
      kind: 'move',
      side: 'white',
      from: 'E4',
      to: 'E7',
      affected: ['E4', 'E5', 'E6'],
    });
    expect(motion?.flips.map(flip => [
      flip.id,
      flip.before,
      flip.after,
    ])).toEqual([
      ['E5', 'black', 'white'],
      ['E6', 'white', 'black'],
    ]);
    expect(before.roomData.rings).toEqual({ E4: 'white', D3: 'black' });
  });

  it('derives removed row points from the snapshot diff', () => {
    const before = snapshot(20);
    before.roomData.markers = {
      E3: 'white',
      E4: 'white',
      E5: 'white',
      E6: 'white',
      E7: 'white',
    };
    const after = snapshot(21);
    after.roomData.markers = {};
    after.roomData.gameStatus = 'remove_ring';
    after.roomData.lastAction = {
      action: 'remove_row',
      playerID: 'white-player',
      payload: { side: 'white' },
    };

    expect(buildYinshMotion(before, after)?.affected).toEqual([
      'E3',
      'E4',
      'E5',
      'E6',
      'E7',
    ]);
  });
});
