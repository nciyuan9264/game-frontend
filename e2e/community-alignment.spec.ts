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

const roomTitleRegressionGames: GameType[] = [
  'cantstop',
  'davinci',
  'fugitive',
  'loveletter',
  'sixnimmt',
  'warchest',
];

const roomProgressTotals: Partial<Record<GameType, number>> = {
  acquire: 108,
  splendor: 15,
  yinsh: 3,
  othello: 60,
  hive: 22,
  loveletter: 6,
  sixnimmt: 66,
  cantstop: 3,
  forsale: 8,
  fugitive: 42,
  warchest: 6,
};

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
  const metricsByGame = {
    acquire: {
      emptyTileCount: 108,
      progressCurrent: 0,
      progressTotal: 108,
    },
    davinci: {
      boardCardCount: 26,
      progressCurrent: 0,
      progressTotal: 0,
    },
    splendor: { maxScore: 0, progressCurrent: 0, progressTotal: 15 },
    yinsh: { ringsRemoved: 0, progressCurrent: 0, progressTotal: 3 },
    othello: {
      occupiedCount: 4,
      progressCurrent: 0,
      progressTotal: 60,
    },
    quoridor: { turnCount: 0 },
    hex: { turnCount: 0 },
    onitama: { turnCount: 0 },
    hive: {
      turnCount: 0,
      placedPieceCount: 0,
      progressCurrent: 0,
      progressTotal: 22,
    },
    loveletter: {
      currentRound: 1,
      maxFavor: 0,
      targetFavor: 6,
      progressCurrent: 0,
      progressTotal: 6,
    },
    sixnimmt: {
      currentRound: 1,
      maxPenalty: 0,
      targetPenalty: 66,
      progressCurrent: 0,
      progressTotal: 66,
    },
    cantstop: {
      maxClaimedColumns: 0,
      targetColumns: 3,
      progressCurrent: 0,
      progressTotal: 3,
    },
    forsale: { progressCurrent: 0, progressTotal: 8 },
    fugitive: {
      highestRevealed: 0,
      hiddenHideoutCount: 0,
      progressCurrent: 0,
      progressTotal: 42,
    },
    warchest: {
      maxControlledLocations: 0,
      progressCurrent: 0,
      progressTotal: 6,
    },
  };
  const metricsKey = gameType === 'forsale' ? 'forSale' : gameType;
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
    metrics: { [metricsKey]: metricsByGame[gameType] },
  };
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

const desktopPublicPageSuffixes = ['', '/rankings', '/guide', '/me'] as const;

async function expectDesktopPublicFrames(page: Page, gameType: GameType) {
  const frames = gameType === 'warchest'
    ? page.locator('.app-header, .page')
    : gameType === 'fugitive'
      ? page.locator('.app-header, .page-content')
      : page.locator('[data-game-shell-frame]');
  await expect(frames).toHaveCount(2);
  await expect(frames.first()).toBeVisible();
  await expect(frames.last()).toBeVisible();
  const geometry = await frames.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return {
      width: box.width,
      center: box.left + box.width / 2,
      viewportCenter: window.innerWidth / 2,
    };
  }));
  for (const frame of geometry) {
    expect(frame.width).toBeLessThanOrEqual(1700.5);
    expect(frame.width).toBeGreaterThanOrEqual(1699);
    expect(Math.abs(frame.center - frame.viewportCenter)).toBeLessThanOrEqual(50);
  }
  await expectNoOverflow(page);
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

async function expectMobileBottomGutter(
  page: Page,
  rootSelector: string,
  navigationName: string,
) {
  const [rootBox, navigationBox] = await Promise.all([
    page.locator(rootSelector).boundingBox(),
    page.getByRole('navigation', { name: navigationName }).boundingBox(),
  ]);
  expect(rootBox).not.toBeNull();
  expect(navigationBox).not.toBeNull();
  expect(Math.abs(
    (navigationBox?.y ?? 0)
    - ((rootBox?.y ?? 0) + (rootBox?.height ?? 0))
    - 14,
  )).toBeLessThanOrEqual(1);
}

