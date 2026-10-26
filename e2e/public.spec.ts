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
  await expect(page.getByText('逃亡者', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('战争之匣', { exact: false }).first()).toBeVisible();
  await expect.poll(async () => page.locator('img').evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).complete
      && (image as HTMLImageElement).naturalWidth > 0))).toBeTruthy();
  assertClean();
});

test('home game switcher remains usable on a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const switcher = page.locator('[aria-label="选择游戏"]');
  await expect(switcher).toBeVisible();
  expect(await switcher.locator('button').count()).toBeGreaterThanOrEqual(6);

  const layout = await switcher.evaluate(element => {
    const content = element.nextElementSibling;
    const firstTab = element.querySelector('button');
    const title = firstTab?.querySelector('span > span');
    return {
      switcherTop: element.getBoundingClientRect().top,
      switcherScrollable: element.scrollWidth > element.clientWidth,
      firstTabWidth: firstTab?.getBoundingClientRect().width ?? 0,
      titleSingleLine: !!title && getComputedStyle(title).whiteSpace === 'nowrap'
        && title.scrollHeight <= title.clientHeight,
      contentScrollable: !!content && content.scrollHeight > content.clientHeight,
    };
  });

  expect(layout.switcherTop).toBeGreaterThanOrEqual(0);
  expect(layout.switcherScrollable).toBe(true);
  expect(layout.firstTabWidth).toBeGreaterThanOrEqual(100);
  expect(layout.titleSingleLine).toBe(true);
  expect(layout.contentScrollable).toBe(true);

  const othelloTab = switcher.getByRole('button', { name: /黑白棋/ });
  await othelloTab.scrollIntoViewIfNeeded();
  await expect(othelloTab).toBeVisible();
  const fugitiveTab = switcher.getByRole('button', { name: /逃亡者/ });
  await fugitiveTab.scrollIntoViewIfNeeded();
  await expect(fugitiveTab).toBeVisible();
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
