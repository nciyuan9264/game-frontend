import { expect, test, type Page } from '@playwright/test';

const games = [
  ['acquire', 6],
  ['davinci', 2],
  ['splendor', 4],
  ['yinsh', 2],
  ['othello', 2],
  ['quoridor', 2],
  ['hex', 2],
  ['onitama', 2],
  ['hive', 2],
  ['loveletter', 6],
  ['sixnimmt', 10],
  ['cantstop', 4],
  ['forsale', 6],
  ['fugitive', 2],
  ['warchest', 2],
] as const;

const scenes = [
  ['lobby', '', '[data-game-public-mobile="lobby"]'],
  ['rankings', '/rankings', '[data-game-public-mobile="rankings"]'],
  ['guide', '/guide', '[data-game-public-mobile="guide"]'],
  ['profile', '/me', '[data-game-public-mobile="profile"]'],
  ['room-empty', '/match', '[data-game-room-mobile]'],
  ['room-ready', '/match', '[data-game-room-mobile]'],
  ['room-ai', '/match', '[data-game-room-mobile]'],
] as const;

function previewURL(game: string, scene: string, suffix: string) {
  const params = new URLSearchParams({
    __preview: '1',
    game,
    scene,
    controls: '0',
  });
  if (scene.startsWith('room-')) {
    params.set('roomID', `PREVIEW-${game.toUpperCase()}`);
  }
  const path = scene === 'result'
    ? '/__dev/acquire-result'
    : `/game/${game}${suffix}`;
  return `${path}?${params.toString()}`;
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectBottomAnchoredLeaveDialog(page: Page) {
  await page.getByRole('button', { name: '离开当前房间' }).click();
  const dialog = page.getByRole('dialog').last();
  await expect(dialog).toBeVisible();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  await expect.poll(async () => {
    const box = await dialog.boundingBox();
    return box
      ? Math.abs(box.y + box.height - viewport!.height)
      : Number.POSITIVE_INFINITY;
  }).toBeLessThanOrEqual(2);
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeLessThan(viewport!.height - 100);
}

test.use({ viewport: { width: 390, height: 844 } });

test('Acquire exposes its real final result preview', async ({ page }) => {
  await page.goto(previewURL('acquire', 'result', ''), {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('[data-game-final-result]')).toBeVisible();
  await expect(page.getByRole('heading', {
    name: '一城落定，好局未完。',
  })).toBeVisible();
  await expect(page.getByText('PREVIEW-ACQUIRE')).toBeVisible();
  const hero = await page.locator('[data-game-final-result-hero]')
    .boundingBox();
  expect(hero?.height ?? 0).toBeGreaterThan(100);
  await expectNoHorizontalOverflow(page);
});

for (const [game, maxPlayers] of games) {
  test(`${game} exposes every independent preview scene`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    for (const [scene, suffix, selector] of scenes) {
      errors.length = 0;
      await page.goto(previewURL(game, scene, suffix), {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator(selector)).toBeVisible();
      await expectNoHorizontalOverflow(page);
      expect(errors).toEqual([]);

      if (scene.startsWith('room-')) {
        const seats = page.locator('[data-game-mobile-room-seat]');
        const occupied = page.locator(
          '[data-game-mobile-room-seat][data-occupied="true"]',
        );
        await expect(seats).toHaveCount(maxPlayers);
        await expect(occupied).toHaveCount(scene === 'room-empty' ? 1 : 2);
        if (scene === 'room-ready') {
          await expectBottomAnchoredLeaveDialog(page);
        }
      }
    }
  });
}

test('the unified preview entry redirects and keeps its controls',
  async ({ page }) => {
    await page.goto('/__dev/game?game=fugitive&scene=guide');
    await expect(page).toHaveURL(/\/game\/fugitive\/guide\?/);
    await expect(page.locator('[data-game-public-mobile="guide"]')).toBeVisible();
    await expect(page.locator('[data-game-preview-controls]')).toBeVisible();
    const game = page.getByRole('combobox', { name: '预览游戏' });
    const scene = page.getByRole('combobox', { name: '预览场景' });
    await expect(game).toHaveValue('fugitive');
    await expect(scene).toHaveValue('guide');

    await game.selectOption('warchest');
    await expect(page).toHaveURL(/\/game\/warchest\/guide\?/);
    await expect(page.getByRole('combobox', { name: '预览游戏' }))
      .toHaveValue('warchest');

    await page.getByRole('combobox', { name: '预览场景' })
      .selectOption('room-ready');
    await expect(page).toHaveURL(/\/game\/warchest\/match\?/);
    await expect(page.locator('[data-game-room-mobile]')).toBeVisible();
  });

test('Acquire controls expose result without leaking it to other games',
  async ({ page }) => {
    await page.goto('/__dev/game?game=acquire&scene=result');
    await expect(page).toHaveURL(/\/__dev\/acquire-result\?/);
    await expect(page.locator('[data-game-final-result]')).toBeVisible();
    const scene = page.getByRole('combobox', { name: '预览场景' });
    await expect(scene.locator('option[value="result"]')).toHaveCount(1);

    await page.getByRole('combobox', { name: '预览游戏' })
      .selectOption('warchest');
    await expect(page).toHaveURL(/\/game\/warchest\?/);
    await expect(page.getByRole('combobox', { name: '预览场景' }))
      .toHaveValue('lobby');
    await expect(page.getByRole('combobox', { name: '预览场景' })
      .locator('option[value="result"]')).toHaveCount(0);
  });
