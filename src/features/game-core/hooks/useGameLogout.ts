import { useCallback, useEffect, useRef, useState } from 'react';
import { logout } from '../api/auth';

interface UseGameLogoutOptions {
  redirect?: (url: string) => void;
  loginURL?: string;
}

const defaultRedirect = (url: string) => {
  window.location.href = url;
};

export function useGameLogout({
  redirect = defaultRedirect,
  loginURL = 'https://auth.gamebus.online/login',
}: UseGameLogoutOptions = {}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const sequenceRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      ++sequenceRef.current;
    };
  }, []);

  const run = useCallback(async () => {
    const requestID = ++sequenceRef.current;
    setPending(true);
    setError('');

    try {
      await logout();
      if (!mountedRef.current || requestID !== sequenceRef.current) return false;
      localStorage.removeItem('profile');
      redirect(`${loginURL}?redirect=${encodeURIComponent(window.location.href)}`);
      return true;
    } catch (reason) {
      if (mountedRef.current && requestID === sequenceRef.current) {
        setError(reason instanceof Error ? reason.message : '退出登录失败，请稍后重试');
        setPending(false);
      }
      return false;
    }
  }, [loginURL, redirect]);

  const reset = useCallback(() => setError(''), []);

  return { run, pending, error, reset };
}
