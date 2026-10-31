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

function gameSnapshot(gameStatus: 'playing' | 'end' = 'playing') {
  const ended = gameStatus === 'end';
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
        result: ended ? {
          winnerID: human.playerID,
          winnerSide: 'south',
          reason: '率先抵达目标行',
          turnCount: 18,
          placedWallCount: 4,
        } : undefined,
        roomData: {
          pawns: {
            south: { row: ended ? 0 : 7, column: 4 },
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
          gameStatus,
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

async function mockSession(
  page: Page,
  snapshot: ReturnType<typeof gameSnapshot> = gameSnapshot(),
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
    socket.send(JSON.stringify(snapshot));
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
  await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
  await expect(page.locator('.playing-page > .top-shell > .app-header')).toBeHidden();
  await expect(board.getByTestId(/^cell-/)).toHaveCount(81);
  const dock = page.getByTestId('quoridor-mobile-dock');
  const cancelButton = dock.getByRole('button', { name: '取消选择' });
  const actionButton = page.getByRole('button', { name: '当前行动状态' });
  await expect(actionButton).toBeDisabled();
  const [dockBox, cancelBox, actionBox] = await Promise.all([
    dock.boundingBox(),
    cancelButton.boundingBox(),
    actionButton.boundingBox(),
  ]);
  expect(dockBox).toMatchObject({ x: 0, width: 390, height: 68 });
  expect(cancelBox).toMatchObject({ width: 48, height: 44 });
  expect(actionBox?.height).toBe(44);
  expect((actionBox?.x ?? 0) - ((cancelBox?.x ?? 0) + (cancelBox?.width ?? 0))).toBe(8);
  await expect(actionButton.locator('svg')).toHaveCount(0);
  await expect(actionButton).toHaveCSS('background-color', 'rgb(121, 68, 83)');
  await expect(actionButton).toHaveCSS('color', 'rgb(255, 250, 243)');
  await page.setViewportSize({ width: 360, height: 800 });
  const topbar = page.locator('[data-game-mobile-topbar]');
  const visibleTopbarBoxes = await topbar.locator(':scope > *').evaluateAll(elements =>
    elements.flatMap(element => {
      const box = element.getBoundingClientRect();
      return box.width && box.height ? [{ left: box.left, right: box.right }] : [];
    }));
  expect(visibleTopbarBoxes.every((box, index) =>
    index === 0 || visibleTopbarBoxes[index - 1].right <= box.left)).toBe(true);
  await expect(page.getByRole('button', {
    name: '打开对局菜单',
  })).toHaveCount(0);
  await capture(page, testInfo, 'mobile-topbar-360');
  await page.setViewportSize({ width: 390, height: 844 });
  const centerOffset = await actionButton.evaluate(element => {
    const label = element.querySelector<HTMLElement>(':scope > span');
    if (!label) return Number.POSITIVE_INFINITY;
    const buttonBox = element.getBoundingClientRect();
    const labelBox = label.getBoundingClientRect();
    return Math.abs(
      labelBox.left + labelBox.width / 2
      - (buttonBox.left + buttonBox.width / 2),
    );
  });
  expect(centerOffset).toBeLessThanOrEqual(1);
  await capture(page, testInfo, 'mobile-game-dock');
  await page.getByTestId('cell-E7').click();
  await expect(page.getByRole('button', { name: '确认移动' })).toBeEnabled();
  await page.getByRole('button', { name: '确认移动' }).click();
  await expect.poll(() => commands.some(command =>
    command.includes('"game_move_pawn"')
    && command.includes('"row":6')
    && command.includes('"column":4'))).toBe(true);

  const mobilePlayers = page.locator('.mobile-player');
  const [moveBoardBox, moveOpponentBox, moveSelfBox] = await Promise.all([
    board.boundingBox(),
    mobilePlayers.first().boundingBox(),
    mobilePlayers.last().boundingBox(),
  ]);
  await page.getByRole('button', { name: '放置围墙' }).click();
  const [wallBoardBox, wallOpponentBox, wallSelfBox] = await Promise.all([
    board.boundingBox(),
    mobilePlayers.first().boundingBox(),
    mobilePlayers.last().boundingBox(),
  ]);
  expect(wallBoardBox).toEqual(moveBoardBox);
  expect(wallOpponentBox).toEqual(moveOpponentBox);
  expect(wallSelfBox).toEqual(moveSelfBox);
  await capture(page, testInfo, 'mobile-wall-mode');
  await page.getByRole('button', { name: '精确选择墙槽' }).click();
  await expect(page.getByTestId('wall-slot-picker')).toBeVisible();
  await page.getByRole('button', { name: '选择第 D 列' }).click();
  await page.getByRole('button', { name: '选择第 4 行' }).click();
  await expect(page.getByRole('button', {
    name: /返回棋盘预览/,
  })).toBeEnabled();
  const slotNote = page.getByTestId('wall-slot-note');
  await expect(slotNote).toHaveCSS('white-space', 'nowrap');
  expect(await slotNote.evaluate(element =>
    element.scrollWidth <= element.clientWidth)).toBe(true);
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-wall-picker');
  expect(pageErrors).toEqual([]);
});

test('Quoridor mobile results and final board keep a compact usable shell', async ({
  page,
}, testInfo) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, gameSnapshot('end'));
  await page.goto(`/game/quoridor/match?roomID=${roomID}`);

  await expect(page.getByTestId('result-page')).toBeVisible();
  await expect(page.getByText('这一局最后的模样')).toHaveCount(0);
  await expect(page.getByText(/权威结算/)).toHaveCount(0);
  const actions = page.locator('.result-certificate > .page-actions');
  expect((await actions.boundingBox())?.height).toBe(66);
  await capture(page, testInfo, 'mobile-results');

  await page.getByRole('button', { name: '回看棋盘' }).click();
  await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
  await expect(page.locator('.playing-page > .top-shell > .app-header')).toBeHidden();
  await expect(page.getByRole('group', {
    name: 'Quoridor 九乘九棋盘',
  })).toBeVisible();
  await expect(page.getByRole('button', {
    name: '步步为营游戏大厅',
  })).toHaveCount(0);
  await expect(page.getByRole('button', {
    name: '打开对局菜单',
  })).toHaveCount(0);
  await expect(page.locator('[data-game-mobile-topbar-identity] strong'))
    .toHaveCSS('white-space', 'nowrap');
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-final-board');

  await page.getByRole('button', { name: '查看行棋记录' }).click();
  await expect(page.getByRole('heading', {
    name: '每一步，都有来路。',
  })).toBeVisible();
  const journal = page.getByTestId('activity-journal');
  await expect(journal).toBeVisible();
  await expect(journal.locator('li')).toHaveCount(2);
  await capture(page, testInfo, 'mobile-activity-journal');
  expect(pageErrors).toEqual([]);
});

test('Quoridor desktop keeps board, actions, and journal visible', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page);
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
  await expect(page.getByRole('button', {
    name: '打开对局菜单',
  })).toBeVisible();
});
