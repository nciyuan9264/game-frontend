import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';

export const OTHELLO_SCREENSHOT_DIR = resolve(
  process.cwd(),
  'test-results/othello-screenshots',
);

export async function captureOthello(page: Page, name: string) {
  mkdirSync(OTHELLO_SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: resolve(OTHELLO_SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}
