import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Board } from '.';

afterEach(cleanup);

describe('YINSH board', () => {
  it('renders a stable 85-point SVG and submits only active points', () => {
    const onPoint = vi.fn();
    render(<Board
      rings={{ E4: 'white', D3: 'black' }}
      markers={{ E5: 'black', E6: 'white' }}
      status="move"
      currentSide="white"
      selected="E4"
      moves={[{ to: 'E7', flips: ['E5', 'E6'] }]}
      preview={{ to: 'E7', flips: ['E5', 'E6'] }}
      candidateRows={[]}
      interactive
      coordinates
      hints
      onPoint={onPoint}
      onHover={vi.fn()}
    />);
    expect(screen.getByRole('group', { name: 'YINSH 棋盘，85 个交点' })).toBeTruthy();
    expect(screen.getAllByTestId(/^point-/)).toHaveLength(85);
    fireEvent.click(screen.getByRole('button', { name: '移动到 E7' }));
    expect(onPoint).toHaveBeenCalledWith('E7');
    fireEvent.click(screen.getByRole('button', { name: '交点 A2' }));
    expect(onPoint).toHaveBeenCalledTimes(1);
  });
});
