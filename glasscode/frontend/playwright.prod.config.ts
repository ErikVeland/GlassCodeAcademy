import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e/prod',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://glasscode.academy',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});