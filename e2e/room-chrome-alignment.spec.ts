import { expect, test, type Page } from '@playwright/test';

const roomID = 'room_chrome_alignment';
const matchID = `${roomID}-r1`;
const owner = {
  userID: 'room-owner',
  playerID: 'room-owner',
  displayName: '房主',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
  gameRole: 'fugitive',
};
const guest = {
  userID: 'room-guest',
  playerID: 'room-guest',
  displayName: '访客',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: false,
  ready: false,
  gameRole: 'marshal',
};
const players = {
  [owner.playerID]: owner,
  [guest.playerID]: guest,
};

const games = [
  { game: 'acquire', maxPlayers: 6 },
  { game: 'cantstop', maxPlayers: 4 },
  { game: 'davinci', maxPlayers: 2 },
  { game: 'forsale', maxPlayers: 6 },
  { game: 'fugitive', maxPlayers: 2 },
  { game: 'hex', maxPlayers: 2 },
  { game: 'hive', maxPlayers: 2 },
  { game: 'loveletter', maxPlayers: 6 },
  { game: 'onitama', maxPlayers: 2 },
  { game: 'othello', maxPlayers: 2 },
  { game: 'quoridor', maxPlayers: 2 },
  { game: 'sixnimmt', maxPlayers: 10 },
  { game: 'splendor', maxPlayers: 4 },
  { game: 'warchest', maxPlayers: 2 },
  { game: 'yinsh', maxPlayers: 2 },
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
) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: owner.userID,
        display_name: owner.displayName,
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
          displayName: '标准准备房间',
          turnTimeoutSeconds: 60,
          ownerUserID: owner.userID,
          ownerPlayerID: owner.playerID,
          maxPlayers: config.maxPlayers,
          playerCount: 2,
          currentMatchID: matchID,
          currentMatchStatus: 'preparing',
          nextRoundNo: 1,
          createdAt: '2026-10-28T00:00:00Z',
          updatedAt: '2026-10-28T00:00:00Z',
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
      playerID: owner.playerID,
      status: 'match',
      visibility: 'private',
      maxPlayers: config.maxPlayers,
      players,
      playerOrder: [owner.playerID, guest.playerID],
      setup: config.game === 'warchest' ? warChestSetup() : undefined,
    }));
  });
}

async function readChromeGeometry(page: Page) {
  return page.evaluate(() => {
    const brandRoot = document.querySelector<HTMLElement>('[data-game-brand]');
    const brandCandidates = brandRoot
      ? [brandRoot, ...brandRoot.querySelectorAll<HTMLElement>('*')]
      : [];
    const brand = brandCandidates.find(element => {
      const display = getComputedStyle(element).display;
      return (display === 'flex' || display === 'inline-flex')
        && element.children.length >= 2;
    });
    const heading = document.querySelector<HTMLElement>('[data-game-room-heading]');
    const identity = document.querySelector<HTMLElement>(
      '[data-game-room-heading-identity]',
    );
    const back = document.querySelector<HTMLElement>(
      '[data-game-room-heading-back]',
    );
    const actions = document.querySelector<HTMLElement>(
      '[data-game-room-heading-actions]',
    );
    const title = document.querySelector<HTMLElement>(
      '[data-game-room-heading-title]',
    );
    const kicker = document.querySelector<HTMLElement>(
      '[data-game-room-heading-kicker]',
    );
    const buttons = actions
      ? [...actions.querySelectorAll<HTMLElement>(':scope > button')]
      : [];
    const stage = document.querySelector<HTMLElement>(
      '[data-game-mobile-room-stage]',
    );
    const media = document.querySelector<HTMLElement>(
      '[data-game-mobile-room-media]',
    );
    const seats = document.querySelector<HTMLElement>(
      '[data-game-mobile-room-seats]',
    );
    const headingStyle = heading ? getComputedStyle(heading) : undefined;
    const stageBox = stage?.getBoundingClientRect();
    const seatsBox = seats?.getBoundingClientRect();
    return {
      brandGap: brand ? getComputedStyle(brand).columnGap : '',
      heading: heading?.getBoundingClientRect().toJSON(),
      headingDisplay: headingStyle?.display ?? '',
      headingDirection: headingStyle?.flexDirection ?? '',
      headingAlign: headingStyle?.alignItems ?? '',
      headingGap: headingStyle?.rowGap ?? '',
      headingMarginLeft: headingStyle?.marginLeft ?? '',
      headingMarginRight: headingStyle?.marginRight ?? '',
      headingMarginBottom: headingStyle?.marginBottom ?? '',
      identityGap: identity ? getComputedStyle(identity).columnGap : '',
      identity: identity?.getBoundingClientRect().toJSON(),
      title: title?.getBoundingClientRect().toJSON(),
      kicker: kicker?.getBoundingClientRect().toJSON(),
      back: back?.getBoundingClientRect().toJSON(),
      actionsGap: actions ? getComputedStyle(actions).columnGap : '',
      buttonHeights: buttons.map(button => button.getBoundingClientRect().height),
      mediaPosition: media ? getComputedStyle(media).position : '',
      seatOffset: stageBox && seatsBox ? seatsBox.y - stageBox.y : -1,
      metaVisible: !!document.querySelector<HTMLElement>(
        '[data-game-room-heading-meta]',
      )?.offsetParent,
    };
  });
}

