import { describe, expect, it } from 'vitest';
import {
  filterLobbyRooms,
  gameInviteURL,
  legacyPlayerName,
  roomEntry,
  roomOwnerName,
  sortLobbyRooms,
  type LobbyRoomLike,
} from './room';

const room: LobbyRoomLike = {
  roomID: '1021_140000',
  ownerID: 'Alice-Cooper-7',
  maxPlayers: 2,
  status: 'match',
  roomPlayer: [{
    userID: 'user-7',
    playerID: 'Alice-Cooper-7',
    name: 'Alice Cooper',
    online: true,
    ai: false,
    ready: false,
  }],
};

describe('shared lobby room model', () => {
  it('resolves owner names and entry states', () => {
    expect(legacyPlayerName('Alice-Cooper-7')).toBe('Alice-Cooper');
    expect(roomOwnerName(room)).toBe('Alice Cooper');
    expect(roomEntry(room, { userID: 'user-7', playerID: 'Renamed-7' })).toEqual({ allowed: true, label: '返回房间' });
    expect(roomEntry({ ...room, status: 'playing' }, { userID: 'user-8', playerID: 'Bob-8' })).toEqual({ allowed: false, label: '已开局' });
    expect(roomEntry({ ...room, roomPlayer: [...room.roomPlayer, {
      playerID: 'Bob-8',
      online: true,
      ai: false,
      ready: false,
    }] }, { userID: 'user-9', playerID: 'Carol-9' })).toEqual({ allowed: false, label: '房间已满' });
  });

  it('sorts, filters, and searches without mutating the source', () => {
    const newer = { ...room, roomID: '1021_150000', status: 'playing' };
    const ended = { ...room, roomID: '1021_160000', status: 'end' };
    const source = [room, newer, ended];
    expect(sortLobbyRooms(source).map(item => item.roomID)).toEqual([
      '1021_160000',
      '1021_150000',
      '1021_140000',
    ]);
    expect(source[0]).toBe(room);
    expect(filterLobbyRooms(source, 'joinable', 'alice')).toEqual([room]);
    expect(filterLobbyRooms(source, 'playing', '')).toEqual([newer]);
    expect(filterLobbyRooms(source, 'all', '')).toEqual(source);
  });

  it('builds an encoded public invite URL', () => {
    expect(gameInviteURL('splendor', 'room / 1')).toBe(
      'https://board.gamebus.online/game/splendor/match?roomID=room%20%2F%201'
    );
  });
});
