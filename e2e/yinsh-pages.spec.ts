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
          gameType: 'yinsh',
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
            yinsh: {
              ringsRemoved: 0,
              progressCurrent: 0,
              progressTotal: 3,
            },
          },
        },
      },
    }));
  await page.route('**/pam-api/platform/history/stats?**', route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          totalGames: 12,
          wins: 7,
          winRate: 7 / 12,
          avgScore: 1.8,
        },
      },
    }));
  await page.route('**/pam-api/platform/rankings?**', route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          gameType: 'yinsh',
          entries: [0, 1, 2].map(index => ({
            userID: String(index + 1),
            playerID: `player-${index + 1}`,
            displayName: `棋手 ${index + 1}`,
            totalGames: 20 - index,
            metric: {
              yinsh: {
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

test('YINSH public pages stay compact on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicData(page);

  await page.goto('/game/yinsh');
  const lobbyHero = page.getByTestId('yinsh-lobby-hero');
  await expect(lobbyHero).toBeVisible();
  expect((await lobbyHero.boundingBox())?.height).toBeLessThanOrEqual(240);
  const joinCard = page.locator('[data-testid="yinsh-join-card"]:visible');
  await expect(joinCard).toBeVisible();
  const facts = page.getByTestId('yinsh-lobby-facts')
    .locator(':scope > span');
  await expect(facts).toHaveCount(3);
  const factRows = await facts.evaluateAll(elements =>
    elements.map(element =>
      Math.round(element.getBoundingClientRect().top)));
  expect(new Set(factRows).size).toBe(1);
  await joinCard.getByRole('textbox', {
    name: '查找房间号',
  }).fill('friend_room');
  await joinCard.getByRole('button', { name: '查找房间' }).click();
  await expect(page.getByRole('heading', {
    name: '对面已经留好了位置？',
  })).toBeVisible();
  await expect(page.getByText('#friend_room')).toBeVisible();
  await expectNoOverflow(page);

  await page.goto('/game/yinsh/rankings');
  const rankHero = page.getByTestId('yinsh-rank-hero');
  await expect(rankHero).toBeVisible();
  expect((await rankHero.boundingBox())?.height).toBeLessThanOrEqual(180);

  await page.goto('/game/yinsh/guide');
  const guideVisual = page.getByTestId('yinsh-guide-visual');
  await expect(guideVisual).toBeVisible();
  expect((await guideVisual.boundingBox())?.height).toBeLessThanOrEqual(220);
  await expectNoOverflow(page);

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/game/yinsh');
  await expect(page.getByTestId('yinsh-lobby-facts')).toBeVisible();
  await expectNoOverflow(page);
});

test('YINSH public pages stay compact on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockPublicData(page);

  await page.goto('/game/yinsh');
  const lobbyHero = page.getByTestId('yinsh-lobby-hero');
  await expect(lobbyHero).toBeVisible();
  expect((await lobbyHero.boundingBox())?.height).toBeLessThanOrEqual(270);
  await expect(page.locator(
    '[data-testid="yinsh-join-card"]:visible',
  )).toBeVisible();

  await page.goto('/game/yinsh/rankings');
  const rankHero = page.getByTestId('yinsh-rank-hero');
  await expect(rankHero).toBeVisible();
  expect((await rankHero.boundingBox())?.height).toBeLessThanOrEqual(190);

  await page.goto('/game/yinsh/guide');
  const guideVisual = page.getByTestId('yinsh-guide-visual');
  await expect(guideVisual).toBeVisible();
  expect((await guideVisual.boundingBox())?.height).toBeLessThanOrEqual(420);
  await expectNoOverflow(page);

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/game/yinsh');
  await expect(page.locator(
    '[data-testid="yinsh-join-card"]:visible',
  )).toBeVisible();
  await expectNoOverflow(page);
});

const roomID = 'yinsh_room_layout';
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
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'yinsh',
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
            yinsh: {
              ringsRemoved: 0,
              progressCurrent: 0,
              progressTotal: 3,
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

test('YINSH room uses the aligned two-seat mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockRoom(page);
  await page.goto(`/game/yinsh/match?roomID=${roomID}`);

  const seats = page.getByTestId('yinsh-room-seat');
  await expect(seats).toHaveCount(2);
  const boxes = await seats.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { y: box.y, width: box.width };
  }));
  expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThanOrEqual(1);
  expect(Math.abs(boxes[0].width - boxes[1].width))
    .toBeLessThanOrEqual(1);
  await expect(page.getByTestId('yinsh-room-facts')).toBeVisible();
  await expect(page.getByRole('button', {
    name: '开始对局',
  })).toBeVisible();
  await expectNoOverflow(page);

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(seats).toHaveCount(2);
  await expectNoOverflow(page);
});

test('YINSH room keeps table and facts side by side on desktop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockRoom(page);
  await page.goto(`/game/yinsh/match?roomID=${roomID}`);

  const [table, facts] = await Promise.all([
    page.getByTestId('yinsh-room-table').boundingBox(),
    page.getByTestId('yinsh-room-facts').boundingBox(),
  ]);
  expect(table?.x).toBeLessThan(facts?.x ?? 0);
  expect(Math.abs((table?.y ?? 0) - (facts?.y ?? 0)))
    .toBeLessThanOrEqual(1);
  await expectNoOverflow(page);
});

