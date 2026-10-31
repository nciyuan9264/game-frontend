import { expect, test, type Page } from '@playwright/test';
import { expectMobileFinalResultLayout } from './helpers';

const roomID = 'fugitive_layout';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '午夜行者',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
  gameRole: 'fugitive',
};
const ai = {
  playerID: 'ai_2',
  displayName: 'Rook',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
  gameRole: 'marshal',
};
const avatarDataURL = 'data:image/png;base64,'
  + 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==';

function gameSnapshot() {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 12,
    view: {
      fugitive: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: { role: 'fugitive', handCount: 5 },
          [ai.playerID]: { role: 'marshal', handCount: 3 },
        },
        hand: [
          { number: 2, sprint: 2 },
          { number: 12, sprint: 2 },
          { number: 20, sprint: 2 },
          { number: 31, sprint: 1 },
          { number: 42, sprint: 0 },
        ],
        roomData: {
          currentPlayer: human.playerID,
          gameStatus: 'fugitiveAction',
          roundNo: 3,
          drawsRemaining: 0,
          highestRevealed: 0,
          hiddenHideoutCount: 2,
          openingHideoutsPlaced: 2,
          route: [
            {
              index: 0,
              revealed: true,
              sprintCount: 0,
              card: { number: 0, sprint: 0 },
              sprints: [],
            },
            {
              index: 1,
              revealed: false,
              sprintCount: 0,
              card: { number: 5, sprint: 1 },
              sprints: [],
            },
            {
              index: 2,
              revealed: false,
              sprintCount: 1,
              card: { number: 9, sprint: 1 },
              sprints: [{ number: 4, sprint: 2 }],
            },
          ],
          decks: [
            { deckIndex: 0, min: 4, max: 14, remaining: 5 },
            { deckIndex: 1, min: 15, max: 28, remaining: 10 },
            { deckIndex: 2, min: 29, max: 41, remaining: 12 },
          ],
          activityLog: [{
            id: 1,
            roundNo: 3,
            kind: 'draw',
            playerID: human.playerID,
            role: 'fugitive',
            deckIndex: 1,
            numbers: [20],
            sprintCount: 0,
            automatic: false,
            private: true,
          }],
          lastData: {
            id: 1,
            roundNo: 3,
            kind: 'draw',
            playerID: human.playerID,
            role: 'fugitive',
            deckIndex: 1,
            numbers: [20],
            sprintCount: 0,
            automatic: false,
            private: true,
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
    maxPlayers: 2,
    players: {
      [human.playerID]: human,
      [ai.playerID]: ai,
    },
    playerOrder: [human.playerID, ai.playerID],
  };
}

function endedSnapshot() {
  const snapshot = gameSnapshot();
  const action = snapshot.view.fugitive.roomData.activityLog[0];
  return {
    ...snapshot,
    view: {
      fugitive: {
        ...snapshot.view.fugitive,
        result: {
          winnerID: human.playerID,
          winnerRole: 'fugitive',
          reason: 'escaped',
          searches: 2,
        },
        roomData: {
          ...snapshot.view.fugitive.roomData,
          currentPlayer: '',
          gameStatus: 'end',
          activityLog: [
            { ...action, id: 2, playerID: ai.playerID, role: 'marshal', automatic: true },
            { ...action, id: 3, playerID: human.playerID, automatic: true },
          ],
        },
      },
    },
  };
}

async function mockSession(
  page: Page,
  snapshot = gameSnapshot(),
  status: 'match' | 'playing' = 'playing',
) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: human.userID,
        display_name: human.displayName,
        avatar: '',
      },
    },
  }));
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'fugitive',
        status,
        visibility: 'private',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 2,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: status === 'match' ? 'preparing' : 'running',
        nextRoundNo: 2,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z',
        turnTimeoutSeconds: 120,
        players: [human, ai],
        metrics: {
          fugitive: {
            highestRevealed: 0,
            hiddenHideoutCount: 2,
            progressCurrent: 9,
            progressTotal: 42,
          },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot));
  });
}

async function mockLobby(page: Page, avatar = '') {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: human.userID,
        display_name: human.displayName,
        avatar,
      },
    },
  }));
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { rooms: [] },
    },
  }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        totalGames: 0,
        wins: 0,
        winRate: 0,
        avgScore: 0,
        gamesByRole: {},
        winsByRole: {},
      },
    },
  }));
  await page.route('**/pam-api/platform/history/games?**', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: { games: [] } },
  }));
}

