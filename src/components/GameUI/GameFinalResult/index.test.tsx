import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '.';

afterEach(cleanup);

describe('GameFinalResult', () => {
  it('renders the result regions in the shared order', () => {
    const { container } = render(<GameFinalResult
      mobileInset="self"
      hero={<h1>Hero</h1>}
      standings={<div>Standings</div>}
      summary={<div>Summary</div>}
      actions={<button type="button">Actions</button>}
      footerNote="Note"
    />);

    const root = container.querySelector('[data-game-final-result]');
    expect(root?.getAttribute('data-game-final-result-inset')).toBe('self');
    expect(Array.from(root?.children ?? []).map(element =>
      element.getAttributeNames().find(name =>
        name.startsWith('data-game-final-result')))).toEqual([
      'data-game-final-result-hero',
      'data-game-final-result-content',
      'data-game-final-result-actions',
      'data-game-final-result-note',
    ]);
    expect(root?.querySelector('[data-game-final-result-content]')?.children)
      .toHaveLength(2);
  });

  it('omits optional summary and note regions', () => {
    const { container } = render(<GameFinalResult
      mobileInset="host"
      hero="Hero"
      standings="Standings"
      actions="Actions"
    />);

    expect(container.querySelector('[data-game-final-result-summary]')).toBeNull();
    expect(container.querySelector('[data-game-final-result-note]')).toBeNull();
  });
});

describe('GameFinalResultActions', () => {
  it('runs the live owner actions in the shared order', () => {
    const onViewBoard = vi.fn();
    const onLeave = vi.fn();
    const onRestart = vi.fn();
    render(<GameFinalResultActions
      mode="live"
      onViewBoard={onViewBoard}
      viewBoardLabel="查看终局棋盘"
      onLeave={onLeave}
      canRestart
      onRestart={onRestart}
    />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.map(button => button.textContent)).toEqual([
      '查看终局棋盘',
      '回到大厅',
      '再来一局',
    ]);
    buttons.forEach(button => fireEvent.click(button));
    expect(onViewBoard).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('shows a disabled waiting action for non-owners', () => {
    render(<GameFinalResultActions
      mode="live"
      onViewBoard={vi.fn()}
      viewBoardLabel="查看终局牌桌"
      onLeave={vi.fn()}
      canRestart={false}
    />);

    expect(screen.getByRole<HTMLButtonElement>('button', {
      name: '等待房主再来一局',
    }).disabled).toBe(true);
  });

  it('only returns to the board in replay mode', () => {
    render(<GameFinalResultActions
      mode="replay"
      onViewBoard={vi.fn()}
      viewBoardLabel="回到回放棋盘"
    />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole<HTMLButtonElement>('button', {
      name: '回到回放棋盘',
    }).disabled).toBe(false);
  });
});
