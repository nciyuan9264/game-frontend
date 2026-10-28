import { expect, test, type Page, type TestInfo } from '@playwright/test';

const roomID = 'cantstop_vfw7hms8fza5';
const matchID = `${roomID}-r1`;
const human = {
  userID: 'cantstop-mobile',
  playerID: 'cantstop-mobile',
  displayName: 'N次元',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  userID: '',
  playerID: 'ai_2',
  displayName: '阿橙',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

async function mockPublic(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: 'cantstop-mobile',
        display_name: '登山玩家',
        avatar: '',
      },
    },
  }));
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: { rooms: [] } },
  }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { totalGames: 6, wins: 2, winRate: 0.333, avgScore: 2.4 },
    },
  }));
}

function matchSnapshot() {
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID,
    matchID,
    seq: '5',
    ownerID: human.playerID,
    status: 'match',
    playerID: human.playerID,
    visibility: 'public',
    maxPlayers: 4,
    players: {
      [human.playerID]: human,
      [ai.playerID]: ai,
    },
    playerOrder: [human.playerID, ai.playerID],
  };
}

async function mockMatchRoom(page: Page) {
  await mockPublic(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'cantstop',
        status: 'match',
        visibility: 'public',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 4,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'preparing',
        nextRoundNo: 1,
        createdAt: '2026-10-28T00:00:00Z',
        updatedAt: '2026-10-28T00:00:00Z',
        displayName: '再高一点',
        turnTimeoutSeconds: 60,
        players: [human, ai],
        metrics: {
          cantstop: { maxClaimedColumns: 0, progressCurrent: 0, progressTotal: 3 },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(matchSnapshot()));
  });
}

function gameSnapshot() {
  const lastAction = {
    id: 1,
    kind: 'roll',
    playerID: human.playerID,
    dice: [5, 2, 2, 1],
    columns: [],
    gain: 0,
    turnNumber: 1,
    rollNumber: 1,
    automatic: false,
    summary: '',
  };
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: '12',
    view: {
      cantstop: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: {
            savedProgress: {},
            claimedColumns: [],
            savedStepCount: 0,
            busts: 0,
          },
          [ai.playerID]: {
            savedProgress: {},
            claimedColumns: [],
            savedStepCount: 0,
            busts: 0,
          },
        },
        roomData: {
          gameStatus: 'choose',
          currentPlayer: human.playerID,
          nextPlayer: ai.playerID,
          turnNumber: 1,
          rollNumber: 1,
          dice: [5, 2, 2, 1],
          pairingOptions: [
            {
              actionID: 'pair-7-3',
              pairingIndex: 0,
              variantIndex: 0,
              sums: [7, 3],
              diceIndexes: [0, 1, 2, 3],
              advances: { 7: 1, 3: 1 },
              runnerPositions: { 7: 1, 3: 1 },
              stepCount: 2,
            },
            {
              actionID: 'pair-6-4',
              pairingIndex: 1,
              variantIndex: 0,
              sums: [6, 4],
              diceIndexes: [0, 3, 1, 2],
              advances: { 6: 1, 4: 1 },
              runnerPositions: { 6: 1, 4: 1 },
              stepCount: 2,
            },
          ],
          runners: {},
          claimedBy: {},
          activityLog: [lastAction],
          lastAction,
          bustRisk: 0.18,
          turnGain: 0,
          lostGain: 0,
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

async function mockGameSession(page: Page) {
  const commands: string[] = [];
  await mockPublic(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'cantstop',
        status: 'playing',
        visibility: 'private',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 4,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'running',
        nextRoundNo: 1,
        createdAt: '2026-10-28T00:00:00Z',
        updatedAt: '2026-10-28T00:00:00Z',
        displayName: '再高一点',
        turnTimeoutSeconds: 60,
        players: [human, ai],
        metrics: {
          cantstop: { maxClaimedColumns: 0, progressCurrent: 0, progressTotal: 3 },
        },
      },
    },
  }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(gameSnapshot()));
    socket.onMessage(message => commands.push(String(message)));
  });
  return commands;
}

const expectNoOverflow = async (page: Page) => {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
};

const capture = async (page: Page, info: TestInfo, name: string) =>
  page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });

