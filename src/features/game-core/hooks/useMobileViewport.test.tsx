import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMobileViewport } from './useMobileViewport';

describe('useMobileViewport', () => {
  let matches = false;
  let listener: (() => void) | undefined;

  beforeEach(() => {
    matches = false;
    listener = undefined;
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches,
      media: '(max-width: 767px)',
      onchange: null,
      addEventListener: (_type: string, next: () => void) => {
        listener = next;
      },
      removeEventListener: () => {
        listener = undefined;
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  it('tracks the shared mobile breakpoint', () => {
    const hook = renderHook(useMobileViewport);
    expect(hook.result.current.isMobile).toBe(false);

    act(() => {
      matches = true;
      listener?.();
    });
    expect(hook.result.current.isMobile).toBe(true);
  });
});
