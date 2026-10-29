import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SixNimmtLoading } from '.';

afterEach(cleanup);

describe('SixNimmtLoading', () => {
  it('uses the bull and card-stack loading treatment', () => {
    const { container } = render(<SixNimmtLoading description="正在整理牌列" />);

    const status = screen.getByRole('status', { name: '正在整理牌列' });
    expect(status.getAttribute('data-game-loading')).toBe('sixnimmt');
    expect(status.querySelector('span > svg:first-child')).toBeTruthy();
    expect(container.querySelector('.lucide-layers')).toBeTruthy();
    expect(container.querySelector('.lucide-loader-circle')).toBeNull();
  });
});
