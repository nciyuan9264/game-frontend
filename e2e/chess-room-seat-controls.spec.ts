import { expect, test, type Page } from '@playwright/test';

const profile = {
  user_id: '110',
  display_name: '房主棋手',
  avatar: '',
};

const owner = {
  userID: profile.user_id,
  playerID: profile.user_id,
  displayName: profile.display_name,
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};

const opponent = {
  playerID: 'ai_2',
  displayName: '墨白',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

const games = [
  {
    game: 'othello',
    seatTestID: 'othello-room-seat',
    metrics: {
      othello: {
        occupiedCount: 4,
        progressCurrent: 0,
        progressTotal: 60,
      },
    },
  },
  {
    game: 'yinsh',
    seatTestID: 'yinsh-room-seat',
    metrics: {
      yinsh: {
        ringsRemoved: 0,
        progressCurrent: 0,
        progressTotal: 3,
      },
    },
  },
  {
    game: 'quoridor',
    seatTestID: 'quoridor-room-seat',
    metrics: {
      quoridor: {
        turnCount: 0,
      },
    },
  },
  {
    game: 'hex',
    seatTestID: 'hex-room-seat',
    metrics: {
      hex: {
        turnCount: 0,
      },
    },
  },
  {
    game: 'hive',
    seatTestID: 'hive-room-seat',
    metrics: {
      hive: {
        turnCount: 0,
        placedPieceCount: 0,
        progressCurrent: 0,
        progressTotal: 6,
      },
    },
  },
] as const;

async function mockRoom(
  page: Page,
  game: typeof games[number],
  roomID: string,
) {
  const matchID = `${roomID}-r1`;
  const players = {
    [owner.playerID]: owner,
    [opponent.playerID]: opponent,
  };
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
          gameType: game.game,
          status: 'match',
          visibility: 'private',
          ownerUserID: profile.user_id,
          ownerPlayerID: owner.playerID,
          maxPlayers: 2,
          playerCount: 2,
          currentMatchID: matchID,
          currentMatchStatus: 'preparing',
          nextRoundNo: 1,
          createdAt: '2026-10-26T00:00:00Z',
          updatedAt: '2026-10-26T00:00:00Z',
          players: [owner, opponent],
          metrics: game.metrics,
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
      playerOrder: [owner.playerID, opponent.playerID],
    }));
  });
}

function overlaps(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

async function expectSeatControlsSeparated(
  page: Page,
  seatTestID: string,
) {
  const opponentSeat = page.getByTestId(seatTestID).nth(1);
  const decorativeSpans = opponentSeat.locator(
    ':scope > span[aria-hidden="true"]',
  );
  const sideMarker = decorativeSpans.nth(0);
  const avatar = decorativeSpans.nth(1);
  const manageButton = opponentSeat.getByRole('button', {
    name: '管理席位 2',
  });
  await expect(decorativeSpans).toHaveCount(2);
  await expect(manageButton).toBeVisible();

  const [markerBox, avatarBox, buttonBox] = await Promise.all([
    sideMarker.boundingBox(),
    avatar.boundingBox(),
    manageButton.boundingBox(),
  ]);
  expect(markerBox).not.toBeNull();
  expect(avatarBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  if (!markerBox || !avatarBox || !buttonBox) return;

  expect(buttonBox.x - (markerBox.x + markerBox.width))
    .toBeGreaterThanOrEqual(6);
  expect(overlaps(markerBox, avatarBox)).toBe(false);
  expect(overlaps(markerBox, buttonBox)).toBe(false);
  expect(overlaps(avatarBox, buttonBox)).toBe(false);
}

for (const game of games) {
  test(`${game.game} keeps side marker, avatar, and seat control separate`,
    async ({ page }) => {
      const roomID = `${game.game}_seat_controls`;
      await mockRoom(page, game, roomID);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/game/${game.game}/match?roomID=${roomID}`);
      await expectSeatControlsSeparated(page, game.seatTestID);

      await page.setViewportSize({ width: 320, height: 568 });
      await expectSeatControlsSeparated(page, game.seatTestID);

      await page.setViewportSize({ width: 1440, height: 900 });
      await expectSeatControlsSeparated(page, game.seatTestID);
    });
}
