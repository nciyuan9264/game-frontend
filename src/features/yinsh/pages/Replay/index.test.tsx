import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameDetailData } from '@/features/game-core/model/history';
import type { YinshPlayer } from '../../model/types';
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

const players: Record<string, YinshPlayer> = {
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

function replaySnapshot(index: number) {
  const moved = index > 0;
  const action = {
    action: 'move_ring',
    playerID: 'me',
    payloadJSON: '{"from":"E4","to":"E7","side":"white","flips":[]}',
  };
  return {
    seq: index - 1,
    totalEvents: 1,
    currentEvent: moved ? {
      seq: 0,
      playerID: 'me',
      displayName: 'Alice',
      cmdType: 'game_move_ring',
      payload: { from: 'E4', to: 'E7' },
    } : undefined,
    roomData: {
      rings: moved
        ? { E7: 'white', D3: 'black' }
        : { E4: 'white', D3: 'black' },
      markers: moved ? { E4: 'white' } : {},
      currentPlayer: moved ? 'ai_2' : 'me',
      gameStatus: moved ? 'end' : 'move',
      placedRings: { white: 5, black: 5 },
      markerPool: moved ? 48 : 49,
      legalMoves: {},
      candidateRows: [],
      lastAction: moved ? action : undefined,
      activity: moved ? [action] : [],
      players,
      playerOrder: ['me', 'ai_2'],
      roundNo: 1,
    },
    playersData: {
      me: { side: 'white', ringsRemoved: moved ? 3 : 2 },
      ai_2: { side: 'black', ringsRemoved: 1 },
    },
    result: {
      winnerID: moved ? 'me' : undefined,
      reason: moved ? '率先取走第三枚圆环' : '',
      ringsRemoved: {
        white: moved ? 3 : 2,
        black: 1,
      },
    },
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
      roomID: 'yinsh-replay',
      gameType: 'yinsh',
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
      cmdType: 'game_move_ring',
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

describe('YINSH replay', () => {
  it('provides aligned navigation, collapse, and result return', async () => {
    render(<MemoryRouter initialEntries={['/game/yinsh/replay/1']}>
      <Routes><Route path="/game/yinsh/replay/:gameId"
        element={<Replay />} /></Routes>
    </MemoryRouter>);

    await screen.findByRole('group', {
      name: 'YINSH 棋盘，85 个交点',
    });
    expect(screen.getByRole('button', { name: '初始' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '末步' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', {
      name: '收起回放面板',
    }));
    expect(screen.getByRole('button', {
      name: '展开回放面板',
    })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {
      name: '展开回放面板',
    }));

    fireEvent.click(screen.getByRole('button', { name: /最终结算/ }));
    await screen.findByRole('button', { name: '回到回放棋盘' });
    expect(screen.queryByRole('button', { name: /返回棋谱/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', {
      name: '回到回放棋盘',
    }));
    expect(screen.getByRole('button', { name: '末步' })).toBeTruthy();
  });
});
