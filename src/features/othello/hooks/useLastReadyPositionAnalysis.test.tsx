import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PositionAnalysis } from '../model/types';
import { useLastReadyPositionAnalysis } from './useLastReadyPositionAnalysis';

const ready: PositionAnalysis = {
  requestID: 'analysis-1',
  status: 'ready',
  blackWinRate: 0.6,
  drawRate: 0.1,
  whiteWinRate: 0.3,
  depth: 10,
  exact: false,
  engineVersion: 'edax-4.7',
};

describe('useLastReadyPositionAnalysis', () => {
  it('keeps the last ready value while the next position is unresolved', () => {
    const pending: PositionAnalysis = {
      requestID: 'analysis-2',
      status: 'pending',
      exact: false,
      engineVersion: 'edax-4.7',
    };
    const unavailable: PositionAnalysis = {
      ...pending,
      status: 'unavailable',
    };
    const { result, rerender } = renderHook(
      ({ analysis, scopeKey }) =>
        useLastReadyPositionAnalysis(analysis, scopeKey),
      {
        initialProps: {
          analysis: pending,
          scopeKey: 'room:match:1',
        },
      },
    );

    expect(result.current).toBeUndefined();
    rerender({ analysis: ready, scopeKey: 'room:match:1' });
    expect(result.current).toEqual(ready);
    rerender({ analysis: pending, scopeKey: 'room:match:1' });
    expect(result.current).toEqual(ready);
    rerender({ analysis: unavailable, scopeKey: 'room:match:1' });
    expect(result.current).toEqual(ready);
    rerender({ analysis: pending, scopeKey: 'room:match:2' });
    expect(result.current).toBeUndefined();
  });
});
