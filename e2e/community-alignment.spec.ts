import { expect, test, type Page } from '@playwright/test';

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

const cases: Array<{
  gameType: GameType;
  heading: string;
  mobileNavigation: string;
  maxPlayers: number;
}> = [
  { gameType: 'acquire', heading: '找到房间，一起开场。', mobileNavigation: 'Acquire 手机导航', maxPlayers: 6 },
  { gameType: 'davinci', heading: '选择一张密码桌', mobileNavigation: '达芬奇密码手机导航', maxPlayers: 2 },
  { gameType: 'splendor', heading: '好的一局，从入座开始。', mobileNavigation: '璀璨宝石手机导航', maxPlayers: 4 },
  { gameType: 'yinsh', heading: '挑一局，慢慢想。', mobileNavigation: 'YINSH 手机导航', maxPlayers: 2 },
  { gameType: 'othello', heading: '挑一局，慢慢想。', mobileNavigation: 'OTHELLO 手机导航', maxPlayers: 2 },
  { gameType: 'quoridor', heading: '挑一条路，慢慢走。', mobileNavigation: 'QUORIDOR 手机导航', maxPlayers: 2 },
  { gameType: 'hex', heading: '挑一条路，慢慢走。', mobileNavigation: 'HEX 手机导航', maxPlayers: 2 },
  { gameType: 'onitama', heading: '挑一条路，慢慢走。', mobileNavigation: 'ONITAMA 手机导航', maxPlayers: 2 },
  { gameType: 'hive', heading: '挑一局，慢慢想。', mobileNavigation: 'HIVE 手机导航', maxPlayers: 2 },
  { gameType: 'loveletter', heading: '找到房间，一起传信。', mobileNavigation: '掌心密信手机导航', maxPlayers: 6 },
  { gameType: 'sixnimmt', heading: '找到牌桌，一起躲牛。', mobileNavigation: '6 nimmt! 手机导航', maxPlayers: 10 },
  { gameType: 'cantstop', heading: '找到山路，一起登顶。', mobileNavigation: "CAN'T STOP 手机导航", maxPlayers: 4 },
  { gameType: 'forsale', heading: '找到房间，一起开场。', mobileNavigation: 'For Sale 手机导航', maxPlayers: 6 },
  { gameType: 'fugitive', heading: '找一个对手，开一场追逐。', mobileNavigation: 'Fugitive 手机导航', maxPlayers: 2 },
  { gameType: 'warchest', heading: '为下一场交锋，入席。', mobileNavigation: '战争之匣手机导航', maxPlayers: 2 },
];

const rankGames = new Set<GameType>([
  'acquire',
  'splendor',
  'loveletter',
  'sixnimmt',
  'forsale',
]);

function metric(gameType: GameType, index: number) {
  if (rankGames.has(gameType)) {
    return { rank: { avgRank: 1 + index / 10 } };
  }
  return {
    [gameType]: {
      wins: 8 - index,
      winRate: .6 - index * .05,
    },
  };
}

async function mockData(
  page: Page,
  gameType: GameType,
  rooms: Array<Record<string, unknown>> = [],
) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: 'mobile-profile',
        display_name: '移动端玩家',
        email: 'mobile@example.com',
        avatar: '',
      },
    },
  }));
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: { rooms } },
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
    json: { status_code: 0, message: 'ok', data: { games: [] } },
  }));
  await page.route('**/pam-api/platform/rankings?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        gameType,
        entries: [0, 1, 2].map(index => ({
          userID: String(index + 1),
          playerID: `player-${index + 1}`,
          displayName: `玩家 ${index + 1}`,
          totalGames: 20 - index,
          metric: metric(gameType, index),
        })),
      },
    },
  }));
}

const ownerAvatarURL = '/test-owner-avatar.png';
const avatarPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==',
  'base64',
);

