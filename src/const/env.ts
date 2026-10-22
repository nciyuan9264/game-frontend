export const rootFontSize = 20;

const resolveWebSocketURL = (value: string): string => {
  if (!value.startsWith('/') || typeof window === 'undefined') {
    return value;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${value}`;
};

export const gameWsUrl = resolveWebSocketURL(
  import.meta.env.VITE_GAME_WS_URL || '/ws',
);
