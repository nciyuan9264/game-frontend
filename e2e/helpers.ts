import {
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test';

export type GameType =
  | 'acquire'
  | 'davinci'
  | 'splendor'
  | 'yinsh'
  | 'othello'
  | 'fugitive'
  | 'warchest'
  | 'loveletter'
  | 'sixnimmt';

interface RoomInfo {
  roomID: string;
  gameType: GameType;
  status: string;
  visibility: string;
  currentMatchID: string;
}

interface RoomEnvelope {
  data: RoomInfo;
}

const production = process.env.PLAYWRIGHT_PRODUCTION === '1';
export const frontendBase = process.env.REGRESSION_FRONTEND_URL
  || (production ? 'https://board.gamebus.online' : 'http://127.0.0.1:4173');
export const apiBase = process.env.REGRESSION_HTTP_BASE
  || (production ? 'https://api.gamebus.online/pam-api' : `${frontendBase}/pam-api`);

export function accessToken(): string {
  const token = process.env.REGRESSION_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error('REGRESSION_ACCESS_TOKEN is required for authenticated E2E tests');
  }
  return token;
}

export async function installAccessToken(context: BrowserContext): Promise<void> {
  const token = accessToken();
  const origins = new Set([new URL(frontendBase).origin, new URL(apiBase).origin]);
  await context.addCookies([...origins].map(url => ({
    name: 'access_token',
    value: token,
    url,
    path: '/',
    httpOnly: true,
    secure: url.startsWith('https://'),
    sameSite: 'Lax' as const,
  })));
}

export async function createPrivateRoom(
  request: APIRequestContext,
  gameType: GameType,
  requestID: string,
): Promise<RoomInfo> {
  const response = await request.post(`${apiBase}/platform/rooms`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
    data: {
      gameType,
      visibility: 'private',
      maxPlayers: gameType === 'sixnimmt'
        ? 10
        : gameType === 'loveletter' ? 6 : 2,
      requestID,
    },
  });
  expect(response.ok(), await safeResponseMessage(response)).toBeTruthy();
  const envelope = await response.json() as RoomEnvelope;
  expect(envelope.data.roomID).toBeTruthy();
  expect(envelope.data.currentMatchID).toBeTruthy();
  return envelope.data;
}

export async function closeRoom(
  request: APIRequestContext,
  room: RoomInfo,
  requestID: string,
): Promise<void> {
  const response = await request.delete(
    `${apiBase}/platform/rooms/${encodeURIComponent(room.roomID)}?gameType=${room.gameType}`,
    {
      headers: { Authorization: `Bearer ${accessToken()}` },
      data: { requestID },
    },
  );
  expect(response.ok(), await safeResponseMessage(response)).toBeTruthy();
}

export function observePage(page: Page) {
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 500) {
      serverErrors.push(`${response.status()} ${new URL(response.url()).pathname}`);
    }
  });
  return () => {
    expect(consoleErrors, 'browser console errors').toEqual([]);
    expect(serverErrors, 'HTTP 5xx responses').toEqual([]);
  };
}

export function regressionRunID(): string {
  return process.env.REGRESSION_RUN_ID
    || `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

async function safeResponseMessage(response: {
  status(): number;
  text(): Promise<string>;
}): Promise<string> {
  const body = (await response.text()).slice(0, 300);
  return `HTTP ${response.status()} ${body}`;
}
