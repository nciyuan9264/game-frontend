import { expect, test, type Page } from '@playwright/test';
import { captureOthello } from './othello-screenshots';

type Disc = '' | 'black' | 'white';
type Side = 'black' | 'white';
type MoveKind = 'move' | 'pass';

interface LegalMove {
  index: number;
  flips: number[];
  lines: number[][];
}

interface MoveEntry {
  id: number;
  kind: MoveKind;
  playerID: string;
  side: Side;
  index?: number;
  flips: number[];
  automatic?: boolean;
}

const roomID = 'othello_full_game';
const matchID = `${roomID}-r1`;
const human = {
  userID: '110',
  playerID: '110',
  displayName: '移动端棋手',
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
const directions = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

function coordinate(index: number) {
  return `${String.fromCharCode(65 + index % 8)}${Math.floor(index / 8) + 1}`;
}

function opponent(side: Side): Side {
  return side === 'black' ? 'white' : 'black';
}

function playerIDForSide(side: Side) {
  return side === 'black' ? human.playerID : ai.playerID;
}

function boardIndex(row: number, column: number) {
  return row * 8 + column;
}

function initialBoard(): Disc[] {
  const board = Array.from({ length: 64 }, (): Disc => '');
  board[27] = 'white';
  board[28] = 'black';
  board[35] = 'black';
  board[36] = 'white';
  return board;
}

function legalMoves(board: readonly Disc[], side: Side): LegalMove[] {
  const rival = opponent(side);
  const moves: LegalMove[] = [];
  for (let index = 0; index < 64; index += 1) {
    if (board[index]) continue;
    const row = Math.floor(index / 8);
    const column = index % 8;
    const lines: number[][] = [];
    for (const [rowDelta, columnDelta] of directions) {
      let nextRow = row + rowDelta;
      let nextColumn = column + columnDelta;
      const line: number[] = [];
      while (
        nextRow >= 0
        && nextRow < 8
        && nextColumn >= 0
        && nextColumn < 8
        && board[boardIndex(nextRow, nextColumn)] === rival
      ) {
        line.push(boardIndex(nextRow, nextColumn));
        nextRow += rowDelta;
        nextColumn += columnDelta;
      }
      if (
        line.length
        && nextRow >= 0
        && nextRow < 8
        && nextColumn >= 0
        && nextColumn < 8
        && board[boardIndex(nextRow, nextColumn)] === side
      ) {
        lines.push(line);
      }
    }
    const flips = lines.flat();
    if (flips.length) moves.push({ index, flips, lines });
  }
  return moves;
}

class OthelloFullGameController {
  board = initialBoard();

  currentSide: Side = 'black';

  moveLog: MoveEntry[] = [];

  seq = 1;

  ended = false;

  result:
    | {
      winnerID?: string;
      winnerSide?: Side;
      draw: boolean;
      reason: string;
      blackCount: number;
      whiteCount: number;
    }
    | undefined;

  get moveCount() {
    return this.moveLog.filter(entry => entry.kind === 'move').length;
  }

  get blackCount() {
    return this.board.filter(cell => cell === 'black').length;
  }

  get whiteCount() {
    return this.board.filter(cell => cell === 'white').length;
  }

  currentLegalMoves() {
    return this.ended ? [] : legalMoves(this.board, this.currentSide);
  }

  nextHumanMove() {
    if (
      this.ended
      || this.currentSide !== 'black'
      || this.currentLegalMoves().length === 0
    ) {
      return;
    }
    return this.currentLegalMoves()[0];
  }

  requiresHumanPass() {
    return !this.ended
      && this.currentSide === 'black'
      && this.currentLegalMoves().length === 0
      && legalMoves(this.board, 'white').length > 0;
  }

  applyHumanMove(index: number) {
    if (this.ended || this.currentSide !== 'black') return false;
    const move = this.currentLegalMoves().find(item => item.index === index);
    if (!move) return false;
    this.applyMove(move, false);
    this.currentSide = 'white';
    this.autoplayAI();
    return true;
  }

  passHumanTurn() {
    if (!this.requiresHumanPass()) return false;
    this.appendPass(false);
    this.currentSide = 'white';
    this.autoplayAI();
    return true;
  }

  snapshot() {
    const legal = this.currentLegalMoves();
    const gameStatus = this.ended
      ? 'end'
      : legal.length
        ? 'playing'
        : 'pass';
    const currentPlayer = playerIDForSide(this.currentSide);
    return {
      schemaVersion: 2,
      type: 'ROOM_SYNC',
      roomID,
      matchID,
      seq: this.seq,
      view: {
        othello: {
          playerId: human.playerID,
          ownerID: human.playerID,
          visibility: 'private',
          playerData: {
            [human.playerID]: { side: 'black', discCount: this.blackCount },
            [ai.playerID]: { side: 'white', discCount: this.whiteCount },
          },
          result: this.result,
          roomData: {
            board: this.board,
            currentPlayer,
            currentSide: this.currentSide,
            blackPlayerID: human.playerID,
            whitePlayerID: ai.playerID,
            roundNo: 1,
            gameStatus,
            legalMoves: legal,
            moveLog: this.moveLog,
            lastData: this.moveLog[this.moveLog.length - 1],
            players: {
              [human.playerID]: human,
              [ai.playerID]: ai,
            },
            playerOrder: [human.playerID, ai.playerID],
            turnDeadline: this.ended
              ? undefined
              : new Date(Date.now() + 60_000).toISOString(),
            turnTimeoutMs: '60000',
          },
        },
      },
    };
  }

  resultCardData() {
    const blackRank = this.result?.draw || this.blackCount >= this.whiteCount
      ? 1
      : 2;
    const whiteRank = this.result?.draw || this.whiteCount >= this.blackCount
      ? 1
      : 2;
    return {
      game_type: 'othello',
      started_at: '2026-10-25T00:00:00Z',
      ended_at: '2026-10-25T00:42:00Z',
      duration_seconds: 2520,
      players: [
        {
          display_name: human.displayName,
          seat_index: human.seatIndex,
          is_ai: false,
          final_score: this.blackCount,
          final_stocks: 0,
          final_rank: blackRank,
          is_winner: this.result?.winnerID === human.playerID,
          game_role: 'black',
          is_self: true,
        },
        {
          display_name: ai.displayName,
          seat_index: ai.seatIndex,
          is_ai: true,
          final_score: this.whiteCount,
          final_stocks: 0,
          final_rank: whiteRank,
          is_winner: this.result?.winnerID === ai.playerID,
          game_role: 'white',
          is_self: false,
        },
      ],
    };
  }

  private applyMove(move: LegalMove, automatic: boolean) {
    this.board = this.board.slice();
    this.board[move.index] = this.currentSide;
    move.flips.forEach(index => {
      this.board[index] = this.currentSide;
    });
    this.moveLog.push({
      id: this.moveLog.length + 1,
      kind: 'move',
      playerID: playerIDForSide(this.currentSide),
      side: this.currentSide,
      index: move.index,
      flips: move.flips,
      automatic,
    });
    this.seq += 1;
    this.finishIfNoSideCanMove();
  }

  private appendPass(automatic: boolean) {
    this.moveLog.push({
      id: this.moveLog.length + 1,
      kind: 'pass',
      playerID: playerIDForSide(this.currentSide),
      side: this.currentSide,
      flips: [],
      automatic,
    });
    this.seq += 1;
  }

  private autoplayAI() {
    while (!this.ended && this.currentSide === 'white') {
      const moves = this.currentLegalMoves();
      if (moves.length) {
        this.applyMove(moves[0], true);
        this.currentSide = 'black';
        continue;
      }
      if (legalMoves(this.board, 'black').length) {
        this.appendPass(true);
        this.currentSide = 'black';
        continue;
      }
      this.finish();
    }
  }

  private finishIfNoSideCanMove() {
    if (
      legalMoves(this.board, 'black').length === 0
      && legalMoves(this.board, 'white').length === 0
    ) {
      this.finish();
    }
  }

  private finish() {
    this.ended = true;
    const draw = this.blackCount === this.whiteCount;
    this.result = {
      blackCount: this.blackCount,
      whiteCount: this.whiteCount,
      winnerID: draw
        ? undefined
        : this.blackCount > this.whiteCount ? human.playerID : ai.playerID,
      winnerSide: draw
        ? undefined
        : this.blackCount > this.whiteCount ? 'black' : 'white',
      draw,
      reason: '双方均无合法落点',
    };
  }
}

async function mockFullGame(page: Page) {
  const controller = new OthelloFullGameController();
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
            occupiedCount: controller.blackCount + controller.whiteCount,
            progressCurrent: controller.moveCount,
            progressTotal: 60,
          },
        },
      },
    },
  }));
  await page.route(
    `**/pam-api/platform/history/matches/${matchID}/result-card?**`,
    route => route.fulfill({
      json: {
        status_code: 200,
        message: 'ok',
        data: controller.resultCardData(),
      },
    }),
  );
  await page.routeWebSocket('**/ws?**', socket => {
    const sendSnapshot = () => {
      socket.send(JSON.stringify(controller.snapshot()));
    };
    sendSnapshot();
    socket.onMessage(message => {
      const command = JSON.parse(String(message)) as {
        type?: string;
        payload?: {
          othello?: {
            placeDisc?: { index?: number };
            pass?: Record<string, never>;
          };
        };
      };
      if (command.type === 'game_place_disc') {
        const index = command.payload?.othello?.placeDisc?.index;
        if (typeof index === 'number') controller.applyHumanMove(index);
      } else if (command.type === 'game_pass') {
        controller.passHumanTurn();
      }
      sendSnapshot();
    });
  });
  return controller;
}

