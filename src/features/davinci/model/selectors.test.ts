import { describe, expect, it } from 'vitest';
import type {
  GameSnapshot,
  MatchSnapshot,
  PendingCommand,
} from './session';
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

function matchSnapshot(visibility: MatchSnapshot['visibility']): MatchSnapshot {
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID: 'room',
    matchID: 'match',
    seq: visibility === 'private' ? 2 : 1,
    phaseVersion: visibility === 'private' ? 2 : 1,
    turnNumber: 0,
    ownerID: 'me',
    playerID: 'me',
    status: 'match',
    visibility,
    maxPlayers: 2,
    players: {},
    playerOrder: [],
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

  it('confirms room visibility after the authoritative snapshot changes', () => {
    const command = {
      commandID: 'command',
      type: 'room_update_settings',
      payload: { visibility: 'private' },
      before: matchSnapshot('public'),
      epoch: 1,
    } as PendingCommand;

    expect(confirmsCommand(command, matchSnapshot('private'))).toBe(true);
    expect(confirmsCommand(command, matchSnapshot('public'))).toBe(false);
  });
});
