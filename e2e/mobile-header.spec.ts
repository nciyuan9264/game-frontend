import { expect, test, type Page } from '@playwright/test';
import { expectMobileFinalResultLayout } from './helpers';

const games = [
  'acquire',
  'cantstop',
  'davinci',
  'forsale',
  'fugitive',
  'hex',
  'hive',
  'loveletter',
  'onitama',
  'othello',
  'quoridor',
  'sixnimmt',
  'splendor',
  'warchest',
  'yinsh',
] as const;

const replayGames = [
  'acquire',
  'cantstop',
  'forsale',
  'hex',
  'hive',
  'loveletter',
  'onitama',
  'othello',
  'quoridor',
  'sixnimmt',
  'splendor',
  'yinsh',
] as const;

async function mockHeaderData(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: 'mobile-header-user',
        display_name: '移动端玩家',
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
      data: { totalGames: 0, wins: 0, winRate: 0, avgScore: 0 },
    },
  }));
}

async function mockAcquirePlay(page: Page, options: {
  endEligible?: boolean;
  ended?: boolean;
  waiting?: boolean;
} = {}) {
  const roomID = 'acquire_mobile_topbar';
  const player = {
    userID: 'mobile-header-user',
    playerID: 'mobile-header-user',
    displayName: '移动端玩家',
    avatar: '',
    seatIndex: 0,
    online: true,
    ai: false,
    ready: true,
  };
  const opponent = {
    playerID: 'ai_2',
    displayName: 'AI 买手',
    avatar: '',
    seatIndex: 1,
    online: true,
    ai: true,
    ready: true,
  };
  const companies = [
    'American', 'Continental', 'Festival', 'Imperial',
    'Sackson', 'Tower', 'Worldwide',
  ];
  await mockHeaderData(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'acquire',
          status: 'playing',
          visibility: 'private',
          ownerUserID: player.userID,
          ownerPlayerID: player.playerID,
          maxPlayers: 4,
          playerCount: 2,
          currentMatchID: `${roomID}-r1`,
          currentMatchStatus: 'running',
          nextRoundNo: 2,
          createdAt: '2026-10-29T00:00:00Z',
          updatedAt: '2026-10-29T00:00:00Z',
          players: [player, opponent],
          metrics: {
            acquire: {
              emptyTileCount: 108,
              progressCurrent: 0,
              progressTotal: 108,
            },
          },
        },
      },
    }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify({
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID,
      matchID: `${roomID}-r1`,
      seq: 5,
      view: {
        acquire: {
          playerId: player.playerID,
          ownerID: player.playerID,
          visibility: 'private',
          playerData: {
            money: 20100,
            stocks: Object.fromEntries(companies.map(key => [key, 0])),
            tiles: ['1A'],
          },
          roomData: {
            companyInfo: Object.fromEntries(companies.map(key => [key, {
              name: key,
              stockPrice: 200,
              stockTotal: 25,
              tiles: 0,
            }])),
            currentPlayer: options.waiting ? opponent.playerID : player.playerID,
            gameStatus: options.ended ? 'end' : 'setTile',
            tiles: {},
            players: {
              [player.playerID]: player,
              [opponent.playerID]: opponent,
            },
            playerOrder: [player.playerID, opponent.playerID],
            turnDeadline: new Date(Date.now() + 60_000).toISOString(),
            turnTimeoutMs: '60000',
            endGame: options.endEligible ? {
              eligible: true,
              condition: 'company_size',
              company: 'Tower',
              tileCount: 41,
              votes: { [player.playerID]: false },
            } : undefined,
          },
          tempData: {
            last_tile_key: '',
            mergeSettleData: {},
            merge_main_company_temp: '',
            merge_selection_temp: {
              mainCompany: [],
              otherCompany: [],
            },
          },
          result: options.ended ? {
            [player.playerID]: { money: 6000, stocks: 0, total: 6000 },
            [opponent.playerID]: { money: 5000, stocks: 0, total: 5000 },
          } : undefined,
        },
      },
    }));
  });
  return roomID;
}

