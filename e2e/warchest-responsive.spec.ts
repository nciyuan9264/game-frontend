import { expect, test, type Page } from '@playwright/test';

const roomID = 'warchest_layout';
const matchID = `${roomID}-r1`;
const profileAvatar = 'data:image/png;base64,'
  + 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==';
const human = {
  userID: '110',
  playerID: '110',
  displayName: '北境来风',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_2',
  displayName: '渡鸦',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

function gameSnapshot() {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 12,
    view: {
      warchest: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: {
            side: 'oak',
            roster: ['sword', 'pike', 'crossbow', 'light'],
            controlledLocations: 3,
            bagCount: 4,
            handCount: 3,
            supply: { sword: 2, pike: 2, crossbow: 2, light: 1 },
            discard: [{ coinID: 'oak-light-2', unitType: 'light', faceUp: true }],
            lost: {},
          },
          [ai.playerID]: {
            side: 'falcon',
            roster: ['archer', 'cavalry', 'lancer', 'scout'],
            controlledLocations: 2,
            bagCount: 5,
            handCount: 3,
            supply: { archer: 2, cavalry: 2, lancer: 2, scout: 3 },
            discard: [{ coinID: 'falcon-hidden', faceUp: false }],
            lost: {},
          },
        },
        privateData: {
          hand: [
            { coinID: 'oak-sword-1', unitType: 'sword', faceUp: true },
            { coinID: 'oak-pike-1', unitType: 'pike', faceUp: true },
            { coinID: 'oak-royal', unitType: 'royal', faceUp: true },
          ],
          bagCounts: { sword: 1, pike: 1, crossbow: 1, light: 1 },
        },
        roomData: {
          board: [
            { unitID: 'oak-sword', unitType: 'sword', side: 'oak', cell: '-1,1', coinCount: 2 },
            { unitID: 'oak-light', unitType: 'light', side: 'oak', cell: '-1,2', coinCount: 1 },
            { unitID: 'oak-crossbow', unitType: 'crossbow', side: 'oak', cell: '1,1', coinCount: 1 },
            { unitID: 'falcon-archer', unitType: 'archer', side: 'falcon', cell: '1,-1', coinCount: 1 },
            { unitID: 'falcon-cavalry', unitType: 'cavalry', side: 'falcon', cell: '-1,0', coinCount: 1 },
            { unitID: 'falcon-lancer', unitType: 'lancer', side: 'falcon', cell: '2,-2', coinCount: 1 },
          ],
          controls: [
            { cell: '-2,3', side: 'oak' },
            { cell: '1,2', side: 'oak' },
            { cell: '-3,2', side: 'oak' },
            { cell: '-1,-2', side: 'falcon' },
            { cell: '2,-3', side: 'falcon' },
          ],
          currentPlayer: human.playerID,
          currentSide: 'oak',
          initiativePlayer: human.playerID,
          initiativeSide: 'oak',
          roundNo: 4,
          gameStatus: 'playing',
          legalActions: [
            { actionID: 'action-pass', action: 'pass', coinID: 'oak-sword-1' },
            {
              actionID: 'action-move',
              action: 'move',
              coinID: 'oak-sword-1',
              actorUnitID: 'oak-sword',
              from: '-1,1',
              to: '0,1',
              path: ['0,1'],
            },
          ],
          activityLog: [{
            id: 8,
            roundNo: 4,
            playerID: ai.playerID,
            side: 'falcon',
            action: 'control',
            unitType: 'cavalry',
            to: '-2,0',
            automatic: false,
            summary: '骑兵控制 D3 据点',
          }],
          lastData: {
            id: 8,
            roundNo: 4,
            playerID: ai.playerID,
            side: 'falcon',
            action: 'control',
            automatic: false,
            summary: '骑兵控制 D3 据点',
          },
          players: { [human.playerID]: human, [ai.playerID]: ai },
          playerOrder: [human.playerID, ai.playerID],
          turnDeadline: new Date(Date.now() + 90_000).toISOString(),
          turnTimeoutMs: '90000',
        },
      },
    },
  };
}

