export const rootFontSize = 20;

export const baseURL = import.meta.env.VITE_API_BASE_URL;
export const authApiBaseURL = (
  import.meta.env.VITE_AUTH_API_BASE_URL ||
  `${baseURL.replace(/\/$/, '')}/pam-api/platform/auth`
).replace(/\/$/, '');

const resolveWebSocketURL = (value: string): string => {
  if (!value.startsWith('/') || typeof window === 'undefined') {
    return value;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${value}`;
};

export const acquireWsUrl = resolveWebSocketURL(import.meta.env.VITE_ACQUIRE_WS_URL);
export const davinciWsUrl = resolveWebSocketURL(import.meta.env.VITE_DAVINCI_WS_URL);
export const splendorWsUrl = resolveWebSocketURL(import.meta.env.VITE_SPLENDOR_WS_URL);
