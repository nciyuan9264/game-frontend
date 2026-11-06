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

  it('does not retain percentages while the next request is pending', () => {
    const { rerender } = render(<PositionAnalysis analysis={{
      requestID: 'request-1',
      status: 'ready',
      blackWinRate: 0.6,
      drawRate: 0.1,
      whiteWinRate: 0.3,
      depth: 10,
      exact: false,
      engineVersion: 'edax-4.7',
    }} />);
    expect(screen.getByText('黑 60%')).toBeTruthy();
    rerender(<PositionAnalysis analysis={{
      requestID: 'request-2',
      status: 'pending',
      exact: false,
      engineVersion: 'edax-4.7',
    }} />);
    expect(screen.queryByText('黑 60%')).toBeNull();
    expect(screen.getByText('Edax 正在分析当前局面')).toBeTruthy();
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