test('Othello mobile plays a full deterministic game and captures every final surface', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const controller = await mockFullGame(page);
  await page.goto(`/game/othello/match?roomID=${roomID}`);

  const board = page.getByRole('group', {
    name: '黑白棋棋盘，8 行 8 列。方向键移动，回车落子。',
  });
  await expect(board).toBeVisible();
  await captureOthello(page, 'othello-full-game-opening');

  let midgameCaptured = false;
  for (let turn = 0; turn < 70 && !controller.ended; turn += 1) {
    const beforeSeq = controller.seq;
    const move = controller.nextHumanMove();
    if (move) {
      const cell = page.getByTestId(`cell-${coordinate(move.index)}`);
      await expect(cell).toHaveAttribute('aria-label', /可落子/);
      await cell.click();
    } else if (controller.requiresHumanPass()) {
      const passButton = page.getByRole('button', { name: '跳过本回合' });
      await expect(passButton).toBeEnabled();
      await passButton.click();
    } else {
      throw new Error(`No human action available at seq ${controller.seq}`);
    }
    await expect.poll(() => controller.seq).toBeGreaterThan(beforeSeq);
    if (!midgameCaptured && controller.moveCount >= 20 && !controller.ended) {
      await expect(board).toBeVisible();
      await captureOthello(page, 'othello-full-game-midgame');
      midgameCaptured = true;
    }
  }

  expect(controller.ended).toBe(true);
  expect(controller.moveCount).toBe(60);
  expect(controller.blackCount + controller.whiteCount).toBe(64);
  await expect(page.locator('[data-game-final-result]')).toBeVisible();
  await expect(page.getByText('终局实际子数 · 空格不补计分')).toBeVisible();
  await captureOthello(page, 'othello-full-game-results');

  await page.getByRole('button', { name: '回到棋盘' }).click();
  await expect(board).toBeVisible();
  await expect(page.getByRole('button', { name: '返回终局结算' })).toBeVisible();
  await captureOthello(page, 'othello-full-game-final-board');

  await page.getByRole('button', { name: '查看棋谱' }).click();
  const journal = page.getByRole('dialog', { name: '这一局的每一步' });
  await expect(journal).toBeVisible();
  await expect(journal.getByText('墨白 自动落在 H8，翻转 3 枚')).toBeVisible();
  await captureOthello(page, 'othello-full-game-journal');
});