for (const game of games) {
  test(`${game} mobile header keeps only the aligned platform home control`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockHeaderData(page);
    await page.goto(`/game/${game}`, { waitUntil: 'domcontentloaded' });

    const header = page.locator('[data-game-shell-header]');
    const brand = header.locator('[data-game-brand]');
    const home = header.locator('[data-game-shell-platform-home]');
    const profile = header.locator('[data-game-shell-profile]');

    await expect(header).toBeVisible();
    await expect(brand).toBeVisible();
    await expect(home).toBeVisible();
    await expect(profile).toHaveCount(1);
    await expect(profile).toBeHidden();

    const geometry = await home.evaluate(element => {
      const homeRect = element.getBoundingClientRect();
      const headerRect = element.closest('[data-game-shell-header]')!
        .getBoundingClientRect();
      const iconRect = element.querySelector('svg')!.getBoundingClientRect();
      return {
        centerDelta: Math.abs(
          homeRect.top + homeRect.height / 2
          - (headerRect.top + headerRect.height / 2),
        ),
        height: Math.round(homeRect.height),
        iconHeight: Math.round(iconRect.height),
        iconWidth: Math.round(iconRect.width),
        width: Math.round(homeRect.width),
      };
    });

    expect(geometry.centerDelta).toBeLessThanOrEqual(.5);
    expect({
      height: geometry.height,
      iconHeight: geometry.iconHeight,
      iconWidth: geometry.iconWidth,
      width: geometry.width,
    }).toEqual({
      height: 40,
      iconHeight: 21,
      iconWidth: 21,
      width: 40,
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(header).toBeVisible();
    await expect(brand).toBeVisible();
    await expect(home).toBeVisible();
    await expect(profile).toBeVisible();
  });
}

for (const game of replayGames) {
  test(`${game} replay uses an in-flow mobile heading`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockHeaderData(page);
    await page.route('**/pam-api/platform/history/games/**', route =>
      route.fulfill({
        status: 404,
        json: { status_code: 404, message: 'fixture replay unavailable', data: {} },
      }));
    await page.goto(`/game/${game}/replay/1`, { waitUntil: 'domcontentloaded' });

    const mobileHeading = page.locator('[data-game-mobile-replay-heading]');
    const desktopHeading = page.locator('[data-game-desktop-topbar]');
    await expect(mobileHeading).toBeVisible();
    await expect(mobileHeading.getByRole('link')).toBeVisible();
    await expect(mobileHeading).toHaveCSS('position', 'static');
    await expect(desktopHeading).toBeHidden();

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(mobileHeading).toBeHidden();
    await expect(desktopHeading).toBeVisible();
  });
}

