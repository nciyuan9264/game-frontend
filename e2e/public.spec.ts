import { expect, test } from '@playwright/test';
import { installAccessToken, observePage } from './helpers';

test('home and static assets render without browser or server errors', async ({ page }) => {
  const assertClean = observePage(page);
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByText('Acquire', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('达芬奇密码', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('璀璨宝石', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('圈套棋', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('黑白棋', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('连边棋', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('逃亡者', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('战争之匣', { exact: false }).first()).toBeVisible();
  await expect.poll(async () => page.locator('img').evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).complete
      && (image as HTMLImageElement).naturalWidth > 0))).toBeTruthy();
  assertClean();
});

test('home game catalog remains usable on a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const categories = page.locator('[aria-label="游戏分类"]');
  const catalog = page.locator('[aria-label="游戏目录"]');
  await expect(categories).toBeVisible();
  await expect(categories.getByRole('button')).toHaveCount(6);
  await expect(catalog).toBeVisible();
  await expect(catalog.getByRole('button', { name: /^预览/ })).toHaveCount(9);
  await categories.scrollIntoViewIfNeeded();

  const layout = await categories.evaluate((element, gameCatalog) => {
    const firstCard = gameCatalog.querySelector('article');
    const categoryButtons = [...element.querySelectorAll('button')];
    const firstTop = categoryButtons[0]?.getBoundingClientRect().top ?? 0;
    const pageScroller = document.querySelector('main')?.parentElement;
    return {
      categoriesSingleLine: categoryButtons.every(button =>
        Math.abs(button.getBoundingClientRect().top - firstTop) <= 1),
      cardFitsViewport: (firstCard?.getBoundingClientRect().width ?? 0)
        <= window.innerWidth,
      pageHasNoHorizontalOverflow:
        document.documentElement.scrollWidth <= window.innerWidth,
      pageScrollable: !!pageScroller
        && pageScroller.scrollHeight > pageScroller.clientHeight,
    };
  }, await catalog.elementHandle());

  expect(layout.categoriesSingleLine).toBe(true);
  expect(layout.cardFitsViewport).toBe(true);
  expect(layout.pageHasNoHorizontalOverflow).toBe(true);
  expect(layout.pageScrollable).toBe(true);

  const hexCard = catalog.getByRole('button', { name: '预览连边棋' });
  await hexCard.scrollIntoViewIfNeeded();
  await expect(hexCard).toBeVisible();
  const fugitiveCard = catalog.getByRole('button', { name: '预览逃亡者' });
  await fugitiveCard.scrollIntoViewIfNeeded();
  await expect(fugitiveCard).toBeVisible();
});

for (const [gameType, heading] of [
  ['acquire', '每一局，都算数。'],
  ['davinci', '每一次破解，都留下记录。'],
  ['splendor', '让每一次远见，都留下声望。'],
  ['yinsh', '每一次取环，都留下判断。'],
  ['othello', '每一次翻转，都留下判断。'],
  ['fugitive', '城市风云榜'],
  ['warchest', '每一次调遣，都留下判断。'],
] as const) {
  test(`${gameType} ranking page renders`, async ({ context, page }) => {
    test.skip(!process.env.REGRESSION_ACCESS_TOKEN, 'authenticated profile cookie is required');
    await installAccessToken(context);
    const assertClean = observePage(page);
    const response = await page.goto(`/game/${gameType}/rankings`, {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.getByRole('tablist', { name: '排行榜模式' })).toBeVisible();
    assertClean();
  });
}