test('Cant Stop mobile lobby uses the Acquire scale and spacing',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockPublic(page);
    await page.goto('/game/cantstop');
    await expect(page.getByRole('heading', { name: /再高一点/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /创建房间/ })).toBeVisible();
    const geometry = await page.evaluate(() => {
      const rect = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect();
      return {
        contentPaddingLeft: getComputedStyle(document.querySelector('.cs-content')!)
          .paddingLeft,
        heroArt: rect('.cs-hero-art'),
        hero: rect('.cs-hero'),
        heroHeight: rect('.cs-hero')?.height ?? 0,
        facts: rect('.cs-facts'),
        factsHeight: rect('.cs-facts')?.height ?? 0,
        browser: rect('.cs-room-browser'),
        search: rect('.cs-room-tools label'),
        heading: rect('.cs-room-browser h2'),
        empty: rect('.cs-empty'),
        emptyHeight: rect('.cs-empty')?.height ?? 0,
        joinTop: rect('.cs-join-card')?.top ?? 0,
        navTop: rect('.cs-mobile-nav')?.top ?? window.innerHeight,
      };
    });
    expect(geometry.contentPaddingLeft).toBe('14px');
    expect(geometry.heroArt?.width ?? 0).toBeGreaterThan(190);
    expect(geometry.heroArt?.height ?? 0).toBeGreaterThan(190);
    expect(geometry.hero).toMatchObject({ x: 14, y: 72, width: 362, height: 227 });
    expect(geometry.facts).toMatchObject({ x: 14, y: 299, width: 362, height: 63 });
    expect(geometry.browser).toMatchObject({ x: 14, y: 381, width: 362 });
    expect(geometry.search).toMatchObject({ x: 14, width: 362, height: 39 });
    expect(geometry.heading).toMatchObject({ y: 395.59375, height: 25.59375 });
    expect(geometry.heroHeight).toBe(227);
    expect(geometry.factsHeight).toBe(63);
    expect(geometry.emptyHeight).toBe(340);
    expect(geometry.joinTop).toBeGreaterThanOrEqual(
      (geometry.empty?.y ?? 0) + (geometry.empty?.height ?? 0) + 12,
    );
    await expectNoOverflow(page);
    await capture(page, info, 'lobby-mobile');
  });

test('Cant Stop mobile room follows the Acquire preparation layout',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockMatchRoom(page);
    await page.goto(`/game/cantstop/match?roomID=${roomID}`);
    await expect(page.locator('.cs-room-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: roomID })).toBeVisible();
    await expect(page.locator('.cs-seat')).toHaveCount(4);

    const geometry = await page.locator('.cs-seat-grid').evaluate(element => {
      const rect = (selector: string) =>
        document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
      const seat = element.querySelector<HTMLElement>('.cs-seat');
      const style = getComputedStyle(element);
      const columns = style.gridTemplateColumns.split(' ').filter(Boolean);
      const brand = document.querySelector<HTMLElement>('.cs-brand, .cs-brand-link');
      const headingLine = rect('.cs-room-heading > div');
      const headingCopy = rect('.cs-room-heading > div > span');
      const label = rect('.cs-room-heading small');
      const roomName = rect('.cs-room-heading h1');
      const roomMeta = rect('.cs-room-heading p');
      const grid = element.getBoundingClientRect();
      const seatBox = seat?.getBoundingClientRect();
      return {
        brandGap: brand ? getComputedStyle(brand).columnGap : '',
        columns: columns.length,
        headingLineHeight: headingLine?.height ?? 0,
        headingCopyHeight: headingCopy?.height ?? 0,
        labelToTitleGap: label && roomName ? roomName.top - label.bottom : 0,
        titleToMetaGap: roomName && roomMeta ? roomMeta.top - roomName.bottom : 0,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        seatInset: seatBox ? seatBox.left - grid.left : 0,
        seatWidth: seatBox?.width ?? 0,
        seatHeight: seatBox?.height ?? 0,
      };
    });
    expect(geometry.brandGap).toBe('8px');
    expect(geometry.columns).toBe(2);
    expect(geometry.headingLineHeight).toBeLessThanOrEqual(50);
    expect(geometry.headingCopyHeight).toBeLessThanOrEqual(45);
    expect(geometry.labelToTitleGap).toBeLessThanOrEqual(4);
    expect(geometry.titleToMetaGap).toBeLessThanOrEqual(3);
    expect(geometry.paddingLeft).toBe('10px');
    expect(geometry.paddingRight).toBe('10px');
    expect(geometry.seatInset).toBe(10);
    expect(geometry.seatWidth).toBeGreaterThan(160);
    expect(geometry.seatHeight).toBeLessThanOrEqual(140);
    await expectNoOverflow(page);
    await capture(page, info, 'room-mobile');
  });

test('Cant Stop mobile choose phase keeps pairing controls visible',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const commands = await mockGameSession(page);
    await page.goto(`/game/cantstop/match?roomID=${roomID}`);

    await expect(page.getByTestId('cantstop-play')).toBeVisible();
    await expect(page.locator('.cs-dice-tray')).toBeVisible();
    await expect(page.locator('.cs-pairings button')).toHaveCount(2);
    await expect(page.getByRole('button', { name: '配对 1：7 和 3' })).toBeVisible();
    await expect(page.getByRole('button', { name: '查看最近记录' })).toBeVisible();

    const dockAdvance = page.locator('.cs-mobile-dock')
      .getByRole('button', { name: /前进/ });
    await expect(dockAdvance).toBeDisabled();
    await page.getByRole('button', { name: '配对 1：7 和 3' }).click();
    await expect(dockAdvance).toBeEnabled();
    await dockAdvance.click();
    await expect.poll(() => commands.some(command =>
      command.includes('"game_advance"')
      && command.includes('"actionID":"pair-7-3"'))).toBe(true);

    await page.getByRole('button', { name: '查看最近记录' }).click();
    await expect(page.getByRole('dialog', { name: '回合记录' })).toBeVisible();
    await expectNoOverflow(page);
    await capture(page, info, 'choose-mobile');
  });
