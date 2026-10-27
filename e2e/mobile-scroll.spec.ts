import { expect, test, type Page } from '@playwright/test';

const games = [
  { gameType: 'acquire', mobileNavigation: 'Acquire 手机导航' },
  { gameType: 'davinci', mobileNavigation: '达芬奇密码手机导航' },
  { gameType: 'splendor', mobileNavigation: '璀璨宝石手机导航' },
  { gameType: 'yinsh', mobileNavigation: 'YINSH 手机导航' },
  { gameType: 'othello', mobileNavigation: 'OTHELLO 手机导航' },
  { gameType: 'fugitive', mobileNavigation: 'Fugitive 手机导航' },
  { gameType: 'warchest', mobileNavigation: '战争之匣手机导航' },
  { gameType: 'loveletter', mobileNavigation: '掌心密信手机导航' },
  { gameType: 'forsale', mobileNavigation: 'For Sale 手机导航' },
] as const;

async function mockProfile(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: 'mobile-scroll-user',
        display_name: '移动端玩家',
        avatar: '',
      },
    },
  }));
}

for (const game of games) {
  test(`${game.gameType} shell scrolls on a short mobile viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 430 });
    await mockProfile(page);
    await page.goto(`/game/${game.gameType}/guide`, { waitUntil: 'domcontentloaded' });

    const mobileNavigation = page.getByRole('navigation', {
      name: game.mobileNavigation,
    });
    await expect(mobileNavigation).toBeVisible();

    const state = await mobileNavigation.evaluate(element => {
      let current: HTMLElement | null = element as HTMLElement;
      while (current) {
        const overflowY = getComputedStyle(current).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          current.scrollTop = current.scrollHeight;
          return {
            clientHeight: current.clientHeight,
            overflowY,
            scrollHeight: current.scrollHeight,
            scrollTop: current.scrollTop,
          };
        }
        current = current.parentElement;
      }
      return null;
    });

    expect(state, 'mobile navigation must live inside the game scroll shell').not.toBeNull();
    expect(state?.overflowY).toBe('auto');
    expect(state?.scrollHeight).toBeGreaterThan(state?.clientHeight ?? 0);
    expect(state?.scrollTop).toBeGreaterThan(0);
    await expect(mobileNavigation).toBeVisible();
  });
}
