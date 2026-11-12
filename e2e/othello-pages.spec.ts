import { expect, test, type Page } from '@playwright/test';
import { captureOthello } from './othello-screenshots';

const profile = {
  user_id: '110',
  display_name: '移动端棋手',
  avatar: '',
};

async function mockPublicData(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: profile },
  }));
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { rooms: [] },
    },
  }));
  await page.route('**/pam-api/platform/rooms/friend_room?**', route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID: 'friend_room',
          gameType: 'othello',
          status: 'match',
          visibility: 'private',
          ownerUserID: '220',
          ownerPlayerID: '220',
          maxPlayers: 2,
          playerCount: 1,
          currentMatchID: 'friend_room-r1',
          currentMatchStatus: 'preparing',
          nextRoundNo: 1,
          createdAt: '2026-10-25T00:00:00Z',
          updatedAt: '2026-10-25T00:00:00Z',
          players: [{
            userID: '220',
            playerID: '220',
            displayName: '朋友',
            avatar: '',
            seatIndex: 0,
            online: true,
            ai: false,
            ready: true,
          }],
          metrics: {
            othello: {
              occupiedCount: 4,
              progressCurrent: 0,
              progressTotal: 60,
            },
          },
        },
      },
    }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { totalGames: 12, wins: 7, winRate: 7 / 12, avgScore: 34 },
    },
  }));
  await page.route('**/pam-api/platform/history/games?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { games: [] },
    },
  }));
  await page.route('**/pam-api/platform/rankings?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        gameType: 'othello',
        entries: [0, 1, 2].map(index => ({
          userID: String(index + 1),
          playerID: `player-${index + 1}`,
          displayName: `棋手 ${index + 1}`,
          totalGames: 20 - index,
          metric: {
            othello: {
              wins: 12 - index,
              winRate: .6 - index * .05,
            },
          },
        })),
      },
    },
  }));
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectMobileTabGeometry(page: Page) {
  const banner = page.getByRole('banner');
  const content = page.getByRole('main');
  const pageRoot = content.locator(':scope > div').first();
  const [bannerBox, pageBox, padding] = await Promise.all([
    banner.boundingBox(),
    pageRoot.boundingBox(),
    content.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        left: style.paddingLeft,
        right: style.paddingRight,
      };
    }),
  ]);
  expect(bannerBox).toMatchObject({ width: 390, height: 57 });
  expect(pageBox).toMatchObject({ x: 14, width: 362 });
  expect(Math.abs(
    (pageBox?.y ?? 0)
    - ((bannerBox?.y ?? 0) + (bannerBox?.height ?? 0))
    - 14,
  )).toBeLessThanOrEqual(1);
  expect(padding).toEqual({ left: '14px', right: '14px' });
}

async function expectGuideFitsViewport(page: Page) {
  const guideCopy = page.locator(
    '[data-game-mobile-guide-panel], [data-testid="othello-guide-copy"]',
  ).first();
  const mobileNavigation = page.getByRole('navigation', { name: 'OTHELLO 手机导航' });
  const shell = page.getByRole('banner').locator('xpath=../..');
  const [copyBox, navigationBox, scrollState] = await Promise.all([
    guideCopy.boundingBox(),
    mobileNavigation.boundingBox(),
    shell.evaluate(element => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    })),
  ]);
  expect((copyBox?.y ?? 0) + (copyBox?.height ?? 0))
    .toBeLessThanOrEqual(navigationBox?.y ?? 0);
  expect(scrollState.scrollHeight).toBeLessThanOrEqual(scrollState.clientHeight);
}

