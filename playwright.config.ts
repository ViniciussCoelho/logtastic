import { defineConfig, devices } from '@playwright/test';

const PORT = 5175;

export default defineConfig({
  testDir: 'e2e',
  // One game at a time: several WebGL/Phaser games sharing a headless GPU starve each other's
  // frames, and the game would run in slow motion. Real players run one game per browser.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  // The dev server is needed: the canvas debug hook only exists in dev builds. The journeys
  // play against the offline mock room (simulated beavers), so they don't need the Go server;
  // a fresh server is always started so it can't be a stray one pointed at the real room.
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    env: { VITE_ROOM_MOCK: 'true' },
    reuseExistingServer: false,
  },
});
