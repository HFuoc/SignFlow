import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    channel: process.env.CI ? undefined : "msedge",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: process.env.ONE_UI9_REVIEW === "1"
      ? "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5173"
      : "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  outputDir: "test-results",
});
