import { expect, test, type Page } from '@playwright/test';

const owner = {
  userID: 'owner-1',
  playerID: 'owner-1',
  displayName: '房主',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
  gameRole: 'fugitive',
};

const guest = {
  userID: 'guest-2',
  playerID: 'guest-2',
  displayName: '访客',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: false,
  ready: false,
  gameRole: 'marshal',
};

const games = [
  { game: 'acquire', maxPlayers: 6 },
  { game: 'davinci', maxPlayers: 2 },
  { game: 'splendor', maxPlayers: 4 },
  { game: 'yinsh', maxPlayers: 2 },
  { game: 'othello', maxPlayers: 2 },
  { game: 'fugitive', maxPlayers: 2 },
  { game: 'warchest', maxPlayers: 2 },
  { game: 'quoridor', maxPlayers: 2 },
] as const;

function warChestSetup() {
  return {
    warchest: {
      mode: 'recommended',
      sides: {
        [owner.playerID]: 'oak',
        [guest.playerID]: 'falcon',
      },
      rosters: {
        [owner.playerID]: ['sword', 'pike', 'crossbow', 'light'],
        [guest.playerID]: ['archer', 'cavalry', 'lancer', 'scout'],
      },
      complete: true,
      initialPlayerID: owner.playerID,
      initialSide: 'oak',
    },
  };
}

async function mockRoom(
  page: Page,
  config: typeof games[number],
  roomID: string,
  actor: typeof owner | typeof guest,
) {
  const matchID = `${roomID}-r1`;
  const players = {
    [owner.playerID]: owner,
    [guest.playerID]: guest,
  };
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: actor.userID,
        display_name: actor.displayName,
        avatar: '',
      },
    },
  }));
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: config.game,
          status: 'match',
          visibility: 'private',
          displayName: '访客不可设置的房间',
          turnTimeoutSeconds: 60,
          ownerUserID: owner.userID,
          ownerPlayerID: owner.playerID,
          maxPlayers: config.maxPlayers,
          playerCount: 2,
          currentMatchID: matchID,
          currentMatchStatus: 'preparing',
          nextRoundNo: 1,
          createdAt: '2026-10-26T00:00:00Z',
          updatedAt: '2026-10-26T00:00:00Z',
          players: [owner, guest],
          metrics: {},
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
      playerID: actor.playerID,
      status: 'match',
      visibility: 'private',
      maxPlayers: config.maxPlayers,
      players,
      playerOrder: [owner.playerID, guest.playerID],
      setup: config.game === 'warchest' ? warChestSetup() : undefined,
    }));
  });
}

test.use({ viewport: { width: 390, height: 844 } });

for (const config of games) {
  test(`${config.game} hides room settings from non-owner players`,
    async ({ page }) => {
      const roomID = `${config.game}_guest_settings`;
      await mockRoom(page, config, roomID, guest);
      await page.goto(`/game/${config.game}/match?roomID=${roomID}`);

      await expect(page.getByRole('button', { name: /邀请/ }).first())
        .toBeVisible();
      await expect(page.getByRole('button', {
        name: /房间设置|房间信息|棋室设置|棋室信息/,
      })).toHaveCount(0);
      await expect(page.getByText(/私密房间|私密棋室|凭房间号加入/).first())
        .toBeVisible();
    });

  test(`${config.game} keeps room settings available to the owner`,
    async ({ page }) => {
      const roomID = `${config.game}_owner_settings`;
      await mockRoom(page, config, roomID, owner);
      await page.goto(`/game/${config.game}/match?roomID=${roomID}`);

      await expect(page.getByRole('button', {
        name: /房间设置|棋室设置/,
      })).toBeVisible();
    });
}
