import { randomBytes } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Real React application + authenticated loopback bridge. Only the launcher is
// replaced in RAM so no credential enters a URL, storage, trace, or screenshot.
const root = path.resolve(import.meta.dirname, "../../../..");
const artifacts = path.join(root, ".design-cache/visual-system-refinement/review");
const token = randomBytes(32).toString("base64url");
let bridge: ChildProcessWithoutNullStreams;
let apiOrigin: string;
let sessionCookie: string;

test.beforeAll(async () => {
  await mkdir(artifacts, { recursive: true });
  bridge = spawn(path.join(root, ".venv/Scripts/python.exe"), ["-m", "app.desktop_collector.shell", "--e2e-server", "--dev", "--vite-origin", "http://127.0.0.1:5173"], { cwd: root, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let startupError = "";
  bridge.stderr.on("data", chunk => { startupError = (startupError + String(chunk)).slice(-4000); });
  const port = await new Promise<number>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error("Bridge startup timed out")), 15000);
    bridge.stdout.on("data", chunk => {
      output += String(chunk);
      const match = output.match(/PORT=(\d+)/);
      if (match) { clearTimeout(timer); resolve(Number(match[1])); }
    });
    bridge.once("exit", code => { clearTimeout(timer); reject(new Error(`Bridge exited ${code}: ${startupError.replaceAll(token, "[redacted]")}`)); });
    bridge.stdin.write(`${token}\n`);
  });
  apiOrigin = `http://127.0.0.1:${port}`;
  const password = randomBytes(24).toString("base64url");
  const response = await fetch(`${apiOrigin}/api/v1/auth/setup`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Origin: "http://127.0.0.1:5173" },
    body: JSON.stringify({ username: "visual-review", display_name: "Visual review", password, password_confirmation: password }),
  });
  expect(response.status).toBe(201);
  sessionCookie = response.headers.get("set-cookie")?.match(/smartglove_user_session=([^;]+)/)?.[1] ?? "";
  expect(Boolean(sessionCookie)).toBe(true);
});

test.afterAll(async () => {
  if (bridge?.exitCode === null) {
    const stopped = new Promise(resolve => bridge.once("exit", resolve));
    bridge.stdin.end("STOP\n");
    await Promise.race([stopped, new Promise(resolve => setTimeout(resolve, 5000))]);
    if (bridge.exitCode === null) bridge.kill();
    expect(bridge.exitCode).toBe(0);
  }
});

