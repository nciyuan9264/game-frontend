import {
  expect,
  test,
  type Page,
  type TestInfo,
} from '@playwright/test';

const roomID = 'onitama_layout';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '青岚',
  avatar: '',
  seatIndex: 0,
  online: true,
  ai: false,
  ready: true,
};
const ai = {
  playerID: 'ai_2',
  displayName: '松风',
  avatar: '',
  seatIndex: 1,
  online: true,
  ai: true,
  ready: true,
};

const initialPieces = ([
  ['red-0', 'red', 'student', 0, 0],
  ['red-1', 'red', 'student', 0, 1],
  ['red-master', 'red', 'master', 0, 2],
  ['red-3', 'red', 'student', 0, 3],
  ['red-4', 'red', 'student', 0, 4],
  ['blue-0', 'blue', 'student', 4, 0],
  ['blue-1', 'blue', 'student', 4, 1],
  ['blue-master', 'blue', 'master', 4, 2],
  ['blue-3', 'blue', 'student', 4, 3],
  ['blue-4', 'blue', 'student', 4, 4],
] as const).map(([id, side, kind, row, column]) => ({
  id,
  side,
  kind,
  cell: { row, column },
}));

function gameSnapshot(gameStatus: 'playing' | 'end' = 'playing') {
  const ended = gameStatus === 'end';
  const finalAction = {
    id: 1,
    kind: 'move',
    playerID: human.playerID,
    side: 'blue',
    cardID: 'tiger',
    pieceID: 'blue-master',
    from: { row: 2, column: 2 },
    to: { row: 0, column: 2 },
    capturedPieceID: 'red-master',
    capturedKind: 'master',
    automatic: false,
  };
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq: 12,
    view: {
      onitama: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: {
            side: 'blue',
            pieceCount: 5,
            masterAlive: true,
          },
          [ai.playerID]: {
            side: 'red',
            pieceCount: ended ? 4 : 5,
            masterAlive: !ended,
          },
        },
        result: ended ? {
          winnerID: human.playerID,
          winnerSide: 'blue',
          reason: 'stone',
          turnCount: 1,
          winnerPieceCount: 5,
        } : undefined,
        roomData: {
          pieces: ended
            ? initialPieces
                .filter(piece => piece.id !== 'red-master')
                .map(piece => piece.id === 'blue-master'
                  ? { ...piece, cell: { row: 0, column: 2 } }
                  : piece)
            : initialPieces,
          hands: {
            blue: ['tiger', 'crane'],
            red: ['dragon', 'elephant'],
          },
          transitCardID: 'crab',
          currentPlayer: ended ? '' : human.playerID,
          currentSide: ended ? '' : 'blue',
          bluePlayerID: human.playerID,
          redPlayerID: ai.playerID,
          firstPlayerID: human.playerID,
          roundNo: 1,
          gameStatus,
          legalMoves: ended ? [] : [
            {
              cardID: 'tiger',
              pieceID: 'blue-master',
              to: { row: 2, column: 2 },
              winning: false,
            },
            {
              cardID: 'crane',
              pieceID: 'blue-master',
              to: { row: 3, column: 2 },
              winning: false,
            },
          ],
          canPass: false,
          moveLog: ended ? [finalAction] : [],
          lastAction: ended ? finalAction : undefined,
          turnDeadline: ended
            ? undefined
            : new Date(Date.now() + 60_000).toISOString(),
          turnTimeoutMs: ended ? '0' : '60000',
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

async function mockProfile(page: Page) {
  await page.route('**/pam-api/platform/auth/profile', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        user_id: human.userID,
        display_name: human.displayName,
        avatar: '',
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
      data: { rooms: [] },
    },
  }));
  await page.route('**/pam-api/platform/history/stats?**', route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        totalGames: 12,
        wins: 7,
        winRate: 7 / 12,
        avgScore: 4.2,
      },
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
        gameType: 'onitama',
        entries: [0, 1, 2].map(index => ({
          userID: String(index + 1),
          playerID: `player-${index + 1}`,
          displayName: `棋手 ${index + 1}`,
          totalGames: 20 - index,
          metric: {
            onitama: {
              wins: 12 - index,
              winRate: .6 - index * .05,
            },
          },
        })),
      },
    },
  }));
}

