import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFontEmbedCSS, toBlob } from 'html-to-image';
import type { ResultCardModel } from './model';
import { getResultCard } from './api';
import { supportsFileShare, useResultCardShare } from './useResultCardShare';

vi.mock('./api', () => ({ getResultCard: vi.fn() }));
vi.mock('html-to-image', () => ({
  getFontEmbedCSS: vi.fn().mockResolvedValue('@font-face {}'),
  toBlob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
}));

const mockedGetResultCard = vi.mocked(getResultCard);
const mockedGetFontEmbedCSS = vi.mocked(getFontEmbedCSS);
const mockedToBlob = vi.mocked(toBlob);

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
    mockedGetFontEmbedCSS.mockResolvedValue('@font-face {}');
    mockedToBlob.mockReset().mockResolvedValue(
      new Blob(['png'], { type: 'image/png' }),
    );
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

  it('prepares one cached image before invoking native share', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    mockedGetResultCard.mockResolvedValue(model('match-1'));
    const hook = renderHook(() =>
      useResultCardShare({ gameType: 'hive', matchID: 'match-1' }));
    const node = document.createElement('div');

    act(() => hook.result.current.open());
    await waitFor(() => expect(hook.result.current.model).toBeTruthy());
    await act(async () => {
      await Promise.all([
        hook.result.current.prepare(node),
        hook.result.current.prepare(node),
      ]);
    });

    expect(mockedToBlob).toHaveBeenCalledTimes(1);
    expect(mockedToBlob).toHaveBeenCalledWith(node, expect.objectContaining({
      fontEmbedCSS: '@font-face {}',
      pixelRatio: 2,
    }));
    expect(mockedToBlob.mock.calls[0][1]?.cacheBust).toBeUndefined();
    expect(hook.result.current.imageReady).toBe(true);

    act(() => {
      hook.result.current.share(node);
      expect(share).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => expect(hook.result.current.status).toBe('ready'));
    expect(mockedToBlob).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0][0].files[0]).toBeInstanceOf(File);
  });
});
