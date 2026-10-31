import {
  expect,
  test,
  type Page,
  type TestInfo,
} from '@playwright/test';
import { expectMobileFinalResultLayout } from './helpers';

const roomID = 'forsale_kq1n52s1wwnm';
const matchID = `${roomID}-r1`;
const players = [
  {
    userID: '110',
    playerID: '110',
    displayName: '周末买家',
    avatar: '',
    seatIndex: 0,
    online: true,
    ai: false,
    ready: true,
  },
  {
    playerID: 'ai_2',
    displayName: '阿橙',
    avatar: '',
    seatIndex: 1,
    online: true,
    ai: true,
    ready: true,
  },
  {
    playerID: 'ai_3',
    displayName: '松子',
    avatar: '',
    seatIndex: 2,
    online: true,
    ai: true,
    ready: true,
  },
];

const gameSnapshot = (count = 3) => {
  const activePlayers = players.slice(0, count);
  const order = activePlayers.map(player => player.playerID);
  const roomPlayers = Object.fromEntries(
    activePlayers.map(player => [player.playerID, player]),
  );
  const playerData = Object.fromEntries(activePlayers.map((player, index) => [
    player.playerID,
    {
      seatIndex: index,
      bid: index,
      passed: false,
      propertyCount: 1,
      chequeCount: 0,
      locked: false,
      ...(index === 0 ? {
        coins: 25,
        properties: [12],
        cheques: [],
        actionDeadline: new Date(Date.now() + 60_000).toISOString(),
        actionTimeoutMs: '60000',
      } : {}),
    },
  ]));
  const market = count === 3 ? [4, 19, 27] : [2, 7, 12, 18, 24, 30];
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: '12',
    view: {
      forSale: {
        playerId: '110',
        ownerID: '110',
        visibility: 'private',
        playerData,
        result: undefined as Record<string, {
          chequeTotal: number;
          coins: number;
          total: number;
          rank: number;
          winner: boolean;
        }> | undefined,
        roomData: {
          gameStatus: 'auction',
          round: 2,
          totalRounds: count === 3 ? 8 : 5,
          propertyMarket: market,
          chequeMarket: [],
          highestBid: 2,
          currentPlayer: '110',
          starterPlayer: '110',
          lockedCount: 0,
          purchases: [],
          sales: [],
          actionLog: [],
          players: roomPlayers,
          playerOrder: order,
        },
      },
    },
  };
};

async function mockProfile(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: '110',
        display_name: '周末买家',
        email: 'buyer@example.com',
        avatar: '',
      },
    },
  }));
}

async function mockPublic(page: Page) {
  await mockProfile(page);
  await page.route('**/pam-api/platform/rooms?**', route => route.fulfill({
    json: { status_code: 0, message: 'ok', data: { rooms: [] } },
  }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: { totalGames: 8, wins: 3, winRate: .375, avgScore: 43 },
    },
  }));
}

const saleSnapshot = (status: 'sellSelect' | 'sellLocked' | 'sellReveal' | 'end') => {
  const snapshot = gameSnapshot(3);
  const view = snapshot.view.forSale;
  view.roomData.gameStatus = status;
  view.roomData.round = 4;
  view.roomData.propertyMarket = [];
  view.roomData.currentPlayer = '';
  view.roomData.chequeMarket = status === 'sellReveal' || status === 'end'
    ? [] : [0, 8, 15];
  view.playerData['110'] = {
    ...view.playerData['110'],
    bid: 0,
    propertyCount: status === 'sellReveal' || status === 'end' ? 2 : 3,
    chequeCount: status === 'end' ? 8 : 3,
    coins: 7,
    properties: status === 'sellReveal' || status === 'end' ? [4, 27] : [4, 12, 27],
    cheques: status === 'end' ? [2, 4, 5, 7, 8, 10, 12, 15] : [4, 7, 12],
    locked: status === 'sellLocked',
    lockedProperty: status === 'sellLocked' ? 12 : undefined,
    actionDeadline: status === 'sellSelect'
      ? new Date(Date.now() + 60_000).toISOString() : undefined,
  };
  if (status === 'sellLocked') {
    view.roomData.lockedCount = 3;
    for (const id of ['ai_2', 'ai_3']) {
      view.playerData[id] = { ...view.playerData[id], locked: true };
    }
  }
  if (status === 'sellReveal' || status === 'end') {
    view.roomData.sales = [{
      round: 4,
      trades: [
        { playerID: 'ai_2', property: 6, amount: 0 },
        { playerID: '110', property: 12, amount: 8 },
        { playerID: 'ai_3', property: 23, amount: 15 },
      ],
    }];
  }
  if (status === 'end') {
    view.roomData.round = 8;
    view.playerData['110'].propertyCount = 0;
    view.playerData['110'].properties = [];
    view.result = {
      '110': { chequeTotal: 63, coins: 7, total: 70, rank: 1, winner: true },
      ai_2: { chequeTotal: 62, coins: 8, total: 70, rank: 1, winner: true },
      ai_3: { chequeTotal: 55, coins: 5, total: 60, rank: 3, winner: false },
    };
  }
  return snapshot;
};

