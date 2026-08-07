import { defineConfig, devices } from '@playwright/test'

// Only the deployed-site smoke tests live here; the hermetic component tests
// run under Vitest and are the ones that gate pull requests.
export default defineConfig({
  testDir: './e2e',
  // The dashboard waits on a backend that may be processing a repository, so
  // these are minutes-scale by nature.
  timeout: 16 * 60 * 1000,
  expect: { timeout: 30_000 },
  // A flake here is usually the tunnel, not the code; one retry keeps the
  // schedule quiet without hiding a real regression.
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.OSSPREY_URL || 'https://ossprey.netlify.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
