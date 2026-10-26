import { describe, expect, it } from 'vitest';
import { roomEntry, roomOwnerName } from './adapters';
import { parseServerMessage } from './session';
import type { DavinciRoom } from './types';

const room: DavinciRoom = {
  roomID: 'room-1',
  ownerID: '42',
  ownerName: 'Alice-Cooper-42',
  maxPlayers: 2,
  status: 'match',
  visibility: 'private',
  roomPlayer: [{
    userID: '42', playerID: '42', displayName: 'Alice-Cooper-42', online: true, ready: true, ai: false, seatIndex: 0,
  }],
};

describe('DaVinci protocol model', () => {
  it('accepts v2 snapshots and rejects malformed frames', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'MATCH_SYNC',
      roomID: 'room-1',
      matchID: 'match-1',
      seq: 1,
      ownerID: '42',
      playerID: '42',
      players: {},
      maxPlayers: 2,
      playerOrder: [],
      status: 'match',
      visibility: 'public',
    }));
    expect(message?.type).toBe('MATCH_SYNC');
    if (message?.type !== 'MATCH_SYNC') throw new Error('expected match sync');
    expect(message.visibility).toBe('public');
    expect(parseServerMessage('{"type":"MATCH_SYNC","roomID":"room-1"}')).toBeUndefined();
    expect(parseServerMessage('not-json')).toBeUndefined();
  });

  it('derives room ownership and entry state without truncating hyphenated names', () => {
    expect(roomOwnerName(room)).toBe('Alice-Cooper-42');
    expect(roomEntry(room, { userID: '42' })).toEqual({ allowed: true, label: '返回房间' });
    expect(roomEntry({ ...room, status: 'guessCard' }, { userID: '7' })).toEqual({ allowed: false, label: '已开局' });
  });

  it('parses the local initial-hand confirmation without opponent state', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'room-1',
      matchID: 'match-1',
      seq: 2,
      view: {
        davinci: {
          playerId: '42',
          ownerID: '42',
          roomData: {
            currentPlayer: '',
            gameStatus: 'initialize',
            players: {},
            playerOrder: [],
            boardCards: {},
            turnDeadline: '2026-10-25T10:00:15Z',
          },
          cardData: {
            self: [{ id: 'joker', color: 1, num: -1, index: -1 }],
            opponents: [{ id: 'hidden', color: 0, index: 0 }],
            initialHandReady: true,
          },
        },
      },
    }));
    expect(message?.type).toBe('ROOM_SYNC');
    if (message?.type !== 'ROOM_SYNC') throw new Error('expected room sync');
    expect(message.roomData.gameStatus).toBe('initialize');
    expect(message.cardData.initialHandReady).toBe(true);
    expect(message.cardData.opponents[0].num).toBeUndefined();
  });
});