async function expectGuideActionsContained(page: Page) {
  const panel = page.locator('[data-game-mobile-guide-panel]');
  const actions = panel.locator(':scope > :last-child');
  const primary = actions.locator('button, a').first();
  await expect(primary).toBeVisible();
  const [panelBox, actionsBox, primaryBox] = await Promise.all([
    panel.boundingBox(),
    actions.boundingBox(),
    primary.boundingBox(),
  ]);
  expect(panelBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(primaryBox).not.toBeNull();
  expect((actionsBox?.y ?? 0) + (actionsBox?.height ?? 0))
    .toBeLessThanOrEqual(
      (panelBox?.y ?? 0) + (panelBox?.height ?? 0) + 1,
    );
  expect((primaryBox?.y ?? 0) + (primaryBox?.height ?? 0))
    .toBeLessThanOrEqual(
      (panelBox?.y ?? 0) + (panelBox?.height ?? 0) + 1,
    );
}

async function expectStickySectionHeader(
  section: Locator,
  kind: 'profile' | 'rankings',
) {
  const header = section.locator(
    `[data-game-mobile-sticky-header="${kind}"]`,
  );
  await expect(header).toHaveCSS('position', 'sticky');
  await expect(header).toHaveCSS('top', '-1px');
  await expect(header).toHaveCSS('border-top-width', '1px');
  const [sectionBox, headerBox, background] = await Promise.all([
    section.boundingBox(),
    header.boundingBox(),
    header.evaluate(element => getComputedStyle(element).backgroundColor),
  ]);
  expect(sectionBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect(Math.abs((headerBox?.y ?? 0) - (sectionBox?.y ?? 0)))
    .toBeLessThanOrEqual(1);
  expect(background).not.toBe('rgba(0, 0, 0, 0)');
}

async function expectLobbyContentBaseline(page: Page, card: Locator) {
  const browser = page.locator('[data-game-mobile-lobby-browser]');
  const search = page.getByPlaceholder('搜索房间号 / 房主').locator('..');
  const alignedElements = [
    page.locator('[data-game-mobile-lobby-hero] h1'),
    browser.locator('header h2'),
    browser.getByRole('tab').first(),
    search.locator('svg'),
    card.locator('h3'),
  ];
  const boxes = await Promise.all(alignedElements.map(element =>
    element.boundingBox()));
  expect(boxes.every(Boolean)).toBe(true);
  const lefts = boxes.map(box => box?.x ?? 0);
  expect(Math.max(...lefts) - Math.min(...lefts))
    .toBeLessThanOrEqual(2);
}

test.use({ viewport: { width: 390, height: 844 } });

test('mobile public heroes scale through all supported height tiers',
  async ({ page }) => {
    await mockData(page, 'acquire');
    const samples: Array<{
      lobby: number;
      rank: number;
      guide: number;
    }> = [];

    for (const viewport of [
      { width: 430, height: 932 },
      { width: 390, height: 844 },
      { width: 390, height: 667 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize(viewport);

      await page.goto('/game/acquire', { waitUntil: 'domcontentloaded' });
      const lobby = await page.locator('[data-game-mobile-lobby-hero]')
        .boundingBox();
      expect(lobby?.width).toBe(viewport.width - 28);

      await page.goto('/game/acquire/rankings', {
        waitUntil: 'domcontentloaded',
      });
      const rank = await page.locator('[data-game-mobile-rank-hero]')
        .boundingBox();
      expect(rank?.width).toBe(viewport.width - 28);

      await page.goto('/game/acquire/guide', {
        waitUntil: 'domcontentloaded',
      });
      const guide = await page.locator('[data-game-mobile-guide-visual]')
        .boundingBox();
      expect(guide?.width).toBe(viewport.width - 28);

      samples.push({
        lobby: lobby?.height ?? 0,
        rank: rank?.height ?? 0,
        guide: guide?.height ?? 0,
      });
    }

    for (const key of ['lobby', 'rank', 'guide'] as const) {
      expect(samples[0][key]).toBeGreaterThan(samples[1][key]);
      expect(samples[1][key]).toBeGreaterThan(samples[2][key]);
      expect(samples[2][key]).toBeGreaterThan(samples[3][key]);
    }
  });

test('guide actions stay pinned across chapters and compact viewports',
  async ({ page }) => {
    await mockData(page, 'acquire');
    for (const viewport of [
      { width: 390, height: 667 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/game/acquire/guide', {
        waitUntil: 'domcontentloaded',
      });
      const copy = page.locator('[data-game-mobile-scroll-owner="guide"]');
      await expect(copy).toHaveCSS('overflow-y', 'auto');
      const tabs = page.getByRole('tablist', { name: '玩法章节' })
        .getByRole('tab');
      for (let chapter = 0; chapter < await tabs.count(); chapter += 1) {
        await tabs.nth(chapter).click();
        const before = await page.locator('[data-game-mobile-guide-panel]')
          .locator(':scope > :last-child').boundingBox();
        await copy.evaluate(element => {
          element.scrollTop = element.scrollHeight;
        });
        const after = await page.locator('[data-game-mobile-guide-panel]')
          .locator(':scope > :last-child').boundingBox();
        expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0)))
          .toBeLessThanOrEqual(1);
        await expectGuideActionsContained(page);
      }
    }
  });


test('ranking tabs do not move sibling tabs while pressed or selected',
  async ({ page }) => {
    await mockData(page, 'acquire');
    await page.goto('/game/acquire/rankings', {
      waitUntil: 'domcontentloaded',
    });
    const tabs = page.getByRole('tablist', { name: '排行榜模式' })
      .getByRole('tab');
    await expect(tabs).toHaveCount(2);
    const geometry = () => tabs.evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    const pulseOpacity = () => tabs.nth(1).evaluate(element =>
      Number(getComputedStyle(element, '::before').opacity));
    const initial = await geometry();
    const target = await tabs.nth(1).boundingBox();
    expect(target).not.toBeNull();
    expect(await pulseOpacity()).toBe(0);

    await page.mouse.move(
      target!.x + target!.width / 2,
      target!.y + target!.height / 2,
    );
    await page.mouse.down();
    await expect.poll(pulseOpacity).toBeGreaterThan(0);
    expect(await geometry()).toEqual(initial);
    await page.mouse.up();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect.poll(pulseOpacity).toBe(0);
    expect(await geometry()).toEqual(initial);
  });

for (const item of cases) {
  test(`${item.gameType} desktop public pages keep the 1700px content frame`,
    async ({ page }) => {
      await page.setViewportSize({ width: 2557, height: 1293 });
      await mockData(page, item.gameType);
      for (const suffix of desktopPublicPageSuffixes) {
        await page.goto(`/game/${item.gameType}${suffix}`, {
          waitUntil: 'domcontentloaded',
        });
        await expectDesktopPublicFrames(page, item.gameType);
      }
    });
}

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
      expect(heroBox?.width).toBe(362);
      expect(heroBox?.height ?? 0).toBeGreaterThanOrEqual(180);
      expect(heroBox?.height ?? 300).toBeLessThanOrEqual(236);
      expect(factsBox?.width).toBe(362);
      expect(factsBox?.height ?? 0).toBeGreaterThanOrEqual(45);
      expect(factsBox?.height ?? 100).toBeLessThanOrEqual(64);
      expect(browserBox?.width).toBe(362);
      expect(joinBox?.width).toBe(362);

      const create = page.getByRole('button', { name: /创建房间|新开一局/ }).first();
      const share = page.getByRole('button', { name: /分享游戏/ }).first();
      const heroTitle = hero.locator('h1');
      const description = hero.locator('h1 + p');
      const [
        createBox,
        shareBox,
        heroTitleBox,
        descriptionBox,
        heroColors,
      ] = await Promise.all([
        create.boundingBox(),
        share.boundingBox(),
        heroTitle.boundingBox(),
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
      expect(Math.abs((createBox?.x ?? 0) - (heroTitleBox?.x ?? 0)))
        .toBeLessThanOrEqual(1);
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
      const publicChoice = createDialog.getByRole('button', {
        name: /公开房间/,
      });
      const privateChoice = createDialog.getByRole('button', {
        name: /私密房间/,
      });
      await expect(publicChoice).toBeVisible();
      await expect(privateChoice).toBeVisible();
      const [dialogBox, publicBox, privateBox, choiceStyle] = await Promise.all([
        createDialog.boundingBox(),
        publicChoice.boundingBox(),
        privateChoice.boundingBox(),
        publicChoice.evaluate(element => {
          const style = getComputedStyle(element);
          const group = getComputedStyle(element.parentElement!);
          return {
            background: style.backgroundColor,
            borderStyle: style.borderStyle,
            borderWidth: style.borderWidth,
            columns: group.gridTemplateColumns.split(' ').filter(Boolean).length,
            display: group.display,
          };
        }),
      ]);
      expect(dialogBox).toMatchObject({ x: 0, width: 390 });
      expect(Math.abs(
        Math.round((dialogBox?.y ?? 0) + (dialogBox?.height ?? 0)) - 844,
      )).toBeLessThanOrEqual(4);
      expect(dialogBox?.height ?? 800).toBeLessThan(800);
      expect(publicBox?.height ?? 0).toBeGreaterThanOrEqual(110);
      expect(Math.abs(
        (privateBox?.height ?? 0) - (publicBox?.height ?? 0),
      )).toBeLessThanOrEqual(.1);
      expect(Math.abs(
        (privateBox?.y ?? 0) - (publicBox?.y ?? 0),
      )).toBeLessThanOrEqual(1);
      expect(choiceStyle).toEqual({
        background: expect.not.stringMatching(/^rgba\(0, 0, 0, 0\)$/),
        borderStyle: 'solid',
        borderWidth: '1px',
        columns: 2,
        display: 'grid',
      });
      const factList = createDialog.locator('dl').first();
      if (await factList.count()) {
        await expect(factList).toHaveCSS('display', 'grid');
        expect(await factList.evaluate(element =>
          getComputedStyle(element).gridTemplateColumns
            .split(' ').filter(Boolean).length)).toBe(2);
      }
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

    expect(eyebrowBox).toMatchObject({ width: 324, height: 9 });
    expect(titleBox).toMatchObject({ width: 324, height: 76.65625 });
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
      await expect(card.getByRole('heading', { name: room.roomID }))
        .toBeVisible();
      await expect(card.getByText('房主', { exact: true })).toHaveCount(0);
      const progress = card.getByRole('progressbar');
      const progressTotal = roomProgressTotals[item.gameType];
      await expect(progress).toHaveCount(progressTotal ? 1 : 0);
      if (progressTotal) {
        await expect(progress).toHaveAttribute(
          'aria-valuemax',
          String(progressTotal),
        );
      }
      const avatar = card.locator(`img[src="${ownerAvatarURL}"]`).first();
      await expect(avatar).toBeVisible();
      await expect.poll(() => avatar.evaluate(image =>
        image instanceof HTMLImageElement
        && image.complete
        && image.naturalWidth > 0)).toBe(true);

      await expectLobbyContentBaseline(page, card);
      await page.setViewportSize({ width: 320, height: 568 });
      await expectLobbyContentBaseline(page, card);
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
      const rankings = page.locator('[data-game-public-mobile="rankings"]');
      const rankPanel = page.locator('[data-game-mobile-rank-panel]');
      await expect(rankings).toBeVisible();
      await expect(page.getByRole('tablist', { name: '排行榜模式' }))
        .toBeVisible();
      const [rankHeroBox, rankPanelBox] = await Promise.all([
        rankHero.boundingBox(),
        rankPanel.boundingBox(),
      ]);
      expect(rankHeroBox?.width).toBe(362);
      expect(rankHeroBox?.height ?? 0).toBeGreaterThanOrEqual(130);
      expect(rankHeroBox?.height ?? 300).toBeLessThanOrEqual(180);
      expect(rankPanelBox?.width).toBe(362);
      expect(rankPanelBox?.y).toBe(
        (rankHeroBox?.y ?? 0) + (rankHeroBox?.height ?? 0) + 14,
      );

      const [rankIntroStyle, rankListStyle] = await rankings
        .locator(':scope > section').evaluateAll(sections =>
          sections.map(section => {
            const style = getComputedStyle(section);
            return {
              background: style.backgroundColor,
              borderTop: style.borderTopWidth,
              borderRight: style.borderRightWidth,
              radius: style.borderRadius,
              shadow: style.boxShadow,
            };
          }));
      expect(rankIntroStyle).toEqual({
        background: 'rgba(0, 0, 0, 0)',
        borderTop: '0px',
        borderRight: '0px',
        radius: '0px',
        shadow: 'none',
      });
      expect(rankListStyle).toEqual({
        background: 'rgba(0, 0, 0, 0)',
        borderTop: '0px',
        borderRight: '0px',
        radius: '0px',
        shadow: 'none',
      });
      await expectStickySectionHeader(rankPanel, 'rankings');

      await page.goto(`/game/${item.gameType}/guide`, {
        waitUntil: 'domcontentloaded',
      });
      const guideVisual = page.locator('[data-game-mobile-guide-visual]');
      const guideMedia = page.locator('[data-game-mobile-guide-media]');
      const guidePanel = page.locator('[data-game-mobile-guide-panel]');
      await expect(page.locator('[data-game-public-mobile="guide"]'))
        .toBeVisible();
      const guideTabs = page.getByRole('tablist', { name: '玩法章节' })
        .getByRole('tab');
      await expect(guideTabs.first()).toBeVisible();
      const [visualBox, panelBox] = await Promise.all([
        guideVisual.boundingBox(),
        guidePanel.boundingBox(),
      ]);
      expect(visualBox?.width).toBe(362);
      expect(panelBox?.width).toBe(362);
      expect(panelBox?.y).toBe(
        (visualBox?.y ?? 0) + (visualBox?.height ?? 0) + 14,
      );
      await expectMobileBottomGutter(
        page,
        '[data-game-public-mobile="guide"]',
        item.mobileNavigation,
      );

      for (let chapter = 0; chapter < await guideTabs.count(); chapter += 1) {
        await guideTabs.nth(chapter).click();
        await expectGuideActionsContained(page);
        const mediaGeometry = await guideMedia.evaluate(element => {
          const media = element.getBoundingClientRect();
          return {
            width: media.width,
            height: media.height,
            overflow: getComputedStyle(element).overflow,
            children: [...element.children].map(child => {
              const box = child.getBoundingClientRect();
              return {
                top: box.top - media.top,
                right: box.right - media.right,
                bottom: box.bottom - media.bottom,
                left: box.left - media.left,
                width: box.width,
                height: box.height,
              };
            }).filter(child => child.width > 0 && child.height > 0),
          };
        });
        expect(mediaGeometry.width).toBe(360);
        expect(mediaGeometry.overflow).toBe('hidden');
        expect(mediaGeometry.height).toBeGreaterThanOrEqual(50);
        expect(mediaGeometry.height).toBeLessThanOrEqual(125);
        expect(mediaGeometry.children.length).toBeGreaterThan(0);
        for (const child of mediaGeometry.children) {
          expect(child.top).toBeGreaterThanOrEqual(-1);
          expect(child.left).toBeGreaterThanOrEqual(-1);
          expect(child.right).toBeLessThanOrEqual(1);
          expect(child.bottom).toBeLessThanOrEqual(1);
        }
        if (item.gameType === 'warchest') {
          const troop = guideMedia.locator('.mobile-guide-unit .troop-art');
          await expect(troop).toBeVisible();
          const troopBox = await troop.boundingBox();
          expect(troopBox?.width ?? 0).toBeGreaterThan(0);
          expect(troopBox?.width ?? 100).toBeLessThanOrEqual(80);
          expect(Math.abs((troopBox?.height ?? 0) - mediaGeometry.height))
            .toBeLessThanOrEqual(1);
        }
      }

      await page.goto(`/game/${item.gameType}/me`, {
        waitUntil: 'domcontentloaded',
      });
      const profile = page.locator('[data-game-public-mobile="profile"]');
      await expect(profile).toBeVisible();
      await expect(page.getByText('mobile@example.com')).toBeVisible();
      await expect(page.getByText('PLAYER ID · mobile-profile'))
        .not.toBeVisible();
      await expect(page.getByRole('link', { name: /编辑资料/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /退出登录/ }))
        .toHaveCount(0);
      await expect(page.getByText('已经到底了')).toHaveCount(0);
      await expect(page.getByText(/加载更多/)).toHaveCount(0);
      await expect(page.locator('[data-game-mobile-about-entry]')).toHaveCount(0);
      const identityGeometry = await profile.locator(':scope > section')
        .nth(0).locator(':scope > div').first().evaluate(element => {
          const [copy, avatar] = [...element.children];
          const name = copy.querySelector('h1')!;
          const email = copy.querySelector<HTMLElement>(
            '[data-game-profile-email]',
          )!;
          const eyebrow = copy.querySelector<HTMLElement>('small')!;
          const playerID = [...copy.querySelectorAll<HTMLElement>('span')]
            .find(item => item !== email)!;
          const avatarBox = avatar.getBoundingClientRect();
          const nameBox = name.getBoundingClientRect();
          const emailBox = email.getBoundingClientRect();
          return {
            avatar: { width: avatarBox.width, height: avatarBox.height },
            nameX: nameBox.x,
            emailX: emailBox.x,
            nameFont: getComputedStyle(name).fontSize,
            emailFont: getComputedStyle(email).fontSize,
            eyebrowDisplay: getComputedStyle(eyebrow).display,
            playerIDDisplay: getComputedStyle(playerID).display,
          };
        });
      expect(identityGeometry.avatar).toEqual({ width: 76, height: 76 });
      expect(Math.abs(identityGeometry.nameX - identityGeometry.emailX))
        .toBeLessThanOrEqual(1);
      expect(identityGeometry).toMatchObject({
        nameFont: '32px',
        emailFont: '11px',
        eyebrowDisplay: 'block',
        playerIDDisplay: 'none',
      });
      const statDividers = await profile.locator(':scope > section').nth(0)
        .evaluate(card => {
          const stats = card.children[1] as HTMLElement;
          return {
            statsTop: getComputedStyle(stats).borderTopWidth,
            statsColumns: [...stats.children].slice(1).map(item =>
              getComputedStyle(item).borderLeftWidth),
          };
        });
      expect(statDividers).toEqual({
        statsTop: '0px',
        statsColumns: ['0px', '0px'],
      });
      const [profileCardBox, profileHistoryBox] = await Promise.all([
        profile.locator(':scope > section').nth(0).boundingBox(),
        profile.locator(':scope > section').nth(1).boundingBox(),
      ]);
      expect(profileCardBox).not.toBeNull();
      expect(profileHistoryBox).not.toBeNull();
      expect(Math.abs(
        (profileHistoryBox?.y ?? 0)
        - ((profileCardBox?.y ?? 0) + (profileCardBox?.height ?? 0))
        - 14,
      )).toBeLessThanOrEqual(1);
      const [identityStyle, historyStyle] = await profile
        .locator(':scope > section').evaluateAll(sections =>
          sections.map(section => {
            const style = getComputedStyle(section);
            return {
              background: style.backgroundColor,
              borderTop: style.borderTopWidth,
              borderRight: style.borderRightWidth,
              radius: style.borderRadius,
              shadow: style.boxShadow,
            };
          }));
      expect(identityStyle).toEqual({
        background: 'rgba(0, 0, 0, 0)',
        borderTop: '0px',
        borderRight: '0px',
        radius: '0px',
        shadow: 'none',
      });
      expect(historyStyle).toEqual({
        background: 'rgba(0, 0, 0, 0)',
        borderTop: '0px',
        borderRight: '0px',
        radius: '0px',
        shadow: 'none',
      });
      await expectStickySectionHeader(
        profile.locator(':scope > section').nth(1),
        'profile',
      );
      await expectMobileBottomGutter(
        page,
        '[data-game-public-mobile="profile"]',
        item.mobileNavigation,
      );
      await expectMobileShell(page, item.mobileNavigation);
      await expectNoOverflow(page);
    });
}

