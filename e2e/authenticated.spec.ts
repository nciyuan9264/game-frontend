import { expect, test } from '@playwright/test';
import { installAccessToken, observePage } from './helpers';

const games = [
  {
    gameType: 'acquire',
    lobbyHeading: /落下一块地/,
    profileHeading: '让这张筹码，代表你。',
  },
  {
    gameType: 'davinci',
    lobbyHeading: '达芬奇密码',
    profileHeading: '身份、判断与每一场对决。',
  },
  {
    gameType: 'splendor',
    lobbyHeading: /从一颗宝石/,
    profileHeading: '你的眼光，值得珍藏。',
  },
  {
    gameType: 'yinsh',
    lobbyHeading: /进退之间/,
    profileHeading: '你的每一步，都值得回看。',
  },
  {
    gameType: 'warchest',
    lobbyHeading: /方寸之间/,
    profileHeading: '每一步，都留下回响。',
  },
  {
    gameType: 'fugitive',
    lobbyHeading: /下一步/,
    profileHeading: '每一场追逐，都有你的痕迹。',
  },
  {
    gameType: 'loveletter',
    lobbyHeading: /一封密信/,
    profileHeading: '寄出的信，都有回音。',
  },
  {
    gameType: 'sixnimmt',
    lobbyHeading: /别做第六个/,
    profileHeading: '每一桌，都有点小故事。',
  },
  {
    gameType: 'forsale',
    lobbyHeading: /好房在手/,
    profileHeading: '每一场买卖，都值得回味。',
  },
] as const;

test.beforeEach(async ({ context }) => {
  await installAccessToken(context);
});

for (const game of games) {
  test(`${game.gameType} lobby, profile, history, and stats load`, async ({ page }) => {
    const assertClean = observePage(page);
    const APIPaths = new Set<string>();
    page.on('response', response => {
      const path = new URL(response.url()).pathname;
      if (path.includes('/platform/')) APIPaths.add(path);
    });

    await page.goto(`/game/${game.gameType}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: game.lobbyHeading }).first()).toBeVisible();
    await expect.poll(() => APIPaths.has('/pam-api/platform/auth/profile')).toBeTruthy();
    await expect.poll(() => APIPaths.has('/pam-api/platform/rooms')).toBeTruthy();
    await expect.poll(() => APIPaths.has('/pam-api/platform/history/stats')).toBeTruthy();

    await page.goto(`/game/${game.gameType}/me`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: game.profileHeading })).toBeVisible();
    await expect.poll(() => APIPaths.has('/pam-api/platform/history/games')).toBeTruthy();
    expect([...APIPaths].some(path => path.endsWith('/platform/auth/refresh'))).toBeFalsy();
    assertClean();
  });
}