test('Othello public pages stay compact on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicData(page);

  await page.goto('/game/othello');
  const lobbyHero = page.locator('[data-game-mobile-lobby-hero]');
  await expect(lobbyHero).toBeVisible();
  await expectMobileTabGeometry(page);
  expect((await lobbyHero.boundingBox())?.height).toBeLessThanOrEqual(240);
  await page.evaluate(() => document.fonts.ready);
  const createButton = lobbyHero.getByRole('button', { name: /创建房间/ });
  const shareButton = lobbyHero.getByRole('button', { name: /分享游戏/ });
  const [createBox, shareBox] = await Promise.all([
    createButton.boundingBox(),
    shareButton.boundingBox(),
  ]);
  expect(createBox).toMatchObject({ width: 129, height: 39 });
  expect(shareBox).toMatchObject({ width: 99, height: 39 });
  expect(createBox?.y).toBe(shareBox?.y);
  const joinCard = page.locator('[data-game-mobile-lobby-join]');
  await expect(joinCard).toBeVisible();
  const facts = page.locator('[data-game-mobile-lobby-facts] > span');
  await expect(facts).toHaveCount(3);
  const factRows = await facts.evaluateAll(elements =>
    elements.map(element => Math.round(element.getBoundingClientRect().top)));
  expect(new Set(factRows).size).toBe(1);
  await joinCard.getByRole('textbox', { name: '查找房间号' }).fill('friend_room');
  const lobbyHeading = page.getByRole('heading', { name: '挑一局，慢慢想。' });
  await expect(lobbyHeading).toHaveCSS('font-size', '16px');
  await expect(lobbyHeading).toHaveCSS('line-height', '25.6px');
  await captureOthello(page, 'othello-mobile-lobby');
  await joinCard.getByRole('button', { name: '查找房间' }).click();
  await expect(page.getByRole('heading', {
    name: '对面已经留好了位置？',
  })).toBeVisible();
  await expect(page.getByText('friend_room')).toBeVisible();
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-mobile-lobby-join-result');

  await page.goto('/game/othello/rankings');
  const rankHero = page.locator('[data-game-mobile-rank-hero]');
  await expect(rankHero).toBeVisible();
  await expectMobileTabGeometry(page);
  expect((await rankHero.boundingBox())?.height).toBeLessThanOrEqual(170);
  const rankPanel = page.locator('[data-game-mobile-rank-panel]');
  const [rankPanelBox, rankNavigationBox] = await Promise.all([
    rankPanel.boundingBox(),
    page.getByRole('navigation', { name: 'OTHELLO 手机导航' }).boundingBox(),
  ]);
  const rankPanelHeight = rankPanelBox?.height ?? 0;
  expect(rankPanelHeight).toBeGreaterThanOrEqual(260);
  expect(Math.abs(
    (rankNavigationBox?.y ?? 0)
    - ((rankPanelBox?.y ?? 0) + rankPanelHeight)
    - 14,
  )).toBeLessThanOrEqual(1);
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-mobile-rankings');

  await page.goto('/game/othello/guide');
  const guideVisual = page.locator('[data-game-mobile-guide-visual]');
  await expect(guideVisual).toBeVisible();
  await expectMobileTabGeometry(page);
  const guideVisualHeight = (await guideVisual.boundingBox())?.height ?? 0;
  expect(guideVisualHeight).toBeGreaterThanOrEqual(160);
  expect(guideVisualHeight).toBeLessThanOrEqual(190);
  await expectGuideFitsViewport(page);
  for (let index = 1; index < 4; index += 1) {
    await page.getByRole('button', { name: '下一步' }).click();
    await expectGuideFitsViewport(page);
  }
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-mobile-guide');

  await page.goto('/game/othello/me');
  const playerID = page.getByText('PLAYER ID · 110');
  await expect(playerID).not.toBeVisible();
  await expect(page.getByText('邮箱未绑定')).toBeVisible();
  await expectMobileTabGeometry(page);
  const profileRoot = page.locator('[data-game-public-mobile="profile"]');
  const identity = profileRoot.locator(':scope > section').nth(0);
  const history = page.getByRole('heading', { name: '过去的棋局' })
    .locator('xpath=ancestor::section[1]');
  const [identityBox, historyBox] = await Promise.all([
    identity.boundingBox(),
    history.boundingBox(),
  ]);
  expect(identityBox).toMatchObject({ width: 362 });
  expect(historyBox).toMatchObject({ width: 362 });
  expect(Math.abs(
    (historyBox?.y ?? 0)
    - ((identityBox?.y ?? 0) + (identityBox?.height ?? 0))
    - 14,
  )).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-game-mobile-about-entry]')).toHaveCount(0);
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-mobile-profile');

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/game/othello/guide');
  await expect(page.locator('[data-game-mobile-guide-visual]')).toBeVisible();
  await expectGuideFitsViewport(page);
  for (let index = 1; index < 4; index += 1) {
    await page.getByRole('button', { name: '下一步' }).click();
    await expectGuideFitsViewport(page);
  }

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/game/othello');
  await expect(page.locator('[data-game-mobile-lobby-facts]')).toBeVisible();
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-mobile-lobby-320x568');
});

test('Othello public pages stay compact on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockPublicData(page);

  await page.goto('/game/othello');
  const lobbyHero = page.getByTestId('othello-lobby-hero');
  await expect(lobbyHero).toBeVisible();
  expect((await lobbyHero.boundingBox())?.height).toBeLessThanOrEqual(270);
  await expect(page.locator('[data-testid="othello-join-card"]:visible')).toBeVisible();
  await captureOthello(page, 'othello-desktop-lobby');

  await page.goto('/game/othello/rankings');
  const rankHero = page.getByTestId('othello-rank-hero');
  await expect(rankHero).toBeVisible();
  expect((await rankHero.boundingBox())?.height).toBeLessThanOrEqual(190);
  await captureOthello(page, 'othello-desktop-rankings');

  await page.goto('/game/othello/guide');
  const guideVisual = page.getByTestId('othello-guide-visual');
  await expect(guideVisual).toBeVisible();
  expect((await guideVisual.boundingBox())?.height).toBeLessThanOrEqual(420);
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-desktop-guide');
});

