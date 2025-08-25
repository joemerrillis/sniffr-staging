import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/web/e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL,   // we pass it from CI
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
});
