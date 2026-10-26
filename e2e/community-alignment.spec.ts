import { expect, test, type Page } from '@playwright/test';

type GameType =
  | 'acquire'
  | 'davinci'
  | 'splendor'
  | 'yinsh'
  | 'othello'
  | 'quoridor'
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
  { gameType: 'fugitive', searchPlaceholder: '搜索房间名称 / 房间号 / 房主', heading: '找一个对手，开一场追逐。', mobileNavigation: 'Fugitive 手机导航' },
  { gameType: 'warchest', searchPlaceholder: '搜索房间名称 / 房间号 / 房主', heading: '为下一场交锋，入席。', mobileNavigation: '战争之匣手机导航' },
];

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
    gameType: 'fugitive',
    title: {
      rankings: '城市风云榜',
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

async function mockCommunityData(page: Page, gameType: GameType) {
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
