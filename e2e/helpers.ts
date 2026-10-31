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
  | 'sixnimmt'
  | 'forsale'
  | 'onitama';

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
        : gameType === 'loveletter' || gameType === 'forsale' ? 6 : 2,
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

export async function expectMobileFinalResultLayout(
  page: Page,
  options: { actionCount?: number } = {},
): Promise<void> {
  const root = page.locator('[data-game-final-result]');
  const hero = root.locator('[data-game-final-result-hero]');
  const standings = root.locator('[data-game-final-result-standings]');
  const summary = root.locator('[data-game-final-result-summary]');
  const actions = root.locator('[data-game-final-result-actions]');

  await expect(root).toBeVisible();
  await expect(hero).toBeVisible();
  await expect(standings).toBeVisible();
  await expect(summary).toBeVisible();
  await expect(actions).toBeVisible();

  const boxes = await Promise.all([
    hero.boundingBox(),
    standings.boundingBox(),
    summary.boundingBox(),
    actions.boundingBox(),
  ]);
  expect(boxes.every(Boolean)).toBe(true);
  const [heroBox, standingsBox, summaryBox, actionsBox] = boxes;
  expect(standingsBox!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height);
  expect(summaryBox!.y).toBeGreaterThanOrEqual(
    standingsBox!.y + standingsBox!.height,
  );
  expect(actionsBox!.y).toBeGreaterThanOrEqual(
    summaryBox!.y + summaryBox!.height,
  );
  await expect(actions).toHaveCSS('position', 'static');
  await expect(actions.locator('button')).toHaveCount(options.actionCount ?? 3);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const viewport = page.viewportSize();
  if (viewport && viewport.width > 320) {
    await page.setViewportSize({ width: 320, height: 700 });
    await expect(root).toBeVisible();
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const buttonsFit = await actions.locator('button').evaluateAll(buttons =>
      buttons.every(button => button.scrollWidth <= button.clientWidth));
    expect(buttonsFit).toBe(true);
    await page.setViewportSize(viewport);
  }
}

async function safeResponseMessage(response: {
  status(): number;
  text(): Promise<string>;
}): Promise<string> {
  const body = (await response.text()).slice(0, 300);
  return `HTTP ${response.status()} ${body}`;
}
