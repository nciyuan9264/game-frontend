import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import { toLeaderboardEntry } from '@/features/game-core/model/history';
import { parseServerMessage, type GameSnapshot, type MatchSnapshot } from './session';
import { confirmsCommand, toBattleGame } from './selectors';

const human = {
  userID: '7',
  playerID: '7',
  displayName: 'N次元',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_2',
  displayName: '渡鸦',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

function matchMessage() {
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID: 'war-room',
    matchID: 'war-room-r1',
    seq: '4',
    ownerID: '7',
    status: 'match',
    playerID: '7',
    visibility: 'private',
    maxPlayers: 2,
    players: { '7': human, ai_2: ai },
    playerOrder: ['7', 'ai_2'],
    setup: {
      warchest: {
        mode: 'recommended',
        sides: { '7': 'oak', ai_2: 'falcon' },
        rosters: {
          '7': ['sword', 'pike', 'crossbow', 'light'],
          ai_2: ['archer', 'cavalry', 'lancer', 'scout'],
        },
        complete: true,
        initialPlayerID: '7',
        initialSide: 'oak',
      },
    },
  };
}

function roomMessage() {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'war-room',
    matchID: 'war-room-r1',
    seq: '9',
    view: {
      warchest: {
        playerId: '7',
        ownerID: '7',
        visibility: 'private',
        playerData: {
          '7': {
            side: 'oak',
            roster: ['sword', 'pike', 'crossbow', 'light'],
            controlledLocations: 2,
            bagCount: 6,
            handCount: 3,
            supply: { sword: 3, pike: 2, crossbow: 3, light: 3 },
            discard: [],
            lost: {},
          },
          ai_2: {
            side: 'falcon',
            roster: ['archer', 'cavalry', 'lancer', 'scout'],
            controlledLocations: 2,
            bagCount: 6,
            handCount: 3,
            supply: { archer: 2, cavalry: 2, lancer: 2, scout: 3 },
            discard: [{ coinID: 'falcon-hidden', faceUp: false }],
            lost: {},
          },
        },
        privateData: {
          hand: [
            { coinID: 'oak-sword-1', unitType: 'sword', faceUp: true },
            { coinID: 'oak-light-1', unitType: 'light', faceUp: true },
            { coinID: 'oak-royal', unitType: 'royal', faceUp: true },
          ],
          bagCounts: { sword: 1, pike: 2, crossbow: 2, light: 1 },
        },
        roomData: {
          board: [{ unitID: 'oak-sword', unitType: 'sword', side: 'oak', cell: '-1,1', coinCount: 1 }],
          controls: [
            { cell: '-2,3', side: 'oak' },
            { cell: '1,2', side: 'oak' },
            { cell: '-1,-2', side: 'falcon' },
            { cell: '2,-3', side: 'falcon' },
          ],
          currentPlayer: '7',
          currentSide: 'oak',
          initiativePlayer: '7',
          initiativeSide: 'oak',
          roundNo: 1,
          gameStatus: 'playing',
          legalActions: [
            { actionID: 'play-pass', action: 'pass', coinID: 'oak-sword-1' },
            { actionID: 'play-move', action: 'move', coinID: 'oak-sword-1', actorUnitID: 'oak-sword', from: '-1,1', to: '0,1', path: ['0,1'] },
          ],
          activityLog: [{
            id: 1,
            roundNo: 1,
            playerID: '7',
            side: 'oak',
            action: 'deploy',
            coinID: 'oak-sword-1',
            unitType: 'sword',
            to: '-1,1',
            automatic: false,
            summary: '剑士部署至 C3',
          }],
          lastData: {
            id: 1,
            roundNo: 1,
            playerID: '7',
            side: 'oak',
            action: 'deploy',
            automatic: false,
            summary: '剑士部署至 C3',
          },
          players: { '7': human, ai_2: ai },
          playerOrder: ['7', 'ai_2'],
          turnDeadline: '2026-10-26T10:01:30Z',
          turnTimeoutMs: '90000',
        },
      },
    },
  };
}

