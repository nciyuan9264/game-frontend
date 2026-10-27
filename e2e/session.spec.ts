import { expect, test } from '@playwright/test';
import {
  closeRoom,
  createPrivateRoom,
  installAccessToken,
  observePage,
  regressionRunID,
  type GameType,
} from './helpers';

const runID = regressionRunID();
const games: Array<{
  gameType: GameType;
  playMarker: RegExp;
}> = [
  { gameType: 'acquire', playMarker: /股价速查/ },
  { gameType: 'davinci', playMarker: /查看游戏规则/ },
  { gameType: 'splendor', playMarker: /宝石池/ },
  { gameType: 'yinsh', playMarker: /轮到你布环/ },
  { gameType: 'othello', playMarker: /轮到你了/ },
  { gameType: 'fugitive', playMarker: /布置 1–2 处初始藏身点/ },
  { gameType: 'warchest', playMarker: /轮到你行动/ },
  { gameType: 'loveletter', playMarker: /玫瑰庭院/ },
  { gameType: 'sixnimmt', playMarker: /公共牌桌/ },
];

test.beforeEach(async ({ context }) => {
  await installAccessToken(context);
});

for (const game of games) {
  test(`${game.gameType} creates a private AI match through the real UI`, async ({
    page,
    request,
  }) => {
    const requestID = `e2e:${runID}:${game.gameType}`;
    const room = await createPrivateRoom(request, game.gameType, requestID);
    const assertClean = observePage(page);
    try {
      await page.goto(
        `/game/${game.gameType}/match?roomID=${encodeURIComponent(room.roomID)}`,
        { waitUntil: 'domcontentloaded' },
      );
      await expect(page.getByText(room.roomID, { exact: false }).first()).toBeVisible();

      const addAI = page.getByRole('button', { name: /添加人机/ }).first();
      await expect(addAI).toBeEnabled();
      await addAI.click();

      const start = page.getByRole('button', { name: '开始对局', exact: true });
      await expect(start).toBeEnabled();
      await start.click();
      const confirm = page.getByRole('button', { name: /确认开局/ });
      await expect(confirm).toBeEnabled();
      await confirm.click();

      await expect(page.getByText(game.playMarker).first()).toBeVisible({
        timeout: 30_000,
      });
      assertClean();
    } finally {
      await page.close();
      await closeRoom(request, room, `${requestID}:close`);
    }
  });
}
