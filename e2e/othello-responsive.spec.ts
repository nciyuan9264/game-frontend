import { expect, test, type Locator, type Page } from '@playwright/test';

const roomID = 'othello_layout';
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

function opening() {
  const board = Array.from({ length: 64 }, () => '');
  board[27] = 'white';
  board[28] = 'black';
  board[35] = 'black';
  board[36] = 'white';
  return board;
}

function gameSnapshot() {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 12,
    view: {
      othello: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: { side: 'black', discCount: 2 },
          [ai.playerID]: { side: 'white', discCount: 2 },
        },
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

async function mockSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('othello-display-preferences', JSON.stringify({
      coordinates: true,
      hints: true,
      confirmMoves: true,
      reduceMotion: false,
    }));
  });
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
        gameType: 'othello',
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
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(gameSnapshot()));
  });
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectVerticalScroll(anchor: Locator) {
  const state = await anchor.evaluate(element => {
    let current: HTMLElement | null = element as HTMLElement;
    while (current) {
      const overflowY = getComputedStyle(current).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        current.scrollTop = current.scrollHeight;
        return {
          clientHeight: current.clientHeight,
          scrollHeight: current.scrollHeight,
          scrollTop: current.scrollTop,
        };
      }
      current = current.parentElement;
    }
    return null;
  });
  expect(state?.scrollHeight).toBeGreaterThan(state?.clientHeight ?? 0);
  expect(state?.scrollTop).toBeGreaterThan(0);
}

test('Othello mobile board and action dock fit 390x844', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  await page.goto(`/game/othello/match?roomID=${roomID}`);
  const board = page.getByRole('group', {
    name: '黑白棋棋盘，8 行 8 列。方向键移动，回车落子。',
  });
  await expect(board).toBeVisible();
  await expect(page.getByRole('heading', { name: '轮到你了' })).toBeVisible();
  await expect(board.locator(':scope > i')).toHaveCount(0);
  await expect.poll(() => page.getByTestId('cell-A1').evaluate(element => ({
    right: getComputedStyle(element).borderRightWidth,
    bottom: getComputedStyle(element).borderBottomWidth,
  }))).toEqual({ right: '1px', bottom: '1px' });
  const [turnBox, opponentBox, selfBox] = await Promise.all([
    page.getByTestId('turn-status').boundingBox(),
    page.getByTestId('mobile-opponent').boundingBox(),
    page.getByTestId('mobile-self').boundingBox(),
  ]);
  expect((turnBox?.y ?? 0) + (turnBox?.height ?? 0))
    .toBeLessThanOrEqual(opponentBox?.y ?? 0);
  expect(Math.abs((opponentBox?.y ?? 0) - (selfBox?.y ?? 0)))
    .toBeLessThanOrEqual(1);
  expect(Math.abs((opponentBox?.width ?? 0) - (selfBox?.width ?? 0)))
    .toBeLessThanOrEqual(1);
  await expect.poll(() => board.evaluate(element =>
    getComputedStyle(element).colorScheme)).toBe('light only');
  const topbarBox = await page.locator('header').first().boundingBox();
  expect(topbarBox?.height).toBe(50);
  await page.getByRole('button', { name: 'D3，可落子，翻转 1 枚' }).click();
  await expect(page.getByRole('button', { name: /确认落子 · D3/ })).toBeVisible();
  const box = await board.boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  expect(box?.height).toBeGreaterThan(300);
  await expectNoOverflow(page);
  await page.setViewportSize({ width: 390, height: 667 });
  await expectVerticalScroll(board);
  expect(pageErrors).toEqual([]);
});

test('Othello desktop keeps board and sidebar visible at 1440x900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page);
  await page.goto(`/game/othello/match?roomID=${roomID}`);
  await expect(page.getByRole('heading', { name: '黑白之间，一步转机。' })).toBeVisible();
  await expect(page.getByText('最后的多，', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: '行棋记录' })).toBeVisible();
  await expectNoOverflow(page);
});
