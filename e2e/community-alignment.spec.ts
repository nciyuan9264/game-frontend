import { expect, test, type Page } from '@playwright/test';

type GameType =
  | 'acquire'
  | 'davinci'
  | 'splendor'
  | 'yinsh'
  | 'othello'
  | 'quoridor'
  | 'hive'
  | 'fugitive'
  | 'warchest';

const lobbyCases: Array<{
  gameType: GameType;
  searchPlaceholder: string;
  heading: string;
  mobileNavigation: string;
}> = [
  { gameType: 'acquire', searchPlaceholder: '搜索房间号 / 房主', heading: '找到房间，一起开场。', mobileNavigation: 'Acquire 手机导航' },
  { gameType: 'davinci', searchPlaceholder: '搜索房间号 / 房主', heading: '选择一张密码桌', mobileNavigation: '达芬奇密码手机导航' },
  { gameType: 'splendor', searchPlaceholder: '搜索房间号 / 房主', heading: '好的一局，从入座开始。', mobileNavigation: '璀璨宝石手机导航' },
  { gameType: 'yinsh', searchPlaceholder: '搜索房间号 / 房主', heading: '挑一局，慢慢想。', mobileNavigation: 'YINSH 手机导航' },
  { gameType: 'othello', searchPlaceholder: '搜索房间号 / 房主', heading: '挑一局，慢慢想。', mobileNavigation: 'OTHELLO 手机导航' },
  { gameType: 'quoridor', searchPlaceholder: '搜索房间号 / 房主', heading: '挑一条路，慢慢走。', mobileNavigation: 'QUORIDOR 手机导航' },
  { gameType: 'hive', searchPlaceholder: '搜索房间号 / 房主', heading: '从一枚棋子，长成一片蜂巢。', mobileNavigation: 'HIVE 手机导航' },
  { gameType: 'fugitive', searchPlaceholder: '搜索房间号 / 房主', heading: '找一个对手，开一场追逐。', mobileNavigation: 'Fugitive 手机导航' },
  { gameType: 'warchest', searchPlaceholder: '搜索房间号 / 房主', heading: '为下一场交锋，入席。', mobileNavigation: '战争之匣手机导航' },
];

const acquireAlignedLobbyCases = [
  { gameType: 'splendor', heading: '好的一局，从入座开始。' },
  { gameType: 'warchest', heading: '为下一场交锋，入席。' },
  { gameType: 'fugitive', heading: '找一个对手，开一场追逐。' },
] as const;

const communityCases: Array<{
  gameType: GameType;
  title: {
    rankings: string;
    guide: string;
    profile: string;
  };
  mobileNavigation: string;
}> = [
  {
    gameType: 'acquire',
    title: {
      rankings: '每一局，都算数。',
      guide: '先懂一招，再赢一局。',
      profile: '让这张筹码，代表你。',
    },
    mobileNavigation: 'Acquire 手机导航',
  },
  {
    gameType: 'davinci',
    title: {
      rankings: '每一次破解，都留下记录。',
      guide: '四步，读懂一场密码对决。',
      profile: '身份、判断与每一场对决。',
    },
    mobileNavigation: '达芬奇密码手机导航',
  },
  {
    gameType: 'splendor',
    title: {
      rankings: '让每一次远见，都留下声望。',
      guide: '简单的规则，长远的眼光。',
      profile: '你的眼光，值得珍藏。',
    },
    mobileNavigation: '璀璨宝石手机导航',
  },
  {
    gameType: 'yinsh',
    title: {
      rankings: '每一次取环，都留下判断。',
      guide: '简单的规则，安静的较量。',
      profile: '你的每一步，都值得回看。',
    },
    mobileNavigation: 'YINSH 手机导航',
  },
  {
    gameType: 'othello',
    title: {
      rankings: '每一次翻转，都留下判断。',
      guide: '简单的规则，安静的较量。',
      profile: '你的每一步，都值得回看。',
    },
    mobileNavigation: 'OTHELLO 手机导航',
  },
  {
    gameType: 'quoridor',
    title: {
      rankings: '每一条路，都留下判断。',
      guide: '规则很短，路可以很长。',
      profile: '你的每一步，都值得回看。',
    },
    mobileNavigation: 'QUORIDOR 手机导航',
  },
  {
    gameType: 'hive',
    title: {
      rankings: '每一条路，都留下判断。',
      guide: '规则很短，蜂巢没有边界。',
      profile: '你的每一步，都值得回看。',
    },
    mobileNavigation: 'HIVE 手机导航',
  },
  {
    gameType: 'fugitive',
    title: {
      rankings: '每一场追逐，都留下痕迹。',
      guide: '读懂规则，藏好下一步。',
      profile: '每一场追逐，都有你的痕迹。',
    },
    mobileNavigation: 'Fugitive 手机导航',
  },
  {
    gameType: 'warchest',
    title: {
      rankings: '每一次调遣，都留下判断。',
      guide: '懂得规则，才懂得破局。',
      profile: '每一步，都留下回响。',
    },
    mobileNavigation: '战争之匣手机导航',
  },
];