function endedSnapshot() {
  const snapshot = gameSnapshot();
  return {
    ...snapshot,
    seq: 13,
    view: {
      warchest: {
        ...snapshot.view.warchest,
        result: {
          winnerID: human.playerID,
          winnerSide: 'oak',
          reason: 'control',
          actionCount: 18,
        },
        roomData: {
          ...snapshot.view.warchest.roomData,
          gameStatus: 'end',
          legalActions: [],
          controls: [
            ...snapshot.view.warchest.roomData.controls,
            { cell: '-2,0', side: 'oak' },
            { cell: '3,-2', side: 'oak' },
            { cell: '2,0', side: 'oak' },
          ],
          turnDeadline: undefined,
        },
      },
    },
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
        avatar: profileAvatar,
      },
    },
  }));
}

async function mockPublicData(page: Page) {
  await mockProfile(page);
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        rooms: [{
          roomID: '1026_140000',
          gameType: 'warchest',
          status: 'match',
          visibility: 'public',
          ownerUserID: '220',
          ownerPlayerID: '220',
          maxPlayers: 2,
          playerCount: 1,
          currentMatchID: '1026_140000-r1',
          currentMatchStatus: 'preparing',
          nextRoundNo: 1,
          createdAt: '2026-10-26T00:00:00Z',
          updatedAt: '2026-10-26T00:00:00Z',
          displayName: '雾谷前哨',
          turnTimeoutSeconds: 90,
          players: [{ ...human, userID: '220', playerID: '220', displayName: 'Elias' }],
          metrics: {
            warchest: {
              maxControlledLocations: 2,
              progressCurrent: 2,
              progressTotal: 6,
            },
          },
        }],
      },
    },
  }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { totalGames: 12, wins: 7, winRate: 7 / 12, avgScore: 4.3 },
    },
  }));
  await page.route('**/pam-api/platform/history/games?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { games: [], total: 0 },
    },
  }));
  await page.route('**/pam-api/platform/rankings?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        gameType: 'warchest',
        entries: [0, 1, 2].map(index => ({
          userID: String(index + 1),
          playerID: `commander-${index + 1}`,
          displayName: `指挥官 ${index + 1}`,
          totalGames: 20 - index,
          metric: { warchest: { wins: 12 - index, winRate: .6 - index * .05 } },
        })),
      },
    },
  }));
}

async function mockSession(page: Page, initialSnapshot = gameSnapshot()) {
  const commands: string[] = [];
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'warchest',
        status: 'playing',
        visibility: 'private',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 2,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'running',
        nextRoundNo: 2,
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
        displayName: '暮色边境',
        turnTimeoutSeconds: 90,
        players: [human, ai],
        metrics: {
          warchest: { maxControlledLocations: 3, progressCurrent: 3, progressTotal: 6 },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(initialSnapshot));
    socket.onMessage(message => commands.push(String(message)));
  });
  return commands;
}

async function mockReplay(page: Page) {
  await mockProfile(page);
  const source = gameSnapshot().view.warchest;
  await page.route('**/pam-api/platform/history/games/99/snapshots?**', route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          snapshots: [{
            warchest: {
              seq: -1,
              totalEvents: 0,
              roomData: source.roomData,
              playersData: source.playerData,
              privateData: {
                [human.playerID]: source.privateData,
                [ai.playerID]: { hand: [], bagCounts: {} },
              },
            },
          }],
          totalEvents: 0,
          totalSnapshots: 1,
          page: {
            offset: 0,
            limit: 20,
            nextOffset: 1,
            hasMore: false,
          },
        },
      },
    }));
  await page.route('**/pam-api/platform/history/games/99?**', route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          game: {
            id: 99,
            roomID,
            roomDisplayName: '暮色边境',
            gameType: 'warchest',
            startedAt: '2026-10-26T00:00:00Z',
            endedAt: '2026-10-26T00:05:00Z',
            durationSeconds: 300,
            maxPlayers: 2,
            createdAt: '2026-10-26T00:00:00Z',
            updatedAt: '2026-10-26T00:05:00Z',
          },
          players: [
            {
              id: 1,
              gameID: 99,
              userID: human.userID,
              playerID: human.playerID,
              displayName: human.displayName,
              seatIndex: 0,
              isAI: false,
              finalStocks: 0,
              isWinner: true,
              createdAt: '2026-10-26T00:00:00Z',
            },
            {
              id: 2,
              gameID: 99,
              playerID: ai.playerID,
              displayName: ai.displayName,
              seatIndex: 1,
              isAI: true,
              finalStocks: 0,
              isWinner: false,
              createdAt: '2026-10-26T00:00:00Z',
            },
          ],
          events: [],
        },
      },
    }));
}

