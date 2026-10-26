import { expect, test, type Page } from '@playwright/test';

const roomID = 'fugitive_layout';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '午夜行者',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
  gameRole: 'fugitive',
};
const ai = {
  playerID: 'ai_2',
  displayName: 'Rook',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
  gameRole: 'marshal',
};

function gameSnapshot() {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 12,
    view: {
      fugitive: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: { role: 'fugitive', handCount: 5 },
          [ai.playerID]: { role: 'marshal', handCount: 3 },
        },
        hand: [
          { number: 2, sprint: 2 },
          { number: 12, sprint: 2 },
          { number: 20, sprint: 2 },
          { number: 31, sprint: 1 },
          { number: 42, sprint: 0 },
        ],
        roomData: {
          currentPlayer: human.playerID,
          gameStatus: 'fugitiveAction',
          roundNo: 3,
          drawsRemaining: 0,
          highestRevealed: 0,
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
              sprintCount: 0,
              card: { number: 5, sprint: 1 },
              sprints: [],
            },
            {
              index: 2,
              revealed: false,
              sprintCount: 1,
              card: { number: 9, sprint: 1 },
              sprints: [{ number: 4, sprint: 2 }],
            },
          ],
          decks: [
            { deckIndex: 0, min: 4, max: 14, remaining: 5 },
            { deckIndex: 1, min: 15, max: 28, remaining: 10 },
            { deckIndex: 2, min: 29, max: 41, remaining: 12 },
          ],
          activityLog: [{
            id: 1,
            roundNo: 3,
            kind: 'draw',
            playerID: human.playerID,
            role: 'fugitive',
            deckIndex: 1,
            numbers: [20],
            sprintCount: 0,
            automatic: false,
            private: true,
          }],
          lastData: {
            id: 1,
            roundNo: 3,
            kind: 'draw',
            playerID: human.playerID,
            role: 'fugitive',
            deckIndex: 1,
            numbers: [20],
            sprintCount: 0,
            automatic: false,
            private: true,
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
        gameType: 'fugitive',
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
        displayName: '午夜追缉',
        turnTimeoutSeconds: 60,
        players: [human, ai],
        metrics: {
          fugitive: {
            highestRevealed: 0,
            hiddenHideoutCount: 2,
            progressCurrent: 9,
            progressTotal: 42,
          },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(gameSnapshot()));
  });
}

async function mockLobby(page: Page) {
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
        totalGames: 0,
        wins: 0,
        winRate: 0,
        avgScore: 0,
        gamesByRole: {},
        winsByRole: {},
      },
    },
  }));
}

async function expectNoDocumentOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('Fugitive mobile lobby uses product chrome and shared entry flows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockLobby(page);
  await page.goto('/game/fugitive');

  const createButton = page.getByRole('button', { name: /创建房间/ });
  const shareButton = page.getByRole('button', { name: /分享游戏/ });
  await expect(createButton).toBeVisible();
  await expect(shareButton).toBeVisible();
  await expect(page.locator('.mobile-system')).toHaveCount(0);
  await expect(page.locator('.home-wrap')).toHaveCount(0);
  await expect(page.getByText('了解玩法', { exact: true })).toHaveCount(0);
  await expect(page.getByText('第一次来？读懂规则')).toHaveCount(0);
  await expect(createButton).toHaveCSS('justify-content', 'center');
  await expect(createButton).toHaveCSS('align-items', 'center');
  await expect(shareButton).toHaveCSS('justify-content', 'center');
  await expect(shareButton).toHaveCSS('align-items', 'center');

  await shareButton.click();
  await expect(page.getByRole('dialog', { name: '分享 Fugitive' })).toBeVisible();
  await expect(page.locator('.share-qr svg')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /复制游戏链接/ })).toBeVisible();
  await page.getByRole('button', { name: '关闭弹窗' }).click();

  await page.getByRole('button', { name: /房间号加入/ }).click();
  await expect(page.getByRole('dialog', { name: '通过房间号加入' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '房间号' }))
    .toHaveAttribute('placeholder', '例如 0302_075034');
  await expect(page.getByRole('button', { name: '取消' })).toBeVisible();
  await expect(page.getByRole('button', { name: /加入房间/ })).toBeDisabled();
  await expectNoDocumentOverflow(page);
});

test('Fugitive mobile route and action dock fit 390x844', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  await page.goto(`/game/fugitive/match?roomID=${roomID}`);

  await expect(page.getByTestId('fugitive-route')).toBeVisible();
  await expect(page.getByTestId('fugitive-mobile-dock')).toBeVisible();
  await expect(page.locator('.mobile-system')).toHaveCount(0);
  await expect(page.locator('.home-wrap')).toHaveCount(0);
  await expect(page.getByText('选择新的藏身点，或原地潜伏')).toBeVisible();
  await page.getByTestId('fugitive-mobile-dock')
    .getByRole('button', { name: /选择藏身点/ }).click();
  await page.getByRole('button', { name: '选择地点 20' }).click();
  await expect(page.getByRole('heading', { name: '前往 20 号藏身点' })).toBeVisible();
  await expectNoDocumentOverflow(page);
  expect(pageErrors).toEqual([]);
});

test('Fugitive desktop keeps route, hand, and mission visible at 1440x900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page);
  await page.goto(`/game/fugitive/match?roomID=${roomID}`);

  await expect(page.getByRole('heading', { name: '逃亡路线' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /我的手牌/ })).toBeVisible();
  await expect(page.getByText('消失在天亮之前。')).toBeVisible();
  await expect(page.getByText('服务端权威牌局')).toBeVisible();
  await expectNoDocumentOverflow(page);
});