async function mockSession(
  page: Page,
  count = 3,
  customSnapshot?: ReturnType<typeof gameSnapshot>,
) {
  await mockProfile(page);
  const snapshot = customSnapshot ?? gameSnapshot(count);
  const roomPlayers = Object.values(snapshot.view.forSale.roomData.players);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'forsale',
          status: 'playing',
          visibility: 'private',
          ownerUserID: '110',
          ownerPlayerID: '110',
          maxPlayers: 6,
          playerCount: count,
          currentMatchID: matchID,
          currentMatchStatus: 'running',
          nextRoundNo: 2,
          createdAt: '2026-10-27T00:00:00Z',
          updatedAt: '2026-10-27T00:00:00Z',
          players: roomPlayers,
          metrics: {
            forSale: { progressCurrent: 1, progressTotal: count === 3 ? 16 : 10 },
          },
        },
      },
    }));
  const commands: string[] = [];
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot));
    socket.onMessage(message => commands.push(String(message)));
  });
  return commands;
}

async function mockMatchRoom(
  page: Page,
  roomPlayers = [players[0]],
) {
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'forsale',
          status: 'match',
          visibility: 'public',
          ownerUserID: '110',
          ownerPlayerID: '110',
          maxPlayers: 6,
          playerCount: roomPlayers.length,
          currentMatchID: matchID,
          currentMatchStatus: 'preparing',
          nextRoundNo: 1,
          createdAt: '2026-10-27T00:00:00Z',
          updatedAt: '2026-10-27T00:00:00Z',
          players: roomPlayers,
          metrics: { forSale: { progressCurrent: 0, progressTotal: 16 } },
        },
      },
    }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify({
      schemaVersion: 2,
      type: 'MATCH_SYNC',
      roomID,
      matchID,
      seq: '1',
      ownerID: '110',
      status: 'match',
      playerID: '110',
      players: Object.fromEntries(roomPlayers.map(player => [
        player.playerID,
        player,
      ])),
      visibility: 'public',
      maxPlayers: 6,
      playerOrder: roomPlayers.map(player => player.playerID),
    }));
  });
}

const expectNoOverflow = async (page: Page) => {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
};

const capture = async (page: Page, info: TestInfo, name: string) =>
  page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });

test('For Sale public pages follow the Acquire shell at all target widths',
  async ({ page }, info) => {
    await mockPublic(page);
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
      { width: 360, height: 780 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/game/forsale');
      await expect(page.getByRole('heading', {
        name: /好房在手/,
      })).toBeVisible();
      await expect(page.getByRole('button', { name: /创建房间/ })).toBeVisible();
      await expectNoOverflow(page);
      await capture(page, info, `lobby-${viewport.width}x${viewport.height}`);
      await page.goto('/game/forsale/guide');
      await expect(page.getByRole('heading', {
        name: /用一笔本金/,
      })).toBeVisible();
      await expectNoOverflow(page);
    }
  });