function matchSnapshot() {
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID,
    matchID,
    seq: 4,
    ownerID: human.playerID,
    status: 'match',
    playerID: human.playerID,
    visibility: 'private',
    maxPlayers: 2,
    players: { [human.playerID]: human, [ai.playerID]: ai },
    playerOrder: [human.playerID, ai.playerID],
    setup: {
      warchest: {
        mode: 'recommended',
        sides: { [human.playerID]: 'oak', [ai.playerID]: 'falcon' },
        rosters: {
          [human.playerID]: ['sword', 'pike', 'crossbow', 'light'],
          [ai.playerID]: ['archer', 'cavalry', 'lancer', 'scout'],
        },
        complete: true,
        initialPlayerID: human.playerID,
        initialSide: 'oak',
      },
    },
  };
}

async function mockPreparation(page: Page) {
  const commands: string[] = [];
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'warchest',
        status: 'match',
        visibility: 'private',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 2,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'preparing',
        nextRoundNo: 1,
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z',
        displayName: '雾谷前哨',
        turnTimeoutSeconds: 90,
        players: [human, ai],
        metrics: {
          warchest: { maxControlledLocations: 2, progressCurrent: 2, progressTotal: 6 },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(matchSnapshot()));
    socket.onMessage(message => commands.push(String(message)));
  });
  return commands;
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('War Chest public pages render the responsive showcase shell', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicData(page);
  await page.goto('/game/warchest');

  await expect(page.getByRole('heading', { name: /方寸之间/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /创建房间/ })).toBeVisible();
  await expect(page.getByText('雾谷前哨')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '战争之匣手机导航' })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: 'test-results/warchest-lobby-mobile.png' });

  await page.getByRole('button', { name: /创建房间/ }).click();
  const createDialog = page.getByRole('dialog', {
    name: '为下一场交锋，升起战旗。',
  });
  await expect(createDialog).toBeVisible();
  await expect(createDialog.getByRole('textbox')).toHaveCount(0);
  await expect(createDialog.getByText('双人完整基础版')).toBeVisible();
  await expect(createDialog.getByText('固定 90 秒')).toBeVisible();
  expect(await createDialog.evaluate(element => {
    const choice = element.querySelector<HTMLElement>(
      'button[aria-pressed="true"]',
    );
    return {
      dialog: getComputedStyle(element).backgroundColor,
      choice: choice ? getComputedStyle(choice).backgroundColor : '',
    };
  })).toEqual({
    dialog: 'rgb(19, 40, 49)',
    choice: 'rgb(25, 50, 58)',
  });
  await createDialog.getByRole('button', { name: '取消' }).click();

  await page.goto('/game/warchest/army');
  await expect(page.getByRole('heading', { name: '各有所长，合而为军。' })).toBeVisible();
  await expect(page.locator('.library-card')).toHaveCount(16);
  await expectNoOverflow(page);

  await page.goto('/game/warchest/guide');
  await expect(page.getByRole('heading', { name: '懂得规则，才懂得破局。' })).toBeHidden();
  await expect(page.getByRole('button', { name: /下一步/ })).toBeVisible();
  await expectNoOverflow(page);

  await page.goto('/game/warchest/rankings');
  await expect(page.getByRole('heading', { name: '每一次调遣，都留下判断。' })).toBeHidden();
  await expect(page.getByRole('tablist', { name: '排行榜模式' })).toBeVisible();
  await expectNoOverflow(page);
});