test('recent game titles use room numbers instead of room or opponent names',
  async ({ page }) => {
    await mockData(page, 'davinci');
    await page.unroute('**/pam-api/platform/history/games?**');
    await page.route('**/pam-api/platform/history/games?**', route => {
      const gameType = new URL(route.request().url()).searchParams
        .get('gameType') as GameType;
      const roomID = `${gameType}-history-room`;
      return route.fulfill({
        json: {
          status_code: 0,
          message: 'ok',
          data: {
            games: [{
              id: `${gameType}-history-game`,
              roomID,
              gameType,
              startedAt: '2026-10-29T12:20:44Z',
              endedAt: '2026-10-29T12:26:44Z',
              durationSeconds: 360,
              maxPlayers: 2,
              createdAt: '2026-10-29T12:20:44Z',
              updatedAt: '2026-10-29T12:26:44Z',
              players: [{
                id: `${gameType}-self`,
                gameID: `${gameType}-history-game`,
                userID: 'mobile-profile',
                playerID: 'mobile-profile',
                displayName: '移动端玩家',
                gameRole: 'fugitive',
                seatIndex: 0,
                isAI: false,
                finalScore: 3,
                finalStocks: 0,
                finalRank: 1,
                isWinner: true,
                createdAt: '2026-10-29T12:20:44Z',
              }, {
                id: `${gameType}-opponent`,
                gameID: `${gameType}-history-game`,
                playerID: `${gameType}-opponent`,
                displayName: '不应展示的对手昵称',
                seatIndex: 1,
                isAI: false,
                finalStocks: 0,
                finalRank: 2,
                isWinner: false,
                createdAt: '2026-10-29T12:20:44Z',
              }],
            }],
          },
        },
      });
    });

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      for (const gameType of roomTitleRegressionGames) {
        await page.goto(`/game/${gameType}/me`, {
          waitUntil: 'domcontentloaded',
        });
        await expect(page.getByText(
          `${gameType}-history-room`,
          { exact: true },
        ).first()).toBeVisible();
        await expect(page.getByText(
          '不应展示的自定义房间名',
          { exact: true },
        )).toHaveCount(0);
        await expect(page.getByText(
          '不应展示的对手昵称',
          { exact: true },
        )).toHaveCount(0);
      }
    }
  });

