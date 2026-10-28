import { expect, test, type Page, type TestInfo } from '@playwright/test';

const roomID = 'splendor_mobile_layout';
const matchID = `${roomID}-r1`;
const human = {
  userID: 'splendor-mobile',
  playerID: 'splendor-mobile',
  displayName: 'N次元',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  userID: '',
  playerID: 'ai_2',
  displayName: 'AI',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

const cards = [
  { level: 1, bonus: 'White', points: 0, cost: { Blue: 2, Green: 2 } },
  { level: 1, bonus: 'Blue', points: 0, cost: { Green: 1, Red: 1, Black: 1 } },
  { level: 1, bonus: 'Green', points: 0, cost: { White: 2, Blue: 1 } },
  { level: 1, bonus: 'Red', points: 1, cost: { White: 4 } },
  { level: 2, bonus: 'White', points: 2, cost: { Red: 5 } },
  { level: 2, bonus: 'Blue', points: 1, cost: { Green: 2, Red: 3, Black: 2 } },
  { level: 2, bonus: 'Green', points: 2, cost: { Green: 5 } },
  { level: 2, bonus: 'Black', points: 1, cost: { White: 3, Blue: 2, Green: 3 } },
  {
    level: 3,
    bonus: 'White',
    points: 3,
    cost: { White: 3, Green: 3, Red: 3, Black: 3 },
  },
  { level: 3, bonus: 'Blue', points: 4, cost: { White: 7, Black: 3 } },
  { level: 3, bonus: 'Green', points: 4, cost: { Blue: 7 } },
  { level: 3, bonus: 'Red', points: 5, cost: { Blue: 7, Red: 3 } },
].map((card, index) => ({
  id: index + 1,
  state: 1,
  ...card,
}));

const nobles = [
  { id: 'N1', cost: { Green: 4, Red: 4 }, points: 3, state: 1 },
  { id: 'N2', cost: { White: 4, Green: 4 }, points: 3, state: 1 },
  { id: 'N3', cost: { White: 4, Blue: 4 }, points: 3, state: 1 },
  { id: 'N4', cost: { Blue: 4, Black: 4 }, points: 3, state: 1 },
  { id: 'N5', cost: { Red: 4, Black: 4 }, points: 3, state: 1 },
];

function gameSnapshot(gameStatus: 'playing' | 'end' = 'playing') {
  const emptyPlayer = {
    normalCard: [],
    nobleCard: [],
    reserveCard: [],
    gem: { White: 0, Blue: 0, Green: 0, Red: 0, Black: 0, Gold: 0 },
    score: 0,
  };
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 12,
    view: {
      splendor: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        result: gameStatus === 'end' ? {
          [human.playerID]: { score: 17, cards: 19, nobles: 2 },
          [ai.playerID]: { score: 3, cards: 11, nobles: 0 },
        } : undefined,
        playerData: {
          [human.playerID]: emptyPlayer,
          [ai.playerID]: emptyPlayer,
        },
        roomData: {
          card: {
            1: cards.filter(card => card.level === 1),
            2: cards.filter(card => card.level === 2),
            3: cards.filter(card => card.level === 3),
          },
          deckCounts: { 1: 36, 2: 26, 3: 16 },
          gems: { White: 7, Blue: 7, Green: 7, Red: 7, Black: 7, Gold: 5 },
          nobles,
          currentPlayer: human.playerID,
          gameStatus,
          turnDeadline: gameStatus === 'playing'
            ? new Date(Date.now() + 60_000).toISOString()
            : undefined,
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

async function mockSession(
  page: Page,
  snapshot: ReturnType<typeof gameSnapshot> = gameSnapshot(),
) {
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
        gameType: 'splendor',
        status: snapshot.view.splendor.roomData.gameStatus === 'end' ? 'finished' : 'playing',
        visibility: 'private',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 4,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'running',
        nextRoundNo: 1,
        createdAt: '2026-10-28T00:00:00Z',
        updatedAt: '2026-10-28T00:00:00Z',
        displayName: '珠宝商会',
        turnTimeoutSeconds: 60,
        players: [human, ai],
        metrics: {
          splendor: { maxScore: 0, progressCurrent: 0, progressTotal: 15 },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot));
  });
}

test('Splendor mobile market gives nobles, cards, and gem bank enough space', async ({
  page,
}, testInfo: TestInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  await page.goto(`/game/splendor/match?roomID=${roomID}`);

  const market = page.getByTestId('splendor-market');
  const nobleTrack = page.getByTestId('splendor-noble-track');
  const nobleTiles = page.getByTestId('splendor-noble');
  const cardMarket = page.getByTestId('splendor-card-market');
  const boardCards = cardMarket.locator('button[aria-label^="查看"]');
  const mobileBank = page.getByTestId('splendor-mobile-bank');

  await expect(market).toBeVisible();
  await expect(page.locator('header').first()).toHaveCSS('height', '57px');
  await expect(nobleTiles).toHaveCount(5);
  await expect(boardCards).toHaveCount(12);

  const nobleGeometry = await nobleTrack.evaluate(element => {
    const tile = element.querySelector<HTMLElement>('[data-testid="splendor-noble"]');
    const requirements = tile?.querySelector<HTMLElement>('[class*="_nobleRequirements_"]');
    const tileBox = tile?.getBoundingClientRect();
    const requirementsBox = requirements?.getBoundingClientRect();
    return {
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      tileHeight: tileBox?.height ?? 0,
      tileWidth: tileBox?.width ?? 0,
      requirementsBottom: requirementsBox?.bottom ?? 0,
      tileBottom: tileBox?.bottom ?? 0,
    };
  });
  expect(nobleGeometry.scrollWidth).toBeGreaterThan(nobleGeometry.clientWidth);
  expect(nobleGeometry.tileWidth).toBeGreaterThanOrEqual(138);
  expect(nobleGeometry.tileHeight).toBeGreaterThanOrEqual(74);
  expect(nobleGeometry.requirementsBottom).toBeLessThanOrEqual(
    nobleGeometry.tileBottom - 6,
  );

  await expect(page.getByTestId('splendor-deck').first()).toBeHidden();
  await expect(page.getByTestId('splendor-card-name').first()).toBeHidden();

  const firstCard = boardCards.first();
  const cardBox = await firstCard.boundingBox();
  const costList = firstCard.getByTestId('splendor-card-costs');
  const costBox = await costList.boundingBox();
  const costItems = await costList.locator('> span').evaluateAll(elements =>
    elements.map(element => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y };
    }));
  expect(cardBox).not.toBeNull();
  expect(costBox).not.toBeNull();
  expect(cardBox!.height).toBeGreaterThanOrEqual(98);
  expect(costItems).toHaveLength(4);
  expect(Math.max(...costItems.map(item => item.x))
    - Math.min(...costItems.map(item => item.x))).toBeLessThanOrEqual(1);
  expect(costItems.map(item => item.y)).toEqual(
    [...costItems].map(item => item.y).sort((left, right) => left - right),
  );
  expect(costBox!.x - cardBox!.x).toBeLessThanOrEqual(6);
  expect(Math.abs(cardBox!.y + cardBox!.height - (costBox!.y + costBox!.height)))
    .toBeLessThanOrEqual(7);

  const [marketBox, bankBox] = await Promise.all([
    market.boundingBox(),
    mobileBank.boundingBox(),
  ]);
  expect(marketBox).not.toBeNull();
  expect(bankBox).not.toBeNull();
  expect(bankBox!.height).toBeGreaterThanOrEqual(195);
  expect(bankBox!.y + bankBox!.height).toBeLessThanOrEqual(844);
  expect(bankBox!.y - (marketBox!.y + marketBox!.height)).toBeGreaterThanOrEqual(0);
  expect(bankBox!.y - (marketBox!.y + marketBox!.height)).toBeLessThanOrEqual(64);
  await expect(mobileBank).toHaveCSS('padding-bottom', '10px');
  await expect(mobileBank.getByRole('heading', { name: '宝石银行' })).toHaveCount(0);
  await expect(mobileBank.getByText('直接选择宝石，再确认拿取')).toHaveCount(0);
  const bankTextSpacing = await mobileBank.getByRole('button', {
    name: '选择钻石',
  }).evaluate(element => {
    const label = element.querySelector<HTMLElement>(':scope > span:last-child');
    const count = element.querySelector<HTMLElement>(':scope > span:first-child > b');
    const labelBox = label?.getBoundingClientRect();
    const countBox = count?.getBoundingClientRect();
    return labelBox && countBox ? countBox.top - labelBox.bottom : 0;
  });
  expect(bankTextSpacing).toBeGreaterThanOrEqual(5);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath('splendor-mobile-market.png'),
    fullPage: true,
  });

  await page.setViewportSize({ width: 360, height: 800 });
  const [narrowMarketBox, narrowBankBox, narrowCardBox] = await Promise.all([
    market.boundingBox(),
    mobileBank.boundingBox(),
    firstCard.boundingBox(),
  ]);
  expect(narrowMarketBox).not.toBeNull();
  expect(narrowBankBox).not.toBeNull();
  expect(narrowCardBox).not.toBeNull();
  expect(narrowCardBox!.height).toBeGreaterThanOrEqual(86);
  expect(narrowBankBox!.y + narrowBankBox!.height).toBeLessThanOrEqual(800);
  expect(narrowBankBox!.y - (narrowMarketBox!.y + narrowMarketBox!.height))
    .toBeGreaterThanOrEqual(0);
  expect(narrowBankBox!.y - (narrowMarketBox!.y + narrowMarketBox!.height))
    .toBeLessThanOrEqual(64);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.getByTestId('splendor-deck').first()).toBeVisible();
  await expect(page.getByTestId('splendor-card-name').first()).toBeVisible();
  await expect(costList).toHaveCSS('flex-direction', 'row');
});

