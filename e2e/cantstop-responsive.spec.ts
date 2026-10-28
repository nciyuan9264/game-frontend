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
        contentPaddingLeft: getComputedStyle(document.querySelector('.cs-content')!)
          .paddingLeft,
        heroArt: rect('.cs-hero-art'),
        hero: rect('.cs-hero'),
        heroHeight: rect('.cs-hero')?.height ?? 0,
        facts: rect('.cs-facts'),
        factsHeight: rect('.cs-facts')?.height ?? 0,
        browser: rect('.cs-room-browser'),
        search: rect('.cs-room-tools label'),
        heading: rect('.cs-room-browser h2'),
        empty: rect('.cs-empty'),
        emptyHeight: rect('.cs-empty')?.height ?? 0,
        joinTop: rect('.cs-join-card')?.top ?? 0,
        navTop: rect('.cs-mobile-nav')?.top ?? window.innerHeight,
      };
    });
    expect(geometry.contentPaddingLeft).toBe('14px');
    expect(geometry.heroArt?.width ?? 0).toBeGreaterThan(190);
    expect(geometry.heroArt?.height ?? 0).toBeGreaterThan(190);
    expect(geometry.hero).toMatchObject({ x: 14, y: 72, width: 362, height: 227 });
    expect(geometry.facts).toMatchObject({ x: 14, y: 299, width: 362, height: 63 });
    expect(geometry.browser).toMatchObject({ x: 14, y: 381, width: 362 });
    expect(geometry.search).toMatchObject({ x: 14, width: 362, height: 39 });
    expect(geometry.heading).toMatchObject({ y: 395.59375, height: 25.59375 });
    expect(geometry.heroHeight).toBe(227);
    expect(geometry.factsHeight).toBe(63);
    expect(geometry.emptyHeight).toBe(340);
    expect(geometry.joinTop).toBeGreaterThanOrEqual(
      (geometry.empty?.y ?? 0) + (geometry.empty?.height ?? 0) + 12,
    );
    await expectNoOverflow(page);
    await capture(page, info, 'lobby-mobile');
  });