function metric(gameType: GameType, index: number) {
  if (gameType === 'acquire' || gameType === 'splendor') {
    return { rank: { avgRank: 1 + index / 10 } };
  }
  return {
    [gameType]: {
      wins: 8 - index,
      winRate: .6 - index * .05,
    },
  };
}

async function mockCommunityData(
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

function ownerIdentityRoom(gameType: GameType) {
  const roomID = `${gameType}_owner_identity`;
  return {
    roomID,
    gameType,
    status: 'match',
    visibility: 'public',
    ownerUserID: '220',
    ownerPlayerID: 'owner-220',
    maxPlayers: gameType === 'acquire' ? 6
      : gameType === 'davinci' || gameType === 'splendor' ? 4 : 2,
    playerCount: 2,
    currentMatchID: `${roomID}-r1`,
    currentMatchStatus: 'preparing',
    nextRoundNo: 1,
    createdAt: '2026-10-26T00:00:00Z',
    updatedAt: '2026-10-26T00:00:00Z',
    displayName: gameType === 'fugitive' ? '午夜追缉'
      : gameType === 'warchest' ? '雾谷前哨' : undefined,
    turnTimeoutSeconds: gameType === 'warchest' ? 90
      : gameType === 'hive' ? 120 : 60,
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
      acquire: { emptyTileCount: 108, progressCurrent: 0, progressTotal: 108 },
      davinci: { boardCardCount: 26, progressCurrent: 0, progressTotal: 26 },
      splendor: { maxScore: 0, progressCurrent: 0, progressTotal: 15 },
      yinsh: { ringsRemoved: 0, progressCurrent: 0, progressTotal: 3 },
      othello: { occupiedCount: 4, progressCurrent: 0, progressTotal: 60 },
      fugitive: {
        highestRevealed: 0,
        hiddenHideoutCount: 0,
        progressCurrent: 0,
        progressTotal: 42,
      },
      warchest: { maxControlledLocations: 0, progressCurrent: 0, progressTotal: 6 },
      quoridor: { turnCount: 0 },
      hive: {
        turnCount: 0,
        placedPieceCount: 0,
        progressCurrent: 0,
        progressTotal: 6,
      },
    },
  };
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectAcquireMobileGeometry(page: Page, mobileNavigation: string) {
  const banner = page.getByRole('banner');
  const navigation = page.getByRole('navigation', { name: mobileNavigation });
  const main = page.getByRole('main').first();
  const [bannerBox, navigationBox, mainBox, padding] = await Promise.all([
    banner.boundingBox(),
    navigation.boundingBox(),
    main.boundingBox(),
    main.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        left: style.paddingLeft,
        right: style.paddingRight,
      };
    }),
  ]);
  expect(bannerBox).toMatchObject({ width: 390, height: 57 });
  expect(navigationBox).toMatchObject({ y: 778, width: 390, height: 66 });
  expect(mainBox).toMatchObject({ x: 0, width: 390 });
  expect(padding).toEqual({ left: '14px', right: '14px' });
}