test('acquire live play keeps only the end vote controls in the mobile topbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const roomID = await mockAcquirePlay(page, { endEligible: true });
  await page.goto(`/game/acquire/match?roomID=${roomID}`);
  await page.getByRole('button', { name: '关闭面板' }).click();

  const mobileTopbar = page.locator('[data-game-mobile-topbar]');
  const desktopTopbar = page.locator('[data-game-desktop-topbar]');
  await expect(mobileTopbar).toBeVisible();
  await expect(desktopTopbar).toBeHidden();
  await expect(mobileTopbar.getByRole('button', { name: '股价速查' })).toHaveCount(0);
  await expect(mobileTopbar.getByRole('button', { name: '查看本局结算' })).toHaveCount(0);
  await expect(mobileTopbar.getByLabel('可用现金 $20,100')).toHaveCount(0);
  const market = page.getByLabel('常驻公司行情');
  const cash = market.getByLabel('可用现金 $20,100');
  const deadline = mobileTopbar.getByRole('timer');
  const endSwitch = mobileTopbar.getByRole('switch', { name: '允许结束游戏' });
  const endHelp = mobileTopbar.getByRole('button', { name: '查看终局规则' });
  const switchTrack = endSwitch.locator('span');
  const helpIcon = endHelp.locator('svg');
  await expect(cash).toBeVisible();
  await expect(endSwitch).toBeVisible();
  await expect(endHelp).toBeVisible();
  await expect(page.locator('[data-game-brand]')).toHaveCount(0);
  await expect(page.locator('[data-game-shell-profile]')).toHaveCount(0);

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 800 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    const status = mobileTopbar.locator('[data-game-mobile-topbar-status]');
    const [metrics, statusMetrics, identityMetrics, timerStyle, helpStyle, deadlineBox,
      switchBox, switchTrackBox, helpBox, helpIconBox, marketHeaderMetrics] = await Promise.all([
      mobileTopbar.evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      })),
      status.evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      })),
      mobileTopbar.locator('[data-game-mobile-topbar-identity]').evaluate(element => ({
        width: element.getBoundingClientRect().width,
        overflow: getComputedStyle(element.querySelector('strong')!).overflow,
        textOverflow: getComputedStyle(element.querySelector('strong')!).textOverflow,
      })),
      deadline.evaluate(element => ({
        borderRadius: getComputedStyle(element).borderRadius,
        borderWidth: getComputedStyle(element).borderWidth,
      })),
      endHelp.evaluate(element => ({
        borderWidth: getComputedStyle(element).borderWidth,
        backgroundColor: getComputedStyle(element).backgroundColor,
      })),
      deadline.boundingBox(),
      endSwitch.boundingBox(),
      switchTrack.boundingBox(),
      endHelp.boundingBox(),
      helpIcon.boundingBox(),
      market.locator('header').evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      })),
    ]);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(viewport.width);
    expect(statusMetrics.scrollWidth).toBeLessThanOrEqual(statusMetrics.clientWidth);
    expect(identityMetrics.width).toBeLessThanOrEqual(132);
    expect(identityMetrics.overflow).toBe('hidden');
    expect(identityMetrics.textOverflow).toBe('ellipsis');
    expect(timerStyle.borderRadius).toBe('6px');
    expect(timerStyle.borderWidth).toBe('1px');
    expect(helpStyle.borderWidth).toBe('0px');
    expect(helpStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(deadlineBox).not.toBeNull();
    expect(switchBox).not.toBeNull();
    expect(switchTrackBox).not.toBeNull();
    expect(helpBox).not.toBeNull();
    expect(helpIconBox).not.toBeNull();
    expect(deadlineBox!.height).toBe(22);
    expect(switchBox!.width).toBe(44);
    expect(switchBox!.height).toBe(34);
    expect(switchTrackBox).toMatchObject({ width: 42, height: 22 });
    expect(helpBox!.width).toBe(34);
    expect(helpBox!.height).toBe(34);
    expect(helpIconBox).toMatchObject({ width: 22, height: 22 });
    expect(marketHeaderMetrics.scrollWidth).toBeLessThanOrEqual(marketHeaderMetrics.clientWidth);
    const centers = [deadlineBox!, switchTrackBox!, helpIconBox!].map(box => box.y + box.height / 2);
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(1);
    expect(Math.abs(helpBox!.x + helpBox!.width - metrics.right)).toBeLessThanOrEqual(1);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(mobileTopbar).toBeHidden();
  await expect(desktopTopbar).toBeVisible();
});

test('acquire end controls stay at the trailing edge without a countdown', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const roomID = await mockAcquirePlay(page, { endEligible: true, waiting: true });
  await page.goto(`/game/acquire/match?roomID=${roomID}`);
  await page.getByRole('button', { name: '关闭面板' }).click();

  const mobileTopbar = page.locator('[data-game-mobile-topbar]');
  const actions = mobileTopbar.locator('[data-game-mobile-topbar-actions]');
  await expect(mobileTopbar.locator('[data-game-mobile-topbar-status]')).toHaveCount(0);
  const [topbarBox, actionsBox] = await Promise.all([
    mobileTopbar.boundingBox(),
    actions.boundingBox(),
  ]);
  expect(topbarBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(Math.abs(actionsBox!.x + actionsBox!.width - (topbarBox!.x + topbarBox!.width)))
    .toBeLessThanOrEqual(1);
});

