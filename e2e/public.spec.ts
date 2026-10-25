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
  await expect.poll(async () => page.locator('img').evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).complete
      && (image as HTMLImageElement).naturalWidth > 0))).toBeTruthy();
  assertClean();
});

for (const [gameType, heading] of [
  ['acquire', '每一局，都算数。'],
  ['davinci', '每一次破解，都留下记录。'],
  ['splendor', '让每一次远见，都留下声望。'],
  ['yinsh', '每一次取环，都留下判断。'],
  ['othello', '每一次翻转，都留下判断。'],
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
