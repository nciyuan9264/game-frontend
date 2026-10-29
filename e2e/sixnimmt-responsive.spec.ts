import { expect, test, type Page, type TestInfo } from '@playwright/test';

const roomID = 'sixnimmt_layout';
const matchID = `${roomID}-r1`;
const human = { userID: '110', playerID: '110', displayName: '牧场玩家', avatar: '', seatIndex: 0, online: true, ai: false, ready: true };
const ai = { playerID: 'ai_2', displayName: '阿麦', avatar: '', seatIndex: 1, online: true, ai: true, ready: true };
const rows = [
  { index: 0, cards: [12, 18, 23], bullheads: 3 },
  { index: 1, cards: [30, 35, 39, 41, 44], bullheads: 12 },
  { index: 2, cards: [61, 64], bullheads: 2 },
  { index: 3, cards: [79, 84, 90], bullheads: 5 },
];

function gameSnapshot(status = 'selecting') {
  return {
    schemaVersion: 2, type: 'ROOM_SYNC', roomID, matchID, seq: 12,
    view: { sixnimmt: {
      playerId: human.playerID, ownerID: human.playerID, visibility: 'private',
      playerData: {
        [human.playerID]: { roundPenalty: 3, totalPenalty: 8, handCount: 10, takenCount: 2, locked: false },
        [ai.playerID]: { roundPenalty: 5, totalPenalty: 13, handCount: 10, takenCount: 4, locked: true },
      },
      privateData: { hand: [7, 24, 33, 46, 55, 68, 76, 88, 95, 103], legalCards: [7, 24, 33, 46, 55, 68, 76, 88, 95, 103] },
      roomData: {
        gameStatus: status, roundNo: 2, turnNo: 1, rows,
        lockedPlayerIDs: [ai.playerID],
        activityLog: [{ id: 1, roundNo: 1, turnNo: 10, kind: 'place', playerID: ai.playerID, card: 64, rowIndex: 2, penalty: 0, automationKind: 'ai', summary: '阿麦的 64 进入 C 行。' }],
        turnDeadline: new Date(Date.now() + 60_000).toISOString(), turnTimeoutMs: '60000',
        players: { [human.playerID]: human, [ai.playerID]: ai },
        playerOrder: [human.playerID, ai.playerID],
      },
    } },
  };
}

function roomSnapshot() {
  return {
    schemaVersion: 2, type: 'MATCH_SYNC', roomID, matchID, seq: 3,
    ownerID: human.playerID, status: 'match', playerID: human.playerID,
    visibility: 'private', maxPlayers: 10,
    players: { [human.playerID]: human, [ai.playerID]: ai },
    playerOrder: [human.playerID, ai.playerID],
  };
}

async function mockProfile(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({ json: {
    status_code: 0, message: 'ok', data: { user_id: human.userID, display_name: human.displayName, avatar: '', email: 'bull@example.com' },
  } }));
}

async function mockPublicData(page: Page) {
  await mockProfile(page);
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({ json: { status_code: 0, message: 'ok', data: { rooms: [] } } }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({ json: { status_code: 0, message: 'ok', data: { totalGames: 8, wins: 3, winRate: .375, avgScore: 24.5 } } }));
  await page.route('**/pam-api/platform/rankings?**', route => route.fulfill({ json: { status_code: 0, message: 'ok', data: { gameType: 'sixnimmt', entries: [], page: { limit: 20, offset: 0, hasMore: false, total: 0 } } } }));
  await page.route('**/pam-api/platform/history/games?**', route => route.fulfill({ json: { status_code: 0, message: 'ok', data: { games: [], page: { limit: 20, offset: 0, hasMore: false, total: 0 } } } }));
}

async function mockSession(page: Page, snapshot: ReturnType<typeof gameSnapshot> | ReturnType<typeof roomSnapshot> = gameSnapshot()) {
  const commands: string[] = [];
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({ json: {
    status_code: 0, message: 'ok', data: {
      roomID, gameType: 'sixnimmt', status: snapshot.type === 'MATCH_SYNC' ? 'match' : 'playing', visibility: 'private',
      ownerUserID: human.userID, ownerPlayerID: human.playerID, maxPlayers: 10, playerCount: 2,
      currentMatchID: matchID, currentMatchStatus: 'running', nextRoundNo: 2,
      createdAt: '2026-10-27T00:00:00Z', updatedAt: '2026-10-27T00:00:00Z', displayName: '牧场牌桌', turnTimeoutSeconds: 60,
      players: [human, ai], metrics: { sixnimmt: { maxPenalty: 13, targetPenalty: 66, progressCurrent: 13, progressTotal: 66 } },
    },
  } }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot));
    socket.onMessage(message => commands.push(String(message)));
  });
  return commands;
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