test('Splendor mobile results keep the ranking and board return chrome orderly', async ({
  page,
}, testInfo: TestInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, gameSnapshot('end'));
  await page.goto(`/game/splendor/match?roomID=${roomID}`);

  const results = page.getByTestId('splendor-results');
  await expect(results).toBeVisible();
  await expect(results.locator('> header')).toHaveCSS('height', '57px');
  await expect(results.getByRole('button', { name: '返回大厅' })).toHaveCount(0);
  await expect(results.getByText('结算结果来自本局服务端快照')).toHaveCount(0);
  await expect(results.getByRole('button', { name: '查看终局牌面' })).toBeVisible();
  await expect(results.getByRole('button', { name: /再来一局/ })).toBeVisible();
  await expect(page.getByTestId('splendor-results-table')
    .locator('svg.lucide-trophy')).toHaveCount(0);
  const [tableBox, tieBreakNoteBox] = await Promise.all([
    page.getByTestId('splendor-results-table').boundingBox(),
    results.getByText('同分时发展卡更少者优先；仍相同则共享胜利。').boundingBox(),
  ]);
  expect(tableBox).not.toBeNull();
  expect(tieBreakNoteBox).not.toBeNull();
  expect(tieBreakNoteBox!.y - (tableBox!.y + tableBox!.height)).toBeGreaterThanOrEqual(20);

  const headerMetrics = await page.getByTestId('splendor-results-header')
    .locator(':scope > span').evaluateAll(elements => elements.map(element => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      whiteSpace: getComputedStyle(element).whiteSpace,
    })));
  expect(headerMetrics).toHaveLength(4);
  expect(headerMetrics.every(metric =>
    metric.whiteSpace === 'nowrap' && metric.scrollWidth <= metric.clientWidth)).toBe(true);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath('splendor-mobile-results.png'),
    fullPage: true,
  });

  await results.getByRole('button', { name: '查看终局牌面' }).click();
  await expect(page.getByTestId('splendor-market')).toBeVisible();
  await expect(page.locator('header').first()).toHaveCSS('height', '57px');
  const topbarStatus = page.getByTestId('splendor-topbar-status');
  const resultsButton = topbarStatus.getByRole('button', { name: '查看结算' });
  await expect(resultsButton).toBeVisible();
  await expect(topbarStatus.getByText('--', { exact: true })).toHaveCount(0);
  expect(await resultsButton.evaluate(element =>
    element.parentElement?.getAttribute('data-testid'))).toBe('splendor-topbar-status');
  await page.screenshot({
    path: testInfo.outputPath('splendor-mobile-board-return.png'),
    fullPage: true,
  });

  await resultsButton.click();
  await expect(results).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  const narrowHeaderFits = await page.getByTestId('splendor-results-header')
    .locator(':scope > span').evaluateAll(elements =>
      elements.every(element => element.scrollWidth <= element.clientWidth));
  expect(narrowHeaderFits).toBe(true);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
