import { describe, expect, it } from 'vitest';
import { createClientCommand } from '@/features/game-core/model/realtime';
import { confirmsCommand } from './selectors';
import {
  parseServerMessage,
  type GameSnapshot,
} from './session';

const player = {
  userID: '7',
  playerID: '7',
  displayName: 'Alice',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
  gameRole: 'fugitive',
};

describe('fugitive protocol', () => {
  it('parses a role-projected authoritative room view', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'fugitive-room',
      matchID: 'fugitive-room-r1',
      seq: '8',
      view: {
        fugitive: {
          playerId: '7',
          ownerID: '7',
          visibility: 'private',
          playerData: {
            '7': { role: 'fugitive', handCount: 4 },
            ai_2: { role: 'marshal', handCount: 2 },
          },
          hand: [{ number: 12, sprint: 2 }, { number: 42, sprint: 0 }],
          roomData: {
            currentPlayer: '7',
            gameStatus: 'fugitiveAction',
            roundNo: 3,
            drawsRemaining: 0,
            highestRevealed: 7,
            hiddenHideoutCount: 2,
            openingHideoutsPlaced: 2,
            route: [
              {
                index: 0,
                revealed: true,
                sprintCount: 0,
                card: { number: 0, sprint: 0 },
                sprints: [],
              },
              {
                index: 1,
                revealed: false,
                sprintCount: 1,
                card: { number: 7, sprint: 1 },
                sprints: [{ number: 2, sprint: 2 }],
              },
            ],
            decks: [
              { deckIndex: 0, min: 4, max: 14, remaining: 5 },
              { deckIndex: 1, min: 15, max: 28, remaining: 10 },
              { deckIndex: 2, min: 29, max: 41, remaining: 13 },
            ],
            activityLog: [{
              id: 1,
              roundNo: 3,
              kind: 'draw',
              playerID: '7',
              role: 'fugitive',
              deckIndex: 0,
              numbers: [12],
              sprintCount: 0,
              automatic: false,
              private: true,
            }],
            lastData: {
              id: 1,
              roundNo: 3,
              kind: 'draw',
              playerID: '7',
              role: 'fugitive',
              deckIndex: 0,
              numbers: [12],
              sprintCount: 0,
              automatic: false,
              private: true,
            },
            turnDeadline: '2026-10-25T10:01:00Z',
            turnTimeoutMs: '60000',
            players: {
              '7': player,
              ai_2: {
                ...player,
                userID: undefined,
                playerID: 'ai_2',
                displayName: 'Rook',
                seatIndex: 1,
                ai: true,
                gameRole: 'marshal',
              },
            },
            playerOrder: ['7', 'ai_2'],
          },
        },
      },
    }));
    expect(message?.type).toBe('ROOM_SYNC');
    const snapshot = message as GameSnapshot;
    expect(snapshot.seq).toBe(8);
    expect(snapshot.hand.map(card => card.number)).toEqual([12, 42]);
    expect(snapshot.roomData.route[1].sprints?.[0].number).toBe(2);
    expect(snapshot.roomData.activityLog[0].private).toBe(true);
    expect(snapshot.roomData.turnTimeoutMs).toBe(60_000);
    expect(snapshot.roomData.players.ai_2.gameRole).toBe('marshal');
  });

  it('normalizes nullable transport collections', () => {
    const message = parseServerMessage(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'fugitive-room',
      matchID: 'fugitive-room-r1',
      seq: 9,
      view: {
        fugitive: {
          playerId: '7',
          ownerID: '7',
          visibility: 'private',
          playerData: {},
          hand: null,
          roomData: {
            currentPlayer: '7',
            gameStatus: 'end',
            roundNo: 3,
            drawsRemaining: 0,
            highestRevealed: 7,
            hiddenHideoutCount: 0,
            openingHideoutsPlaced: 2,
            route: null,
            decks: null,
            activityLog: null,
            players: null,
            playerOrder: null,
          },
        },
      },
    })) as GameSnapshot;
    expect(message.hand).toEqual([]);
    expect(message.roomData.route).toEqual([]);
    expect(message.roomData.decks).toEqual([]);
    expect(message.roomData.activityLog).toEqual([]);
    expect(message.roomData.playerOrder).toEqual([]);
  });

  it('serializes every Fugitive command through the generated union', () => {
    expect(createClientCommand('fugitive', 'match-1', 'cmd-1', 'match_select_role', {
      role: 'marshal',
    }).payload).toEqual({ fugitive: { selectRole: { role: 'marshal' } } });
    expect(createClientCommand('fugitive', 'match-1', 'cmd-2', 'game_draw_card', {
      deckIndex: 2,
    }).payload).toEqual({ fugitive: { drawCard: { deckIndex: 2 } } });
    expect(createClientCommand('fugitive', 'match-1', 'cmd-3', 'game_play_hideout', {
      hideout: 19,
      sprints: [2, 4],
    }).payload).toEqual({
      fugitive: { playHideout: { hideout: 19, sprints: [2, 4] } },
    });
    expect(createClientCommand(
      'fugitive', 'match-1', 'cmd-4', 'game_finish_opening', {},
    ).payload).toEqual({ fugitive: { finishOpening: {} } });
    expect(createClientCommand(
      'fugitive', 'match-1', 'cmd-5', 'game_lay_low', {},
    ).payload).toEqual({ fugitive: { layLow: {} } });
    expect(createClientCommand('fugitive', 'match-1', 'cmd-6', 'game_search_hideouts', {
      numbers: [7, 11],
    }).payload).toEqual({
      fugitive: { searchHideouts: { numbers: [7, 11] } },
    });
  });

  it('confirms game commands only after sequence advancement', () => {
    const before = {
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID: 'room',
      matchID: 'match',
      seq: 3,
      phaseVersion: 3,
      turnNumber: 3,
    } as GameSnapshot;
    expect(confirmsCommand({
      commandID: 'cmd',
      type: 'game_draw_card',
      payload: { deckIndex: 0 },
      before,
      epoch: 1,
    }, { ...before, seq: 4 })).toBe(true);
    expect(confirmsCommand({
      commandID: 'cmd',
      type: 'game_draw_card',
      payload: { deckIndex: 0 },
      before,
      epoch: 1,
    }, before)).toBe(false);
  });
});