test('War Chest replay uses an in-flow mobile heading and keeps desktop battle chrome', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockReplay(page);
  await page.goto('/game/warchest/replay/99');

  const mobileHeading = page.locator('[data-game-mobile-replay-heading]');
  await expect(mobileHeading).toBeVisible();
  await expect(mobileHeading.getByRole('link', { name: '返回战绩' })).toBeVisible();
  await expect(mobileHeading).toHaveCSS('position', 'static');
  await expect(page.locator('.battle-header')).toBeHidden();
  await expect(page.locator('.warchest-replay-back')).toBeHidden();
  await expect(page.getByTestId('warchest-replay-panel')).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(mobileHeading).toBeHidden();
  await expect(page.locator('.battle-header')).toBeVisible();
  await expect(page.locator('.warchest-replay-back')).toBeVisible();
});

test('War Chest desktop keeps primary actions, profile images, and footer content separated', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 876 });
  await mockPublicData(page);
  await page.goto('/game/warchest');

  const hero = page.getByTestId('warchest-lobby-hero');
  const createButton = hero.getByRole('button', { name: /创建房间/ });
  const [heroBox, createBox] = await Promise.all([
    hero.boundingBox(),
    createButton.boundingBox(),
  ]);
  expect(createBox!.y + createBox!.height).toBeLessThanOrEqual(
    heroBox!.y + heroBox!.height,
  );
  await expect(page.locator('.sidebar .lucide-settings-2')).toHaveCount(0);
  await expect(page.locator('.side-tail .user-avatar img')).toHaveAttribute(
    'src',
    profileAvatar,
  );
  await expect(page.locator('.header-profile .user-avatar img')).toHaveAttribute(
    'src',
    profileAvatar,
  );
  await expect.poll(() => page.locator('.header-profile .user-avatar').evaluate(
    element => {
      const avatar = element.getBoundingClientRect();
      const image = element.querySelector('img')!.getBoundingClientRect();
      return {
        width: Math.round(image.width),
        height: Math.round(image.height),
        avatarWidth: Math.round(avatar.width),
        avatarHeight: Math.round(avatar.height),
      };
    },
  )).toEqual({
    width: 29,
    height: 29,
    avatarWidth: 31,
    avatarHeight: 31,
  });

  await page.goto('/game/warchest/me');
  await expect(page.locator('.profile-card .user-avatar img')).toHaveAttribute(
    'src',
    profileAvatar,
  );
  const [aboutBox, footerBox] = await Promise.all([
    page.getByTestId('warchest-about-entry').boundingBox(),
    page.locator('.app-footer').boundingBox(),
  ]);
  expect(aboutBox!.y + aboutBox!.height).toBeLessThanOrEqual(footerBox!.y);
  await expectNoOverflow(page);
});


test('War Chest preparation room exposes all authoritative setup modes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const commands = await mockPreparation(page);
  await page.goto(`/game/warchest/match?roomID=${roomID}`);

  await expect(page.locator('[data-game-shell-header]')).toBeVisible();
  await expect(page.locator('[data-game-brand]')).toBeVisible();
  await expect(page.locator('[data-game-shell-platform-home]')).toBeHidden();
  await expect(page.locator('[data-game-shell-profile]')).toBeHidden();
  await expect(page.getByRole('heading', { name: new RegExp(roomID) }))
    .toBeVisible();
  await expect(page.locator('[data-game-mobile-room-seat]')).toHaveCount(2);
  await expect(page.getByRole('button', { name: /首局推荐/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /随机编成/ })).toBeVisible();
  const draftButton = page.getByRole('button', { name: /官方轮抽/ });
  await expect(draftButton).toBeEnabled();
  await expect(page.getByRole('button', { name: '开始对局' })).toBeEnabled();
  await expectNoOverflow(page);
  await page.screenshot({ path: 'test-results/warchest-room-mobile.png' });

  await draftButton.click();
  await expect.poll(() => commands.some(value =>
    value.includes('"game_set_setup_mode"')
    && value.includes('"mode":"draft"'))).toBe(true);
});

