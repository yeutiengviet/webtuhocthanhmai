import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    launchOptions: { executablePath: process.env.PW_CHROMIUM ?? undefined },
  },
  projects: [{ name: "dien-thoai", use: { ...devices["Pixel 5"] } }],
  webServer: {
    // Chạy bản đã build (giống bản thật). Hãy chạy `npm run build` trước.
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
