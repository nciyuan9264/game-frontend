import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { OthelloSessionLoading } from './Loading';

describe('Othello session loading', () => {
  it('keeps one stable loading view through session initialization', () => {
    render(<MemoryRouter>
      <OthelloSessionLoading />
    </MemoryRouter>);

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByText('正在进入棋室。')).toBeTruthy();
    expect(screen.getByText('正在同步身份、席位与最新对局状态')).toBeTruthy();
  });
});
