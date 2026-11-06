import { expect, test, type Page } from '@playwright/test';

const roomID = 'othello_ai_hint';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '测试棋手',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_001',
  displayName: '墨白',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  aiDifficulty: 'hard',
  ready: true,
};

function opening() {
  const board = Array.from({ length: 64 }, () => '');
  board[27] = 'white';
  board[28] = 'black';
  board[35] = 'black';
  board[36] = 'white';
  return board;
}

async function mockRoomAPI(page: Page, playing = false) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: human.userID,
        display_name: human.displayName,
        avatar: '',
      },
    },
  }));
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'othello',
          status: playing ? 'playing' : 'match',
          visibility: 'private',
          ownerUserID: human.userID,
          ownerPlayerID: human.playerID,
          maxPlayers: 2,
          playerCount: playing ? 2 : 1,
          currentMatchID: matchID,
          currentMatchStatus: playing ? 'running' : 'preparing',
          nextRoundNo: 2,
          createdAt: '2026-11-07T00:00:00Z',
          updatedAt: '2026-11-07T00:00:00Z',
          players: playing ? [human, ai] : [human],
          metrics: {
            othello: {
              occupiedCount: 4,
              progressCurrent: 0,
              progressTotal: 60,
            },
          },
        },
      },
    }));
}

function matchSnapshot() {
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID,
    matchID,
    seq: 2,
    ownerID: human.playerID,
    playerID: human.playerID,
    status: 'match',
    visibility: 'private',
    maxPlayers: 2,
    players: { [human.playerID]: human },
    playerOrder: [human.playerID],
  };
}

function gameSnapshot(
  seq: number,
  hint: { remaining: number; pending: boolean; index?: number },
) {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq,
    view: {
      othello: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: { side: 'black', discCount: 2 },
          [ai.playerID]: { side: 'white', discCount: 2 },
        },
        hint,
        roomData: {
          board: opening(),
          currentPlayer: human.playerID,
          currentSide: 'black',
          blackPlayerID: human.playerID,
          whitePlayerID: ai.playerID,
          roundNo: 1,
          gameStatus: 'playing',
          legalMoves: [
            { index: 19, flips: [27], lines: [[27]] },
            { index: 26, flips: [27], lines: [[27]] },
            { index: 37, flips: [36], lines: [[36]] },
            { index: 44, flips: [36], lines: [[36]] },
          ],
          moveLog: [],
          players: {
            [human.playerID]: human,
            [ai.playerID]: ai,
          },
          playerOrder: [human.playerID, ai.playerID],
          turnDeadline: new Date(Date.now() + 60_000).toISOString(),
          turnTimeoutMs: '60000',
        },
      },
    },
  };
}

test('Othello room submits the selected AI difficulty', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockRoomAPI(page);
  const commands: Array<Record<string, unknown>> = [];
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(matchSnapshot()));
    socket.onMessage(message => {
      commands.push(JSON.parse(String(message)) as Record<string, unknown>);
    });
  });

  await page.goto(`/game/othello/match?roomID=${roomID}`);
  await page.getByRole('button', { name: '在席位 2 添加人机' }).click();
  await expect(page.getByRole('heading', { name: '选择人机难度' })).toBeVisible();
  await expect(page.getByRole('button', { name: /中等/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /困难/ }).click();
  await page.getByRole('dialog')
    .getByRole('button', { name: '添加人机', exact: true })
    .click();

  await expect.poll(() => commands.length).toBe(1);
  expect(commands[0]).toMatchObject({
    type: 'match_add_ai',
    payload: {
      common: {
        matchSeat: {
          seatIndex: 1,
          aiDifficulty: 'hard',
        },
      },
    },
  });
});

test('Othello hint command reveals a private recommended cell', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockRoomAPI(page, true);
  const commands: Array<Record<string, unknown>> = [];
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(gameSnapshot(12, {
      remaining: 1,
      pending: false,
    })));
    socket.onMessage(message => {
      const command = JSON.parse(String(message)) as Record<string, unknown>;
      commands.push(command);
      if (command.type === 'game_request_hint') {
        socket.send(JSON.stringify(gameSnapshot(13, {
          remaining: 0,
          pending: false,
          index: 19,
        })));
      }
    });
  });

  await page.goto(`/game/othello/match?roomID=${roomID}`);
  await page.getByRole('button', { name: '提示 1' }).click();

  await expect(page.getByRole('button', { name: '提示已用' })).toBeDisabled();
  await expect(page.getByRole('button', {
    name: 'D3，推荐落点，可落子，翻转 1 枚',
  })).toBeVisible();
  await expect.poll(() => commands.length).toBe(1);
  expect(commands[0]).toMatchObject({
    type: 'game_request_hint',
    payload: { othello: { requestHint: {} } },
  });
});
