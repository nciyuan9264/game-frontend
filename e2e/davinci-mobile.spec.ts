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
  const commands: string[] = [];
  let publishSnapshot = (_next: Record<string, unknown>) => {
    throw new Error('the DaVinci websocket is not connected');
  };
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
    publishSnapshot = next => socket.send(JSON.stringify(next));
    socket.onMessage(message => commands.push(String(message)));
  });
  return {
    commands,
    publish: (next: Record<string, unknown>) => publishSnapshot(next),
  };
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
    visibility: 'private',
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
          lastData: {
            action: 'guess_card',
            playerID: human.playerID,
            payload: {
              targetCardID: 'black-2',
              targetPlayerID: ai.playerID,
              guessNum: 2,
              correct: true,
            },
          },
        },
        cardData: {
          self: [{ id: 'white-1', color: 0, num: 1, isRevealed: false, index: 0 }],
          opponents: [
            { id: 'black-1', color: 1, num: 1, isRevealed: true, index: 0 },
            { id: 'black-2', color: 1, num: 2, isRevealed: true, index: 1 },
          ],
        },
        result: { winnerID: human.playerID },
      },
    },
  };
}

function playingSnapshot() {
  const players = {
    [human.playerID]: human,
    [ai.playerID]: ai,
  };
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 42,
    view: {
      davinci: {
        playerId: human.playerID,
        ownerID: human.playerID,
        roomData: {
          currentPlayer: human.playerID,
          gameStatus: 'guessCard',
          players,
          boardCards: {},
          lastData: {
            action: 'guess_card',
            playerID: ai.playerID,
            payload: {
              targetCardID: 'white-1',
              targetPlayerID: human.playerID,
              guessNum: 1,
              correct: true,
            },
          },
        },
        cardData: {
          self: [{ id: 'white-1', color: 0, num: 1, isRevealed: true, index: 0 }],
          opponents: [
            { id: 'black-1', color: 1, num: 1, isRevealed: true, index: 0 },
            { id: 'black-2', color: 1, num: 2, isRevealed: false, index: 1 },
          ],
        },
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
  const size = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(size.document).toBeLessThanOrEqual(size.viewport);
}

async function expectAlignedPreparationRoom(page: Page) {
  const table = page.getByTestId('davinci-room-table');
  const facts = page.getByTestId('davinci-room-facts');
  const startBar = page.getByTestId('davinci-room-start-bar');
  await expect(table).toBeVisible();
  await expect(facts).toBeVisible();
  await expect(startBar).toBeVisible();
  const [tableBox, factsBox, startBox, startPosition] = await Promise.all([
    table.boundingBox(),
    facts.boundingBox(),
    startBar.boundingBox(),
    startBar.evaluate(element => getComputedStyle(element).position),
  ]);
  expect(tableBox).not.toBeNull();
  expect(factsBox).not.toBeNull();
  expect(startBox).not.toBeNull();
  if (!tableBox || !factsBox || !startBox) return;
  expect(Math.abs(tableBox.x - factsBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(tableBox.width - factsBox.width)).toBeLessThanOrEqual(1);
  expect(tableBox.y + tableBox.height).toBeLessThan(factsBox.y);
  expect(startPosition).toBe('fixed');
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
  const { commands } = await mockSession(page, matchSnapshot());
  await page.goto(`/game/davinci/match?roomID=${roomID}`);

  await expect(page.locator('[data-game-shell-header]')).toBeVisible();
  await expect(page.locator('[data-game-brand]')).toBeVisible();
  await expect(page.locator('[data-game-shell-platform-home]')).toBeHidden();
  await expect(page.locator('[data-game-shell-profile]')).toBeHidden();
  const heading = page.getByRole('heading', { name: new RegExp(roomID) });
  await expect(heading).toBeVisible();
  await expect(page.getByRole('button', { name: '房间设置' })).toBeVisible();
  await expect(page.getByRole('button', { name: '邀请好友' })).toBeVisible();
  await expect(page.getByText('私密房间')).toBeVisible();
  await expect(page.getByRole('button', {
    name: '在席位 2 添加人机',
  })).toBeVisible();
  await expectAlignedPreparationRoom(page);
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 356, height: 783 });
  await expectAlignedPreparationRoom(page);
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 390, height: 430 });
  await expectVerticalScroll(heading);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '房间设置' }).click();
  await expect(page.getByRole('button', { name: /私密房间/ }))
    .toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /公开房间/ }).click();
  await page.getByRole('button', { name: /保存设置/ }).click();
  await expect.poll(() => commands.some(command =>
    command.includes('"roomSettings"')
    && command.includes('"visibility":"public"'))).toBe(true);
});

test('DaVinci final board can reopen the results panel on mobile', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  const { publish } = await mockSession(page, playingSnapshot());
  await page.goto(`/game/davinci/match?roomID=${roomID}`);

  await expect(page.locator('canvas')).toBeVisible();
  publish(endedSnapshot());
  await expect(page.getByRole('heading', { name: '你破解了这组密码。' })).toBeVisible();
  await page.getByRole('button', { name: '查看终局牌面' }).click();
  await expect(page.getByRole('button', { name: '打开终局结算' })).toBeVisible();
  await expect(page.locator('header').first()).toHaveCSS('height', '57px');
  const topbarActions = page.locator('[data-game-mobile-topbar-actions] > button');
  await expect(topbarActions).toHaveCount(2);
  await expect.poll(() => topbarActions.evaluateAll(buttons =>
    buttons.map(button => button.getBoundingClientRect().height))).toEqual([34, 34]);
  await expectNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 356, height: 783 });
  await expect(page.getByRole('button', { name: '打开终局结算' })).toBeVisible();
  await expect.poll(() => topbarActions.evaluateAll(buttons =>
    buttons.map(button => button.getBoundingClientRect().height))).toEqual([31, 31]);
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: '打开终局结算' }).click();
  await expect(page.getByRole('heading', { name: '你破解了这组密码。' })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('DaVinci initial hand confirmation fits a mobile viewport', async ({ page }) => {
  await mockSession(page, initializationSnapshot());
  await page.goto(`/game/davinci/match?roomID=${roomID}`);

  const mobileTopbar = page.locator('[data-game-mobile-topbar]');
  await expect(mobileTopbar.getByText('确认初始密码')).toBeVisible();
  await expect(mobileTopbar).toHaveCSS('height', '57px');
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

test('DaVinci desktop play stage is bounded on an ultra-wide viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 2557, height: 1293 });
  await mockSession(page, initializationSnapshot());
  await page.goto(`/game/davinci/match?roomID=${roomID}`);

  const stage = page.getByTestId('davinci-play');
  const canvas = stage.locator('canvas');
  await expect(stage).toBeVisible();
  await expect(canvas).toBeVisible();
  const [stageBox, canvasBox] = await Promise.all([
    stage.boundingBox(),
    canvas.boundingBox(),
  ]);
  expect(stageBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  expect(stageBox!.width).toBeLessThanOrEqual(1700.5);
  expect(stageBox!.height).toBeLessThanOrEqual(1000.5);
  expect(stageBox!.y).toBeLessThanOrEqual(1);
  expect(canvasBox!.width).toBeGreaterThan(0);
  expect(canvasBox!.height).toBeGreaterThan(0);
  await expectNoHorizontalOverflow(page);
});