test('For Sale mobile room follows the Acquire preparation layout',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockMatchRoom(page);
    await page.goto(`/game/forsale/match?roomID=${roomID}`);
    await expect(page.locator('.fs-room-page')).toBeVisible();
    await expect(page.locator('[data-game-shell-header]')).toBeVisible();
    await expect(page.locator('[data-game-brand]')).toBeVisible();
    await expect(page.locator('[data-game-shell-platform-home]')).toBeHidden();
    await expect(page.locator('[data-game-shell-profile]')).toBeHidden();
    await expect(page.locator('.fs-room-table')).toBeVisible();
    await expect(page.locator('.fs-seat')).toHaveCount(6);
    await expect(page.getByText('公开多人房间')).toBeVisible();
    const geometry = await page.locator('.fs-seat-grid').evaluate(element => {
      const seat = element.querySelector<HTMLElement>('.fs-seat');
      const stage = element.parentElement;
      const style = getComputedStyle(element);
      const columns = style.gridTemplateColumns.split(' ').filter(Boolean);
      const box = seat?.getBoundingClientRect();
      const brand = document.querySelector<HTMLElement>('.fs-brand');
      const mark = brand?.querySelector<HTMLElement>('.fs-mark');
      const label = document.querySelector<HTMLElement>('.fs-room-heading small')?.getBoundingClientRect();
      const roomName = document.querySelector<HTMLElement>('.fs-room-heading h1')?.getBoundingClientRect();
      return {
        brandGap: brand ? getComputedStyle(brand).gap : '',
        columns: columns.length,
        headingGap: label && roomName ? roomName.top - label.bottom : 0,
        markMarginRight: mark ? getComputedStyle(mark).marginRight : '',
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        stagePaddingLeft: stage ? getComputedStyle(stage).paddingLeft : '',
        stagePaddingRight: stage ? getComputedStyle(stage).paddingRight : '',
        seatWidth: box?.width ?? 0,
        seatHeight: box?.height ?? 0,
      };
    });
    expect(geometry.brandGap).toBe('8px');
    expect(geometry.columns).toBe(2);
    expect(geometry.headingGap).toBeLessThanOrEqual(4);
    expect(geometry.markMarginRight).toBe('0px');
    expect(geometry.paddingLeft).toBe('0px');
    expect(geometry.paddingRight).toBe('0px');
    expect(geometry.stagePaddingLeft).toBe('15px');
    expect(geometry.stagePaddingRight).toBe('15px');
    expect(geometry.seatWidth).toBeGreaterThan(160);
    expect(geometry.seatHeight).toBeLessThanOrEqual(140);
    await expectNoOverflow(page);
    await capture(page, info, 'room-mobile');
  });

