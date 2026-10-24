import { describe, expect, it } from 'vitest';
import { parseServerMessage } from './session';

describe('splendor protocol parser', () => {
  it('unwraps the v2 game view and derives UI sequence fields', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'room',
      matchID: 'match',
      seq: 4,
      view: {
        splendor: {
          ownerID: 'owner',
          visibility: 'public',
          playerId: 'me',
          playerData: {
            me: {
              normalCard: null,
              nobleCard: null,
              gem: null,
              score: 0,
              reserveCard: null,
            },
          },
          roomData: {
            card: {},
            deckCounts: {},
            gems: {},
            nobles: [],
            currentPlayer: 'me',
            gameStatus: 'playing',
            players: {},
            playerOrder: [],
          },
        },
      },
    }));
    expect(message?.type).toBe('ROOM_SYNC');
    if (message?.type === 'ROOM_SYNC') {
      expect(message.phaseVersion).toBe(4);
      expect(message.playerData.me).toEqual({
        normalCard: [],
        nobleCard: [],
        gem: {},
        score: 0,
        reserveCard: [],
      });
    }
  });

  it('retains structured errors and ignores malformed snapshots', () => {
    expect(parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ERROR',
      roomID: 'room',
      matchID: 'match',
      seq: 4,
      code: 'phase_changed',
      message: '阶段已变化',
    }))).toMatchObject({ type: 'ERROR', code: 'phase_changed' });
    expect(parseServerMessage(JSON.stringify({ type: 'ROOM_SYNC', roomID: 'room' }))).toBeUndefined();
    expect(parseServerMessage('{')).toBeUndefined();
  });
});