async function open(page: Page, theme: "dark" | "light" = "dark") {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  await page.context().addCookies([{ name: "smartglove_user_session", value: sessionCookie, url: apiOrigin, httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/src/main.tsx", route => route.fulfill({ contentType: "application/javascript", body: `import React from '/node_modules/.vite/deps/react.js'; import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js'; import { App } from '/src/App.tsx'; import { BridgeClient } from '/src/api.ts'; import '/src/styles.css'; import '/node_modules/uplot/dist/uPlot.min.css'; window.__mountReview = credentials => ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, {bridge:new BridgeClient(credentials)}));` }));
  await page.goto("/");
  await page.waitForFunction(() => typeof (window as any).__mountReview === "function");
  await page.evaluate(credentials => { (window as any).__mountReview(credentials); delete (window as any).__mountReview; }, { apiOrigin, token });
  await expect(page.getByTestId("device-manager")).toBeVisible();
  await expect(page.locator(".device-status").first()).toContainText("Đang nhận dữ liệu");
  expect(new URL(page.url()).hash).toBe("");
}

async function navigate(page: Page, name: "Devices" | "Monitor") {
  await page.getByRole("navigation", { name: "Điều hướng ứng dụng" }).getByRole("button", { name, exact: true }).click();
}
async function resetScroll(page: Page) {
  await page.evaluate(() => { document.querySelector(".app-content")!.scrollTop = 0; (document.activeElement as HTMLElement)?.blur(); });
  await page.mouse.move(0, 0);
}
async function screenshot(page: Page, name: string) {
  await resetScroll(page);
  await page.screenshot({ path: path.join(artifacts, name) });
}
async function accessible(page: Page, name: string) {
  console.info(`Accessibility scan: ${name}`);
  const results = await new AxeBuilder({ page }).analyze();
  await writeFile(path.join(artifacts, `${name}-axe.json`), JSON.stringify({ violations: results.violations, incomplete: results.incomplete.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })) }, null, 2));
  expect(results.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function channelFocusReachable(page: Page) {
  const panel = page.locator("#live-channels");
  const inputs = panel.locator("input");
  for (const input of [inputs.last(), inputs.first()]) {
    await input.focus();
    await expect(input).toBeFocused();
    const row = (await input.locator("..").boundingBox())!;
    const scroll = (await page.locator(".health-live-channel-scroll").boundingBox())!;
    expect(row.y).toBeGreaterThanOrEqual(scroll.y - 1);
    expect(row.y + row.height).toBeLessThanOrEqual(scroll.y + scroll.height + 1);
    expect(await panel.evaluate(element => element.scrollTop)).toBe(0);
  }
}

test("shared system: real review, modal focus, channels, pause and follow-live", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await accessible(page, "devices-dark-1440x900");
  await screenshot(page, "device-manager-dark-1440x900.png");
  const disconnect = page.getByRole("button", { name: "Ngắt tất cả", exact: true });
  await disconnect.click();
  await expect(page.getByRole("dialog")).toHaveAttribute("data-state", "open");
  await accessible(page, "disconnect-dialog-dark");
  await page.screenshot({ path: path.join(artifacts, "device-manager-dialog-dark-1440x900.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(disconnect).toBeFocused();
  await navigate(page, "Monitor");
  await expect(page.locator(".uplot")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Quick Status", exact: true })).toBeVisible();
  await expect(page.locator(".one-ui-activity-lane")).toBeVisible();
  const beforeActivity = await page.locator("#live-overview").boundingBox();
  const activity = page.getByTestId("runtime-now-bar");
  await activity.getByRole("button", { name: /^Expand / }).click();
  await expect(activity.getByRole("button", { name: /^Collapse / })).toHaveAttribute("aria-expanded", "true");
  expect(await page.locator("#live-overview").boundingBox()).toEqual(beforeActivity);
  await page.keyboard.press("Escape");
  await expect(activity.getByRole("button", { name: /^Expand / })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".health-chart-legend__item")).toHaveCount(6);
  await accessible(page, "monitor-dark-1440x900");
  await screenshot(page, "live-monitor-dark-1440x900.png");

  const pause = page.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true });
  const bounds = await pause.boundingBox();
  await pause.click();
  await page.mouse.move(0, 0);
  await expect(page.locator(".chart-status").first()).toContainText("Paused");
  expect(await page.getByRole("button", { name: "Tiếp tục biểu đồ", exact: true }).boundingBox()).toEqual(bounds);
  await page.waitForTimeout(120);
  const frozen = await page.locator(".plot-host canvas").first().evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const packets = Number(await page.getByTestId("live-monitor").getAttribute("data-total-packets"));
  await expect.poll(async () => Number(await page.getByTestId("live-monitor").getAttribute("data-total-packets"))).toBeGreaterThan(packets);
  expect(await page.locator(".plot-host canvas").first().evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(frozen);
  await page.getByTestId("theme-control").click();
  await page.getByTestId("theme-control").click();
  await expect.poll(() => page.locator(".plot-host canvas").first().evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(frozen);
  await page.getByRole("button", { name: "Tiếp tục biểu đồ", exact: true }).click();

  const labels = page.locator(".health-live-channels .one-ui-checkbox-row");
  await expect(labels).toHaveCount(13);
  for (let i = 0; i < 13; i++) if (!(await labels.nth(i).locator("input").isChecked())) await labels.nth(i).click();
  await expect(page.locator("#chart-left .health-chart-legend__item")).toHaveCount(13);
  const colors = await page.locator("#chart-left .health-chart-legend__swatch").evaluateAll(elements => elements.map(element => getComputedStyle(element).color));
  expect(new Set(colors).size).toBe(13);
  await channelFocusReachable(page);
  await screenshot(page, "live-monitor-all-channels-dark-1440x900.png");
  for (let i = 0; i < 13; i++) if (await labels.nth(i).locator("input").isChecked()) await labels.nth(i).click();
  await expect(page.locator(".uplot")).toHaveCount(0);
  await expect(page.getByText("Chưa chọn kênh", { exact: true })).toHaveCount(2);
  await labels.first().click();
  await expect(page.locator(".uplot")).toHaveCount(2);
  await resetScroll(page);
  const plot = page.locator("#chart-left .u-over");
  await plot.scrollIntoViewIfNeeded();
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width * .3, box.y + box.height * .5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .7, box.y + box.height * .5, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText("Đang xem dữ liệu trước", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true }).click();
  const explored = await plot.locator("..").locator("canvas").first().evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.getByTestId("theme-control").click();
  await page.getByTestId("theme-control").click();
  await expect.poll(() => page.locator("#chart-left canvas").first().evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(explored);
  await page.getByRole("button", { name: "Tiếp tục biểu đồ", exact: true }).click();
  await page.getByRole("button", { name: "Về dữ liệu mới nhất", exact: true }).click();
  await expect(page.getByRole("button", { name: "Về dữ liệu mới nhất", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "30s", exact: true }).click();
  await expect(page.getByRole("button", { name: "30s", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#live-table tbody tr")).toHaveCount(13);
  await navigate(page, "Devices");
  await page.locator("#device-left").getByRole("button", { name: "Ngắt kết nối", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAttribute("data-state", "open");
  await page.getByRole("dialog").getByRole("button", { name: "Ngắt kết nối", exact: true }).click();
  await expect(page.locator("#device-left .device-status")).toContainText("Đã ngắt");
  await expect(page.locator("#device-left .health-flex-bars i[data-missing='true']")).toHaveCount(5);
  await page.locator("#device-left").getByRole("button", { name: "Kết nối", exact: true }).click();
  await expect(page.locator("#device-left .device-status")).toContainText("Đang nhận dữ liệu");
  await page.emulateMedia({ forcedColors: "active" });
  await navigate(page, "Monitor");
  const checkbox = page.locator(".health-live-channels input").first();
  await checkbox.focus();
  const wasChecked = await checkbox.isChecked();
  await page.keyboard.press("Space");
  expect(await checkbox.isChecked()).toBe(!wasChecked);
  await expect(checkbox).toBeFocused();
  await accessible(page, "monitor-forced-colors-keyboard");
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 800, height: 1100 }, { width: 640, height: 450 }]) {
  test(`shared system responsive ${viewport.width}x${viewport.height}: both themes`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    await open(page);
    for (const theme of ["dark", "light"]) {
      if (theme === "light") await page.getByTestId("theme-control").click();
      await navigate(page, "Devices");
      await accessible(page, `devices-${theme}-${viewport.width}`);
      await screenshot(page, `device-manager-${theme}-${viewport.width}x${viewport.height}.png`);
      await page.getByLabel("Tần số", { exact: true }).fill("200");
      await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
      const snack = page.locator(".one-ui-snackbar");
      await expect(snack).toHaveAttribute("data-state", "open");
      const snackBox = (await snack.boundingBox())!;
      expect(snackBox.x).toBeGreaterThanOrEqual(0);
      expect(snackBox.x + snackBox.width).toBeLessThanOrEqual(viewport.width);
      await page.getByRole("button", { name: "Đóng thông báo", exact: true }).click();
      await navigate(page, "Monitor");
      await expect(page.locator(".uplot")).toHaveCount(2);
      await channelFocusReachable(page);
      await accessible(page, `monitor-${theme}-${viewport.width}`);
      await screenshot(page, `live-monitor-${theme}-${viewport.width}x${viewport.height}.png`);
      const quickStatus = page.getByRole("button", { name: "Quick Status", exact: true });
      await quickStatus.click();
      const sheet = page.getByRole("dialog", { name: "Quick Status", exact: true });
      await expect(sheet).toHaveAttribute("data-state", "open");
      await accessible(page, `quick-status-${theme}-${viewport.width}`);
      if (viewport.width === 1440 && theme === "dark") await page.screenshot({ path: path.join(artifacts, "quick-status-dark-1440x900.png") });
      const sheetBox = (await sheet.boundingBox())!;
      expect(sheetBox.x).toBeGreaterThanOrEqual(0);
      expect(sheetBox.x + sheetBox.width).toBeLessThanOrEqual(viewport.width);
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
      await expect(quickStatus).toBeFocused();
      for (const hand of ["left", "right"]) {
        const canvasWidth = await page.locator(`#chart-${hand} .uplot`).evaluate(element => element.getBoundingClientRect().width);
        const hostWidth = await page.locator(`#chart-${hand} .plot-host`).evaluate(element => element.getBoundingClientRect().width);
        expect(canvasWidth).toBeLessThanOrEqual(hostWidth + 1);
      }
    }
  });
}
