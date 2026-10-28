import {
  expect,
  test,
  type Page,
  type TestInfo,
} from '@playwright/test';

const roomID = 'hex_layout';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '陶岸棋手',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_2',
  displayName: '青岸',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

function gameSnapshot(gameStatus: 'playing' | 'end' = 'playing') {
  const ended = gameStatus === 'end';
  const board = Array(121).fill('');
  [5, 16, 27, 38, 49, 60, 71, 82, 93, 104, 115]
    .forEach(index => { board[index] = 'red'; });
  [55, 56, 57, 58, 59, 61, 62]
    .forEach(index => { board[index] = 'teal'; });
  const winningPath = ended
    ? [5, 16, 27, 38, 49, 60, 71, 82, 93, 104, 115]
      .map(index => ({ row: Math.floor(index / 11), column: index % 11 }))
    : [];
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 18,
    view: {
      hex: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: { side: 'red', stoneCount: 11 },
          [ai.playerID]: { side: 'teal', stoneCount: 7 },
        },
        result: ended ? {
          winnerID: human.playerID,
          winnerSide: 'red',
          reason: '陶红连接南北两岸',
          turnCount: 18,
          pathLength: 11,
          redStoneCount: 11,
          tealStoneCount: 7,
        } : undefined,
        roomData: {
          boardSize: 11,
          board,
          currentPlayer: ended ? '' : human.playerID,
          currentSide: ended ? '' : 'red',
          redPlayerID: human.playerID,
          tealPlayerID: ai.playerID,
          firstPlayerID: human.playerID,
          roundNo: 1,
          gameStatus,
          pieRule: true,
          swapAvailable: false,
          legalMoves: ended ? [] : [{ row: 4, column: 4 }],
          winningPath,
          moveLog: [
            {
              id: 17,
              kind: 'place',
              playerID: human.playerID,
              side: 'red',
              cell: { row: 4, column: 5 },
              automatic: false,
            },
            {
              id: 18,
              kind: 'place',
              playerID: ai.playerID,
              side: 'teal',
              cell: { row: 5, column: 6 },
              automatic: false,
            },
          ],
          lastAction: {
            id: 18,
            kind: 'place',
            playerID: ai.playerID,
            side: 'teal',
            cell: { row: 5, column: 6 },
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

function roomSnapshot() {
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID,
    matchID,
    seq: 3,
    ownerID: human.playerID,
    status: 'match',
    playerID: human.playerID,
    visibility: 'private',
    maxPlayers: 2,
    players: {
      [human.playerID]: human,
      [ai.playerID]: ai,
    },
    playerOrder: [human.playerID, ai.playerID],
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

async function mockSession(
  page: Page,
  snapshot: ReturnType<typeof gameSnapshot> | ReturnType<typeof roomSnapshot>,
) {
  const commands: string[] = [];
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'hex',
          status: snapshot.type === 'MATCH_SYNC' ? 'match' : 'playing',
          visibility: 'private',
          ownerUserID: human.userID,
          ownerPlayerID: human.playerID,
          maxPlayers: 2,
          playerCount: 2,
          currentMatchID: matchID,
          currentMatchStatus: 'running',
          nextRoundNo: 2,
          createdAt: '2026-10-27T00:00:00Z',
          updatedAt: '2026-10-27T00:00:00Z',
          players: [human, ai],
          metrics: { hex: { turnCount: 18 } },
        },
      },
    }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot));
    socket.onMessage(message => commands.push(String(message)));
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

test('Hex public pages stay stable across desktop and mobile', async ({
  page,
}, testInfo) => {
  await mockPublicData(page);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 360, height: 780 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/game/hex');
    await expect(page.getByTestId('hex-lobby-hero')).toBeVisible();
    await expect(page.getByTestId('hex-lobby-facts')
      .locator(':scope > span')).toHaveCount(3);
    await expect(page.getByText('11 × 11')).toBeVisible();
    await expectNoOverflow(page);
    if (viewport.width !== 360) {
      await capture(
        page,
        testInfo,
        `lobby-${viewport.width}x${viewport.height}`,
      );
    }

    await page.goto('/game/hex/guide');
    await expect(page.getByTestId('hex-guide-visual')).toBeVisible();
    await expect(page.getByText('交换规则')).toBeVisible();
    await expectNoOverflow(page);
  }
});

test('Hex room exposes the fixed online rules', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, roomSnapshot());
  await page.goto(`/game/hex/match?roomID=${roomID}`);

  await expect(page.getByTestId('hex-room-table')).toBeVisible();
  await expect(page.getByTestId('hex-room-seat')).toHaveCount(2);
  await expect(page.getByTestId('hex-room-table')
    .getByText('11 × 11', { exact: true })).toBeVisible();
  await expect(page.getByText('11 × 11 · Pie rule')).toBeVisible();
  await expectNoOverflow(page);
});

test('Hex mobile preselects and confirms an authoritative legal move', async ({
  page,
}, testInfo) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  const commands = await mockSession(page, gameSnapshot());
  await page.goto(`/game/hex/match?roomID=${roomID}`);

  const board = page.getByRole('group', {
    name: '十一乘十一连边棋棋盘，陶红连接南北，湖绿连接东西',
  });
  await expect(board).toBeVisible();
  await expect(page.locator('.playing-page > .top-shell .app-header'))
    .toHaveCSS('height', '57px');
  await expect(board.locator('[data-cell]')).toHaveCount(121);
  await page.getByTestId('cell-E5').click();
  await expect(page.getByRole('button', { name: /确认落子 E5/ })).toBeEnabled();
  await page.getByRole('button', { name: /确认落子 E5/ }).click();
  await expect.poll(() => commands.some(command =>
    command.includes('"game_place_stone"')
    && command.includes('"row":4')
    && command.includes('"column":4'))).toBe(true);
  await expectNoOverflow(page);
  await capture(page, testInfo, 'game-mobile-390x844');
  expect(pageErrors).toEqual([]);
});

test('Hex result returns to a compact final board', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, gameSnapshot('end'));
  await page.goto(`/game/hex/match?roomID=${roomID}`);

  await expect(page.getByTestId('result-page')).toBeVisible();
  await expect(page.getByText('这一局最后的模样')).toHaveCount(0);
  await expect(page.getByText(/权威结算/)).toHaveCount(0);
  await capture(page, testInfo, 'result-mobile-390x844');
  await page.getByRole('button', { name: '查看终局棋盘' }).click();
  await expect(page.getByRole('group', {
    name: '十一乘十一连边棋棋盘，陶红连接南北，湖绿连接东西',
  })).toBeVisible();
  await expectNoOverflow(page);
});

test('Hex desktop keeps board, actions, and journal visible', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page, gameSnapshot());
  await page.goto(`/game/hex/match?roomID=${roomID}`);

  await expect(page.getByRole('heading', {
    name: '落子之间，两岸相连。',
  })).toBeVisible();
  await expect(page.getByRole('group', {
    name: '十一乘十一连边棋棋盘，陶红连接南北，湖绿连接东西',
  })).toBeVisible();
  await expect(page.getByRole('heading', { name: '轮到你了' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '行棋记录' })).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, testInfo, 'game-desktop-1440x900');
});
