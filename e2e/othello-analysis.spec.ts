import { expect, test, type Page } from '@playwright/test';

const roomID = 'othello_analysis';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '分析棋手',
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

function opening() {
  const board = Array.from({ length: 64 }, () => '');
  board[27] = 'white';
  board[28] = 'black';
  board[35] = 'black';
  board[36] = 'white';
  return board;
}

function snapshot(seq: number, analysis: Record<string, unknown>) {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID,
    seq,
    view: {
      othello: {
        playerId: human.playerID,
        ownerID: human.playerID,
        visibility: 'private',
        playerData: {
          [human.playerID]: { side: 'black', discCount: 2 },
          [ai.playerID]: { side: 'white', discCount: 2 },
        },
        roomData: {
          board: opening(),
          currentPlayer: human.playerID,
          currentSide: 'black',
          blackPlayerID: human.playerID,
          whitePlayerID: ai.playerID,
          roundNo: 1,
          gameStatus: 'playing',
          legalMoves: [
            { index: 19, flips: [27], lines: [[27]] },
            { index: 26, flips: [27], lines: [[27]] },
            { index: 37, flips: [36], lines: [[36]] },
            { index: 44, flips: [36], lines: [[36]] },
          ],
          moveLog: [],
          players: {
            [human.playerID]: human,
            [ai.playerID]: ai,
          },
          playerOrder: [human.playerID, ai.playerID],
          turnDeadline: new Date(Date.now() + 60_000).toISOString(),
          turnTimeoutMs: '60000',
          analysis,
        },
      },
    },
  };
}

async function mockSession(page: Page) {
  let sendSnapshot: ((value: object) => void) | undefined;
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
  await page.route(`**/pam-api/platform/rooms/${roomID}?**`, route => route.fulfill({
    json: {
      status_code: 0,
      message: 'ok',
      data: {
        roomID,
        gameType: 'othello',
        status: 'playing',
        visibility: 'private',
        ownerUserID: human.userID,
        ownerPlayerID: human.playerID,
        maxPlayers: 2,
        playerCount: 2,
        currentMatchID: matchID,
        currentMatchStatus: 'running',
        nextRoundNo: 2,
        createdAt: '2026-10-25T00:00:00Z',
        updatedAt: '2026-10-25T00:00:00Z',
        players: [human, ai],
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
    sendSnapshot = value => socket.send(JSON.stringify(value));
    sendSnapshot(snapshot(12, {
      requestID: 'analysis-12',
      status: 'pending',
      exact: false,
      engineVersion: 'edax-4.7',
    }));
  });
  return async (value: object) => {
    await expect.poll(() => Boolean(sendSnapshot)).toBe(true);
    sendSnapshot!(value);
  };
}

test('Othello keeps the last rates while the next analysis is pending', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const send = await mockSession(page);
  await page.goto(`/game/othello/match?roomID=${roomID}`);

  const analysis = page.getByTestId('othello-position-analysis');
  await expect(analysis).toHaveAttribute('data-status', 'empty');
  await expect(analysis).toHaveAttribute('aria-label', '形势参考，暂无分析数据');
  await expect(page.getByText('Edax 正在分析当前局面')).toHaveCount(0);

  await send(snapshot(13, {
    requestID: 'analysis-12',
    status: 'ready',
    blackWinRate: 0.613,
    drawRate: 0.054,
    whiteWinRate: 0.333,
    score: 5,
    depth: 12,
    elapsedMs: '412',
    exact: false,
    engineVersion: 'edax-4.7',
  }));
  await expect(analysis).toHaveAttribute('data-status', 'ready');
  await expect(analysis).toHaveAttribute(
    'aria-label',
    '黑方胜率 61%，和棋 6%，白方胜率 33%',
  );

  await send(snapshot(14, {
    requestID: 'analysis-14',
    status: 'pending',
    exact: false,
    engineVersion: 'edax-4.7',
  }));
  await expect(analysis).toHaveAttribute('data-status', 'stale');
  await expect(page.getByText('黑 61%')).toBeVisible();
  await expect(page.getByText('Edax 正在分析当前局面')).toHaveCount(0);
});

test('Othello analysis stays between the header and board at target sizes', async ({
  page,
}) => {
  const send = await mockSession(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/game/othello/match?roomID=${roomID}`);
  await expect(page.getByTestId('othello-position-analysis'))
    .toHaveAttribute('data-status', 'empty');
  await send(snapshot(13, {
    requestID: 'analysis-12',
    status: 'ready',
    blackWinRate: 0.55,
    drawRate: 0.1,
    whiteWinRate: 0.35,
    score: 2,
    depth: 11,
    elapsedMs: '398',
    exact: false,
    engineVersion: 'edax-4.7',
  }));

  const analysis = page.getByTestId('othello-position-analysis');
  const board = page.getByRole('group', {
    name: '黑白棋棋盘，8 行 8 列。方向键移动，回车落子。',
  });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(analysis).toBeVisible();
    await expect(board).toBeVisible();
    const [analysisBox, boardBox, fits] = await Promise.all([
      analysis.boundingBox(),
      board.boundingBox(),
      page.evaluate(() =>
        document.documentElement.scrollWidth <= window.innerWidth
      ),
    ]);
    expect(analysisBox).not.toBeNull();
    expect(boardBox).not.toBeNull();
    expect(analysisBox!.y + analysisBox!.height)
      .toBeLessThanOrEqual(boardBox!.y);
    expect(fits).toBe(true);
  }
});