async function expectNoDocumentOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('Fugitive mobile lobby uses product chrome and shared entry flows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockLobby(page);
  await page.goto('/game/fugitive');

  const createButton = page.getByRole('button', { name: /创建房间/ });
  const shareButton = page.getByRole('button', { name: /分享游戏/ });
  await expect(createButton).toBeVisible();
  await expect(shareButton).toBeVisible();
  await expect(page.locator('.mobile-system')).toHaveCount(0);
  await expect(page.locator('.home-wrap')).toHaveCount(0);
  await expect(page.getByText('了解玩法', { exact: true })).toHaveCount(0);
  await expect(page.getByText('第一次来？读懂规则')).toHaveCount(0);
  await expect(createButton).toHaveCSS('justify-content', 'center');
  await expect(createButton).toHaveCSS('align-items', 'center');
  await expect(shareButton).toHaveCSS('justify-content', 'center');
  await expect(shareButton).toHaveCSS('align-items', 'center');

  await createButton.click();
  const createDialog = page.getByRole('dialog', { name: '创建房间' });
  await expect(createDialog).toBeVisible();
  await expect(createDialog.getByRole('button', { name: '公开房间' })).toBeVisible();
  await expect(createDialog.getByRole('button', { name: '私密房间' })).toBeVisible();
  await expect(createDialog.getByRole('button', { name: '公开房间' }))
    .toHaveCSS('background-color', 'rgb(32, 53, 42)');
  await expect(createDialog.getByRole('button', { name: '创建并入座' }))
    .toHaveCSS('color', 'rgb(45, 27, 16)');
  await expect(createDialog.getByRole('button', { name: '创建并入座' }))
    .toHaveCSS('background-color', 'rgb(226, 145, 93)');
  await expect(createDialog.getByText('午夜追缉 · 固定 2 人 · 每回合 120 秒'))
    .toBeVisible();
  await expect(createDialog.getByRole('textbox')).toHaveCount(0);
  await expect(createDialog.getByRole('combobox')).toHaveCount(0);
  await page.getByRole('button', { name: '关闭面板' }).click();

  await shareButton.click();
  await expect(page.getByRole('dialog', { name: '分享 Fugitive' })).toBeVisible();
  await expect(page.getByText('https://board.gamebus.online/game/fugitive', { exact: true }))
    .toBeVisible();
  await expect(page.getByRole('button', { name: /复制游戏链接/ })).toBeVisible();
  await page.getByRole('button', { name: '关闭面板' }).click();
  const roomLookup = page.getByRole('textbox', { name: '查找房间号' });
  await expect(roomLookup).toBeVisible();
  await expect(roomLookup).toHaveAttribute('placeholder', '输入完整房间号');
  await expect(roomLookup).toHaveCSS('border-top-width', '0px');
  await expect(roomLookup).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const roomSearch = page.getByRole('textbox', { name: '搜索房间号或房主' });
  await expect(roomSearch).toHaveCSS('border-top-width', '0px');
  await expect(roomSearch).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.getByRole('button', { name: '查找房间' })).toBeDisabled();

  await page.goto('/game/fugitive/guide');
  const guidePrimary = page.getByRole('button', { name: /下一步/ });
  await expect(guidePrimary).toHaveCSS('color', 'rgb(45, 27, 16)');
  await expect(guidePrimary).toHaveCSS('background-color', 'rgb(226, 145, 93)');

  await page.goto('/game/fugitive/me');
  const emptyHistory = page.getByRole('status');
  await expect(emptyHistory).toContainText('还没有追逃记录');
  const emptyBox = await emptyHistory.boundingBox();
  expect(emptyBox).not.toBeNull();
  expect(emptyBox!.height).toBeLessThanOrEqual(120);
  await expectNoDocumentOverflow(page);
});