function ownerRoom(gameType: GameType, maxPlayers: number) {
  const roomID = `${gameType}_owner_identity`;
  return {
    roomID,
    gameType,
    status: 'match',
    visibility: 'public',
    ownerUserID: '220',
    ownerPlayerID: 'owner-220',
    maxPlayers,
    playerCount: 2,
    currentMatchID: `${roomID}-r1`,
    currentMatchStatus: 'preparing',
    nextRoundNo: 1,
    createdAt: '2026-10-26T00:00:00Z',
    updatedAt: '2026-10-26T00:00:00Z',
    displayName: gameType === 'fugitive' ? '午夜追缉'
      : gameType === 'warchest' ? '雾谷前哨' : undefined,
    turnTimeoutSeconds: gameType === 'warchest' ? 90
      : gameType === 'fugitive' || gameType === 'hive' ? 120 : 60,
    players: [{
      userID: '330',
      playerID: 'guest-330',
      displayName: '先返回的玩家',
      avatar: '',
      seatIndex: 1,
      online: true,
      ai: false,
      ready: true,
      gameRole: gameType === 'fugitive' ? 'marshal' : undefined,
    }, {
      userID: '220',
      playerID: 'owner-220',
      displayName: '真实房主',
      avatar: ownerAvatarURL,
      seatIndex: 0,
      online: true,
      ai: false,
      ready: true,
      gameRole: gameType === 'fugitive' ? 'fugitive' : undefined,
    }],
    metrics: {
      acquire: { emptyTileCount: 108 },
      davinci: { boardCardCount: 26 },
      splendor: { maxScore: 0 },
      yinsh: { ringsRemoved: 0 },
      othello: { occupiedCount: 4 },
      quoridor: { turnCount: 0 },
      hex: { turnCount: 0 },
      onitama: { turnCount: 0 },
      hive: { turnCount: 0, placedPieceCount: 0 },
      loveletter: { currentRound: 1 },
      sixnimmt: { currentRound: 1 },
      cantstop: { maxClaimedColumns: 0, targetColumns: 3 },
      forsale: { progressCurrent: 0, progressTotal: 8 },
      fugitive: { highestRevealed: 0, hiddenHideoutCount: 0 },
      warchest: { maxControlledLocations: 0 },
    },
  };
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectMobileShell(page: Page, navigationName: string) {
  const banner = page.getByRole('banner');
  const navigation = page.getByRole('navigation', { name: navigationName });
  const [bannerBox, navigationBox] = await Promise.all([
    banner.boundingBox(),
    navigation.boundingBox(),
  ]);
  expect(bannerBox).toMatchObject({ width: 390, height: 57 });
  expect(navigationBox).toMatchObject({ y: 778, width: 390, height: 66 });
}

test.use({ viewport: { width: 390, height: 844 } });

for (const item of cases) {
  test(`${item.gameType} mobile lobby uses the shared public layout`,
    async ({ page }) => {
      await mockData(page, item.gameType);
      await page.goto(`/game/${item.gameType}`, { waitUntil: 'domcontentloaded' });

      const root = page.locator('[data-game-public-mobile="lobby"]');
      const hero = page.locator('[data-game-mobile-lobby-hero]');
      const facts = page.locator('[data-game-mobile-lobby-facts]');
      const browser = page.locator('[data-game-mobile-lobby-browser]');
      const join = page.locator('[data-game-mobile-lobby-join]');
      await expect(root).toBeVisible();
      await expect(page.getByRole('heading', { name: item.heading })).toBeVisible();
      await expect(page.getByPlaceholder('搜索房间号 / 房主')).toBeVisible();
      await expectMobileShell(page, item.mobileNavigation);

      const [heroBox, factsBox, browserBox, joinBox] = await Promise.all([
        hero.boundingBox(),
        facts.boundingBox(),
        browser.boundingBox(),
        join.boundingBox(),
      ]);
      expect(heroBox).toMatchObject({ width: 362, height: 227 });
      expect(factsBox).toMatchObject({ width: 362, height: 63 });
      expect(browserBox?.width).toBe(362);
      expect(joinBox?.width).toBe(362);

      const create = page.getByRole('button', { name: /创建房间|新开一局/ }).first();
      const share = page.getByRole('button', { name: /分享游戏/ }).first();
      const heroTitle = hero.locator('h1');
      const description = hero.locator('h1 + p');
      const [createBox, shareBox, descriptionBox, heroColors] = await Promise.all([
        create.boundingBox(),
        share.boundingBox(),
        description.boundingBox(),
        hero.evaluate(element => {
          const title = element.querySelector('h1');
          const copy = element.querySelector('h1 + p');
          return {
            title: title ? getComputedStyle(title).color : '',
            description: copy ? getComputedStyle(copy).color : '',
          };
        }),
      ]);
      await expect(heroTitle).toBeVisible();
      expect(createBox).toMatchObject({ width: 129, height: 39 });
      expect(shareBox).toMatchObject({ width: 99, height: 39 });
      expect(heroColors).toEqual({
        title: 'rgb(242, 232, 214)',
        description: 'rgb(162, 182, 186)',
      });
      expect((createBox?.x ?? 0) - (heroBox?.x ?? 0)).toBe(21);
      expect(shareBox?.y).toBe(createBox?.y);
      expect((heroBox?.y ?? 0) + (heroBox?.height ?? 0)
        - ((createBox?.y ?? 0) + (createBox?.height ?? 0)))
        .toBe(9);
      expect((createBox?.y ?? 0)
        - ((descriptionBox?.y ?? 0) + (descriptionBox?.height ?? 0)))
        .toBeGreaterThanOrEqual(8);

      await share.click();
      await expect(page.getByRole('dialog').getByText('游戏地址')).toBeVisible();
      await page.getByRole('dialog').getByRole('button', {
        name: '关闭',
        exact: true,
      }).click();

      await create.click();
      const createDialog = page.getByRole('dialog');
      await expect(createDialog.getByRole('button', { name: /公开房间/ }))
        .toBeVisible();
      await expect(createDialog.getByRole('button', { name: /私密房间/ }))
        .toBeVisible();
      await createDialog.getByRole('button', { name: '取消', exact: true }).click();
      await expectNoOverflow(page);
    });
}

test('Acquire mobile lobby preserves the canonical hero composition',
  async ({ page }) => {
    await mockData(page, 'acquire');
    await page.goto('/game/acquire', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('[data-game-mobile-lobby-hero]');
    const eyebrow = hero.locator('span').first();
    const title = hero.getByRole('heading', { name: /落下一块地/ });
    const description = hero.getByText(/开一张桌，邀请朋友/);
    const media = hero.getByRole('img');

    const [eyebrowBox, titleBox, descriptionBox, mediaStyle, eyebrowStyle] =
      await Promise.all([
        eyebrow.boundingBox(),
        title.boundingBox(),
        description.boundingBox(),
        media.evaluate(image => {
          const style = getComputedStyle(image);
          return {
            objectPosition: style.objectPosition,
            opacity: style.opacity,
          };
        }),
        eyebrow.evaluate(element => ({
          display: getComputedStyle(element).display,
          lineWidth: getComputedStyle(element, '::before').width,
        })),
      ]);

    expect(eyebrowBox).toMatchObject({ width: 320, height: 9 });
    expect(titleBox).toMatchObject({ width: 320, height: 76.65625 });
    expect(descriptionBox?.width).toBe(225);
    expect(mediaStyle).toEqual({ objectPosition: '63% 51%', opacity: '0.78' });
    expect(eyebrowStyle).toEqual({ display: 'flex', lineWidth: '21px' });
  });

for (const item of cases) {
  test(`${item.gameType} mobile room card binds the real owner`,
    async ({ page }) => {
      const room = ownerRoom(item.gameType, item.maxPlayers);
      await page.route('**/test-owner-avatar.png', route => route.fulfill({
        body: avatarPNG,
        contentType: 'image/png',
      }));
      await mockData(page, item.gameType, [room]);
      await page.goto(`/game/${item.gameType}`, { waitUntil: 'domcontentloaded' });

      const card = page.locator('[data-game-mobile-room-card]')
        .filter({ hasText: room.roomID });
      await expect(card).toContainText('真实房主');
      const avatar = card.locator(`img[src="${ownerAvatarURL}"]`).first();
      await expect(avatar).toBeVisible();
      await expect.poll(() => avatar.evaluate(image =>
        image instanceof HTMLImageElement
        && image.complete
        && image.naturalWidth > 0)).toBe(true);
      await expectNoOverflow(page);
    });
}

for (const item of cases) {
  test(`${item.gameType} mobile community pages use the shared hierarchy`,
    async ({ page }) => {
      await mockData(page, item.gameType);

      await page.goto(`/game/${item.gameType}/rankings`, {
        waitUntil: 'domcontentloaded',
      });
      const rankHero = page.locator('[data-game-mobile-rank-hero]');
      const rankPanel = page.locator('[data-game-mobile-rank-panel]');
      await expect(page.locator('[data-game-public-mobile="rankings"]'))
        .toBeVisible();
      await expect(page.getByRole('tablist', { name: '排行榜模式' }))
        .toBeVisible();
      const [rankHeroBox, rankPanelBox] = await Promise.all([
        rankHero.boundingBox(),
        rankPanel.boundingBox(),
      ]);
      expect(rankHeroBox).toMatchObject({ width: 362, height: 166 });
      expect(rankPanelBox?.width).toBe(362);
      expect(rankPanelBox?.y).toBe(
        (rankHeroBox?.y ?? 0) + (rankHeroBox?.height ?? 0) + 18,
      );

      await page.goto(`/game/${item.gameType}/guide`, {
        waitUntil: 'domcontentloaded',
      });
      const guideVisual = page.locator('[data-game-mobile-guide-visual]');
      const guidePanel = page.locator('[data-game-mobile-guide-panel]');
      await expect(page.locator('[data-game-public-mobile="guide"]'))
        .toBeVisible();
      await expect(page.getByRole('tablist', { name: '玩法章节' }))
        .toBeVisible();
      const [visualBox, panelBox] = await Promise.all([
        guideVisual.boundingBox(),
        guidePanel.boundingBox(),
      ]);
      expect(visualBox?.width).toBe(362);
      expect(panelBox?.width).toBe(362);
      expect(panelBox?.y).toBe(
        (visualBox?.y ?? 0) + (visualBox?.height ?? 0) + 8,
      );

      await page.goto(`/game/${item.gameType}/me`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator('[data-game-public-mobile="profile"]'))
        .toBeVisible();
      await expect(page.getByText('PLAYER ID · mobile-profile')).toBeVisible();
      await expect(page.getByRole('link', { name: /编辑资料/ })).toBeVisible();
      await expect(page.locator('[data-game-mobile-about-entry]')).toBeVisible();
      await expectMobileShell(page, item.mobileNavigation);
      await expectNoOverflow(page);
    });
}

test('Fugitive mobile profile fills the Acquire content frame',
  async ({ page }) => {
    await mockData(page, 'fugitive');
    await page.route('**/pam-api/platform/history/games?**', route =>
      route.fulfill({
        json: {
          status_code: 0,
          message: 'ok',
          data: {
            games: [0, 1].map(index => ({
              id: `fugitive-profile-${index}`,
              roomID: `fugitive-room-${index}`,
              roomDisplayName: '午夜追缉',
              startedAt: `2026-10-2${8 - index}T12:20:44Z`,
              endedAt: `2026-10-2${8 - index}T12:26:44Z`,
              durationSeconds: 360 + index * 120,
              players: [{
                userID: 'mobile-profile',
                playerID: 'mobile-profile',
                displayName: '移动端玩家',
                gameRole: index ? 'marshal' : 'fugitive',
                isWinner: index === 0,
              }],
            })),
          },
        },
      }));

    await page.goto('/game/fugitive/me', { waitUntil: 'domcontentloaded' });
    const profile = page.locator('[data-game-public-mobile="profile"]');
    const about = page.locator('[data-game-mobile-about-entry]');
    const navigation = page.getByRole('navigation', {
      name: 'Fugitive 手机导航',
    });
    await expect(profile).toBeVisible();

    const [profileBox, aboutBox, navigationBox] = await Promise.all([
      profile.boundingBox(),
      about.boundingBox(),
      navigation.boundingBox(),
    ]);
    expect(profileBox).toMatchObject({ x: 14, width: 362 });
    expect((profileBox?.y ?? 0) + (profileBox?.height ?? 0))
      .toBe(navigationBox?.y);
    expect((aboutBox?.y ?? 0) + (aboutBox?.height ?? 0))
      .toBe(navigationBox?.y);
  });

test('Fugitive preserves role ranking and card library extensions',
  async ({ page }) => {
    await mockData(page, 'fugitive');
    await page.goto('/game/fugitive/rankings', { waitUntil: 'domcontentloaded' });
    const roleSelect = page.getByRole('combobox', { name: '排行榜身份' });
    await roleSelect.click();
    await page.getByRole('option', { name: '逃亡榜' }).click();
    await expect(roleSelect).toContainText('逃亡榜');

    await page.goto('/game/fugitive/guide', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /牌库速查/ })).toBeVisible();
});

test('Onitama and War Chest preserve guide extensions', async ({ page }) => {
  await mockData(page, 'onitama');
  await page.goto('/game/onitama/guide', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /移动卡速查/ })).toBeVisible();

  await mockData(page, 'warchest');
  await page.goto('/game/warchest/guide', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: /兵种图鉴/ })).toBeVisible();
});
