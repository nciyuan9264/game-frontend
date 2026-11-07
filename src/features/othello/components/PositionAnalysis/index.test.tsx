import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PositionAnalysis } from '.';

afterEach(cleanup);

describe('Othello position analysis', () => {
  it('rounds three probabilities to exactly one hundred percent', () => {
    render(<PositionAnalysis analysis={{
      requestID: 'request-1',
      status: 'ready',
      blackWinRate: 0.3333,
      drawRate: 0.3333,
      whiteWinRate: 0.3334,
      depth: 12,
      exact: false,
      engineVersion: 'edax-4.7',
    }} />);
    expect(screen.getByLabelText(
      '黑方胜率 33%，和棋 33%，白方胜率 34%',
    )).toBeTruthy();
    expect(screen.getByText('Edax · 深度 12 · 局面估计')).toBeTruthy();
  });

  it('keeps an empty analysis row before rates are available', () => {
    const { rerender } = render(<PositionAnalysis analysis={{
      requestID: 'request-2',
      status: 'pending',
      exact: false,
      engineVersion: 'edax-4.7',
    }} />);
    expect(screen.getByTestId('othello-position-analysis')
      .getAttribute('data-status')).toBe('empty');
    expect(screen.getByLabelText('形势参考，暂无分析数据')).toBeTruthy();
    expect(screen.getByText('黑 --')).toBeTruthy();
    rerender(<PositionAnalysis analysis={{
      requestID: 'request-3',
      status: 'unavailable',
      exact: false,
      engineVersion: 'edax-4.7',
    }} />);
    expect(screen.getByTestId('othello-position-analysis')
      .getAttribute('data-status')).toBe('empty');
  });

  it('labels terminal probabilities as the final result', () => {
    render(<PositionAnalysis analysis={{
      requestID: 'final-1',
      status: 'ready',
      blackWinRate: 1,
      drawRate: 0,
      whiteWinRate: 0,
      score: 8,
      exact: true,
      engineVersion: 'platform-result',
    }} />);
    expect(screen.getByText('最终结果')).toBeTruthy();
  });
});
