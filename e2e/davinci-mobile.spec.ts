import { expect, test, type Locator, type Page } from '@playwright/test';

const roomID = 'davinci_mobilelayout';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '移动端玩家',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_001',
  displayName: 'AI',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

test.use({ viewport: { width: 390, height: 844 } });

async function mockSession(page: Page, snapshot: Record<string, unknown>) {
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
        gameType: 'davinci',
        status: 'match',
        visibility: 'private',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 2,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'playing',
        nextRoundNo: 2,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z',
        players: [human, ai],
        metrics: { davinci: { boardCardCount: 14, progressCurrent: 0, progressTotal: 0 } },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot));
  });
}

function matchSnapshot() {
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID,
    matchID,
    seq: 0,
    ownerID: human.playerID,
    playerID: human.playerID,
    status: 'match',
    maxPlayers: 2,
    playerOrder: [human.playerID],
    players: {
      [human.playerID]: human,
    },
  };
}

function endedSnapshot() {
  const players = {
    [human.playerID]: human,
    [ai.playerID]: ai,
  };
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 43,
    view: {
      davinci: {
        playerId: human.playerID,
        ownerID: human.playerID,
        roomData: {
          currentPlayer: human.playerID,
          gameStatus: 'end',
          players,
          boardCards: {},
        },
        cardData: {
          self: [{ id: 'white-1', color: 0, num: 1, isRevealed: false, index: 0 }],
          opponents: [{ id: 'black-2', color: 1, num: 2, isRevealed: true, index: 0 }],
        },
        result: { winnerID: human.playerID },
      },
    },
  };
}

function initializationSnapshot() {
  const players = {
    [human.playerID]: human,
    [ai.playerID]: ai,
  };
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 3,
    view: {
      davinci: {
        playerId: human.playerID,
        ownerID: human.playerID,
        roomData: {
          currentPlayer: '',
          gameStatus: 'initialize',
          players,
          boardCards: {},
          turnDeadline: new Date(Date.now() + 15_000).toISOString(),
          turnTimeoutMs: '15000',
        },
        cardData: {
          self: [
            { id: 'white-1', color: 0, num: 1, index: 0 },
            { id: 'black-3', color: 1, num: 3, index: 1 },
            { id: 'white-5', color: 0, num: 5, index: 2 },
            { id: 'black-7', color: 1, num: 7, index: 3 },
            { id: 'white-9', color: 0, num: 9, index: 4 },
          ],
          opponents: [
            { id: 'opponent-1', color: 1, index: 0 },
            { id: 'opponent-2', color: 0, index: 1 },
            { id: 'opponent-3', color: 1, index: 2 },
            { id: 'opponent-4', color: 0, index: 3 },
            { id: 'opponent-5', color: 1, index: 4 },
          ],
          initialHandReady: false,
        },
      },
    },
  };
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))).toEqual({ viewport: 390, document: 390 });
}

async function expectVerticalScroll(anchor: Locator) {
  const state = await anchor.evaluate(element => {
    let current: HTMLElement | null = element as HTMLElement;
    while (current) {
      const overflowY = getComputedStyle(current).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        current.scrollTop = current.scrollHeight;
        return {
          overflowY,
          clientHeight: current.clientHeight,
          scrollHeight: current.scrollHeight,
          scrollTop: current.scrollTop,
        };
      }
      current = current.parentElement;
    }
    return null;
  });
  expect(state?.overflowY).toBe('auto');
  expect(state?.scrollHeight).toBeGreaterThan(state?.clientHeight ?? 0);
  expect(state?.scrollTop).toBeGreaterThan(0);
}

test('DaVinci preparation room fits a mobile viewport', async ({ page }) => {
  await mockSession(page, matchSnapshot());
  await page.goto(`/game/davinci/match?roomID=${roomID}`);

  const heading = page.getByRole('heading', { name: new RegExp(roomID) });
  await expect(heading).toBeVisible();
  await expect(page.getByRole('button', { name: '邀请好友' })).toBeVisible();
  await expect(page.getByText('空席位')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 390, height: 430 });
  await expectVerticalScroll(heading);
});

test('DaVinci final board can reopen the results panel on mobile', async ({ page }) => {
  await mockSession(page, endedSnapshot());
  await page.goto(`/game/davinci/match?roomID=${roomID}`);

  await expect(page.getByRole('heading', { name: '你破解了这组密码。' })).toBeVisible();
  await page.getByRole('button', { name: '查看终局牌面' }).click();
  await expect(page.getByRole('button', { name: '打开终局结算' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: '打开终局结算' }).click();
  await expect(page.getByRole('heading', { name: '你破解了这组密码。' })).toBeVisible();
});

test('DaVinci initial hand confirmation fits a mobile viewport', async ({ page }) => {
  await mockSession(page, initializationSnapshot());
  await page.goto(`/game/davinci/match?roomID=${roomID}`);

  await expect(page.getByText('确认初始密码')).toBeVisible();
  await expect(page.getByRole('button', { name: /确认牌序/ })).toBeEnabled();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const portraitBox = await canvas.boundingBox();
  expect(portraitBox?.width).toBeGreaterThan(0);
  expect(portraitBox?.height).toBeGreaterThan(0);
  const scrollContract = await canvas.evaluate(element => {
    let current = element.parentElement;
    while (current && getComputedStyle(current).overflowY !== 'auto') {
      current = current.parentElement;
    }
    return {
      canvasTouchAction: getComputedStyle(element).touchAction,
      playOverflowY: current ? getComputedStyle(current).overflowY : '',
    };
  });
  expect(scrollContract).toEqual({
    canvasTouchAction: 'pan-y',
    playOverflowY: 'auto',
  });
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('button', { name: /确认牌序/ })).toBeVisible();
  const landscapeBox = await canvas.boundingBox();
  expect(landscapeBox?.width).toBeGreaterThan(0);
  expect(landscapeBox?.height).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
