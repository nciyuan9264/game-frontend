import {
  expect,
  test,
  type Page,
  type TestInfo,
} from '@playwright/test';
import { expectMobileFinalResultLayout } from './helpers';

const roomID = 'hive_layout';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '织巢棋手',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_2',
  displayName: '行舟',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

const reserves = {
  queen: 0,
  ant: 2,
  beetle: 1,
  grasshopper: 2,
  spider: 1,
};

function gameSnapshot(gameStatus: 'playing' | 'end' = 'playing', seq = 12) {
  const ended = gameStatus === 'end';
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq,
    view: {
      hive: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: {
            side: 'white',
            turnsTaken: 5,
            queenPlaced: true,
            queenPressure: 2,
            reserveByKind: reserves,
          },
          [ai.playerID]: {
            side: 'black',
            turnsTaken: 5,
            queenPlaced: true,
            queenPressure: ended ? 6 : 3,
            reserveByKind: reserves,
          },
        },
        result: ended ? {
          winnerID: human.playerID,
          winnerSide: 'white',
          draw: false,
          reason: '黑方蜂后六边被围住',
          turnCount: 18,
          placedPieceCount: 12,
          maxStackHeight: 2,
        } : undefined,
        roomData: {
          stacks: [
            {
              position: { q: 0, r: 0 },
              pieces: [{
                pieceID: 'wQ1',
                side: 'white',
                kind: 'queen',
                number: 1,
              }],
            },
            {
              position: { q: 1, r: 0 },
              pieces: [{
                pieceID: 'bQ1',
                side: 'black',
                kind: 'queen',
                number: 1,
              }],
            },
            {
              position: { q: -1, r: 0 },
              pieces: [{
                pieceID: 'wA1',
                side: 'white',
                kind: 'ant',
                number: 1,
              }],
            },
            {
              position: { q: 2, r: 0 },
              pieces: [{
                pieceID: 'bA1',
                side: 'black',
                kind: 'ant',
                number: 1,
              }],
            },
            {
              position: { q: -1, r: 1 },
              pieces: [{
                pieceID: 'wB1',
                side: 'white',
                kind: 'beetle',
                number: 1,
              }],
            },
            {
              position: { q: 2, r: -1 },
              pieces: [{
                pieceID: 'bB1',
                side: 'black',
                kind: 'beetle',
                number: 1,
              }],
            },
          ],
          currentPlayer: human.playerID,
          currentSide: 'white',
          whitePlayerID: human.playerID,
          blackPlayerID: ai.playerID,
          firstPlayerID: human.playerID,
          roundNo: 1,
          gameStatus,
          legalActions: ended ? [] : [
            {
              kind: 'place',
              pieceID: 'wA2',
              to: { q: -2, r: 1 },
              path: [{ q: -2, r: 1 }],
            },
            {
              kind: 'place',
              pieceID: 'wB2',
              to: { q: -2, r: 1 },
              path: [{ q: -2, r: 1 }],
            },
            {
              kind: 'move',
              pieceID: 'wB1',
              to: { q: 0, r: 0 },
              path: [{ q: -1, r: 1 }, { q: 0, r: 0 }],
            },
            {
              kind: 'move',
              pieceID: 'wB1',
              to: { q: 0, r: 1 },
              path: [{ q: -1, r: 1 }, { q: 0, r: 1 }],
            },
          ],
          moveLog: [
            {
              id: 1,
              kind: 'place',
              playerID: human.playerID,
              side: 'white',
              pieceID: 'wQ1',
              to: { q: 0, r: 0 },
              path: [{ q: 0, r: 0 }],
              automatic: false,
            },
            {
              id: 2,
              kind: 'place',
              playerID: ai.playerID,
              side: 'black',
              pieceID: 'bQ1',
              to: { q: 1, r: 0 },
              path: [{ q: 1, r: 0 }],
              automatic: false,
            },
          ],
          lastAction: {
            id: 2,
            kind: 'place',
            playerID: ai.playerID,
            side: 'black',
            pieceID: 'bQ1',
            to: { q: 1, r: 0 },
            path: [{ q: 1, r: 0 }],
            automatic: false,
          },
          turnDeadline: new Date(Date.now() + 120_000).toISOString(),
          turnTimeoutMs: '120000',
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
  snapshot = gameSnapshot(),
) {
  const commands: string[] = [];
  let seq = snapshot.seq;
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'hive',
          status: snapshot.view.hive.roomData.gameStatus,
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
          metrics: {
            hive: {
              turnCount: 10,
              placedPieceCount: 6,
              progressCurrent: 3,
              progressTotal: 6,
            },
          },
        },
      },
    }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot));
    socket.onMessage(message => {
      const command = String(message);
      commands.push(command);
      if (
        command.includes('"game_place_piece"')
        || command.includes('"game_move_piece"')
      ) {
        seq += 1;
        socket.send(JSON.stringify(gameSnapshot('playing', seq)));
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

test('Hive public pages stay stable across target viewports', async ({
  page,
}, testInfo) => {
  await mockPublicData(page);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 780 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/game/hive');
    await expect(page.getByTestId('hive-lobby-hero')).toBeVisible();
    await expect(page.getByTestId('hive-lobby-facts')
      .locator(':scope > span')).toHaveCount(3);
    await expectNoOverflow(page);
    await capture(page, testInfo, `lobby-${viewport.width}x${viewport.height}`);

    await page.goto('/game/hive/guide');
    await expect(page.getByTestId('hive-guide-visual')).toBeVisible();
    await expectNoOverflow(page);
  }
});

test('Hive mobile submits only service-provided placement and movement', async ({
  page,
}, testInfo) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  const commands = await mockSession(page);
  await page.goto(`/game/hive/match?roomID=${roomID}`);

  const board = page.getByRole('group', { name: '无边界六边形棋盘' });
  await expect(board).toBeVisible();
  await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
  await expect(page.locator('.hive-game-header')).toBeHidden();
  expect((await board.boundingBox())?.width).toBeGreaterThanOrEqual(360);
  await page.getByTestId('cell--2,1').click();
  await expect(page.getByRole('button', { name: '确认部署' })).toBeEnabled();
  await page.getByRole('button', { name: '确认部署' }).click();
  await expect.poll(() => commands.some(command =>
    command.includes('"game_place_piece"')
    && command.includes('"pieceID":"wA2"')
    && command.includes('"q":-2')
    && command.includes('"r":1'))).toBe(true);

  await page.getByRole('button', { name: '移动棋子' }).click();
  await page.getByTestId('cell--1,1').click();
  await page.getByTestId('cell-0,0').click();
  await expect(page.getByRole('button', { name: '确认移动' })).toBeEnabled();
  await page.getByRole('button', { name: '确认移动' }).click();
  await expect.poll(() => commands.some(command =>
    command.includes('"game_move_piece"')
    && command.includes('"pieceID":"wB1"')
    && command.includes('"q":0')
    && command.includes('"r":0'))).toBe(true);

  const dock = page.locator('.hive-move-dock');
  expect((await dock.boundingBox())?.height).toBe(66);
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-game');
  expect(pageErrors).toEqual([]);
});

test('Hive mobile results return to a compact final board', async ({
  page,
}, testInfo) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, gameSnapshot('end'));
  await page.goto(`/game/hive/match?roomID=${roomID}`);

  await expect(page.getByTestId('result-page')).toBeVisible();
  await expectMobileFinalResultLayout(page);
  const resultHero = await page.locator('[data-game-final-result-hero]')
    .boundingBox();
  expect(resultHero).not.toBeNull();
  expect(resultHero!.height).toBeLessThan(220);
  expect(resultHero!.height).not.toBe(246);
  await expect(page.locator('.hive-result-players article')).toHaveCount(2);
  await expect(page.getByText(/权威结算/)).toHaveCount(0);
  await capture(page, testInfo, 'mobile-results');
  await page.getByRole('button', { name: '回看终局蜂巢' }).click();
  const board = page.getByRole('group', { name: '无边界六边形棋盘' });
  await expect(board).toBeVisible();
  expect((await board.boundingBox())?.width).toBeGreaterThanOrEqual(360);
  await expect(page.getByRole('button', { name: '打开对局菜单' }))
    .toHaveCount(0);
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-final-board');
  expect(pageErrors).toEqual([]);
});

test('Hive desktop keeps the board, actions, and journal visible', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page);
  await page.goto(`/game/hive/match?roomID=${roomID}`);

  await expect(page.getByRole('heading', {
    name: '一片蜂巢，等你布局。',
  })).toBeVisible();
  await expect(page.getByRole('group', {
    name: '无边界六边形棋盘',
  })).toBeVisible();
  await expect(page.getByRole('heading', {
    name: '让蜂巢，再长一格。',
  })).toBeVisible();
  await expect(page.getByRole('heading', { name: '最近落子' })).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, testInfo, 'game-1440x900');
});
