import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameDetailData } from '@/features/game-core/model/history';
import type { Disc, OthelloPlayer } from '../../model/types';
import Replay from '.';

const api = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getGameDetail: vi.fn(),
  getSnapshotPage: vi.fn(),
}));

vi.mock('@/features/game-core/api/auth', () => ({
  getProfile: api.getProfile,
}));
vi.mock('@/features/game-core/api/history', () => ({
  getGameDetail: api.getGameDetail,
  getSnapshotPage: api.getSnapshotPage,
}));

const players: Record<string, OthelloPlayer> = {
  me: {
    playerID: 'me',
    displayName: 'Alice',
    online: true,
    ai: false,
    ready: true,
    seatIndex: 0,
  },
  ai_2: {
    playerID: 'ai_2',
    displayName: '墨白',
    online: true,
    ai: true,
    ready: true,
    seatIndex: 1,
  },
};

function board(moved = false): Disc[] {
  const value: Disc[] = Array.from({ length: 64 }, () => '');
  value[27] = 'white';
  value[28] = 'black';
  value[35] = 'black';
  value[36] = 'white';
  if (moved) {
    value[19] = 'black';
    value[27] = 'black';
  }
  return value;
}

function replaySnapshot(index: number) {
  const moved = index > 0;
  return {
    seq: index - 1,
    totalEvents: 1,
    currentEvent: moved ? {
      seq: 0,
      playerID: 'ai_2',
      displayName: 'Legacy AI',
      cmdType: 'game_place_disc',
      payload: { index: 19 },
    } : undefined,
    roomData: {
      board: board(moved),
      currentPlayer: moved ? 'ai_2' : 'me',
      currentSide: moved ? 'white' : 'black',
      blackPlayerID: 'me',
      whitePlayerID: 'ai_2',
      roundNo: 1,
      gameStatus: moved ? 'end' : 'playing',
      legalMoves: [],
      moveLog: moved ? [{
        id: 1,
        kind: 'move',
        playerID: 'me',
        side: 'black',
        index: 19,
        flips: [27],
        lines: [[27]],
      }] : [],
      lastData: moved ? {
        id: 1,
        kind: 'move',
        playerID: 'me',
        side: 'black',
        index: 19,
        flips: [27],
        lines: [[27]],
      } : undefined,
      players,
      playerOrder: ['me', 'ai_2'],
    },
    playersData: {
      me: { side: 'black', discCount: moved ? 4 : 2 },
      ai_2: { side: 'white', discCount: moved ? 1 : 2 },
    },
    result: moved ? {
      winnerID: 'me',
      draw: false,
      reason: '双方均无合法落点',
      blackCount: 4,
      whiteCount: 1,
    } : {},
  };
}

beforeEach(() => {
  api.getProfile.mockResolvedValue({
    id: '7',
    name: 'Alice',
    email: '',
    avatar: '',
  });
  api.getGameDetail.mockResolvedValue({
    game: {
      id: 1,
      roomID: 'othello-replay',
      gameType: 'othello',
      startedAt: '',
      endedAt: '2026-10-25T00:01:00Z',
      durationSeconds: 60,
      maxPlayers: 2,
      createdAt: '',
      updatedAt: '',
    },
    players: [{
      id: 1,
      gameID: 1,
      userID: 7,
      playerID: 'me',
      displayName: 'Alice',
      seatIndex: 0,
      isAI: false,
      finalStocks: 0,
      isWinner: true,
      createdAt: '',
    }],
    events: [{
      seq: 0,
      playerID: 'me',
      displayName: 'Alice',
      cmdType: 'game_place_disc',
    }],
  } as GameDetailData);
  api.getSnapshotPage.mockResolvedValue({
    snapshots: [replaySnapshot(0), replaySnapshot(1)],
    totalEvents: 1,
    totalSnapshots: 2,
    offset: 0,
    limit: 20,
    nextOffset: 2,
    hasMore: false,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Othello replay', () => {
  it('provides Acquire-aligned navigation, collapse, and result return', async () => {
    render(<MemoryRouter initialEntries={['/game/othello/replay/1']}><Routes>
      <Route path="/game/othello/replay/:gameId" element={<Replay />} />
    </Routes></MemoryRouter>);

    await screen.findByRole('group', {
      name: '黑白棋棋盘，8 行 8 列。方向键移动，回车落子。',
    });
    expect(screen.getByRole('button', { name: '初始' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '末步' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '末步' }));
    await screen.findByText('墨白 · AI · 落子');

    fireEvent.click(screen.getByRole('button', { name: '收起回放面板' }));
    expect(screen.getByRole('button', { name: '展开回放面板' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '展开回放面板' }));

    fireEvent.click(screen.getByRole('button', { name: /最终结算/ }));
    await screen.findByRole('button', { name: '回到回放棋盘' });
    expect(screen.queryByRole('button', { name: /返回棋谱/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '回到回放棋盘' }));
    expect(screen.getByRole('button', { name: '末步' })).toBeTruthy();
  });
});
