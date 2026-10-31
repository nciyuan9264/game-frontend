import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameTabs } from '.';

const items = [
  { value: 'all', label: '全部' },
  { value: 'joinable', label: '可加入' },
  { value: 'playing', label: '对局中' },
] as const;

afterEach(cleanup);

describe('GameTabs', () => {
  it('exposes tab semantics and handles click selection', () => {
    const onChange = vi.fn();
    render(<GameTabs items={items} value="all" onChange={onChange} ariaLabel="房间筛选" />);
    expect(screen.getByRole('tablist', { name: '房间筛选' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '全部' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: '可加入' }));
    expect(onChange).toHaveBeenCalledWith('joinable');
  });

  it('supports Arrow, Home, and End keyboard selection', () => {
    const onChange = vi.fn();
    const view = render(<GameTabs items={items} value="all" onChange={onChange} ariaLabel="房间筛选" />);
    fireEvent.keyDown(screen.getByRole('tab', { name: '全部' }), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('playing');

    view.rerender(<GameTabs items={items} value="playing" onChange={onChange} ariaLabel="房间筛选" />);
    fireEvent.keyDown(screen.getByRole('tab', { name: '对局中' }), { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith('all');

    view.rerender(<GameTabs items={items} value="all" onChange={onChange} ariaLabel="房间筛选" />);
    fireEvent.keyDown(screen.getByRole('tab', { name: '全部' }), { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('playing');
  });

  it('marks only the activated tab during press feedback', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<GameTabs items={items} value="all" onChange={onChange} ariaLabel="房间筛选" />);

    fireEvent.click(screen.getByRole('tab', { name: '可加入' }));

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(tab => tab.getAttribute('data-game-tab-pressed')))
      .toEqual([null, 'true', null]);
    expect(screen.getByRole('tablist', { name: '房间筛选' })
      .getAttribute('data-game-tabs-pressing')).toBe('true');

    act(() => vi.advanceTimersByTime(140));
    expect(tabs.every(tab => !tab.hasAttribute('data-game-tab-pressed'))).toBe(true);
    expect(screen.getByRole('tablist', { name: '房间筛选' })
      .hasAttribute('data-game-tabs-pressing')).toBe(false);
    vi.useRealTimers();
  });
});
