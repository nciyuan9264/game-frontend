import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
});
