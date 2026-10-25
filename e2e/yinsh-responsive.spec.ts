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

function gameSnapshot() {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 12,
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
            E4: 'white', C5: 'white', G3: 'white', I8: 'white',
            D3: 'black', F9: 'black', H9: 'black', I6: 'black',
          },
          markers: { E5: 'black', E6: 'white', F5: 'black', G6: 'white' },
          currentPlayer: human.playerID,
          gameStatus: 'move',
          placedRings: { white: 5, black: 5 },
          markerPool: 47,
          legalMoves: {
            E4: [{ to: 'E7', flips: ['E5', 'E6'] }],
          },
          candidateRows: [],
          activity: [{
            action: 'move_ring',
            playerID: ai.playerID,
            payloadJSON: '{"from":"D3","to":"D6","flips":[]}',
          }],
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

async function mockSession(page: Page) {
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
    socket.send(JSON.stringify(gameSnapshot()));
  });
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('YINSH mobile board and action dock fit 390x844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  await page.goto(`/game/yinsh/match?roomID=${roomID}`);
  await expect(page.getByRole('group', { name: 'YINSH 棋盘，85 个交点' })).toBeVisible();
  await page.getByRole('button', { name: '选择白环 E4' }).click();
  await expect(page.getByRole('button', { name: '移动到 E7' })).toBeVisible();
  await expect(page.getByRole('button', { name: '选择高亮落点' })).toBeVisible();
  const box = await page.locator('svg[aria-label^="YINSH 棋盘"]').boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  expect(box?.height).toBeGreaterThan(300);
  await expectNoOverflow(page);
});

test('YINSH desktop keeps board and sidebar visible at 1440x900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page);
  await page.goto(`/game/yinsh/match?roomID=${roomID}`);
  await expect(page.getByRole('heading', { name: '进退之间，胜负无声。' })).toBeVisible();
  await expect(page.getByText('取三环，赢一局。')).toBeVisible();
  await expect(page.getByText('公共棋子池')).toBeVisible();
  await expectNoOverflow(page);
});
