import { expect, test, type Page } from '@playwright/test';

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
  expect(pageBox).toMatchObject({ x: 14, y: 72, width: 362 });
  expect(padding).toEqual({ left: '14px', right: '14px' });
}

test('Othello public pages stay compact on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicData(page);

  await page.goto('/game/othello');
  const lobbyHero = page.getByTestId('othello-lobby-hero');
  await expect(lobbyHero).toBeVisible();
  await expectMobileTabGeometry(page);
  expect((await lobbyHero.boundingBox())?.height).toBeLessThanOrEqual(240);
  await page.evaluate(() => document.fonts.ready);
  const createButton = lobbyHero.getByRole('button', { name: /新开一局/ });
  const shareButton = lobbyHero.getByRole('button', { name: /分享游戏/ });
  const [createBox, shareBox] = await Promise.all([
    createButton.boundingBox(),
    shareButton.boundingBox(),
  ]);
  expect(createBox).toMatchObject({ width: 129, height: 39 });
  expect(shareBox).toMatchObject({ width: 99, height: 39 });
  expect(createBox?.y).toBe(shareBox?.y);
  await expect(page.locator('[data-testid="othello-join-card"]:visible')).toBeVisible();
  const facts = page.getByTestId('othello-lobby-facts').locator(':scope > span');
  await expect(facts).toHaveCount(3);
  const factRows = await facts.evaluateAll(elements =>
    elements.map(element => Math.round(element.getBoundingClientRect().top)));
  expect(new Set(factRows).size).toBe(1);
  const joinCard = page.locator('[data-testid="othello-join-card"]:visible');
  await joinCard.getByRole('textbox', { name: '查找房间号' }).fill('friend_room');
  const lobbyHeading = page.getByRole('heading', { name: '挑一局，慢慢想。' });
  await expect(lobbyHeading).toHaveCSS('font-size', '16px');
  await expect(lobbyHeading).toHaveCSS('line-height', '25.6px');
  await joinCard.getByRole('button', { name: '查找房间' }).click();
  await expect(page.getByRole('heading', {
    name: '对面已经留好了位置？',
  })).toBeVisible();
  await expect(page.getByText('#friend_room')).toBeVisible();
  await expectNoOverflow(page);

  await page.goto('/game/othello/rankings');
  const rankHero = page.getByTestId('othello-rank-hero');
  await expect(rankHero).toBeVisible();
  await expectMobileTabGeometry(page);
  expect((await rankHero.boundingBox())?.height).toBe(139);
  const rankPanel = page.getByRole('tablist', { name: '排行榜模式' }).locator('..');
  expect((await rankPanel.boundingBox())?.height).toBeGreaterThanOrEqual(337);
  await expectNoOverflow(page);

  await page.goto('/game/othello/guide');
  const guideVisual = page.getByTestId('othello-guide-visual');
  await expect(guideVisual).toBeVisible();
  await expectMobileTabGeometry(page);
  expect((await guideVisual.boundingBox())?.height).toBe(266);
  await expectNoOverflow(page);

  await page.goto('/game/othello/me');
  const playerID = page.getByText('PLAYER ID · 110');
  await expect(playerID).toBeVisible();
  await expectMobileTabGeometry(page);
  const identity = playerID.locator('xpath=ancestor::aside[1]');
  const history = page.getByRole('heading', { name: '过去的棋局' })
    .locator('xpath=ancestor::section[1]');
  const about = page.getByTestId('othello-about-entry');
  expect((await identity.boundingBox())?.height).toBeCloseTo(324.58, 1);
  expect((await history.boundingBox())?.height).toBe(142);
  expect((await about.boundingBox())?.height).toBe(55);
  await expectNoOverflow(page);

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/game/othello');
  await expect(page.getByTestId('othello-lobby-facts')).toBeVisible();
  await expectNoOverflow(page);
});

test('Othello public pages stay compact on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockPublicData(page);

  await page.goto('/game/othello');
  const lobbyHero = page.getByTestId('othello-lobby-hero');
  await expect(lobbyHero).toBeVisible();
  expect((await lobbyHero.boundingBox())?.height).toBeLessThanOrEqual(270);
  await expect(page.locator('[data-testid="othello-join-card"]:visible')).toBeVisible();

  await page.goto('/game/othello/rankings');
  const rankHero = page.getByTestId('othello-rank-hero');
  await expect(rankHero).toBeVisible();
  expect((await rankHero.boundingBox())?.height).toBeLessThanOrEqual(190);

  await page.goto('/game/othello/guide');
  const guideVisual = page.getByTestId('othello-guide-visual');
  await expect(guideVisual).toBeVisible();
  expect((await guideVisual.boundingBox())?.height).toBeLessThanOrEqual(420);
  await expectNoOverflow(page);
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

async function mockRoom(page: Page) {
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
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'preparing',
        nextRoundNo: 1,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z',
        players: [owner, ai],
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
      players: {
        [owner.playerID]: owner,
        [ai.playerID]: ai,
      },
      playerOrder: [owner.playerID, ai.playerID],
    }));
  });
}

test('Othello room uses the aligned two-seat mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockRoom(page);
  await page.goto(`/game/othello/match?roomID=${roomID}`);

  const seats = page.getByTestId('othello-room-seat');
  await expect(seats).toHaveCount(2);
  const boxes = await seats.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width };
  }));
  expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThanOrEqual(1);
  expect(Math.abs(boxes[0].width - boxes[1].width)).toBeLessThanOrEqual(1);
  await expect(page.getByTestId('othello-room-facts')).toBeVisible();
  await expect(page.getByRole('button', { name: '开始对局' })).toBeVisible();
  await expectNoOverflow(page);

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(seats).toHaveCount(2);
  await expectNoOverflow(page);
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
  await page.getByRole('button', { name: '收起回放面板' }).click();
  await expect(page.getByRole('button', { name: '展开回放面板' })).toBeVisible();
  const collapsed = await panel.boundingBox();
  expect(collapsed?.height).toBe(56);
  await expectNoOverflow(page);

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(panel).toBeVisible();
  await expectNoOverflow(page);
});