async function mockSession(
  page: Page,
  snapshot: ReturnType<typeof gameSnapshot> = gameSnapshot(),
) {
  const commands: string[] = [];
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'onitama',
          status: snapshot.view.onitama.roomData.gameStatus,
          visibility: 'private',
          ownerUserID: human.userID,
          ownerPlayerID: human.playerID,
          maxPlayers: 2,
          playerCount: 2,
          currentMatchID: matchID,
          currentMatchStatus: snapshot.view.onitama.roomData.gameStatus,
          nextRoundNo: 2,
          createdAt: '2026-10-27T00:00:00Z',
          updatedAt: '2026-10-27T00:00:00Z',
          players: [human, ai],
          metrics: {
            onitama: { turnCount: snapshot.view.onitama.roomData.moveLog.length },
          },
        },
      },
    }));
  await page.routeWebSocket('**/ws?**', socket => {
    socket.send(JSON.stringify(snapshot));
    socket.onMessage(message => {
      const command = String(message);
      commands.push(command);
      if (command.includes('"game_move_piece"')) {
        const next = gameSnapshot();
        next.seq = 13;
        next.view.onitama.roomData.pieces = initialPieces.map(piece =>
          piece.id === 'blue-master'
            ? { ...piece, cell: { row: 2, column: 2 } }
            : piece);
        next.view.onitama.roomData.hands.blue = ['crab', 'crane'];
        next.view.onitama.roomData.transitCardID = 'tiger';
        next.view.onitama.roomData.currentPlayer = ai.playerID;
        next.view.onitama.roomData.currentSide = 'red';
        next.view.onitama.roomData.legalMoves = [];
        next.view.onitama.roomData.moveLog = [{
          id: 1,
          kind: 'move',
          playerID: human.playerID,
          side: 'blue',
          cardID: 'tiger',
          pieceID: 'blue-master',
          from: { row: 4, column: 2 },
          to: { row: 2, column: 2 },
          receivedCardID: 'crab',
          automatic: false,
        }];
        next.view.onitama.roomData.lastAction =
          next.view.onitama.roomData.moveLog[0];
        socket.send(JSON.stringify(next));
      }
    });
  });
  return commands;
}

async function mockRoom(page: Page) {
  await mockProfile(page);
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route =>
    route.fulfill({
      json: {
        status_code: 0,
        message: 'ok',
        data: {
          roomID,
          gameType: 'onitama',
          status: 'match',
          visibility: 'private',
          ownerUserID: human.userID,
          ownerPlayerID: human.playerID,
          maxPlayers: 2,
          playerCount: 1,
          currentMatchID: matchID,
          currentMatchStatus: 'preparing',
          nextRoundNo: 1,
          createdAt: '2026-10-27T00:00:00Z',
          updatedAt: '2026-10-27T00:00:00Z',
          players: [human],
          metrics: { onitama: { turnCount: 0 } },
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
      ownerID: human.playerID,
      playerID: human.playerID,
      status: 'match',
      visibility: 'private',
      maxPlayers: 2,
      players: { [human.playerID]: human },
      playerOrder: [human.playerID],
    }));
  });
}

async function expectNoOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
  });
}

test('Onitama public pages stay stable across target viewports', async ({
  page,
}, testInfo) => {
  await mockPublicData(page);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/game/onitama');
    await expect(page.getByTestId('onitama-lobby-hero')).toBeVisible();
    await expect(page.getByTestId('onitama-lobby-facts')
      .locator(':scope > span')).toHaveCount(4);
    await expectNoOverflow(page);
    await capture(page, testInfo, `lobby-${viewport.width}x${viewport.height}`);

    await page.goto('/game/onitama/guide');
    await expect(page.getByTestId('onitama-guide-visual')).toBeVisible();
    await expect(page.locator('.move-card')).toHaveCount(16);
    await expectNoOverflow(page);
  }
});

