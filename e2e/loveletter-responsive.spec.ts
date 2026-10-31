import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { expectMobileFinalResultLayout } from './helpers';

const roomID = 'loveletter_layout';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '执笔人',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_2',
  displayName: '静候者',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

function gameSnapshot(status = 'play') {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 12,
    view: {
      loveletter: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: {
            favors: 1,
            alive: true,
            protected: false,
            spyUsed: false,
            handCount: 2,
            discards: [{ cardID: 'spy-1', rank: 0 }],
          },
          [ai.playerID]: {
            favors: 0,
            alive: true,
            protected: false,
            spyUsed: false,
            handCount: 1,
            discards: [{ cardID: 'handmaid-1', rank: 4 }],
          },
        },
        privateData: {
          hand: [
            { cardID: 'guard-1', rank: 1 },
            { cardID: 'princess-1', rank: 9 },
          ],
          legalCardIDs: ['guard-1', 'princess-1'],
          legalTargets: {
            'guard-1': [ai.playerID],
            'princess-1': [],
          },
          guardGuessRanks: [0, 2, 3, 4, 5, 6, 7, 8, 9],
        },
        roomData: {
          currentPlayer: human.playerID,
          gameStatus: status,
          roundNo: 2,
          goal: 6,
          deckCount: 12,
          reserveCount: 1,
          burnCards: [
            { cardID: 'priest-1', rank: 2 },
            { cardID: 'baron-1', rank: 3 },
            { cardID: 'prince-1', rank: 5 },
          ],
          activityLog: [{
            id: 1,
            roundNo: 2,
            kind: 'play',
            playerID: ai.playerID,
            cardRank: 4,
            automatic: false,
            private: false,
            summary: '打出侍女并获得保护。',
          }],
          lastData: {
            id: 1,
            roundNo: 2,
            kind: 'play',
            playerID: ai.playerID,
            cardRank: 4,
            automatic: false,
            private: false,
            summary: '打出侍女并获得保护。',
          },
          turnDeadline: new Date(Date.now() + 60_000).toISOString(),
          turnTimeoutMs: '60000',
          players: {
            [human.playerID]: human,
            [ai.playerID]: ai,
          },
          playerOrder: [human.playerID, ai.playerID],
        },
      },
    },
  };
}

function roomSnapshot() {
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID,
    matchID,
    seq: 3,
    ownerID: human.playerID,
    status: 'match',
    playerID: human.playerID,
    visibility: 'private',
    maxPlayers: 6,
    players: {
      [human.playerID]: human,
      [ai.playerID]: ai,
    },
    playerOrder: [human.playerID, ai.playerID],
  };
}

async function mockProfile(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: human.userID,
        display_name: human.displayName,
        avatar: '',
        email: 'letter@example.com',
      },
    },
  }));
}

async function mockPublicData(page: Page) {
  await mockProfile(page);
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: { rooms: [] } },
  }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { totalGames: 8, wins: 3, winRate: .375, avgScore: 2.5 },
    },
  }));
  await page.route('**/pam-api/platform/rankings?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        gameType: 'loveletter',
        entries: [],
        page: { limit: 20, offset: 0, hasMore: false, total: 0 },
      },
    },
  }));
  await page.route('**/pam-api/platform/history/games?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        games: [],
        page: { limit: 20, offset: 0, hasMore: false, total: 0 },
      },
    },
  }));
}

async function mockSession(
  page: Page,
  snapshot: ReturnType<typeof gameSnapshot> | ReturnType<typeof roomSnapshot>
    = gameSnapshot(),
) {
  const commands: string[] = [];
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'loveletter',
        status: snapshot.type === 'MATCH_SYNC' ? 'match' : 'playing',
        visibility: 'private',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 6,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'running',
        nextRoundNo: 2,
        createdAt: '2026-10-27T00:00:00Z',
        updatedAt: '2026-10-27T00:00:00Z',
        turnTimeoutSeconds: 60,
        players: [human, ai],
        metrics: {
          loveletter: {
            currentRound: 2,
            maxFavor: 1,
            targetFavor: 6,
            progressCurrent: 1,
            progressTotal: 6,
          },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot));
    socket.onMessage(message => commands.push(String(message)));
  });
  return commands;
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