test('Fugitive desktop clips the rail profile image inside its avatar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockLobby(page, avatarDataURL);
  await page.goto('/game/fugitive');

  const railAvatar = page.locator('.rail-avatar');
  const monogram = railAvatar.locator('.profile-monogram');
  const image = monogram.locator('img');
  await expect(image).toBeVisible();
  await expect(railAvatar).toHaveCSS('overflow', 'hidden');

  const [railBox, monogramBox, imageBox] = await Promise.all([
    railAvatar.boundingBox(),
    monogram.boundingBox(),
    image.boundingBox(),
  ]);
  expect(railBox).not.toBeNull();
  expect(monogramBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(railBox!.width).toBe(32);
  expect(railBox!.height).toBe(32);
  for (const box of [monogramBox!, imageBox!]) {
    expect(box.x).toBeGreaterThanOrEqual(railBox!.x);
    expect(box.y).toBeGreaterThanOrEqual(railBox!.y);
    expect(box.x + box.width).toBeLessThanOrEqual(railBox!.x + railBox!.width);
    expect(box.y + box.height).toBeLessThanOrEqual(railBox!.y + railBox!.height);
  }
  await expectNoDocumentOverflow(page);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`Fugitive room seats align at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockSession(page, roomSnapshot(), 'match');
    await page.goto(`/game/fugitive/match?roomID=${roomID}`);

    await expect(page.locator('[data-game-shell-header]')).toBeVisible();
    await expect(page.locator('[data-game-brand]')).toBeVisible();
    await expect(page.locator('[data-game-shell-platform-home]')).toBeHidden();
    await expect(page.locator('[data-game-shell-profile]')).toBeHidden();
    const seats = page.locator('[data-game-mobile-room-seat]');
    await expect(seats).toHaveCount(2);
    await expect(seats.nth(1).locator('[data-fugitive-ai-avatar]')).toBeVisible();
    await expect(seats.nth(1)).toContainText('追捕者');
    await expect(seats.nth(1)).toContainText('人机');
    const first = await seats.nth(0).boundingBox();
    const second = await seats.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.y - second!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(first!.height - second!.height)).toBeLessThanOrEqual(1);

    const remove = await seats.nth(1).getByRole('button', { name: '管理席位 2' }).boundingBox();
    expect(remove).not.toBeNull();
    expect(remove!.x).toBeGreaterThanOrEqual(second!.x);
    expect(remove!.y).toBeGreaterThanOrEqual(second!.y);
    expect(remove!.x + remove!.width).toBeLessThanOrEqual(second!.x + second!.width);
    expect(remove!.y + remove!.height).toBeLessThanOrEqual(second!.y + second!.height);
    await expectNoDocumentOverflow(page);
  });
}

test('Fugitive mobile route and action dock fit 390x844', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  await page.goto(`/game/fugitive/match?roomID=${roomID}`);

  await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
  await expect(page.locator('[data-game-desktop-topbar]')).toBeHidden();
  await expect(page.getByTestId('fugitive-route')).toBeVisible();
  await expect(page.getByTestId('fugitive-mobile-dock')).toBeVisible();
  await expect(page.locator('.mobile-system')).toHaveCount(0);
  await expect(page.locator('.home-wrap')).toHaveCount(0);
  await expect(page.getByText('选择新的藏身点，或原地潜伏')).toBeVisible();
  await page.getByTestId('fugitive-mobile-dock')
    .getByRole('button', { name: /选择藏身点/ }).click();
  await page.getByRole('button', { name: '选择地点 20' }).click();
  await expect(page.getByRole('heading', { name: '前往 20 号藏身点' })).toBeVisible();
  await expectNoDocumentOverflow(page);
  expect(pageErrors).toEqual([]);
});

test('Fugitive mobile result and final board controls stay aligned', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, endedSnapshot());
  await page.goto(`/game/fugitive/match?roomID=${roomID}`);

  await expect(page.locator('[data-game-result-topbar]')).toBeHidden();
  await expectMobileFinalResultLayout(page);
  await expect(page.locator('[data-game-mobile-topbar]')).toHaveCount(0);
  const review = page.getByRole('button', { name: '查看终局牌桌' });
  await expect(review).toBeVisible();
  const reviewLayout = await review.evaluate(element => {
    return {
      justifyContent: getComputedStyle(element).justifyContent,
      iconCount: element.querySelectorAll('svg').length,
    };
  });
  expect(reviewLayout.justifyContent).toBe('center');
  expect(reviewLayout.iconCount).toBe(1);

  await review.click();
  await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
  await expect(page.locator('[data-game-desktop-topbar]')).toBeHidden();
  const settlement = page.getByTestId('fugitive-mobile-dock')
    .getByRole('button', { name: /查看结算/ });
  const settlementBox = await settlement.boundingBox();
  expect(settlementBox).not.toBeNull();
  expect(844 - settlementBox!.y - settlementBox!.height).toBeGreaterThanOrEqual(12);

  await page.getByRole('button', { name: '追逐记录' }).click();
  const historyDialog = page.getByRole('dialog', { name: '每一步，都留下痕迹。' });
  await expect(historyDialog.locator('.full-log p')
    .filter({ hasText: '（AI 操作）' })).toBeVisible();
  await expect(historyDialog.locator('.full-log p')
    .filter({ hasText: '（超时托管）' })).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test('Fugitive desktop keeps route, hand, and mission visible at 1440x900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page);
  await page.goto(`/game/fugitive/match?roomID=${roomID}`);

  await expect(page.getByRole('heading', { name: '逃亡路线' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /我的手牌/ })).toBeVisible();
  await expect(page.getByText('消失在天亮之前。')).toBeVisible();
  await expect(page.getByText('服务端权威牌局')).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test('Fugitive desktop game chrome is bounded on an ultra-wide viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 2557, height: 1293 });
  await mockSession(page);
  await page.goto(`/game/fugitive/match?roomID=${roomID}`);

  const frames = page.locator('.game-header, .game-main');
  await expect(frames).toHaveCount(2);
  const geometry = await frames.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return {
      width: box.width,
      center: box.left + box.width / 2,
    };
  }));
  for (const frame of geometry) {
    expect(frame.width).toBeLessThanOrEqual(1700.5);
    expect(frame.width).toBeGreaterThanOrEqual(1699);
    expect(Math.abs(frame.center - 2557 / 2)).toBeLessThanOrEqual(1);
  }
  await expectNoDocumentOverflow(page);
});
