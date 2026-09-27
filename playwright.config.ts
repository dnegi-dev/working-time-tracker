import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Use a preinstalled Chromium when the bundled one is missing (e.g. cloud sandboxes).
const local = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync(local) ? local : undefined);
const common = { timezoneId: 'Europe/Berlin', locale: 'en-US', launchOptions: { executablePath } };

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173/working-time-tracker/', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...common } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium', ...common } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/working-time-tracker/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