test('Onitama room keeps two explicit seats on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockRoom(page);
  await page.goto(`/game/onitama/match?roomID=${roomID}`);

  const seats = page.getByTestId('onitama-room-seat');
  await expect(seats).toHaveCount(2);
  const boxes = await seats.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { y: box.y, width: box.width };
  }));
  expect(boxes[0].y).toBe(boxes[1].y);
  expect(boxes[0].width).toBeGreaterThan(130);
  await expectNoOverflow(page);
});

test('Onitama confirms a service-provided move before submitting', async ({
  page,
}, testInfo) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  const commands = await mockSession(page);
  await page.goto(`/game/onitama/match?roomID=${roomID}`);

  const board = page.getByRole('grid', { name: '御神乐棋 5 乘 5 棋盘' });
  await expect(board).toBeVisible();
  await expect(board.getByRole('gridcell')).toHaveCount(25);
  await expect.poll(() => board.evaluate(element => {
    const grid = getComputedStyle(element);
    const cell = getComputedStyle(element.querySelector('[role="gridcell"]')!);
    return {
      rowGap: grid.rowGap,
      columnGap: grid.columnGap,
      cellBorderRight: cell.borderRightWidth,
      cellBorderBottom: cell.borderBottomWidth,
    };
  })).toEqual({
    rowGap: '1px',
    columnGap: '1px',
    cellBorderRight: '0px',
    cellBorderBottom: '0px',
  });
  await page.getByRole('button', { name: '使用虎式' }).click();
  await page.locator('[data-testid="cell-4-2"]:visible').click();
  await page.locator('[data-testid="cell-2-2"]:visible').click();
  const commit = page.getByRole('button', { name: /落子并换牌/ });
  await expect(commit).toBeEnabled();
  await commit.click();
  await expect.poll(() => commands.some(command =>
    command.includes('"game_move_piece"')
    && command.includes('"cardID":"tiger"')
    && command.includes('"pieceID":"blue-master"')
    && command.includes('"row":2')
    && command.includes('"column":2'))).toBe(true);
  await expect(page.locator('strong:visible', {
    hasText: '松风 正在思考',
  })).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-game');
  expect(pageErrors).toEqual([]);
});

test('Onitama results return to a compact final board', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, gameSnapshot('end'));
  await page.goto(`/game/onitama/match?roomID=${roomID}`);

  await expect(page.getByTestId('result-page')).toBeVisible();
  await expect(page.locator('.result-art')).toHaveCount(0);
  await capture(page, testInfo, 'mobile-results');

  await page.getByRole('button', { name: '回看终局棋盘' }).click();
  await expect(page.getByRole('grid', {
    name: '御神乐棋 5 乘 5 棋盘',
  })).toBeVisible();
  await expect(page.getByRole('button', { name: '对局菜单' })).toHaveCount(0);
  await expectNoOverflow(page);
  await capture(page, testInfo, 'mobile-final-board');

  await page.getByRole('button', { name: '返回终局结算' }).click();
  await expect(page.getByTestId('result-page')).toBeVisible();
});

test('Onitama desktop keeps cards, board, and journal visible', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSession(page);
  await page.goto(`/game/onitama/match?roomID=${roomID}`);

  await expect(page.getByRole('heading', { name: /山门对弈/ })).toBeVisible();
  await expect(page.getByRole('grid', {
    name: '御神乐棋 5 乘 5 棋盘',
  })).toBeVisible();
  await expect(page.getByRole('heading', { name: '对手的招式' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '你的招式' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '行棋记录' })).toBeVisible();
  await expectNoOverflow(page);
  await capture(page, testInfo, 'game-1440x900');
});
