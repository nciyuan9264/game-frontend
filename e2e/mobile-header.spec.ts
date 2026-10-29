import { expect, test, type Page } from '@playwright/test';

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

async function mockAcquirePlay(page: Page) {
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
            money: 6000,
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
            currentPlayer: player.playerID,
            gameStatus: 'setTile',
            tiles: {},
            players: {
              [player.playerID]: player,
              [opponent.playerID]: opponent,
            },
            playerOrder: [player.playerID, opponent.playerID],
            turnDeadline: new Date(Date.now() + 60_000).toISOString(),
            turnTimeoutMs: '60000',
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

test('acquire live play swaps only the mobile topbar structure', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const roomID = await mockAcquirePlay(page);
  await page.goto(`/game/acquire/match?roomID=${roomID}`);

  const mobileTopbar = page.locator('[data-game-mobile-topbar]');
  const desktopTopbar = page.locator('[data-game-desktop-topbar]');
  await expect(mobileTopbar).toBeVisible();
  await expect(desktopTopbar).toBeHidden();
  await expect(mobileTopbar.getByRole('button', { name: '股价速查' })).toBeVisible();
  await expect(mobileTopbar.locator('svg.lucide-wallet')).toBeVisible();
  await expect(page.locator('[data-game-brand]')).toHaveCount(0);
  await expect(page.locator('[data-game-shell-profile]')).toHaveCount(0);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(mobileTopbar).toBeHidden();
  await expect(desktopTopbar).toBeVisible();
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
