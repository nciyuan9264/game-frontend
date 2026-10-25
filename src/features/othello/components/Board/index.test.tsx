import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Disc } from '../../model/types';
import { Board } from '.';

afterEach(cleanup);

describe('OTHELLO board', () => {
  it('renders a stable 64-cell board and submits only legal cells', () => {
    const onCell = vi.fn();
    const board: Disc[] = Array.from({ length: 64 }, () => '');
    board[27] = 'white';
    board[28] = 'black';
    board[35] = 'black';
    board[36] = 'white';
    render(<Board
      board={board}
      currentSide="black"
      legalMoves={[{ index: 19, flips: [27], lines: [[27]] }]}
      preview={{ index: 19, flips: [27], lines: [[27]] }}
      interactive
      coordinates
      hints
      onCell={onCell}
      onHover={vi.fn()}
    />);
    expect(screen.getByRole('group', {
      name: '黑白棋棋盘，8 行 8 列。方向键移动，回车落子。',
    })).toBeTruthy();
    expect(screen.getAllByTestId(/^cell-/)).toHaveLength(64);
    fireEvent.click(screen.getByRole('button', {
      name: 'D3，可落子，翻转 1 枚',
    }));
    expect(onCell).toHaveBeenCalledWith(19);
    fireEvent.click(screen.getByRole('button', { name: 'A1，不可落子' }));
    expect(onCell).toHaveBeenCalledTimes(1);
  });
});
