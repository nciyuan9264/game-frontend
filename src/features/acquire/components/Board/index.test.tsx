import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gameFixture } from '../../model/selectors.test';
import { Board } from '.';

afterEach(cleanup);

describe('Acquire board interactions', () => {
  it('selects playable hand tiles and inspects other empty tiles', () => {
    const onSelect = vi.fn();
    const onInspect = vi.fn();
    const data = gameFixture();
    const { rerender } = render(<Board data={data} mode="live" canSelect onSelect={onSelect} onInspect={onInspect} />);

    const playableTile = screen.getByRole('button', { name: '地块 1A，我的手牌' });
    expect(playableTile.className).toMatch(/playable/);
    fireEvent.click(playableTile);
    expect(onSelect).toHaveBeenCalledWith('1A');
    expect(onInspect).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '地块 3C，空地' }));
    expect(onInspect).toHaveBeenCalledWith('3C · 空地');

    rerender(<Board data={data} mode="live" canSelect={false} onSelect={onSelect} onInspect={onInspect} />);
    expect(screen.getByRole('button', { name: '地块 1A，我的手牌' }).className).not.toMatch(/playable/);
  });
  it('allows and flashes a hand tile between two safe companies', () => {
    const data = gameFixture();
    data.roomData.tiles['2A'] = { id: '2A', belong: 'Blank' };
    data.roomData.tiles['3A'] = { id: '3A', belong: 'Tower' };
    data.roomData.tiles['1B'] = { id: '1B', belong: 'American' };
    data.roomData.companyInfo.Tower.tiles = 11;
    data.roomData.companyInfo.American.tiles = 11;
    const onSelect = vi.fn();
    const onInspect = vi.fn();

    render(<Board data={data} mode="live" canSelect onSelect={onSelect} onInspect={onInspect} />);
    const tile = screen.getByRole('button', { name: '地块 1A，我的手牌' });

    expect(tile.className).toMatch(/playable/);
    fireEvent.click(tile);
    expect(onSelect).toHaveBeenCalledWith('1A');
    expect(onInspect).not.toHaveBeenCalled();
  });
  it('identifies independent tiles with the dedicated neutral style', () => {
    const data = gameFixture();
    data.roomData.tiles['3C'] = { id: '3C', belong: 'Blank' };

    render(<Board data={data} mode="live" canSelect={false} onSelect={vi.fn()} onInspect={vi.fn()} />);

    expect(screen.getByRole('button', { name: '地块 3C，独立地块' }).className).toMatch(/neutral/);
  });
});
