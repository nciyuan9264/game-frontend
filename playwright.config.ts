import { defineConfig, devices } from '@playwright/test';

const production = process.env.PLAYWRIGHT_PRODUCTION === '1';
const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = process.env.REGRESSION_FRONTEND_URL
  || (production ? 'https://board.gamebus.online' : `http://127.0.0.1:${port}`);

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: production
    ? undefined
    : {
        command: `pnpm dev --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