for (const item of lobbyCases) {
  test(`${item.gameType} lobby exposes aligned share and room entry copy`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCommunityData(page, item.gameType);
    await page.goto(`/game/${item.gameType}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByPlaceholder(item.searchPlaceholder)).toBeVisible();
    await expectAcquireMobileGeometry(page, item.mobileNavigation);
    const createButton = page.getByRole('button', { name: /创建房间|新开一局/ }).first();
    const shareButton = page.getByRole('button', { name: /分享游戏/ }).first();
    const [createBox, shareBox] = await Promise.all([
      createButton.boundingBox(),
      shareButton.boundingBox(),
    ]);
    expect(createBox).toMatchObject({ width: 129, height: 39 });
    expect(shareBox).toMatchObject({ width: 99, height: 39 });
    expect(createBox?.y).toBe(shareBox?.y);
    if (item.gameType === 'splendor') {
      const heroBox = await page.getByTestId('splendor-lobby-hero').boundingBox();
      expect((heroBox?.y ?? 0) + (heroBox?.height ?? 0)
        - ((createBox?.y ?? 0) + (createBox?.height ?? 0))).toBeGreaterThanOrEqual(7);
    }
    const heading = page.getByRole('heading', { name: item.heading });
    await expect(heading).toHaveCSS('font-size', '16px');
    await expect(heading).toHaveCSS('line-height', '25.6px');
    await page.getByRole('button', { name: /分享游戏/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('游戏地址')).toBeVisible();
    await expect(dialog.getByRole('button', { name: /复制游戏链接/ })).toBeVisible();
    await dialog.getByRole('button', { name: '关闭', exact: true }).click();

    const directRoomInput = page.locator('input[placeholder="输入完整房间号"]:visible');
    if (!await directRoomInput.count()) {
      await page.getByRole('button', { name: /房间号加入/ }).click();
    }
    await expect(page.locator('input[placeholder="输入完整房间号"]:visible')).toBeVisible();
    await expectNoOverflow(page);
  });
}

for (const item of acquireAlignedLobbyCases) {
  test(`${item.gameType} lobby matches the Acquire mobile and desktop structure`, async ({ page }) => {
    await mockCommunityData(page, item.gameType);
    const hero = page.getByTestId(`${item.gameType}-lobby-hero`);
    const facts = page.getByTestId(`${item.gameType}-lobby-facts`);
    const browser = page.getByTestId(`${item.gameType}-lobby-browser`);
    const aside = page.getByTestId(`${item.gameType}-lobby-aside`);
    const mobileJoin = page.getByTestId(`${item.gameType}-lobby-mobile-join`);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/game/${item.gameType}`, { waitUntil: 'domcontentloaded' });
    const search = page.getByPlaceholder('搜索房间号 / 房主');
    const heading = page.getByRole('heading', { name: item.heading });
    const [heroBox, factsBox, browserBox, joinBox, searchBox, headingBox] = await Promise.all([
      hero.boundingBox(),
      facts.boundingBox(),
      browser.boundingBox(),
      mobileJoin.boundingBox(),
      search.locator('..').boundingBox(),
      heading.boundingBox(),
    ]);
    expect(heroBox).toMatchObject({ x: 14, y: 72, width: 362, height: 227 });
    expect(factsBox).toMatchObject({ x: 14, y: 299, width: 362, height: 63 });
    expect(browserBox).toMatchObject({ x: 14, y: 381, width: 362 });
    expect(searchBox).toMatchObject({ x: 14, width: 362, height: 39 });
    expect(headingBox).toMatchObject({ y: 395, height: 25.59375 });
    expect(joinBox).toMatchObject({ x: 14, width: 362 });
    expect(joinBox?.y).toBeGreaterThanOrEqual(
      (browserBox?.y ?? 0) + (browserBox?.height ?? 0) + 12,
    );
    await expect(aside).toBeHidden();
    await expectNoOverflow(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/game/${item.gameType}`, { waitUntil: 'domcontentloaded' });
    const [desktopHeroBox, desktopBrowserBox, desktopAsideBox] = await Promise.all([
      hero.boundingBox(),
      browser.boundingBox(),
      aside.boundingBox(),
    ]);
    expect(desktopHeroBox?.height).toBe(252);
    expect(desktopBrowserBox?.x).toBeLessThan(desktopAsideBox?.x ?? 0);
    expect(desktopAsideBox?.width).toBe(302);
    await expect(mobileJoin).toBeHidden();
    await expectNoOverflow(page);
  });
}

test('fugitive lobby removes content outside the Acquire hierarchy', async ({ page }) => {
  await mockCommunityData(page, 'fugitive');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/game/fugitive', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('做逃亡者', { exact: true })).toHaveCount(0);
  await expect(page.getByText('做追捕者', { exact: true })).toHaveCount(0);
  await expect(page.getByText('完整牌库', { exact: true })).toHaveCount(0);
  await expect(page.getByText('城市风云榜', { exact: true })).toHaveCount(0);
});

for (const item of lobbyCases) {
  test(`${item.gameType} lobby card binds the real owner name and avatar`, async ({ page }) => {
    const room = ownerIdentityRoom(item.gameType);
    await page.route('**/test-owner-avatar.png', route => route.fulfill({
      body: avatarPNG,
      contentType: 'image/png',
    }));
    await mockCommunityData(page, item.gameType, [room]);

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`/game/${item.gameType}`, { waitUntil: 'domcontentloaded' });

      const card = page.locator('article').filter({ hasText: room.roomID }).first();
      const ownerAvatar = card.locator(`img[src="${ownerAvatarURL}"]`).first();
      await expect(card.getByText('真实房主', { exact: false }).first()).toBeVisible();
      await expect(ownerAvatar).toBeVisible();
      await expect.poll(() => ownerAvatar.evaluate(image =>
        image instanceof HTMLImageElement
        && image.complete
        && image.naturalWidth > 0)).toBe(true);
      const avatarBox = await ownerAvatar.boundingBox();
      expect(avatarBox?.width).toBeGreaterThanOrEqual(20);
      expect(avatarBox?.height).toBeGreaterThanOrEqual(20);
      await expectNoOverflow(page);
    }
  });
}

for (const item of communityCases) {
  test(`${item.gameType} mobile community pages follow the Acquire hierarchy`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCommunityData(page, item.gameType);

    await page.goto(`/game/${item.gameType}/rankings`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(item.title.rankings, { exact: true })).toBeHidden();
    await expect(page.getByRole('tablist', { name: '排行榜模式' })).toBeVisible();
    await expectAcquireMobileGeometry(page, item.mobileNavigation);
    await expect(page.locator('[class*="podium"], [aria-label="排行榜前三名"]')).toHaveCount(0);
    await expectNoOverflow(page);

    await page.goto(`/game/${item.gameType}/guide`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(item.title.guide, { exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: /下一步/ })).toBeVisible();
    await expectAcquireMobileGeometry(page, item.mobileNavigation);
    const guideLayout = page.locator('[class*="guideLayout"], .guide-layout').first();
    const [guideBox, navigationBox] = await Promise.all([
      guideLayout.boundingBox(),
      page.getByRole('navigation', { name: item.mobileNavigation }).boundingBox(),
    ]);
    expect((guideBox?.y ?? 0) + (guideBox?.height ?? 0))
      .toBeLessThanOrEqual(navigationBox?.y ?? 0);
    await expectNoOverflow(page);

    await page.goto(`/game/${item.gameType}/me`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(item.title.profile, { exact: true })).toBeHidden();
    await expectAcquireMobileGeometry(page, item.mobileNavigation);
    const about = page.getByTestId(`${item.gameType}-about-entry`);
    const navigation = page.getByRole('navigation', { name: item.mobileNavigation });
    await expect(about).toBeVisible();
    await expect(page.getByText('PLAYER ID · mobile-profile')).toBeVisible();
    await expect(page.getByRole('link', { name: /编辑资料/ })).toBeVisible();
    if (item.gameType === 'fugitive') {
      await expect(page.getByText('显示偏好', { exact: true })).toHaveCount(0);
    }

    await expect.poll(async () => {
      await navigation.evaluate(element => {
        let current: HTMLElement | null = element as HTMLElement;
        while (current) {
          const overflowY = getComputedStyle(current).overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') {
            current.scrollTop = current.scrollHeight;
            return;
          }
          current = current.parentElement;
        }
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      const [aboutBox, navigationBox] = await Promise.all([
        about.boundingBox(),
        navigation.boundingBox(),
      ]);
      return Math.abs((navigationBox?.y ?? 0)
        - ((aboutBox?.y ?? 0) + (aboutBox?.height ?? 0)));
    }).toBeLessThanOrEqual(12);
    await expectNoOverflow(page);
  });
}

test('fugitive rankings and guide use the Acquire content hierarchy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockCommunityData(page, 'fugitive');

  await page.goto('/game/fugitive/rankings', { waitUntil: 'domcontentloaded' });
  const rankHero = page.getByTestId('fugitive-rank-hero');
  const rankPanel = page.getByTestId('fugitive-rank-panel');
  const [rankHeroBox, rankPanelBox] = await Promise.all([
    rankHero.boundingBox(),
    rankPanel.boundingBox(),
  ]);
  expect(rankHeroBox).toMatchObject({ x: 14, y: 72, width: 362, height: 166 });
  expect(rankPanelBox).toMatchObject({ x: 14, width: 362 });
  expect(rankPanelBox?.y).toBe((rankHeroBox?.y ?? 0) + (rankHeroBox?.height ?? 0) + 18);
  const roleSelect = page.getByRole('combobox', { name: '排行榜身份' });
  await expect(roleSelect).toBeVisible();
  await expect(roleSelect).toHaveAttribute('aria-expanded', 'false');
  await roleSelect.click();
  await expect(roleSelect).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('option', { name: '逃亡榜' }).click();
  await expect(roleSelect).toContainText('逃亡榜');
  await expect(roleSelect).toHaveAttribute('aria-expanded', 'false');
  await roleSelect.press('ArrowDown');
  await roleSelect.press('ArrowDown');
  await roleSelect.press('Enter');
  await expect(roleSelect).toContainText('追捕榜');
  await expect(roleSelect).toHaveAttribute('aria-expanded', 'false');

  await page.goto('/game/fugitive/guide', { waitUntil: 'domcontentloaded' });
  const guideSummary = page.getByTestId('fugitive-guide-summary');
  const guidePanel = page.getByTestId('fugitive-guide-panel');
  await expect.poll(() => guideSummary.boundingBox()).toMatchObject({
    x: 14,
    y: 72,
    width: 362,
    height: 173,
  });
  const [guideSummaryBox, guidePanelBox, navigationBox] = await Promise.all([
    guideSummary.boundingBox(),
    guidePanel.boundingBox(),
    page.getByRole('navigation', { name: 'Fugitive 手机导航' }).boundingBox(),
  ]);
  expect(guidePanelBox).toMatchObject({ x: 14, width: 362 });
  expect(guidePanelBox?.y)
    .toBe((guideSummaryBox?.y ?? 0) + (guideSummaryBox?.height ?? 0) + 8);
  expect((guidePanelBox?.y ?? 0) + (guidePanelBox?.height ?? 0))
    .toBeLessThanOrEqual(navigationBox?.y ?? 0);
  await expect(page.getByRole('tablist', { name: '玩法章节' }))
    .toBeVisible();
  await expectNoOverflow(page);
});

test('davinci mobile profile keeps the Acquire card geometry on narrow screens', async ({ page }) => {
  await mockCommunityData(page, 'davinci');
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 356, height: 783 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/game/davinci/me', { waitUntil: 'domcontentloaded' });

    const card = page.getByTestId('davinci-profile-card');
    const identity = page.getByTestId('davinci-profile-identity');
    const history = page.getByTestId('davinci-profile-history');
    const about = page.getByTestId('davinci-about-entry');
    const avatar = identity.locator(':scope > span').first();
    const playerName = identity.getByRole('heading', { name: '移动端玩家' });
    await expect(card).toBeVisible();
    await expect(history).toBeVisible();
    await expect(about).toBeVisible();

    const [
      cardBox,
      historyBox,
      aboutBox,
      avatarBox,
      playerNameBox,
    ] = await Promise.all([
      card.boundingBox(),
      history.boundingBox(),
      about.boundingBox(),
      avatar.boundingBox(),
      playerName.boundingBox(),
    ]);
    expect(cardBox).not.toBeNull();
    expect(historyBox).not.toBeNull();
    expect(aboutBox).not.toBeNull();
    expect(avatarBox).not.toBeNull();
    expect(playerNameBox).not.toBeNull();
    expect(Math.abs((cardBox?.x ?? 0) - (historyBox?.x ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((cardBox?.width ?? 0) - (historyBox?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((cardBox?.x ?? 0) - (aboutBox?.x ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((cardBox?.width ?? 0) - (aboutBox?.width ?? 0))).toBeLessThanOrEqual(1);
    expect((avatarBox?.x ?? 0) + (avatarBox?.width ?? 0)).toBeLessThan(playerNameBox?.x ?? 0);
    expect(Math.abs(
      (avatarBox?.y ?? 0) + (avatarBox?.height ?? 0) / 2
      - ((playerNameBox?.y ?? 0) + (playerNameBox?.height ?? 0) / 2),
    )).toBeLessThanOrEqual(20);
    await expectNoOverflow(page);
  }
});
