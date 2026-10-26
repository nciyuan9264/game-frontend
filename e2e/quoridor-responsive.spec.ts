import {
  expect,
  test,
  type Page,
  type TestInfo,
} from '@playwright/test';

const roomID = 'quoridor_layout';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '寻路棋手',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_2',
  displayName: '曲径',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

function gameSnapshot() {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 12,
    view: {
      quoridor: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: {
            side: 'south',
            wallsRemaining: 8,
            distanceToGoal: 7,
          },
          [ai.playerID]: {
            side: 'north',
            wallsRemaining: 8,
            distanceToGoal: 7,
          },
        },
        roomData: {
          pawns: {
            south: { row: 7, column: 4 },
            north: { row: 1, column: 4 },
          },
          walls: [
            {
              row: 5,
              column: 3,
              orientation: 'h',
              side: 'south',
            },
            {
              row: 2,
              column: 4,
              orientation: 'v',
              side: 'north',
            },
            {
              row: 4,
              column: 1,
              orientation: 'v',
              side: 'south',
            },
            {
              row: 3,
              column: 6,
              orientation: 'h',
              side: 'north',
            },
          ],
          wallStock: { south: 8, north: 8 },
          currentPlayer: human.playerID,
          currentSide: 'south',
          southPlayerID: human.playerID,
          northPlayerID: ai.playerID,
          firstPlayerID: human.playerID,
          roundNo: 1,
          gameStatus: 'playing',
          legalMoves: [
            { row: 6, column: 4 },
            { row: 7, column: 3 },
            { row: 7, column: 5 },
          ],
          wallOptions: [
            {
              row: 3,
              column: 3,
              orientation: 'h',
              legal: true,
            },
            {
              row: 3,
              column: 3,
              orientation: 'v',
              legal: true,
            },
            {
              row: 5,
              column: 3,
              orientation: 'h',
              legal: false,
              reasonCode: 'overlap',
            },
          ],
          referencePaths: {
            south: [
              { row: 7, column: 4 },
              { row: 6, column: 4 },
              { row: 5, column: 4 },
              { row: 4, column: 4 },
              { row: 3, column: 4 },
              { row: 2, column: 4 },
              { row: 1, column: 4 },
              { row: 0, column: 4 },
            ],
            north: [
              { row: 1, column: 4 },
              { row: 2, column: 4 },
              { row: 3, column: 4 },
              { row: 4, column: 4 },
              { row: 5, column: 4 },
              { row: 6, column: 4 },
              { row: 7, column: 4 },
              { row: 8, column: 4 },
            ],
          },
          moveLog: [
            {
              id: 1,
              kind: 'move',
              playerID: human.playerID,
              side: 'south',
              from: { row: 8, column: 4 },
              to: { row: 7, column: 4 },
              automatic: false,
            },
            {
              id: 2,
              kind: 'move',
              playerID: ai.playerID,
              side: 'north',
              from: { row: 0, column: 4 },
              to: { row: 1, column: 4 },
              automatic: false,
            },
          ],
          lastAction: {
            id: 2,
            kind: 'move',
            playerID: ai.playerID,
            side: 'north',
            from: { row: 0, column: 4 },
            to: { row: 1, column: 4 },
            automatic: false,
          },
          turnDeadline: new Date(Date.now() + 60_000).toISOString(),
          turnTimeoutMs: '60000',
          players: {
            [human.playerID]: human,
            [ai.playerID]: ai,
          },
          playerOrder: [human.playerID, ai.playerID],
        },
      },
    },
  };
}

async function mockProfile(page: Page) {
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
}

async function mockPublicData(page: Page) {
  await mockProfile(page);
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { rooms: [] },
    },
  }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        totalGames: 12,
        wins: 7,
        winRate: 7 / 12,
        avgScore: 0,
      },
    },
  }));
}

