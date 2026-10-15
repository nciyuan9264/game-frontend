import { describe, expect, it } from 'vitest';
import type { MatchSnapshot } from '../../model/session';
import { roomSeatOrder } from './parts';

const snapshot = (players: MatchSnapshot['players'], playerOrder = Object.keys(players)) => ({
  type: 'MATCH_SYNC',
  roomID: 'room',
  ownerID: 'owner',
  playerID: 'owner',
  visibility: 'public',
  phaseVersion: 1,
  turnNumber: 0,
  status: 'match',
  maxPlayers: 6,
  players,
  playerOrder,
}) as MatchSnapshot;

describe('Acquire room seats', () => {
  it('places a targeted AI in the requested visual seat', () => {
    const data = snapshot({
      owner: { playerID: 'owner', online: true, ready: true, ai: false, seatIndex: 0 },
      ai_001: { playerID: 'ai_001', online: true, ready: true, ai: true, seatIndex: 4 },
    });
    expect(roomSeatOrder(data)).toEqual(['owner', undefined, undefined, undefined, 'ai_001', undefined]);
  });

  it('keeps legacy snapshots ordered in the first available seats', () => {
    const data = snapshot({
      owner: { playerID: 'owner', online: true, ready: true, ai: false },
      guest: { playerID: 'guest', online: true, ready: false, ai: false },
    });
    expect(roomSeatOrder(data).slice(0, 2)).toEqual(['owner', 'guest']);
  });
});