describe('War Chest protocol', () => {
  it('parses setup mode, sides, and public rosters', () => {
    const snapshot = parseServerMessage(JSON.stringify(matchMessage())) as MatchSnapshot;
    expect(snapshot.type).toBe('MATCH_SYNC');
    expect(snapshot.seq).toBe(4);
    expect(snapshot.setup.mode).toBe('recommended');
    expect(snapshot.setup.sides).toEqual({ '7': 'oak', ai_2: 'falcon' });
    expect(snapshot.setup.complete).toBe(true);
  });

  it('adapts the authoritative view without deriving legal actions locally', () => {
    const snapshot = parseServerMessage(JSON.stringify(roomMessage())) as GameSnapshot;
    const game = toBattleGame(snapshot);
    expect(game.selfSide).toBe(0);
    expect(game.players[0].hand.map(coin => coin.id)).toEqual([
      'oak-sword-1', 'oak-light-1', 'oak-royal',
    ]);
    expect(game.players[1].hand).toEqual([]);
    expect(game.board['-1,1']).toMatchObject({ id: 'oak-sword', type: 'sword', n: 1 });
    expect(game.legalActions.map(action => action.actionID)).toEqual([
      'play-pass', 'play-move',
    ]);
    expect(game.legalActions[1]).toMatchObject({
      action: 'move',
      type: 'sword',
      from: '-1,1',
      to: '0,1',
    });
    expect(game.log[0].text).toBe('剑士部署至 C3');
  });

  it('serializes setup, draft, action ID, and resign commands', () => {
    expect(createClientCommand('warchest', 'm1', 'c1', 'game_set_setup_mode', {
      mode: 'draft',
    }).payload).toEqual({ warchest: { setSetupMode: { mode: 'draft' } } });
    expect(createClientCommand('warchest', 'm1', 'c2', 'game_draft_unit', {
      unitType: 'priest',
    }).payload).toEqual({ warchest: { draftUnit: { unitType: 'priest' } } });
    expect(createClientCommand('warchest', 'm1', 'c3', 'game_play_action', {
      actionID: 'stable-action',
    }).payload).toEqual({ warchest: { playAction: { actionID: 'stable-action' } } });
    expect(createClientCommand('warchest', 'm1', 'c4', 'game_resign', {}).payload)
      .toEqual({ warchest: { resign: {} } });
  });

  it('confirms draft and game commands from authoritative advancement', () => {
    const before = parseServerMessage(JSON.stringify(matchMessage())) as MatchSnapshot;
    const next = {
      ...before,
      seq: before.seq + 1,
      setup: {
        ...before.setup,
        mode: 'draft',
        complete: false,
        draft: {
          pool: ['sword'],
          availableUnits: [],
          pickedUnits: ['sword'],
          rosters: { '7': ['sword'], ai_2: [] },
          firstPickerID: '7',
          currentPickerID: 'ai_2',
          currentPickCount: 2,
          completedPickCount: 1,
          complete: false,
        },
      },
    };
    expect(confirmsCommand({
      commandID: 'cmd', type: 'game_draft_unit', payload: { unitType: 'sword' },
      before: { ...before, setup: { ...next.setup, draft: { ...next.setup.draft!, completedPickCount: 0 } } },
      epoch: 1,
    }, next)).toBe(true);

    const room = parseServerMessage(JSON.stringify(roomMessage())) as GameSnapshot;
    expect(confirmsCommand({
      commandID: 'cmd', type: 'game_play_action', payload: { actionID: 'play-pass' },
      before: room, epoch: 1,
    }, { ...room, seq: room.seq + 1 })).toBe(true);
  });

  it('maps War Chest leaderboard metrics to win-rate entries', () => {
    expect(toLeaderboardEntry({
      userID: '7',
      playerID: '7',
      displayName: 'N次元',
      totalGames: 12,
      metric: { warchest: { wins: 8, winRate: 2 / 3 } },
    })).toEqual({
      userID: '7', playerID: '7', displayName: 'N次元',
      totalGames: 12, wins: 8, winRate: 2 / 3,
    });
  });
});