const roomID = 'othello_room_layout';
const matchID = `${roomID}-r1`;
const owner = {
  playerID: profile.user_id,
  displayName: profile.display_name,
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_2',
  displayName: '墨白',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

async function mockRoom(page: Page, roomPlayers = [owner, ai]) {
  const players = Object.fromEntries(roomPlayers.map(player =>
    [player.playerID, player]));
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: profile },
  }));
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'othello',
        status: 'match',
        visibility: 'private',
        ownerUserID: profile.user_id,
        ownerPlayerID: owner.playerID,
        maxPlayers: 2,
        playerCount: roomPlayers.length,
        currentMatchID: matchID,
        currentMatchStatus: 'preparing',
        nextRoundNo: 1,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z',
        players: roomPlayers,
        metrics: {
          othello: {
            occupiedCount: 4,
            progressCurrent: 0,
            progressTotal: 60,
          },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify({
      schemaVersion: 2,
      type: 'MATCH_SYNC',
      roomID,
      matchID,
      seq: 2,
      ownerID: owner.playerID,
      playerID: owner.playerID,
      status: 'match',
      visibility: 'private',
      maxPlayers: 2,
      players,
      playerOrder: roomPlayers.map(player => player.playerID),
    }));
  });
}

test('Othello room uses the aligned two-seat mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockRoom(page, [owner]);
  await page.goto(`/game/othello/match?roomID=${roomID}`);

  const seats = page.locator('[data-game-mobile-room-seat]');
  await expect(seats).toHaveCount(2);
  const boxes = await seats.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width };
  }));
  expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThanOrEqual(1);
  expect(Math.abs(boxes[0].width - boxes[1].width)).toBeLessThanOrEqual(1);
  const seatMarkers = seats.first().locator('span[aria-hidden="true"]');
  await expect(seatMarkers).toHaveCount(2);
  const [discBox, avatarBox] = await Promise.all([
    seatMarkers.nth(0).boundingBox(),
    seatMarkers.nth(1).boundingBox(),
  ]);
  expect(discBox).not.toBeNull();
  expect(avatarBox).not.toBeNull();
  expect(
    (discBox?.x ?? 0) < (avatarBox?.x ?? 0) + (avatarBox?.width ?? 0)
      && (discBox?.x ?? 0) + (discBox?.width ?? 0) > (avatarBox?.x ?? 0)
      && (discBox?.y ?? 0) < (avatarBox?.y ?? 0) + (avatarBox?.height ?? 0)
      && (discBox?.y ?? 0) + (discBox?.height ?? 0) > (avatarBox?.y ?? 0)
  ).toBe(true);
  await expect(page.getByRole('button', { name: '在席位 2 添加人机' })).toBeVisible();
  await expect(page.locator('[data-game-mobile-room-summary]')).toBeVisible();
  await expect(page.locator('[data-game-mobile-room-dock]')).toBeVisible();
  await expect(page.getByRole('button', { name: '开始对局' })).toBeVisible();
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-mobile-room');

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(seats).toHaveCount(2);
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-mobile-room-320x568');
});

test('Othello refresh keeps one stable session loading view', async ({ page }) => {
  await page.addInitScript(() => {
    const state = {
      labels: [] as string[],
      maxVisible: 0,
    };
    Object.defineProperty(window, '__othelloLoadingState', {
      configurable: true,
      value: state,
    });
    const collect = () => {
      const statuses = Array.from(document.querySelectorAll<HTMLElement>(
        '[role="status"]'
      ));
      state.maxVisible = Math.max(state.maxVisible, statuses.length);
      statuses.forEach(status => {
        const label = status.getAttribute('aria-label') || '';
        if (label && !state.labels.includes(label)) state.labels.push(label);
      });
    };
    new MutationObserver(collect).observe(document, {
      childList: true,
      subtree: true,
    });
  });
  await mockRoom(page);
  await page.goto(`/game/othello/match?roomID=${roomID}`);
  await expect(page.getByTestId('othello-room-seat')).toHaveCount(2);

  const loadingState = await page.evaluate(() =>
    (window as unknown as Window & {
      __othelloLoadingState: {
        labels: string[];
        maxVisible: number;
      };
    }).__othelloLoadingState
  );
  expect(loadingState.labels).toEqual(['正在同步身份、席位与最新对局状态']);
  expect(loadingState.maxVisible).toBe(1);
});

test('Othello room keeps table and facts side by side on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockRoom(page);
  await page.goto(`/game/othello/match?roomID=${roomID}`);

  const [table, facts] = await Promise.all([
    page.getByTestId('othello-room-table').boundingBox(),
    page.getByTestId('othello-room-facts').boundingBox(),
  ]);
  expect(table?.x).toBeLessThan(facts?.x ?? 0);
  expect(Math.abs((table?.y ?? 0) - (facts?.y ?? 0))).toBeLessThanOrEqual(1);
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-desktop-room');
});