test('admin logout lives at the bottom of mobile history', async ({ page }) => {
  await mockData(page, 'othello');
  await page.unroute('**/pam-api/platform/auth/profile');
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: 'mobile-profile',
        display_name: '管理员',
        email: 'admin@example.com',
        avatar: '',
        roles: ['player', 'Admin'],
      },
    },
  }));
  await page.goto('/game/othello/me', { waitUntil: 'domcontentloaded' });

  const profile = page.locator('[data-game-public-mobile="profile"]');
  const history = profile.locator(':scope > section').nth(1);
  const logout = history.getByRole('button', { name: /退出登录/ });
  await expect(logout).toBeVisible();
  await expect(history.locator(':scope > :last-child')
    .getByRole('button', { name: /退出登录/ })).toBeVisible();

  await logout.click();
  await expect(page.getByRole('dialog')).toContainText('离开当前账号');
});

test('mobile profile loads later history pages without a footer control',
  async ({ page }) => {
    await mockData(page, 'othello');
    await page.unroute('**/pam-api/platform/history/games?**');
    const requestedOffsets: number[] = [];
    await page.route('**/pam-api/platform/history/games?**', route => {
      const url = new URL(route.request().url());
      const offset = Number(url.searchParams.get('offset') ?? 0);
      requestedOffsets.push(offset);
      const count = offset === 0 ? 20 : offset === 20 ? 1 : 0;
      return route.fulfill({
        json: {
          status_code: 0,
          message: 'ok',
          data: {
            games: Array.from({ length: count }, (_, index) => {
              const sequence = offset + index + 1;
              const id = `history-${sequence}`;
              return {
                id,
                roomID: `OTHELLO-${String(sequence).padStart(4, '0')}`,
                gameType: 'othello',
                startedAt: '2026-10-29T12:20:44Z',
                endedAt: '2026-10-29T12:26:44Z',
                durationSeconds: 360,
                maxPlayers: 2,
                createdAt: '2026-10-29T12:20:44Z',
                updatedAt: '2026-10-29T12:26:44Z',
                players: [{
                  id: `${id}-self`,
                  gameID: id,
                  userID: 'mobile-profile',
                  playerID: 'mobile-profile',
                  displayName: '移动端玩家',
                  seatIndex: 0,
                  isAI: false,
                  finalScore: 32,
                  finalRank: 1,
                  isWinner: true,
                  createdAt: '2026-10-29T12:20:44Z',
                }],
              };
            }),
          },
        },
      });
    });
    await page.goto('/game/othello/me', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('OTHELLO-0001')).toBeVisible();

    const profile = page.locator('[data-game-public-mobile="profile"]');
    await profile.evaluate(element => {
      element.scrollTop = element.scrollHeight;
    });
    await expect.poll(() => requestedOffsets.includes(20)).toBe(true);
    await expect(page.getByText('OTHELLO-0021')).toBeVisible();
    await expect(page.getByText(/加载更多|已经到底了/)).toHaveCount(0);
  });

