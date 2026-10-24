import { describe, expect, it } from 'vitest';
import type { GameSnapshot, PendingCommand } from './session';
import { confirmsCommand } from './selectors';

function snapshot(ready: boolean, status: GameSnapshot['roomData']['gameStatus'] = 'initialize'): GameSnapshot {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'room',
    matchID: 'match',
    seq: ready ? 2 : 1,
    phaseVersion: ready ? 2 : 1,
    turnNumber: ready ? 2 : 1,
    ownerID: 'me',
    playerId: 'me',
    roomData: {
      currentPlayer: '',
      gameStatus: status,
      players: {},
      playerOrder: [],
      boardCards: {},
    },
    cardData: {
      self: [],
      opponents: [],
      initialHandReady: ready,
    },
  };
}

describe('DaVinci command confirmation', () => {
  it('confirms initial-hand submission from the private flag or phase transition', () => {
    const command = {
      commandID: 'command',
      type: 'game_initialize_hand',
      payload: { jokerPlacements: [] },
      before: snapshot(false),
      epoch: 1,
    } as PendingCommand;

    expect(confirmsCommand(command, snapshot(true))).toBe(true);
    expect(confirmsCommand(command, snapshot(false, 'waiting'))).toBe(true);
    expect(confirmsCommand(command, snapshot(false))).toBe(false);
  });
});
