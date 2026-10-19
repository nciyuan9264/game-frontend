import { describe, expect, it } from 'vitest';
import { roomEntry, roomOwnerName } from './adapters';
import { parseServerMessage } from './session';
import type { DavinciRoom } from './types';

const room: DavinciRoom = {
  roomID: 'room-1',
  ownerID: 'Alice-42',
  ownerName: 'Alice',
  maxPlayers: 2,
  status: 'match',
  roomPlayer: [{
    playerID: 'Alice-42', name: 'Alice', online: true, ready: true, ai: false, seatIndex: 0,
  }],
};

describe('DaVinci protocol model', () => {
  it('accepts versioned snapshots and rejects malformed frames', () => {
    expect(parseServerMessage(JSON.stringify({
      type: 'MATCH_SYNC',
      roomID: 'room-1',
      ownerID: 'Alice-42',
      playerID: 'Alice-42',
      players: {},
      maxPlayers: 2,
      playerOrder: [],
      status: 'match',
      phaseVersion: 1,
      turnNumber: 0,
    }))?.type).toBe('MATCH_SYNC');
    expect(parseServerMessage('{"type":"MATCH_SYNC","roomID":"room-1"}')).toBeUndefined();
    expect(parseServerMessage('not-json')).toBeUndefined();
  });

  it('derives room ownership and entry state without truncating hyphenated names', () => {
    expect(roomOwnerName(room)).toBe('Alice');
    expect(roomEntry(room, 'Alice-42')).toEqual({ allowed: true, label: '返回房间' });
    expect(roomEntry({ ...room, status: 'guessCard' }, 'Bob-7')).toEqual({ allowed: false, label: '已开局' });
  });
});
