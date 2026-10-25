import { describe, expect, it } from 'vitest';
import type { MatchSnapshot } from '../../model/session';
import { roomReadiness, roomSeatOrder } from './parts';

const snapshot = (
  players: MatchSnapshot['players'],
  playerOrder = Object.keys(players),
) => ({
  type: 'MATCH_SYNC',
  roomID: 'othello-room',
  ownerID: 'owner',
  playerID: 'owner',
  visibility: 'public',
  phaseVersion: 1,
  turnNumber: 0,
  status: 'match',
  maxPlayers: 2,
  players,
  playerOrder,
}) as MatchSnapshot;

describe('Othello room presentation', () => {
  it('keeps explicit two-seat placement', () => {
    const data = snapshot({
      owner: {
        playerID: 'owner',
        online: true,
        ready: true,
        ai: false,
        seatIndex: 0,
      },
      ai_2: {
        playerID: 'ai_2',
        online: true,
        ready: true,
        ai: true,
        seatIndex: 1,
      },
    });
    expect(roomSeatOrder(data)).toEqual(['owner', 'ai_2']);
  });

  it('requires both occupied seats to be ready', () => {
    const waiting = snapshot({
      owner: {
        playerID: 'owner',
        online: true,
        ready: true,
        ai: false,
        seatIndex: 0,
      },
      guest: {
        playerID: 'guest',
        online: true,
        ready: false,
        ai: false,
        seatIndex: 1,
      },
    });
    expect(roomReadiness(waiting)).toMatchObject({
      count: 2,
      ready: 1,
      canStart: false,
    });
    waiting.players.guest.ready = true;
    expect(roomReadiness(waiting).canStart).toBe(true);
  });
});