test('For Sale desktop room follows the Acquire responsive split',
  async ({ page }, info) => {
    await mockMatchRoom(page);
    for (const viewport of [
      { width: 1440, height: 900, columns: 2 },
      { width: 1024, height: 768, columns: 1 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`/game/forsale/match?roomID=${roomID}`);
      await expect(page.locator('.fs-room-table')).toBeVisible();
      await expect(page.locator('.fs-room-facts')).toBeVisible();
      const geometry = await page.locator('.fs-room-layout').evaluate(element => {
        const layout = getComputedStyle(element);
        const table = element.querySelector<HTMLElement>('.fs-room-table');
        const facts = element.querySelector<HTMLElement>('.fs-room-facts');
        const dock = document.querySelector<HTMLElement>('.fs-ready-dock');
        return {
          columns: layout.gridTemplateColumns.split(' ').filter(Boolean).length,
          tableWidth: table?.getBoundingClientRect().width ?? 0,
          factsWidth: facts?.getBoundingClientRect().width ?? 0,
          dockPosition: dock ? getComputedStyle(dock).position : '',
        };
      });
      expect(geometry.columns).toBe(viewport.columns);
      if (viewport.columns === 2) {
        expect(geometry.tableWidth).toBeGreaterThan(geometry.factsWidth);
      }
      expect(geometry.dockPosition).toBe('static');
      await expectNoOverflow(page);
      await capture(page, info, `room-${viewport.width}x${viewport.height}`);
    }
  });

test('For Sale start dialog centers AI avatar icons', async ({ page }, info) => {
  await page.setViewportSize({ width: 718, height: 780 });
  await mockMatchRoom(page, players);
  await page.goto(`/game/forsale/match?roomID=${roomID}`);
  await page.getByRole('button', { name: '开始拍卖' }).click();

  const dialog = page.getByRole('dialog', { name: '合伙人齐了，开场吧。' });
  await expect(dialog).toBeVisible();
  const offsets = await dialog.locator('.fs-avatar').evaluateAll(avatars =>
    avatars.slice(1).map(avatar => {
      const icon = avatar.querySelector('svg');
      const avatarBox = avatar.getBoundingClientRect();
      const iconBox = icon?.getBoundingClientRect();
      return iconBox
        ? {
            x: Math.abs(
              avatarBox.left + avatarBox.width / 2
              - iconBox.left - iconBox.width / 2,
            ),
            y: Math.abs(
              avatarBox.top + avatarBox.height / 2
              - iconBox.top - iconBox.height / 2,
            ),
          }
        : { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
    }));
  expect(offsets).toHaveLength(2);
  for (const offset of offsets) {
    expect(offset.x).toBeLessThanOrEqual(1);
    expect(offset.y).toBeLessThanOrEqual(1);
  }
  await capture(page, info, 'start-dialog-718x780');
});

test('For Sale mobile auction keeps cards and actions usable',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 358, height: 784 });
    const commands = await mockSession(page, 3);
    await page.goto(`/game/forsale/match?roomID=${roomID}`);
    await expect(page.getByTestId('forsale-play')).toBeVisible();
    await expect(page.locator('[data-game-mobile-topbar]')).toBeVisible();
    await expect(page.locator('.fs-game-header')).toBeHidden();
    const mobileTopbar = page.locator('[data-game-mobile-topbar]');
    const countdown = mobileTopbar.getByRole('timer');
    const history = mobileTopbar.getByRole('button', { name: '公开记录' });
    const rules = mobileTopbar.getByRole('button', { name: '桌边规则' });
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 360, height: 800 },
      { width: 320, height: 700 },
    ]) {
      await page.setViewportSize(viewport);
      const [topbarBox, identityBox, countdownBox, historyBox, rulesBox,
        historyIconBox, rulesIconBox, countdownTextBox, countdownStyle,
        historyStyle, rulesStyle] = await Promise.all([
          mobileTopbar.boundingBox(),
          mobileTopbar.locator('[data-game-mobile-topbar-identity]').boundingBox(),
          countdown.boundingBox(),
          history.boundingBox(),
          rules.boundingBox(),
          history.locator('svg').boundingBox(),
          rules.locator('svg').boundingBox(),
          countdown.evaluate(element => {
            const range = document.createRange();
            range.selectNodeContents(element);
            const box = range.getBoundingClientRect();
            return {
              height: box.height,
              width: box.width,
              x: box.x,
              y: box.y,
            };
          }),
          countdown.evaluate(element => ({
            borderRadius: getComputedStyle(element).borderRadius,
            borderWidth: getComputedStyle(element).borderWidth,
          })),
          history.evaluate(element => ({
            backgroundColor: getComputedStyle(element).backgroundColor,
            borderWidth: getComputedStyle(element).borderWidth,
          })),
          rules.evaluate(element => ({
            backgroundColor: getComputedStyle(element).backgroundColor,
            borderWidth: getComputedStyle(element).borderWidth,
          })),
        ]);
      expect(topbarBox).not.toBeNull();
      expect(identityBox).not.toBeNull();
      expect(countdownBox).not.toBeNull();
      expect(historyBox).not.toBeNull();
      expect(rulesBox).not.toBeNull();
      expect(historyIconBox).not.toBeNull();
      expect(rulesIconBox).not.toBeNull();
      expect(countdownTextBox.height).toBeGreaterThan(0);
      expect(identityBox!.width).toBeLessThanOrEqual(132);
      expect(countdownStyle).toEqual({
        borderRadius: '6px',
        borderWidth: '1px',
      });
      expect(historyStyle).toEqual({
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderWidth: '0px',
      });
      expect(rulesStyle).toEqual(historyStyle);
      expect(countdownBox!.height).toBe(22);
      expect(historyBox).toMatchObject({ width: 34, height: 34 });
      expect(rulesBox).toMatchObject({ width: 34, height: 34 });
      expect(historyIconBox).toMatchObject({ width: 22, height: 22 });
      expect(rulesIconBox).toMatchObject({ width: 22, height: 22 });
      expect(Math.abs(countdownTextBox.y + countdownTextBox.height / 2
        - (countdownBox!.y + countdownBox!.height / 2))).toBeLessThanOrEqual(1);
      const centers = [countdownBox!, historyIconBox!, rulesIconBox!]
        .map(box => box.y + box.height / 2);
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(1);
      expect(Math.abs(rulesBox!.x + rulesBox!.width
        - (topbarBox!.x + topbarBox!.width))).toBeLessThanOrEqual(1);
      await expectNoOverflow(page);
    }
    await page.setViewportSize({ width: 358, height: 784 });
    await rules.click();
    await expect(page.getByRole('dialog', { name: '桌边规则卡' })).toBeVisible();
    await page.getByRole('button', { name: '关闭面板' }).click();
    await expect(page.locator('.fs-property-market .fs-property')).toHaveCount(3);
    await expect(page.getByLabel('总出价金币')).toHaveValue('3');
    await page.getByRole('button', { name: '退出本轮' }).click();
    await expect(page.getByRole('heading', {
      name: '这轮收手，也是一笔好买卖。',
    })).toBeVisible();
    await expect(page.getByText(/退回钱包/)).toBeVisible();
    await page.getByRole('button', { name: '确认退出本轮' }).click();
    await expect.poll(() => commands.some(command =>
      command.includes('"game_pass"')
      && command.includes('"forSale"'))).toBe(true);
    await expectNoOverflow(page);
    await capture(page, info, 'auction-mobile');
  });