test('acquire final board keeps result access out of the mobile topbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const roomID = await mockAcquirePlay(page, { ended: true });
  await page.goto(`/game/acquire/match?roomID=${roomID}`);
  await expectMobileFinalResultLayout(page);
  await page.getByRole('button', { name: '查看终局棋盘' }).click();

  const mobileTopbar = page.locator('[data-game-mobile-topbar]');
  await expect(mobileTopbar).toBeVisible();
  await expect(mobileTopbar.locator('[data-game-mobile-topbar-status]')).toHaveCount(0);
  await expect(mobileTopbar.getByLabel('可用现金 $20,100')).toHaveCount(0);
  await expect(page.getByLabel('常驻公司行情').getByLabel('可用现金 $20,100')).toHaveCount(0);
  await expect(mobileTopbar.getByRole('button', { name: '股价速查' })).toHaveCount(0);
  await expect(mobileTopbar.getByRole('button', { name: '查看本局结算' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '查看本局结算' })).toBeVisible();
});

test('acquire waiting state places cash beside the stock lookup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const roomID = await mockAcquirePlay(page, { waiting: true });
  await page.goto(`/game/acquire/match?roomID=${roomID}`);

  const mobileTopbar = page.locator('[data-game-mobile-topbar]');
  const market = page.getByLabel('常驻公司行情');
  const cash = market.getByLabel('可用现金 $20,100');
  const stockLookup = market.getByRole('button', { name: '股价速查' });
  await expect(mobileTopbar.locator('[data-game-mobile-topbar-actions]')).toHaveCount(0);
  await expect(mobileTopbar.locator('[data-game-mobile-topbar-status]')).toHaveCount(0);
  await expect(cash).toBeVisible();
  const [cashBox, stockLookupBox] = await Promise.all([
    cash.boundingBox(),
    stockLookup.boundingBox(),
  ]);
  expect(cashBox).not.toBeNull();
  expect(stockLookupBox).not.toBeNull();
  expect(cashBox!.x + cashBox!.width).toBeLessThanOrEqual(stockLookupBox!.x);
  expect(stockLookupBox!.x - (cashBox!.x + cashBox!.width)).toBeLessThanOrEqual(2);
});

test('acquire desktop activity column ends with the board', async ({ page }) => {
  await page.setViewportSize({ width: 1727, height: 1261 });
  const roomID = await mockAcquirePlay(page);
  await page.goto(`/game/acquire/match?roomID=${roomID}`);

  const board = page.getByRole('group', { name: '12 列 9 行，共 108 块地' })
    .locator('..');
  const activity = page.getByRole('heading', { name: '城市动态' }).locator('..');
  await expect(board).toBeVisible();
  await expect(activity).toBeVisible();

  const [boardBox, activityBox] = await Promise.all([
    board.boundingBox(),
    activity.boundingBox(),
  ]);
  expect(boardBox).not.toBeNull();
  expect(activityBox).not.toBeNull();
  const boardBottom = boardBox!.y + boardBox!.height;
  const activityBottom = activityBox!.y + activityBox!.height;
  expect(Math.abs(activityBottom - boardBottom)).toBeLessThanOrEqual(45);
});

test('davinci mobile cipher facts use the full strip width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockHeaderData(page);
  await page.goto('/game/davinci');

  const facts = page.getByLabel('达芬奇密码规则要点').locator(':scope > div');
  await expect(facts).toHaveCSS('justify-content', 'space-between');
  await expect(facts.locator(':scope > button')).toHaveCount(4);
  await expect.poll(() => facts.evaluate(element =>
    element.scrollWidth <= element.clientWidth)).toBe(true);
});
