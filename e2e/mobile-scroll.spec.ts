import { expect, test, type Locator, type Page } from '@playwright/test';

type GameType =
  | 'acquire'
  | 'davinci'
  | 'splendor'
  | 'yinsh'
  | 'othello'
  | 'quoridor'
  | 'hex'
  | 'onitama'
  | 'hive'
  | 'loveletter'
  | 'sixnimmt'
  | 'cantstop'
  | 'forsale'
  | 'fugitive'
  | 'warchest';

const games: Array<{ gameType: GameType; mobileNavigation: string }> = [
  { gameType: 'acquire', mobileNavigation: 'Acquire 手机导航' },
  { gameType: 'davinci', mobileNavigation: '达芬奇密码手机导航' },
  { gameType: 'splendor', mobileNavigation: '璀璨宝石手机导航' },
  { gameType: 'yinsh', mobileNavigation: 'YINSH 手机导航' },
  { gameType: 'othello', mobileNavigation: 'OTHELLO 手机导航' },
  { gameType: 'quoridor', mobileNavigation: 'QUORIDOR 手机导航' },
  { gameType: 'hex', mobileNavigation: 'HEX 手机导航' },
  { gameType: 'onitama', mobileNavigation: 'ONITAMA 手机导航' },
  { gameType: 'hive', mobileNavigation: 'HIVE 手机导航' },
  { gameType: 'loveletter', mobileNavigation: '掌心密信手机导航' },
  { gameType: 'sixnimmt', mobileNavigation: '6 nimmt! 手机导航' },
  { gameType: 'cantstop', mobileNavigation: "CAN'T STOP 手机导航" },
  { gameType: 'forsale', mobileNavigation: 'For Sale 手机导航' },
  { gameType: 'fugitive', mobileNavigation: 'Fugitive 手机导航' },
  { gameType: 'warchest', mobileNavigation: '战争之匣手机导航' },
];

const rankMetricGames = new Set<GameType>([
  'acquire',
  'splendor',
  'loveletter',
  'sixnimmt',
  'forsale',
]);

function metric(gameType: GameType, index: number) {
  if (rankMetricGames.has(gameType)) {
    return { rank: { avgRank: 1 + index / 10 } };
  }
  return {
    [gameType]: {
      wins: 20 - index,
      winRate: .75 - index * .01,
    },
  };
}

function historyGame(gameType: GameType, index: number) {
  const id = `${gameType}-mobile-history-${index}`;
  const day = String(20 - index).padStart(2, '0');
  const timestamp = `2026-10-${day}T12:20:44Z`;
  return {
    id,
    roomID: `${gameType}-room-${index}`,
    gameType,
    startedAt: timestamp,
    endedAt: timestamp,
    durationSeconds: 360,
    maxPlayers: 2,
    createdAt: timestamp,
    updatedAt: timestamp,
    players: [{
      id: `${id}-self`,
      gameID: id,
      userID: 'mobile-scroll-user',
      playerID: 'mobile-scroll-user',
      displayName: '移动端玩家',
      gameRole: 'fugitive',
      seatIndex: 0,
      isAI: false,
      finalScore: 3,
      finalStocks: 0,
      finalRank: 1,
      isWinner: true,
      createdAt: timestamp,
    }, {
      id: `${id}-opponent`,
      gameID: id,
      playerID: `${gameType}-opponent-${index}`,
      displayName: `对手 ${index + 1}`,
      gameRole: 'marshal',
      seatIndex: 1,
      isAI: false,
      finalScore: 1,
      finalStocks: 0,
      finalRank: 2,
      isWinner: false,
      createdAt: timestamp,
    }],
  };
}

async function mockPublicData(page: Page, gameType: GameType) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: 'mobile-scroll-user',
        display_name: '移动端玩家',
        email: 'mobile@example.com',
        avatar: '',
      },
    },
  }));
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: { rooms: [] } },
  }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        totalGames: 12,
        wins: 7,
        winRate: 7 / 12,
        avgScore: 18,
        gamesByRole: { fugitive: 6, marshal: 6 },
        winsByRole: { fugitive: 4, marshal: 3 },
      },
    },
  }));
  await page.route('**/pam-api/platform/history/games?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        games: Array.from({ length: 10 }, (_, index) =>
          historyGame(gameType, index)),
      },
    },
  }));
  await page.route('**/pam-api/platform/rankings?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        gameType,
        entries: Array.from({ length: 12 }, (_, index) => ({
          userID: String(index + 1),
          playerID: `player-${index + 1}`,
          displayName: `玩家 ${index + 1}`,
          totalGames: 30 - index,
          metric: metric(gameType, index),
        })),
      },
    },
  }));
}

async function readScrollState(locator: Locator) {
  return locator.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      clientHeight: element.clientHeight,
      overflowY: style.overflowY,
      scrollHeight: element.scrollHeight,
    };
  });
}