test('Love Letter public pages follow the shared responsive frame', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  await mockPublicData(page);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/game/loveletter', { waitUntil: 'commit' });
    const hero = page.locator(
      '.ll-hero, [data-game-mobile-lobby-hero]',
    );
    await expect(hero).toBeVisible();
    await expect(page.getByRole('button', { name: /创建房间/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /分享游戏/ })).toBeVisible();
    if (viewport.width <= 390) {
      const brand = page.getByRole('link', { name: '掌心密信游戏大厅' });
      const logoBox = await brand.locator('> span').first().boundingBox();
      const iconBox = await brand.locator('> span').first().locator('svg').boundingBox();
      expect(logoBox).not.toBeNull();
      expect(iconBox).not.toBeNull();
      expect(Math.abs(
        logoBox!.x + logoBox!.width / 2 - (iconBox!.x + iconBox!.width / 2),
      )).toBeLessThanOrEqual(1);
      expect(Math.abs(
        logoBox!.y + logoBox!.height / 2 - (iconBox!.y + iconBox!.height / 2),
      )).toBeLessThanOrEqual(1);
      const heroBox = await hero.boundingBox();
      expect(heroBox).not.toBeNull();
      expect(heroBox!.height).toBeGreaterThanOrEqual(225);
      expect(heroBox!.height).toBeLessThanOrEqual(230);
    }
    await expectNoOverflow(page);
    await capture(page, testInfo, `lobby-${viewport.width}x${viewport.height}`);

    await page.goto('/game/loveletter/guide', { waitUntil: 'commit' });
    const guideHeading = page.getByRole('heading', { name: '读懂规则，也读懂人心。' });
    if (viewport.width <= 390) await expect(guideHeading).toBeHidden();
    else await expect(guideHeading).toBeVisible();
    await expectNoOverflow(page);

    await page.goto('/game/loveletter/rankings', { waitUntil: 'commit' });
    const rankingHeading = page.getByRole('heading', { name: '每一封信，都算数。' });
    if (viewport.width <= 390) await expect(rankingHeading).toBeHidden();
    else await expect(rankingHeading).toBeVisible();
    await expectNoOverflow(page);

    await page.goto('/game/loveletter/me', { waitUntil: 'commit' });
    const profileHeading = page.getByRole('heading', { name: '寄出的信，都有回音。' });
    if (viewport.width <= 390) await expect(profileHeading).toBeHidden();
    else await expect(profileHeading).toBeVisible();
    await expectNoOverflow(page);
  }
});

test('Love Letter mobile room keeps six seats and the ready dock in view', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, roomSnapshot());
  await page.goto(`/game/loveletter/match?roomID=${roomID}`);
  await expect(page.locator('[data-game-shell-header]')).toBeVisible();
  await expect(page.locator('[data-game-brand]')).toBeVisible();
  await expect(page.locator('[data-game-shell-platform-home]')).toBeHidden();
  await expect(page.locator('[data-game-shell-profile]')).toBeHidden();
  const seats = page.locator('[data-game-mobile-room-seat]');
  await expect(seats).toHaveCount(6);
  const firstSeat = await seats.first().boundingBox();
  expect(firstSeat).not.toBeNull();
  expect(firstSeat!.height).toBeGreaterThanOrEqual(126);
  expect(firstSeat!.height).toBeLessThanOrEqual(132);
  const dock = await page.locator('[data-game-mobile-room-dock]').boundingBox();
  expect(dock).not.toBeNull();
  expect(dock!.height).toBeLessThanOrEqual(115);
  expect(dock!.y + dock!.height).toBeLessThanOrEqual(844);
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-room');
});

test('Love Letter mobile submits guard target and guess atomically', async ({
  page,
}, testInfo) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  const commands = await mockSession(page);
  await page.goto(`/game/loveletter/match?roomID=${roomID}`);

  await expect(page.getByTestId('loveletter-play')).toBeVisible();
  await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
  await expect(page.locator('.ll-game-header')).toBeHidden();
  const identityPortraitLocator = page.locator(
    '.ll-hand > header > .ll-portrait',
  );
  const identityPortrait = await identityPortraitLocator.boundingBox();
  expect(identityPortrait).not.toBeNull();
  expect(identityPortrait!.width).toBeLessThanOrEqual(32);
  expect(identityPortrait!.height).toBeLessThanOrEqual(32);
  await expect(identityPortraitLocator).toHaveCSS('overflow', 'hidden');
  const identityArtwork = await page.locator(
    '.ll-hand > header > .ll-portrait > span',
  ).boundingBox();
  expect(identityArtwork).not.toBeNull();
  expect(identityArtwork!.width).toBeLessThanOrEqual(32);
  expect(identityArtwork!.height).toBeLessThanOrEqual(60);
  await page.getByRole('button', { name: '选择卫兵' }).click();
  const sheet = page.getByRole('dialog', { name: '写下你的选择' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: /静候者/ }).click();
  await sheet.getByRole('button', { name: /9\s*公主/ }).click();
  await sheet.getByRole('button', { name: /确认打出卫兵/ }).click();

  await expect.poll(() => commands.filter(command =>
    command.includes('"game_play_card"')).length).toBe(1);
  const command = commands.find(item => item.includes('"game_play_card"')) ?? '';
  expect(command).toContain('"cardID":"guard-1"');
  expect(command).toContain(`"targetPlayerID":"${ai.playerID}"`);
  expect(command).toContain('"guessRank":9');
  const dock = await page.locator('.ll-mobile-dock').boundingBox();
  expect(dock).not.toBeNull();
  expect(dock!.y + dock!.height).toBeLessThanOrEqual(844);
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-play');
  expect(pageErrors).toEqual([]);
});

test('Love Letter mobile results omit the game topbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, gameSnapshot('end'));
  await page.goto(`/game/loveletter/match?roomID=${roomID}`);

  await expect(page.locator('.ll-results')).toBeVisible();
  await expectMobileFinalResultLayout(page);
  await expect(page.locator('[data-game-result-topbar]')).toBeHidden();
  await expect(page.locator('[data-game-mobile-topbar]')).toHaveCount(0);
  await expect(page.locator('[data-game-final-result-action="view"]')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('[data-game-result-topbar]')).toBeVisible();
});

test('Love Letter round result keeps its own layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, gameSnapshot('roundEnd'));
  await page.goto(`/game/loveletter/match?roomID=${roomID}`);

  await expect(page.locator('.ll-results')).toBeVisible();
  await expect(page.locator('[data-game-final-result]')).toHaveCount(0);
  await expect(page.getByRole('button', {
    name: '下一轮，继续传信',
  })).toBeVisible();
});