test('Six Nimmt public pages follow the shared responsive frame', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await mockPublicData(page);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 800 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/game/sixnimmt', { waitUntil: 'commit' });
    const hero = page.locator(
      '.sn-hero, [data-game-mobile-lobby-hero]',
    );
    await expect(hero).toBeVisible();
    await expect(page.getByRole('button', { name: /创建房间/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /分享游戏/ })).toBeVisible();
    if (viewport.width <= 390) await expect(hero).toHaveCSS('height', '227px');
    await expectNoOverflow(page);
    await capture(page, testInfo, `lobby-${viewport.width}x${viewport.height}`);

    await page.goto('/game/sixnimmt/guide', { waitUntil: 'commit' });
    const guideHeading = page.getByRole('heading', { name: '三分钟，读懂这一桌。' });
    if (viewport.width <= 390) await expect(guideHeading).toBeHidden();
    else await expect(guideHeading).toBeVisible();
    await expectNoOverflow(page);

    await page.goto('/game/sixnimmt/rankings', { waitUntil: 'commit' });
    const rankingHeading = page.getByRole('heading', { name: '每一桌，都算数。' });
    if (viewport.width <= 390) await expect(rankingHeading).toBeHidden();
    else await expect(rankingHeading).toBeVisible();
    await expectNoOverflow(page);
  }
});

test('Six Nimmt mobile room keeps ten seats and ready dock in view', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, roomSnapshot());
  await page.goto(`/game/sixnimmt/match?roomID=${roomID}`);
  await expect(page.locator('[data-game-shell-header]')).toBeVisible();
  await expect(page.locator('[data-game-brand]')).toBeVisible();
  await expect(page.locator('[data-game-shell-platform-home]')).toBeHidden();
  await expect(page.locator('[data-game-shell-profile]')).toBeHidden();
  await expect(page.locator('[data-game-mobile-room-seat]')).toHaveCount(10);
  const dock = await page.locator('[data-game-mobile-room-dock]').boundingBox();
  expect(dock).not.toBeNull();
  expect(dock!.height).toBeLessThanOrEqual(115);
  expect(dock!.y + dock!.height).toBeLessThanOrEqual(844);
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-room');
});

test('Six Nimmt mobile locks one selected card atomically', async ({ page }, testInfo) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  const commands = await mockSession(page);
  await page.goto(`/game/sixnimmt/match?roomID=${roomID}`);
  await expect(page.getByTestId('sixnimmt-play')).toBeVisible();
  await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
  await expect(page.locator('.sn-game-header')).toBeHidden();
  await page.getByRole('button', { name: '选择手牌 55' }).click();
  await page.getByRole('button', { name: /锁定 55/ }).click();
  await expect.poll(() => commands.filter(command => command.includes('"game_lock_card"')).length).toBe(1);
  expect(commands.find(command => command.includes('"game_lock_card"'))).toContain('"card":55');
  const dock = await page.locator('.sn-mobile-dock').boundingBox();
  expect(dock).not.toBeNull();
  expect(dock!.y + dock!.height).toBeLessThanOrEqual(844);
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-play');
  expect(pageErrors).toEqual([]);
});

test('Six Nimmt mobile results omit the game topbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, gameSnapshot('end'));
  await page.goto(`/game/sixnimmt/match?roomID=${roomID}`);

  await expect(page.locator('.sn-results')).toBeVisible();
  await expect(page.locator('[data-game-result-topbar]')).toBeHidden();
  await expect(page.locator('[data-game-mobile-topbar]')).toHaveCount(0);
  await expect(page.locator('.sn-mobile-result-review')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('[data-game-result-topbar]')).toBeVisible();
  await expect(page.locator('.sn-mobile-result-review')).toBeHidden();
});

test('Six Nimmt round results can return from the final table', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, gameSnapshot('roundEnd'));
  await page.goto(`/game/sixnimmt/match?roomID=${roomID}`);

  await expect(page.locator('.sn-results')).toBeVisible();
  await page.getByRole('button', { name: '查看终局牌桌' }).click();
  await expect(page.getByTestId('sixnimmt-play')).toBeVisible();

  const returnToResults = page.getByRole('button', {
    name: /正在查看终局牌桌 · 返回结算/,
  });
  await expect(returnToResults).toBeVisible();
  await returnToResults.click();
  await expect(page.locator('.sn-results')).toBeVisible();
});