test('For Sale six-player desktop market remains stable',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockSession(page, 6);
    await page.goto(`/game/forsale/match?roomID=${roomID}`);
    await expect(page.locator('.fs-property-market .fs-property')).toHaveCount(6);
    await expect(page.getByRole('heading', {
      name: /轮到你出价/,
    })).toBeVisible();
    await page.getByRole('button', { name: '桌边规则' }).click();
    await expect(page.getByRole('dialog', { name: '桌边规则卡' })).toBeVisible();
    await page.getByRole('button', { name: '关闭面板' }).click();
    await expectNoOverflow(page);
    await capture(page, info, 'auction-six-player-desktop');
  });

test('For Sale mobile sale selection locks only after confirmation',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const commands = await mockSession(page, 3, saleSnapshot('sellSelect'));
    await page.goto(`/game/forsale/match?roomID=${roomID}`);
    await expect(page.locator('.fs-cheque-market .fs-cheque')).toHaveCount(3);
    await page.getByRole('button', { name: '选择27号房产' }).click();
    await expect(page.getByRole('button', {
      name: '锁定这张房产',
    })).toBeEnabled();
    await page.getByRole('button', { name: '锁定这张房产' }).click();
    await expect.poll(() => commands.some(command =>
      command.includes('"game_lock_sale"')
      && command.includes('"property":27'))).toBe(true);
    await expectNoOverflow(page);
    await capture(page, info, 'sale-select-mobile');
  });

test('For Sale mobile sale reveal aligns player and property details',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const snapshot = saleSnapshot('sellReveal');
    const userAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';
    snapshot.view.forSale.roomData.players['110'].avatar = userAvatar;
    await mockSession(page, 3, snapshot);
    await page.goto(`/game/forsale/match?roomID=${roomID}`);

    const reveal = page.locator('.fs-reveal');
    const rows = reveal.locator('article');
    await expect(rows).toHaveCount(3);
    await expect(rows.locator('.fs-reveal-player img')).toHaveCount(1);
    await expect(rows.locator('.fs-reveal-player img'))
      .toHaveAttribute('src', userAvatar);

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 360, height: 800 },
      { width: 320, height: 700 },
    ]) {
      await page.setViewportSize(viewport);
      const geometry = await rows.evaluateAll(elements => elements.map(element => {
        const player = element.querySelector<HTMLElement>('.fs-reveal-player')!;
        const avatar = player.querySelector<HTMLElement>('.fs-avatar')!;
        const name = player.querySelector<HTMLElement>('b')!;
        const property = element.querySelector<HTMLElement>('.fs-reveal-property')!;
        const icon = property.querySelector<SVGElement>('svg')!;
        const number = property.querySelector<HTMLElement>('span')!;
        const playerBox = player.getBoundingClientRect();
        const avatarBox = avatar.getBoundingClientRect();
        const nameBox = name.getBoundingClientRect();
        const iconBox = icon.getBoundingClientRect();
        const numberBox = number.getBoundingClientRect();
        return {
          avatarLeftOffset: avatarBox.left - playerBox.left,
          nameGap: nameBox.left - avatarBox.right,
          playerJustify: getComputedStyle(player).justifyContent,
          propertyCenterDelta: Math.abs(
            iconBox.top + iconBox.height / 2
            - numberBox.top - numberBox.height / 2,
          ),
          propertyGap: numberBox.left - iconBox.right,
        };
      }));
      for (const row of geometry) {
        expect(Math.abs(row.avatarLeftOffset)).toBeLessThanOrEqual(1);
        expect(Math.abs(row.nameGap - 7)).toBeLessThanOrEqual(1);
        expect(row.playerJustify).toBe('flex-start');
        expect(row.propertyCenterDelta).toBeLessThanOrEqual(1);
        expect(Math.abs(row.propertyGap - 5)).toBeLessThanOrEqual(1);
      }
      await expectNoOverflow(page);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await capture(page, info, 'sale-reveal-mobile');
  });

test('For Sale results support tied winners and final-table review',
  async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockSession(page, 3, saleSnapshot('end'));
    await page.goto(`/game/forsale/match?roomID=${roomID}`);
    await expect(page.getByTestId('forsale-results')).toBeVisible();
    await expectMobileFinalResultLayout(page);
    await expect(page.getByText('好买卖，并肩赢。')).toBeVisible();
    await expect(page.getByText('$70,000').first()).toBeVisible();
    await capture(page, info, 'results-mobile');
    await page.getByRole('button', { name: '查看终局牌桌' }).first().click();
    await expect(page.getByTestId('forsale-play')).toBeVisible();
    await expectNoOverflow(page);
  });