async function mockSession(page: Page) {
  const commands: string[] = [];
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'quoridor',
          status: 'playing',
          visibility: 'private',
          ownerUserID: human.userID,
          ownerPlayerID: human.playerID,
          maxPlayers: 2,
          playerCount: 2,
          currentMatchID: matchID,
          currentMatchStatus: 'running',
          nextRoundNo: 2,
          createdAt: '2026-10-26T00:00:00Z',
          updatedAt: '2026-10-26T00:00:00Z',
          players: [human, ai],
          metrics: {
            quoridor: { turnCount: 2 },
          },
        },
      },
    }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(gameSnapshot()));
    socket.onMessage(message => {
      const command = String(message);
      commands.push(command);
      if (command.includes('"game_move_pawn"')) {
        socket.send(JSON.stringify({
          ...gameSnapshot(),
          seq: 13,
        }));
      }
    });
  });
  return commands;
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
  });
}

test('Quoridor public pages stay stable across target viewports', async ({
  page,
}, testInfo) => {
  await mockPublicData(page);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 360, height: 780 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/game/quoridor');
    await expect(page.getByTestId('quoridor-lobby-hero')).toBeVisible();
    await expect(page.getByTestId('quoridor-lobby-facts')
      .locator(':scope > span')).toHaveCount(3);
    await expectNoOverflow(page);
    await capture(page, testInfo, `lobby-${viewport.width}x${viewport.height}`);

    await page.goto('/game/quoridor/guide');
    await expect(page.getByTestId('quoridor-guide-visual')).toBeVisible();
    await expectNoOverflow(page);
  }
});

test('Quoridor mobile confirms moves and exposes precise wall placement', async ({
  page,
}, testInfo) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  const commands = await mockSession(page);
  await page.goto(`/game/quoridor/match?roomID=${roomID}`);

  const board = page.getByRole('group', { name: 'Quoridor 九乘九棋盘' });
  await expect(board).toBeVisible();
  await expect(board.getByTestId(/^cell-/)).toHaveCount(81);
  await expect(page.getByRole('button', {
    name: '当前行动状态',
  })).toBeDisabled();
  await page.getByTestId('cell-E7').click();
  await expect(page.getByRole('button', { name: '确认移动' })).toBeEnabled();
  await page.getByRole('button', { name: '确认移动' }).click();
  await expect.poll(() => commands.some(command =>
    command.includes('"game_move_pawn"')
    && command.includes('"row":6')
    && command.includes('"column":4'))).toBe(true);

  await page.getByRole('button', { name: '放置围墙' }).click();
  await page.getByRole('button', { name: '精确选择墙槽' }).click();
  await expect(page.getByTestId('wall-slot-picker')).toBeVisible();
  await page.getByRole('button', { name: '选择第 D 列' }).click();
  await page.getByRole('button', { name: '选择第 4 行' }).click();
  await expect(page.getByRole('button', {
    name: /返回棋盘预览/,
  })).toBeEnabled();
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-wall-picker');
  await page.getByRole('button', { name: /返回棋盘预览/ }).click();
  await expect(page.getByRole('button', { name: '确认放墙' })).toBeEnabled();
  await page.getByRole('button', { name: '确认放墙' }).click();
  await expect.poll(() => commands.some(command =>
    command.includes('"game_place_wall"')
    && command.includes('"row":3')
    && command.includes('"column":3')
    && command.includes('"orientation":"h"'))).toBe(true);

  await page.setViewportSize({ width: 360, height: 780 });
  await expect(board).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, testInfo, 'game-360x780');
  expect(pageErrors).toEqual([]);
});

test('Quoridor desktop keeps board, actions, and journal visible', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const commands = await mockSession(page);
  await page.goto(`/game/quoridor/match?roomID=${roomID}`);

  await expect(page.getByRole('heading', {
    name: '步步为营，亦步亦远。',
  })).toBeVisible();
  await expect(page.getByRole('group', {
    name: 'Quoridor 九乘九棋盘',
  })).toBeVisible();
  await expect(page.getByRole('heading', { name: '轮到你了' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '行棋记录' })).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, testInfo, 'game-1440x900');
  await page.getByTestId('cell-E7').click();
  await expect.poll(() => commands.some(command =>
    command.includes('"game_move_pawn"'))).toBe(true);
  await expect(page.getByRole('button', { name: '确认移动' })).toHaveCount(0);

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole('group', {
    name: 'Quoridor 九乘九棋盘',
  })).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, testInfo, 'game-1024x768');
});