test('Fugitive mobile profile matches the Acquire frame and typography',
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

    const profile = page.locator('[data-game-public-mobile="profile"]');
    const profileTypography = () => profile.evaluate(element => {
      const [card, history] = Array.from(element.children);
      const identity = card.children[0];
      const stats = card.children[1];
      const row = history.querySelector('a, button');
      const rowContent = row?.querySelector('span');
      const fontSize = (target: Element | null | undefined) =>
        target ? getComputedStyle(target).fontSize : '';
      return {
        name: fontSize(identity.querySelector('h1')),
        email: fontSize(identity.querySelector('[data-game-profile-email]')),
        statValue: fontSize(stats.querySelector('b')),
        statLabel: fontSize(stats.querySelector('small')),
        historyTitle: fontSize(history.querySelector('h2')),
        historyRow: fontSize(row),
        historyName: fontSize(rowContent?.querySelector('b')),
        historyDetail: fontSize(rowContent?.querySelector('small')),
      };
    });

    await page.goto('/game/acquire/me', { waitUntil: 'domcontentloaded' });
    await expect(profile).toBeVisible();
    const acquireTypography = await profileTypography();
    const acquireHistoryHeight = await profile.locator(':scope > section')
      .nth(1).evaluate(element => element.getBoundingClientRect().height);

    await page.goto('/game/fugitive/me', { waitUntil: 'domcontentloaded' });
    const navigation = page.getByRole('navigation', {
      name: 'Fugitive 手机导航',
    });
    await expect(profile).toBeVisible();
    await expect(page.getByRole('heading', { name: '追逃档案' })).toBeVisible();
    await expect(page.getByText('已经到底了')).toHaveCount(0);
    expect(await profileTypography()).toEqual(acquireTypography);
    await expect.poll(async () => Math.abs(
      await profile.locator(':scope > section').nth(1)
        .evaluate(element => element.getBoundingClientRect().height)
        - acquireHistoryHeight,
    )).toBeLessThanOrEqual(1);

    const [profileBox, navigationBox] = await Promise.all([
      profile.boundingBox(),
      navigation.boundingBox(),
    ]);
    expect(profileBox).toMatchObject({ x: 14, width: 362 });
    expect(Math.abs(
      (navigationBox?.y ?? 0)
      - ((profileBox?.y ?? 0) + (profileBox?.height ?? 0))
      - 14,
    )).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-game-mobile-about-entry]')).toHaveCount(0);
  });

test('War Chest mobile public shell keeps the shared dark palette and frame',
  async ({ page }) => {
    await mockData(page, 'warchest');
    for (const suffix of ['', '/rankings', '/guide', '/me']) {
      await page.goto(`/game/warchest${suffix}`, {
        waitUntil: 'domcontentloaded',
      });
      const palette = await page.locator('.warchest-root.app-shell')
        .evaluate(element => {
          const shell = getComputedStyle(element);
          const header = getComputedStyle(
            element.querySelector<HTMLElement>('[data-game-shell-header]')!,
          );
          const content = getComputedStyle(
            element.querySelector<HTMLElement>('.page')!,
          );
          return {
            background: shell.backgroundColor,
            color: shell.color,
            headerBackground: header.backgroundColor,
            contentPaddingLeft: content.paddingLeft,
            contentPaddingTop: content.paddingTop,
          };
        });
      expect(palette).toEqual({
        background: 'rgb(11, 24, 32)',
        color: 'rgb(236, 232, 220)',
        headerBackground: 'rgb(13, 28, 36)',
        contentPaddingLeft: '14px',
        contentPaddingTop: '14px',
      });
    }

    await expect(page.locator('[data-game-mobile-about-entry]')).toHaveCount(0);
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
