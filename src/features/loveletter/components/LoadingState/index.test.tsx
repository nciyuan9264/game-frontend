import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LoveLetterLoading } from '.';

afterEach(cleanup);

describe('LoveLetterLoading', () => {
  it('uses the letter and wax-seal loading treatment', () => {
    const { container } = render(<LoveLetterLoading description="正在递送密信" />);

    const status = screen.getByRole('status', { name: '正在递送密信' });
    expect(status.getAttribute('data-game-loading')).toBe('loveletter');
    expect(container.querySelector('.lucide-mail')).toBeTruthy();
    expect(container.querySelector('.lucide-heart')).toBeTruthy();
    expect(container.querySelector('.lucide-loader-circle')).toBeNull();
  });
});
