import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function mockPublic(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: 'cantstop-mobile',
        display_name: '登山玩家',
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
      data: { totalGames: 6, wins: 2, winRate: 0.333, avgScore: 2.4 },
    },
  }));
}

const expectNoOverflow = async (page: Page) => {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
};

const capture = async (page: Page, info: TestInfo, name: string) =>
  page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });

test('Cant Stop mobile lobby uses the Acquire scale and spacing',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockPublic(page);
    await page.goto('/game/cantstop');
    await expect(page.getByRole('heading', { name: /再高一点/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /创建房间/ })).toBeVisible();
    const geometry = await page.evaluate(() => {
      const rect = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect();
      return {
        heroHeight: rect('.cs-hero')?.height ?? 0,
        factsHeight: rect('.cs-facts')?.height ?? 0,
        emptyHeight: rect('.cs-empty')?.height ?? 0,
        joinTop: rect('.cs-join-card')?.top ?? 0,
        navTop: rect('.cs-mobile-nav')?.top ?? window.innerHeight,
      };
    });
    expect(geometry.heroHeight).toBeLessThanOrEqual(195);
    expect(geometry.factsHeight).toBeLessThanOrEqual(56);
    expect(geometry.emptyHeight).toBeLessThanOrEqual(270);
    expect(geometry.joinTop).toBeLessThan(geometry.navTop);
    await expectNoOverflow(page);
    await capture(page, info, 'lobby-mobile');
  });
