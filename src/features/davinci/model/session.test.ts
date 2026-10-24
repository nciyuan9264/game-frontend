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
  roomPlayer: [{
    userID: '42', playerID: '42', displayName: 'Alice-Cooper-42', online: true, ready: true, ai: false, seatIndex: 0,
  }],
};

describe('DaVinci protocol model', () => {
  it('accepts v2 snapshots and rejects malformed frames', () => {
    expect(parseServerMessage(JSON.stringify({
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
    }))?.type).toBe('MATCH_SYNC');
    expect(parseServerMessage('{"type":"MATCH_SYNC","roomID":"room-1"}')).toBeUndefined();
    expect(parseServerMessage('not-json')).toBeUndefined();
  });

  it('derives room ownership and entry state without truncating hyphenated names', () => {
    expect(roomOwnerName(room)).toBe('Alice-Cooper-42');
    expect(roomEntry(room, { userID: '42' })).toEqual({ allowed: true, label: '返回房间' });
    expect(roomEntry({ ...room, status: 'guessCard' }, { userID: '7' })).toEqual({ allowed: false, label: '已开局' });
  });
});
