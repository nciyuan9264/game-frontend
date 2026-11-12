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
    metrics: {
      quoridor: {
        turnCount: 0,
      },
    },
  },
  {
    game: 'hex',
    metrics: {
      hex: {
        turnCount: 0,
      },
    },
  },
  {
    game: 'hive',
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
  game: string,
) {
  const opponentSeat = page.locator(
    '[data-game-mobile-room-seat], [data-testid="' + game + '-room-seat"]',
  ).nth(1);
  const manageButton = opponentSeat.getByRole('button', {
    name: '管理席位 2',
  });
  await expect(opponentSeat).toBeVisible();
  await expect(manageButton).toBeVisible();

  const { markerBox, avatarBox, buttonBox } = await opponentSeat.evaluate(
    seat => {
      const descendants = Array.from(
        seat.querySelectorAll<HTMLElement>('*'),
      );
      const avatarWrapper = Array.from(seat.children)
        .find(element => element.tagName === 'DIV') as HTMLElement | undefined;
      const avatar = avatarWrapper
        ? avatarWrapper.getBoundingClientRect().height > 0
          ? avatarWrapper
          : avatarWrapper.firstElementChild as HTMLElement | null
        : descendants.find(element => {
          const width = Number.parseFloat(element.style.width);
          const height = Number.parseFloat(element.style.height);
          return element.tagName === 'SPAN' && width >= 40 && height >= 40;
        });
      const marker = seat.hasAttribute('data-game-mobile-room-seat')
        ? seat.children.item(1) as HTMLElement | null
        : descendants.find(element => {
          const box = element.getBoundingClientRect();
          return getComputedStyle(element).position === 'absolute'
            && !element.closest('button')
            && !element.textContent?.trim()
            && box.width >= 14
            && box.width <= 30
            && box.height >= 14
            && box.height <= 30;
        });
      const button = seat.querySelector<HTMLElement>(
        'button[aria-label="管理席位 2"]',
      );
      const rect = (element: HTMLElement | undefined | null) => {
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        };
      };
      return {
        markerBox: rect(marker),
        avatarBox: rect(avatar),
        buttonBox: rect(button),
      };
    },
  );
  expect(markerBox).not.toBeNull();
  expect(avatarBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  if (!markerBox || !avatarBox || !buttonBox) return;

  expect(overlaps(markerBox, buttonBox)).toBe(false);
  expect(
    overlaps(avatarBox, buttonBox),
    `avatar=${JSON.stringify(avatarBox)} button=${JSON.stringify(buttonBox)}`,
  ).toBe(false);
}

for (const game of games) {
  test(`${game.game} keeps side marker, avatar, and seat control separate`,
    async ({ page }) => {
      const roomID = `${game.game}_seat_controls`;
      await mockRoom(page, game, roomID);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/game/${game.game}/match?roomID=${roomID}`);
      await expectSeatControlsSeparated(page, game.game);

      await page.setViewportSize({ width: 320, height: 568 });
      await expectSeatControlsSeparated(page, game.game);

      await page.setViewportSize({ width: 1440, height: 900 });
      await expectSeatControlsSeparated(page, game.game);
    });
}
