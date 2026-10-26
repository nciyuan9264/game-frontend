import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClipboardCopy } from './useClipboardCopy';

describe('useClipboardCopy', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('tracks the last successfully copied value and resets it', async () => {
    writeText.mockResolvedValue(undefined);
    const hook = renderHook(useClipboardCopy);

    await act(async () => {
      expect(await hook.result.current.copy('https://example.com')).toBe(true);
    });
    expect(hook.result.current.copiedValue).toBe('https://example.com');

    act(() => hook.result.current.reset());
    expect(hook.result.current.copiedValue).toBe('');
  });

  it('clears stale success state when copying fails', async () => {
    writeText.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('denied'));
    const hook = renderHook(useClipboardCopy);

    await act(async () => {
      await hook.result.current.copy('first');
      expect(await hook.result.current.copy('second')).toBe(false);
    });
    expect(hook.result.current.copiedValue).toBe('');
  });
});
