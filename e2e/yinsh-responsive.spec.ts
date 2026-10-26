import { expect, test, type Page } from '@playwright/test';

const roomID = 'yinsh_layout';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '移动端棋手',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_2',
  displayName: '墨白',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

function gameSnapshot(moved = false) {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: moved ? 13 : 12,
    view: {
      yinsh: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: { side: 'white', ringsRemoved: 1 },
          [ai.playerID]: { side: 'black', ringsRemoved: 1 },
        },
        roomData: {
          rings: {
            ...(moved ? { E7: 'white' } : { E4: 'white' }),
            C5: 'white', G3: 'white', I8: 'white',
            D3: 'black', F9: 'black', H9: 'black', I6: 'black',
          },
          markers: moved
            ? { E4: 'white', E5: 'white', E6: 'black', F5: 'black', G6: 'white' }
            : { E5: 'black', E6: 'white', F5: 'black', G6: 'white' },
          currentPlayer: moved ? ai.playerID : human.playerID,
          gameStatus: 'move',
          placedRings: { white: 5, black: 5 },
          markerPool: 47,
          legalMoves: moved ? {} : {
            E4: [{ to: 'E7', flips: null }],
          },
          candidateRows: [],
          activity: [{
            action: moved ? 'move_ring' : 'place_ring',
            playerID: moved ? human.playerID : ai.playerID,
            payloadJSON: moved
              ? '{"from":"E4","to":"E7","side":"white","flips":["E5","E6"]}'
              : '{"pointID":"D3","side":"black"}',
          }],
          lastAction: moved ? {
            action: 'move_ring',
            playerID: human.playerID,
            payloadJSON: '{"from":"E4","to":"E7","side":"white","flips":["E5","E6"]}',
          } : undefined,
          players: {
            [human.playerID]: human,
            [ai.playerID]: ai,
          },
          playerOrder: [human.playerID, ai.playerID],
          roundNo: 1,
          turnDeadline: new Date(Date.now() + 60_000).toISOString(),
          turnTimeoutMs: '60000',
        },
      },
    },
  };
}

function endedSnapshot(ownerID = human.playerID) {
  const snapshot = gameSnapshot();
  return {
    ...snapshot,
    seq: 14,
    view: {
      yinsh: {
        ...snapshot.view.yinsh,
        ownerID,
        playerData: {
          ...snapshot.view.yinsh.playerData,
          [human.playerID]: { side: 'white', ringsRemoved: 3 },
        },
        result: {
          winnerID: human.playerID,
          reason: '率先取走第三枚圆环',
          ringsRemoved: { white: 3, black: 1 },
        },
        roomData: {
          ...snapshot.view.yinsh.roomData,
          gameStatus: 'end',
          legalMoves: {},
        },
      },
    },
  };
}

async function mockSession(
  page: Page,
  respondToMove = false,
  initialSnapshot = gameSnapshot(),
) {
  const commands: string[] = [];
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
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'yinsh',
        status: 'playing',
        visibility: 'private',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 2,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'running',
        nextRoundNo: 2,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z',
        players: [human, ai],
        metrics: { yinsh: { ringsRemoved: 1, progressCurrent: 1, progressTotal: 3 } },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(initialSnapshot));
    socket.onMessage(message => {
      const value = String(message);
      commands.push(value);
      if (respondToMove && value.includes('"game_move_ring"')) {
        socket.send(JSON.stringify(gameSnapshot(true)));
      }
    });
  });
  return commands;
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('YINSH mobile board and action dock fit 390x844', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  const commands = await mockSession(page);
  await page.goto(`/game/yinsh/match?roomID=${roomID}`);
  const board = page.getByRole('group', { name: 'YINSH 棋盘，85 个交点' });
  await expect(board).toBeVisible();
  await expect.poll(() => board.evaluate(element =>
    getComputedStyle(element).colorScheme)).toBe('light only');
  await expect(page.getByRole('heading', { name: '选择你的下一步' })).toBeVisible();
  await expect(page.getByText(/^公共池/).first()).toBeVisible();
  const dockAction = page.getByTestId('yinsh-mobile-dock')
    .getByRole('button', { name: '按坐标选择圆环' });
  await expect(dockAction).toHaveCSS('background-color', 'rgb(121, 68, 83)');
  await expect(dockAction).toHaveCSS('color', 'rgb(255, 250, 243)');
  const initialBoardBox = await board.boundingBox();
  expect(initialBoardBox?.x).toBeGreaterThanOrEqual(10);
  expect(initialBoardBox?.width).toBeGreaterThan(340);
  expect(initialBoardBox?.width).toBeLessThanOrEqual(370);
  await page.getByRole('button', { name: '选择白环 E4' }).click();
  const destination = page.getByRole('button', { name: '移动到 E7' });
  const hitArea = destination.locator('circle').first();
  const idleFill = await hitArea.evaluate(element => getComputedStyle(element).fill);
  await destination.hover();
  await expect(destination).toBeVisible();
  await expect.poll(() => hitArea.evaluate(element => getComputedStyle(element).fill))
    .not.toBe(idleFill);
  await expect(page.getByRole('button', { name: '按坐标选择落点' })).toBeVisible();
  await page.getByRole('button', { name: '按坐标选择落点' }).click();
  await expect(page.getByRole('heading', { name: '精确选择落点' })).toBeVisible();
  await page.getByRole('button', { name: '预选落点 E7' }).click();
  await expect.poll(() => commands.some(command =>
    command.includes('"game_move_ring"')
    && command.includes('"from":"E4"')
    && command.includes('"to":"E7"'))).toBe(true);
  await expect(page.getByRole('button', { name: /确认落子/ })).toHaveCount(0);
  const normalWidth = (await page.getByTestId('yinsh-board').boundingBox())?.width ?? 0;
  await page.getByRole('button', { name: '放大棋盘' }).click();
  await expect(page.getByRole('button', { name: '缩小棋盘' })).toBeVisible();
  expect((await page.getByTestId('yinsh-board').boundingBox())?.width).toBeGreaterThan(normalWidth);
  const box = await page.locator('svg[aria-label^="YINSH 棋盘"]').boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  expect(box?.height).toBeGreaterThan(300);
  await expectNoOverflow(page);
  expect(pageErrors).toEqual([]);
});

