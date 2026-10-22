import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logout } from '../api/auth';
import { useGameLogout } from './useGameLogout';

vi.mock('../api/auth', () => ({ logout: vi.fn() }));

beforeEach(() => {
  localStorage.setItem('profile', '{"name":"Alice"}');
  vi.mocked(logout).mockReset();
});
afterEach(cleanup);

describe('useGameLogout', () => {
  it('clears the cached profile and redirects after success', async () => {
    vi.mocked(logout).mockResolvedValue({
      status_code: 200,
      message: 'ok',
    });
    const redirect = vi.fn();
    const hook = renderHook(() => useGameLogout({ redirect }));
    await act(async () => {
      expect(await hook.result.current.run()).toBe(true);
    });

    expect(localStorage.getItem('profile')).toBeNull();
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining(
      'https://auth.gamebus.online/login?redirect='
    ));
  });

  it('keeps the session when logout fails', async () => {
    vi.mocked(logout).mockRejectedValue(new Error('offline'));
    const redirect = vi.fn();
    const hook = renderHook(() => useGameLogout({ redirect }));
    await act(async () => {
      expect(await hook.result.current.run()).toBe(false);
    });

    expect(localStorage.getItem('profile')).not.toBeNull();
    expect(redirect).not.toHaveBeenCalled();
    expect(hook.result.current.error).toBe('offline');
    expect(hook.result.current.pending).toBe(false);
  });
});