test('War Chest mobile battle submits only the service action ID', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const commands = await mockSession(page);
  await page.goto(`/game/warchest/match?roomID=${roomID}`);

  await expect(page.getByTestId('warchest-board')).toBeVisible();
  await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
  await expect(page.locator('.battle-header')).toBeHidden();
  await expect(page.getByTestId('warchest-turn-status')).toHaveText(/轮到你行动/);
  const mobileBoardBox = await page.getByTestId('warchest-board').boundingBox();
  expect(mobileBoardBox?.width).toBeGreaterThan(340);
  await expect(page.getByRole('button', { name: '行动：移动' })).toBeEnabled();
  await page.screenshot({ path: 'test-results/warchest-battle-mobile.png' });
  await page.getByRole('button', { name: '行动：移动' }).click();
  await page.getByRole('button', { name: '确认行动' }).click();
  await expect.poll(() => commands.some(value =>
    value.includes('"game_play_action"')
    && value.includes('"actionID":"action-move"'))).toBe(true);
  await expectNoOverflow(page);
});

test('War Chest mobile returns from battle to full-width lobby cards', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicData(page);
  await mockSession(page);
  await page.goto(`/game/warchest/match?roomID=${roomID}`);

  await expect(page.getByTestId('warchest-board')).toBeVisible();
  await page.getByRole('button', { name: '退出对局' }).click();
  await page.getByRole('button', { name: '确认离开' }).click();

  await expect(page).toHaveURL(/\/game\/warchest$/);
  await expect(page.getByText('雾谷前哨')).toBeVisible();
  const [browserBox, cardBox] = await Promise.all([
    page.locator('[data-game-mobile-lobby-browser]').boundingBox(),
    page.locator('[data-game-mobile-room-card]').first().boundingBox(),
  ]);
  expect(cardBox?.x).toBe(browserBox?.x);
  expect(cardBox?.width).toBe(browserBox?.width);
  await expectNoOverflow(page);
});

test('War Chest final board keeps history and results without the live menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, endedSnapshot());
  await page.goto(`/game/warchest/match?roomID=${roomID}`);

  await expect(page.getByRole('dialog', {
    name: '六面旗帜，见证你的远见。',
  })).toBeVisible();
  await page.getByRole('button', { name: '回到棋盘' }).click();

  await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
  await expect(page.locator('.battle-header')).toBeHidden();
  await expect(page.getByRole('button', { name: '打开对局菜单' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '打开终局结算' })).toBeVisible();
  await page.getByRole('button', { name: '打开战报' }).click();
  await expect(page.getByRole('dialog', { name: '战场纪事' })).toBeVisible();
  await page.getByRole('button', { name: '关闭弹窗' }).click();
  await expectNoOverflow(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.getByRole('button', { name: '打开战报' })).toBeVisible();
  await expect(page.getByRole('button', { name: '打开终局结算' })).toBeVisible();
  await expectNoOverflow(page);

  await page.getByRole('button', { name: '打开终局结算' }).click();
  await expect(page.getByRole('dialog', {
    name: '六面旗帜，见证你的远见。',
  })).toBeVisible();
});

test('War Chest desktop keeps board, factions, and intelligence visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page);
  await page.goto(`/game/warchest/match?roomID=${roomID}`);

  const board = page.getByTestId('warchest-board');
  await expect(board).toBeVisible();
  await expect(page.getByText('军团情报', { exact: true })).toBeVisible();
  await expect(page.getByText('最近行动', { exact: true })).toBeVisible();
  const box = await board.boundingBox();
  expect(box?.width).toBeGreaterThan(450);
  expect(box?.height).toBeGreaterThan(450);
  await expectNoOverflow(page);
  await page.screenshot({ path: 'test-results/warchest-battle-desktop.png' });
});