test('YINSH desktop keeps board and sidebar visible at 1440x900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page);
  await page.goto(`/game/yinsh/match?roomID=${roomID}`);
  await expect(page.getByRole('heading', { name: '进退之间，胜负无声。' })).toBeVisible();
  await expect(page.getByText('取三环，赢一局。')).toBeVisible();
  await expect(page.getByText('公共棋子池')).toBeVisible();
  await expectNoOverflow(page);
  const scroll = await page.getByTestId('yinsh-play').evaluate((play) => {
    const shell = play.parentElement?.parentElement?.parentElement;
    if (!shell) return;
    return {
      overflowY: getComputedStyle(shell).overflowY,
      clientHeight: shell.clientHeight,
      scrollHeight: shell.scrollHeight,
    };
  });
  expect(scroll?.overflowY).toBe('auto');
  expect(scroll?.scrollHeight).toBeGreaterThan(scroll?.clientHeight ?? 0);

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.getByTestId('yinsh-board')).toBeVisible();
  await expectNoOverflow(page);
});

test('YINSH drag waits for the authoritative snapshot before animating', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const commands = await mockSession(page, true);
  await page.goto(`/game/yinsh/match?roomID=${roomID}`);
  const board = page.getByTestId('yinsh-board');
  await expect(board).toHaveAttribute('data-motion', 'idle');

  await page.getByRole('button', { name: '选择白环 E4' })
    .dragTo(page.getByRole('button', { name: '交点 E7' }));

  await expect.poll(() => commands.some(command =>
    command.includes('"game_move_ring"'))).toBe(true);
  await expect(board).toHaveAttribute('data-motion', 'move');
  await expect(page.getByTestId('motion-status')).toBeVisible();
  await expect(board).toHaveAttribute('data-motion', 'idle');
  await expect(page.getByTestId('point-E7')).toHaveAttribute('data-ring', 'white');
  await expect(page.getByRole('button', { name: '回放上一步' })).toBeEnabled();
});

test('YINSH final result returns through the timer slot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, false, endedSnapshot());
  await page.goto(`/game/yinsh/match?roomID=${roomID}`);

  await expect(page.getByRole('button', { name: '回到棋盘' })).toBeVisible();
  await expect(page.getByRole('button', { name: '再来一局' })).toBeVisible();
  await expect(page.getByRole('button', { name: /返回大厅/ })).toHaveCount(0);

  await page.getByRole('button', { name: '回到棋盘' }).click();
  const button = page.getByRole('button', { name: '返回终局结算' });
  const content = button.locator('span').first();
  await expect(button).toBeVisible();
  await expect(page.getByTestId('yinsh-mobile-dock')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '打开对局菜单' })).toHaveCount(0);
  const [buttonBox, contentBox] = await Promise.all([
    button.boundingBox(),
    content.boundingBox(),
  ]);
  expect(buttonBox?.width).toBeGreaterThanOrEqual(48);
  expect(contentBox?.x).toBeGreaterThanOrEqual(buttonBox?.x ?? 0);
  expect((contentBox?.x ?? 0) + (contentBox?.width ?? 0))
    .toBeLessThanOrEqual((buttonBox?.x ?? 0) + (buttonBox?.width ?? 0));
  await page.getByRole('button', { name: '查看棋谱' }).click();
  await expect(page.getByRole('dialog', { name: '这一局的每一步' })).toBeVisible();
  await page.getByRole('button', { name: '关闭面板' }).click();
  await expectNoOverflow(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.getByRole('button', { name: '查看棋谱' })).toBeVisible();
  await expect(button).toBeVisible();
  await expectNoOverflow(page);

  await button.click();
  await expect(page.getByRole('button', { name: '回到棋盘' })).toBeVisible();
  await expectNoOverflow(page);
});

test('YINSH non-owner waits for the room owner to rematch', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, false, endedSnapshot(ai.playerID));
  await page.goto(`/game/yinsh/match?roomID=${roomID}`);

  const rematch = page.getByRole('button', {
    name: '等待房主再来一局',
  });
  await expect(rematch).toBeVisible();
  await expect(rematch).toBeDisabled();
});
