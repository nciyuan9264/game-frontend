import { expect, test, type Page } from '@playwright/test';

const cases = [
  { gameType: 'acquire', loadingText: '正在连接在线大厅' },
  { gameType: 'davinci', loadingText: '正在同步密码桌与在线玩家' },
  { gameType: 'splendor', loadingText: '正在同步商会与在线收藏家' },
  { gameType: 'yinsh', loadingText: '正在同步棋室与在线棋手' },
  { gameType: 'othello', loadingText: '正在同步棋室与在线棋手' },
  { gameType: 'quoridor', loadingText: '正在同步棋室与在线棋手' },
  { gameType: 'hex', loadingText: '正在同步棋室与在线棋手' },
  { gameType: 'onitama', loadingText: '正在同步棋室与在线棋手' },
  { gameType: 'hive', loadingText: '正在同步棋室与在线棋手' },
  {
    gameType: 'loveletter',
    loadingText: '正在同步宫廷与在线玩家',
    accent: '.lucide-heart',
    dataGameLoading: 'loveletter',
  },
  {
    gameType: 'sixnimmt',
    loadingText: '正在同步牌桌与在线玩家',
    accent: '.lucide-layers',
    dataGameLoading: 'sixnimmt',
  },
  {
    gameType: 'cantstop',
    loadingText: '正在同步骰子、路线与在线玩家',
    accent: '.lucide-dices',
    dataGameLoading: 'cantstop',
  },
  { gameType: 'forsale', loadingText: '同步房间、玩家与牌桌状态' },
  { gameType: 'fugitive', loadingText: '正在同步追逃房间与在线玩家' },
  { gameType: 'warchest', loadingText: '正在同步战场与在线指挥官' },
] as const;

function deferred() {
  let release = () => {};
  const promise = new Promise<void>(resolve => {
    release = resolve;
  });
  return { promise, release };
}

async function holdLobbyData(page: Page) {
  const gate = deferred();
  await page.route('**/pam-api/platform/auth/profile', async route => {
    await gate.promise;
    await route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          user_id: 'loading-audit',
          display_name: '加载审计玩家',
          email: 'loading@example.com',
          avatar: '',
        },
      },
    });
  });
  await page.route('**/pam-api/platform/rooms?**', async route => {
    await gate.promise;
    await route.fulfill({
      json: { status_code: 0, message: 'ok', data: { rooms: [] } },
    });
  });
  await page.route('**/pam-api/platform/history/stats?**', route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          totalGames: 0,
          wins: 0,
          winRate: 0,
          avgScore: 0,
          gamesByRole: {},
          winsByRole: {},
        },
      },
    }));
  return gate.release;
}

async function failLobbyData(page: Page, failProfile = false) {
  await page.route('**/pam-api/platform/auth/profile', route =>
    failProfile
      ? route.fulfill({
        status: 500,
        json: { status_code: 500, message: 'profile unavailable', data: null },
      })
      : route.fulfill({
        json: {
          status_code: 0,
          message: 'ok',
          data: {
            user_id: 'error-audit',
            display_name: '错误态审计玩家',
            email: 'error@example.com',
            avatar: '',
          },
        },
      }));
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    status: 500,
    json: { status_code: 500, message: 'rooms unavailable', data: null },
  }));
  await page.route('**/pam-api/platform/history/stats?**', route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          totalGames: 0,
          wins: 0,
          winRate: 0,
          avgScore: 0,
          gamesByRole: {},
          winsByRole: {},
        },
      },
    }));
}

test.use({ viewport: { width: 390, height: 844 } });

for (const item of cases) {
  test(`${item.gameType} uses a branded mobile loading state`, async ({
    page,
  }, testInfo) => {
    const releaseLobbyData = await holdLobbyData(page);
    const loading = page.getByRole('status')
      .filter({ hasText: item.loadingText }).first();

    try {
      await page.goto(`/game/${item.gameType}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(loading).toBeVisible();
      await expect(loading.locator('svg, i, span').first()).toBeVisible();
      await expect(page.locator('.ant-spin, .lucide-loader-circle')).toHaveCount(0);

      if ('accent' in item) {
        await expect(loading.locator(item.accent)).toBeVisible();
      }
      if ('dataGameLoading' in item) {
        await expect(loading).toHaveAttribute(
          'data-game-loading',
          item.dataGameLoading,
        );
      }

      const layout = await loading.evaluate(element => {
        const box = element.getBoundingClientRect();
        return {
          bottom: box.bottom,
          left: box.left,
          right: box.right,
          top: box.top,
          documentFits: document.documentElement.scrollWidth
            <= window.innerWidth,
        };
      });
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.right).toBeLessThanOrEqual(390);
      expect(layout.top).toBeGreaterThanOrEqual(0);
      expect(layout.bottom).toBeLessThanOrEqual(844);
      expect(layout.documentFits).toBe(true);

      await page.screenshot({
        path: testInfo.outputPath(`${item.gameType}-loading-mobile.png`),
      });
    } finally {
      releaseLobbyData();
    }

    await expect(loading).toBeHidden();
  });

  test(`${item.gameType} uses a branded mobile lobby error state`,
    async ({ page }) => {
      await failLobbyData(page, item.gameType === 'acquire');
      await page.goto(`/game/${item.gameType}`, {
        waitUntil: 'domcontentloaded',
      });

      const error = page.locator('[data-game-mobile-error="lobby"]');
      await expect(error).toBeVisible();
      await expect(error.getByText('大厅暂时无法连接')).toBeVisible();
      await expect(error.locator('.lucide-cloud-off')).toBeVisible();
      await expect(error.getByRole('button', { name: /重试/ })).toBeVisible();
      await expect(page.getByText('还没有等待中的房间')).toHaveCount(0);

      const geometry = await error.evaluate(element => {
        const box = element.getBoundingClientRect();
        const source = element.querySelector('[role="alert"], .is-error')
          ?? element.lastElementChild?.firstElementChild;
        const sourceStyle = source && getComputedStyle(source);
        return {
          background: getComputedStyle(element).backgroundColor,
          bottom: box.bottom,
          left: box.left,
          right: box.right,
          sourceBackground: sourceStyle?.backgroundColor,
          sourceBorderTop: sourceStyle?.borderTopWidth,
          sourceFontSize: sourceStyle?.fontSize,
          top: box.top,
        };
      });
      expect(geometry.background).toBe('rgba(0, 0, 0, 0)');
      expect(geometry.sourceBackground).toBe('rgba(0, 0, 0, 0)');
      expect(geometry.sourceBorderTop).toBe('0px');
      expect(geometry.sourceFontSize).toBe('0px');
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(390);
      expect(geometry.top).toBeGreaterThanOrEqual(0);
      expect(geometry.bottom).toBeLessThanOrEqual(844);
    });
}
