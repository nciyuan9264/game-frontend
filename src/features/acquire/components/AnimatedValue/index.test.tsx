import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnimatedValue } from '.';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AnimatedValue', () => {
  it('never interpolates below the starting value when the first frame timestamp is earlier', () => {
    let frame: FrameRequestCallback | undefined;
    vi.spyOn(performance, 'now').mockReturnValue(100);
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));

    const { rerender } = render(<AnimatedValue value={0} />);
    rerender(<AnimatedValue value={1} />);

    act(() => frame?.(0));
    expect(screen.getByText('0')).toBeTruthy();
    act(() => frame?.(460));
    expect(screen.getByText('1')).toBeTruthy();
  });
});
