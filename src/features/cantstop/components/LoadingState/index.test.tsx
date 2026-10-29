import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CantStopLoading } from '.';

afterEach(cleanup);

describe('CantStopLoading', () => {
  it('uses the mountain and dice loading treatment', () => {
    const { container } = render(<CantStopLoading description="正在同步山路" />);

    const status = screen.getByRole('status', { name: '正在同步山路' });
    expect(status.getAttribute('data-game-loading')).toBe('cantstop');
    expect(status.querySelector('span > svg:first-child')).toBeTruthy();
    expect(container.querySelector('.lucide-dices')).toBeTruthy();
    expect(container.querySelector('.lucide-loader-circle')).toBeNull();
  });
});