test.use({ viewport: { width: 390, height: 844 } });

for (const config of games) {
  test(`${config.game} aligns mobile room chrome with Acquire`,
    async ({ page }) => {
      await mockRoom(page, config);
      await page.goto(`/game/${config.game}/match?roomID=${roomID}`);
      await expect(page.locator('[data-game-room-heading]')).toBeVisible();

      const geometry = await readChromeGeometry(page);
      expect(geometry.brandGap).toBe('8px');
      expect(geometry.headingDisplay).toBe('flex');
      expect(geometry.headingDirection).toBe('column');
      expect(geometry.headingAlign).toBe('stretch');
      expect(geometry.headingGap).toBe('16px');
      expect(geometry.headingMarginLeft).toBe('2px');
      expect(geometry.headingMarginRight).toBe('2px');
      expect(geometry.headingMarginBottom).toBe('17px');
      expect(geometry.identityGap).toBe('10px');
      expect(geometry.back).toMatchObject({ width: 36, height: 36 });
      expect(geometry.actionsGap).toBe('8px');
      expect(geometry.buttonHeights.length).toBeGreaterThan(0);
      for (const height of geometry.buttonHeights) expect(height).toBe(35);
      expect(geometry.metaVisible).toBe(false);
      expect(geometry.heading?.height ?? 0).toBeGreaterThanOrEqual(90);
      expect(geometry.heading?.height ?? 0).toBeLessThanOrEqual(104);
      expect(geometry.heading?.x ?? 100).toBeLessThanOrEqual(20);
      expect(geometry.heading?.width ?? 0).toBeGreaterThanOrEqual(350);
      if (geometry.mediaPosition) expect(geometry.mediaPosition).toBe('absolute');
      expect(geometry.seatOffset).toBeGreaterThanOrEqual(0);
      expect(geometry.seatOffset).toBeLessThanOrEqual(24);
      if (config.game === 'quoridor' || config.game === 'onitama') {
        for (const viewport of [
          { width: 390, height: 844 },
          { width: 320, height: 568 },
        ]) {
          await page.setViewportSize(viewport);
          const seat = page.locator('[data-game-mobile-room-seat]').first();
          const status = seat.getByText('准备就绪');
          const [seatBox, statusBox] = await Promise.all([
            seat.boundingBox(),
            status.boundingBox(),
          ]);
          expect(seatBox).not.toBeNull();
          expect(statusBox).not.toBeNull();
          expect(statusBox!.y + statusBox!.height)
            .toBeLessThanOrEqual(seatBox!.y + seatBox!.height);
        }
      }
    });
}