async function expectOuterShellLocked(page: Page, pageRoot: Locator) {
  const shell = page.locator('[data-game-shell]').first();
  const content = pageRoot.locator('..');
  const [shellState, contentState, documentState] = await Promise.all([
    readScrollState(shell),
    readScrollState(content),
    page.evaluate(() => ({
      body: {
        scrollHeight: document.body.scrollHeight,
      },
      document: {
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
      },
      viewport: { height: window.innerHeight, width: window.innerWidth },
    })),
  ]);
  expect(shellState.overflowY).toBe('hidden');
  expect(contentState.overflowY).toBe('hidden');
  expect(documentState.document.scrollHeight)
    .toBeLessThanOrEqual(documentState.viewport.height + 1);
  expect(documentState.body.scrollHeight)
    .toBeLessThanOrEqual(documentState.viewport.height + 1);
  expect(documentState.document.scrollWidth)
    .toBeLessThanOrEqual(documentState.viewport.width);
}

async function expectScrollable(locator: Locator) {
  await expect(locator).toBeVisible();
  const state = await readScrollState(locator);
  expect(state.overflowY).toBe('auto');
  expect(state.scrollHeight).toBeGreaterThan(state.clientHeight);
  await locator.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect.poll(() => locator.evaluate(element => element.scrollTop))
    .toBeGreaterThan(0);
}

test.use({ viewport: { width: 320, height: 568 } });

for (const game of games) {
  test(`${game.gameType} gives each public page one mobile scroll owner`,
    async ({ page }) => {
      await mockPublicData(page, game.gameType);

      await page.goto(`/game/${game.gameType}`, {
        waitUntil: 'domcontentloaded',
      });
      const navigation = page.getByRole('navigation', {
        name: game.mobileNavigation,
      });
      const lobby = page.locator('[data-game-public-mobile="lobby"]');
      await expect(navigation).toBeVisible();
      await expectScrollable(lobby);
      await expectOuterShellLocked(page, lobby);

      await page.goto(`/game/${game.gameType}/rankings`, {
        waitUntil: 'domcontentloaded',
      });
      const rankings = page.locator('[data-game-public-mobile="rankings"]');
      const rankList = page.locator(
        '[data-game-mobile-scroll-owner="rankings"]',
      );
      await expect(rankings).toHaveCSS('overflow-y', 'hidden');
      await expectScrollable(rankList);
      await expectOuterShellLocked(page, rankings);

      await page.goto(`/game/${game.gameType}/guide`, {
        waitUntil: 'domcontentloaded',
      });
      const guide = page.locator('[data-game-public-mobile="guide"]');
      const guideCopy = page.locator(
        '[data-game-mobile-scroll-owner="guide"]',
      );
      await expect(guide).toHaveCSS('overflow-y', 'hidden');
      await expect(guideCopy).toHaveCSS('overflow-y', 'auto');
      const guideState = await readScrollState(guide);
      expect(guideState.scrollHeight).toBeLessThanOrEqual(
        guideState.clientHeight + 1,
      );
      const guideGeometry = await page.locator(
        '[data-game-mobile-guide-panel]',
      ).evaluate(panel => {
        const actions = panel.lastElementChild;
        const panelBox = panel.getBoundingClientRect();
        const actionsBox = actions?.getBoundingClientRect();
        return {
          panelBottom: panelBox.bottom,
          actionsBottom: actionsBox?.bottom ?? Number.POSITIVE_INFINITY,
          actionsTop: actionsBox?.top ?? Number.NEGATIVE_INFINITY,
          panelTop: panelBox.top,
        };
      });
      expect(guideGeometry.actionsTop).toBeGreaterThanOrEqual(
        guideGeometry.panelTop,
      );
      expect(guideGeometry.actionsBottom).toBeLessThanOrEqual(
        guideGeometry.panelBottom,
      );
      await expectOuterShellLocked(page, guide);

      await page.goto(`/game/${game.gameType}/me`, {
        waitUntil: 'domcontentloaded',
      });
      const profile = page.locator('[data-game-public-mobile="profile"]');
      const history = profile.locator(':scope > section').nth(1);
      const historyList = history.locator(':scope > div').first();
      await expectScrollable(profile);
      await expect(history).toHaveCSS('overflow-y', 'visible');
      await expect(historyList).toHaveCSS('overflow-y', 'visible');
      const [historyState, historyListState] = await Promise.all([
        readScrollState(history),
        readScrollState(historyList),
      ]);
      expect(historyState.scrollHeight)
        .toBeLessThanOrEqual(historyState.clientHeight + 1);
      expect(historyListState.scrollHeight)
        .toBeLessThanOrEqual(historyListState.clientHeight + 1);
      await expectOuterShellLocked(page, profile);
      await expect(navigation).toBeVisible();
    });
}

for (const specialPage of [
  {
    name: 'Fugitive card library',
    path: '/game/fugitive/cards',
    root: '.library-page',
    gameType: 'fugitive',
  },
  {
    name: 'War Chest army library',
    path: '/game/warchest/army',
    root: '.army-page',
    gameType: 'warchest',
  },
] as const) {
  test(`${specialPage.name} owns its mobile scrolling`, async ({ page }) => {
    await mockPublicData(page, specialPage.gameType);
    await page.goto(specialPage.path, { waitUntil: 'domcontentloaded' });

    const root = page.locator(specialPage.root);
    await expectScrollable(root);

    const geometry = await root.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, viewport: window.innerWidth };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