function replayBoard(moved = false) {
  const board = Array.from({ length: 64 }, () => '');
  board[27] = moved ? 'black' : 'white';
  board[28] = 'black';
  board[35] = 'black';
  board[36] = 'white';
  if (moved) board[19] = 'black';
  return board;
}

function replaySnapshot(index: number) {
  const moved = index > 0;
  const move = {
    id: 1,
    kind: 'move',
    playerID: owner.playerID,
    side: 'black',
    index: 19,
    flips: [27],
  };
  return {
    seq: index - 1,
    totalEvents: 1,
    currentEvent: moved ? {
      seq: 0,
      playerID: owner.playerID,
      displayName: owner.displayName,
      cmdType: 'game_place_disc',
      payloadJSON: '{"index":19}',
    } : undefined,
    roomData: {
      board: replayBoard(moved),
      currentPlayer: moved ? ai.playerID : owner.playerID,
      currentSide: moved ? 'white' : 'black',
      blackPlayerID: owner.playerID,
      whitePlayerID: ai.playerID,
      roundNo: 1,
      gameStatus: moved ? 'end' : 'playing',
      legalMoves: [],
      moveLog: moved ? [move] : [],
      lastData: moved ? move : undefined,
      players: {
        [owner.playerID]: owner,
        [ai.playerID]: ai,
      },
      playerOrder: [owner.playerID, ai.playerID],
    },
    playersData: {
      [owner.playerID]: { side: 'black', discCount: moved ? 4 : 2 },
      [ai.playerID]: { side: 'white', discCount: moved ? 1 : 2 },
    },
    result: {
      blackCount: moved ? 4 : 2,
      whiteCount: moved ? 1 : 2,
      winnerID: moved ? owner.playerID : undefined,
      winnerSide: moved ? 'black' : undefined,
      draw: !moved,
      reason: moved ? '双方均无合法落点' : '',
    },
  };
}

async function mockReplay(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: profile },
  }));
  await page.route('**/pam-api/platform/history/games/1/snapshots?**', route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          snapshots: [
            { othello: replaySnapshot(0) },
            { othello: replaySnapshot(1) },
          ],
          totalEvents: 1,
          totalSnapshots: 2,
          page: {
            offset: 0,
            limit: 20,
            nextOffset: 2,
            hasMore: false,
            total: 2,
          },
        },
      },
    }));
  await page.route('**/pam-api/platform/history/games/1?**', route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          game: {
            id: '1',
            roomID: 'othello-replay',
            gameType: 'othello',
            startedAt: '2026-10-25T00:00:00Z',
            endedAt: '2026-10-25T00:01:00Z',
            durationSeconds: 60,
            maxPlayers: 2,
            createdAt: '2026-10-25T00:00:00Z',
            updatedAt: '2026-10-25T00:01:00Z',
          },
          players: [{
            id: '1',
            gameID: '1',
            userID: profile.user_id,
            playerID: owner.playerID,
            displayName: owner.displayName,
            seatIndex: 0,
            isAI: false,
            finalStocks: 0,
            isWinner: true,
            createdAt: '2026-10-25T00:00:00Z',
          }],
          events: [{
            seq: 0,
            playerID: owner.playerID,
            displayName: owner.displayName,
            cmdType: 'game_place_disc',
          }],
        },
      },
    }));
}

test('Othello replay exposes the aligned movable mobile panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockReplay(page);
  await page.goto('/game/othello/replay/1');

  const panel = page.getByTestId('othello-replay-panel');
  await expect(panel).toBeVisible();
  await expect(page.getByRole('button', { name: '初始', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '末步', exact: true })).toBeVisible();
  await captureOthello(page, 'othello-mobile-replay');
  await page.getByRole('button', { name: '收起回放面板' }).click();
  await expect(page.getByRole('button', { name: '展开回放面板' })).toBeVisible();
  const collapsed = await panel.boundingBox();
  expect(collapsed?.height).toBe(56);
  await expectNoOverflow(page);
  await page.getByRole('button', { name: '展开回放面板' }).click();

  await page.getByRole('button', { name: '最终结算' }).click();
  await expect(page.locator('[data-game-final-result]')).toBeVisible();
  await expect(page.locator('[data-game-final-result-actions] button'))
    .toHaveCount(1);
  await captureOthello(page, 'othello-mobile-replay-results');
  await page.getByRole('button', { name: '回到回放棋盘' }).click();
  await expect(panel).toBeVisible();

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(panel).toBeVisible();
  await expectNoOverflow(page);
  await captureOthello(page, 'othello-mobile-replay-320x568');
});
