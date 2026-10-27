import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import { parseServerMessage } from './session';

const player = {
  userID: '7',
  playerID: '7',
  displayName: '周末买家',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};

describe('for sale protocol', () => {
  it('parses match and room snapshots with numeric deadlines', () => {
    const match = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'MATCH_SYNC',
      roomID: 'sale-room',
      matchID: 'sale-room-r1',
      seq: '1',
      ownerID: '7',
      status: 'match',
      playerID: '7',
      visibility: 'private',
      maxPlayers: 6,
      players: { '7': player },
      playerOrder: ['7'],
    }));
    expect(match?.type).toBe('MATCH_SYNC');

    const room = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'sale-room',
      matchID: 'sale-room-r1',
      seq: '2',
      view: {
        forSale: {
          playerId: '7',
          ownerID: '7',
          visibility: 'private',
          playerData: {
            '7': {
              seatIndex: 0,
              bid: 3,
              passed: false,
              propertyCount: 1,
              chequeCount: 0,
              locked: false,
              coins: 18,
              properties: [12],
              cheques: [],
              actionTimeoutMs: '60000',
            },
          },
          roomData: {
            gameStatus: 'auction',
            round: 2,
            totalRounds: 7,
            propertyMarket: [4, 19, 24, 27],
            chequeMarket: [],
            highestBid: 3,
            currentPlayer: '7',
            starterPlayer: '7',
            lockedCount: 0,
            purchases: [],
            sales: [],
            actionLog: [],
            players: { '7': player },
            playerOrder: ['7'],
            transitionTimeoutMs: '8000',
          },
        },
      },
    }));
    expect(room?.type).toBe('ROOM_SYNC');
    if (room?.type !== 'ROOM_SYNC') throw new Error('missing room snapshot');
    expect(room.playerData['7'].actionTimeoutMs).toBe(60000);
    expect(room.roomData.transitionTimeoutMs).toBe(8000);
  });

  it('serializes every for sale command into the camel-case union', () => {
    expect(createClientCommand(
      'forsale', 'm1', 'c1', 'game_bid', { amount: 7 },
    ).payload).toEqual({ forSale: { bid: { amount: 7 } } });
    expect(createClientCommand(
      'forsale', 'm1', 'c2', 'game_pass', {},
    ).payload).toEqual({ forSale: { pass: {} } });
    expect(createClientCommand(
      'forsale', 'm1', 'c3', 'game_lock_sale', { property: 24 },
    ).payload).toEqual({ forSale: { lockSale: { property: 24 } } });
    expect(createClientCommand(
      'forsale', 'm1', 'c4', 'game_reveal_sale', {},
    ).payload).toEqual({ forSale: { revealSale: {} } });
    expect(createClientCommand(
      'forsale', 'm1', 'c5', 'game_next_round', {},
    ).payload).toEqual({ forSale: { nextRound: {} } });
    expect(createClientCommand(
      'forsale', 'm1', 'c6', 'game_start_selling', {},
    ).payload).toEqual({ forSale: { startSelling: {} } });
  });
});
