import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResultCardModel } from './model';
import { getResultCard } from './api';
import { supportsFileShare, useResultCardShare } from './useResultCardShare';

vi.mock('./api', () => ({ getResultCard: vi.fn() }));
vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
}));

const mockedGetResultCard = vi.mocked(getResultCard);

function model(matchID: string): ResultCardModel {
  const self = {
    displayName: matchID,
    seatIndex: 0,
    isAI: false,
    finalScore: 1,
    finalStocks: 0,
    finalRank: 1,
    isWinner: true,
    isSelf: true,
  };
  return {
    gameType: 'hive',
    startedAt: '2026-11-02T10:00:00Z',
    endedAt: '2026-11-02T10:10:00Z',
    durationSeconds: 600,
    players: [self],
    self,
    outcome: 'win',
    winnerCount: 1,
  };
}

describe('useResultCardShare', () => {
  beforeEach(() => {
    mockedGetResultCard.mockReset();
  });

  it('ignores a stale match response using an explicit request id', async () => {
    const resolves = new Map<string, (value: ResultCardModel) => void>();
    mockedGetResultCard.mockImplementation((_gameType, matchID) =>
      new Promise(resolve => resolves.set(matchID, resolve)));
    const hook = renderHook(
      ({ matchID }) => useResultCardShare({ gameType: 'hive', matchID }),
      { initialProps: { matchID: 'match-1' } },
    );

    act(() => hook.result.current.open());
    await waitFor(() => expect(mockedGetResultCard).toHaveBeenCalledTimes(1));
    hook.rerender({ matchID: 'match-2' });
    await waitFor(() => expect(mockedGetResultCard).toHaveBeenCalledTimes(2));
    act(() => resolves.get('match-2')?.(model('match-2')));
    await waitFor(() =>
      expect(hook.result.current.model?.self.displayName).toBe('match-2'));
    act(() => resolves.get('match-1')?.(model('match-1')));
    expect(hook.result.current.model?.self.displayName).toBe('match-2');
  });

  it('only reports native file sharing when canShare accepts files', () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    expect(supportsFileShare()).toBe(true);

    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });
    expect(supportsFileShare()).toBe(false);
  });
});