function replaySnapshot(index: number) {
  const moved = index > 0;
  const action = {
    action: 'move_ring',
    playerID: owner.playerID,
    payloadJSON: '{"from":"E4","to":"E7","side":"white","flips":[]}',
  };
  return {
    seq: index - 1,
    totalEvents: 1,
    currentEvent: moved ? {
      seq: 0,
      playerID: owner.playerID,
      displayName: owner.displayName,
      cmdType: 'game_move_ring',
      payloadJSON: action.payloadJSON,
    } : undefined,
    roomData: {
      rings: moved
        ? { E7: 'white', D3: 'black' }
        : { E4: 'white', D3: 'black' },
      markers: moved ? { E4: 'white' } : {},
      currentPlayer: moved ? ai.playerID : owner.playerID,
      gameStatus: moved ? 'end' : 'move',
      placedRings: { white: 5, black: 5 },
      markerPool: moved ? 48 : 49,
      legalMoves: {},
      candidateRows: [],
      lastAction: moved ? action : undefined,
      activity: moved ? [action] : [],
      players: {
        [owner.playerID]: owner,
        [ai.playerID]: ai,
      },
      playerOrder: [owner.playerID, ai.playerID],
      roundNo: 1,
    },
    playersData: {
      [owner.playerID]: { side: 'white', ringsRemoved: moved ? 3 : 2 },
      [ai.playerID]: { side: 'black', ringsRemoved: 1 },
    },
    result: {
      winnerID: moved ? owner.playerID : undefined,
      reason: moved ? '率先取走第三枚圆环' : '',
      ringsRemoved: { white: moved ? 3 : 2, black: 1 },
    },
  };
}

async function mockReplay(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: profile },
  }));
  await page.route('**/pam-api/platform/history/games/1/snapshots?**',
    route => route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          snapshots: [
            { yinsh: replaySnapshot(0) },
            { yinsh: replaySnapshot(1) },
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
  await page.route('**/pam-api/platform/history/games/1?**',
    route => route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          game: {
            id: '1',
            roomID: 'yinsh-replay',
            gameType: 'yinsh',
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
            cmdType: 'game_move_ring',
          }],
        },
      },
    }));
}

test('YINSH replay exposes the aligned movable mobile panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockReplay(page);
  await page.goto('/game/yinsh/replay/1');

  const panel = page.getByTestId('yinsh-replay-panel');
  await expect(panel).toBeVisible();
  await expect(page.getByRole('button', {
    name: '初始',
    exact: true,
  })).toBeVisible();
  await expect(page.getByRole('button', {
    name: '末步',
    exact: true,
  })).toBeVisible();
  await page.getByRole('button', { name: '收起回放面板' }).click();
  await expect(page.getByRole('button', {
    name: '展开回放面板',
  })).toBeVisible();
  expect((await panel.boundingBox())?.height).toBe(56);
  await expectNoOverflow(page);

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(panel).toBeVisible();
  await expectNoOverflow(page);
});
