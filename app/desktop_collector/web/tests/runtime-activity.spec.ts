import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const repoRoot = path.resolve(import.meta.dirname, "../../../../");
const python = process.env.PYTHON_EXECUTABLE ?? path.join(repoRoot, ".venv", "Scripts", "python.exe");
const artifactRoot = path.join(repoRoot, ".design-cache", "artifacts", process.env.ONE_UI9_REVIEW === "1" ? "one-ui9-device-manager" : "one-ui-v3");
const token = randomBytes(32).toString("base64url");
const administrator = { username: "admin-p21", password: "Admin P.2.1 passphrase 2026" };
let bridge: ChildProcessWithoutNullStreams | undefined;
let port: number;
let sessionCredential: string;

async function waitForPort(child: ChildProcessWithoutNullStreams): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => reject(new Error(`bridge did not report its port${stderr ? `: ${stderr.trim()}` : ""}`)), 10_000);
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      const match = stdout.match(/PORT=(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(Number(match[1]));
      }
    });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.once("exit", (code) => reject(new Error(`bridge exited early (${code})${stderr ? `: ${stderr.trim()}` : ""}`)));
  });
}

test.beforeAll(async () => {
  await mkdir(artifactRoot, { recursive: true });
  bridge = spawn(
    python,
    ["-m", "app.desktop_collector.shell", "--e2e-server", "--dev", "--vite-origin", "http://127.0.0.1:5173"],
    {
      cwd: repoRoot,
      env: { ...process.env, OPENBLAS_NUM_THREADS: "1", OMP_NUM_THREADS: "1" },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  bridge.stdin.write(`${token}\n`);
  port = await waitForPort(bridge);

  // Hash the test credential before the browser starts so Argon2id keeps its production
  // parameters without competing with a browser process on constrained CI hosts.
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/setup`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Origin: "http://127.0.0.1:5173",
    },
    body: JSON.stringify({
      username: administrator.username,
      display_name: "Admin P21",
      password: administrator.password,
      password_confirmation: administrator.password,
    }),
  });
  if (!response.ok) throw new Error(`administrator bootstrap failed (${response.status})`);
  sessionCredential = response.headers.get("set-cookie")?.match(/smartglove_user_session=([^;]+)/)?.[1] ?? "";
  if (!sessionCredential) throw new Error("administrator session cookie was not issued");
});

test.afterAll(async () => {
  if (!bridge) return;
  bridge.stdin.write("STOP\n");
  bridge.stdin.end();
  await new Promise<void>((resolve) => {
    bridge!.once("exit", () => resolve());
    setTimeout(() => { bridge?.kill(); resolve(); }, 5_000);
  });
});

async function openCollector(page: Page) {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.context().addCookies([{
    name: "smartglove_user_session",
    value: sessionCredential,
    url: `http://127.0.0.1:${port}`,
    httpOnly: true,
    sameSite: "Strict",
  }]);
  await page.goto(`/#api=${encodeURIComponent(`http://127.0.0.1:${port}`)}&token=${encodeURIComponent(token)}`);
  await expect(page.getByTestId("device-manager")).toBeVisible({ timeout: 15_000 });
  await expect(page).not.toHaveURL(/token=/);
}

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

const protectedContentSelector = [
  ".one-ui-top-app-bar",
  ".landscape-app-rail",
  ".compact-app-navigation",
  "#collector-content .page-toolbar > p",
  "#collector-content .device-page-intro",
  "#collector-content .metric-strip",
  "#collector-content .metric-strip small",
  "#collector-content .metric-strip strong",
  "#collector-content .device-card",
  "#collector-content .device-stats",
  "#collector-content .sensor-summary",
  "#collector-content .settings-card",
  "#collector-content .settings-card label",
  "#collector-content .channel-panel",
  "#collector-content .channel-panel .panel-title",
  "#collector-content .channel-panel fieldset",
  "#collector-content .chart-card",
  "#collector-content .chart-card header",
  "#collector-content .chart-card header p",
  "#collector-content .plot-host",
  "#collector-content .uplot",
  "#collector-content .uplot canvas",
  ".one-ui-overlay-layer button",
].join(",");

async function expectCollisionSafe(page: Page, nowBarVisible = true) {
  const nowBar = page.getByTestId("runtime-now-bar");
  if (nowBarVisible) await expect(nowBar).toBeVisible();
  else {
    await expect(nowBar).toHaveAttribute("aria-hidden", "true");
    await expect(nowBar).toHaveCSS("opacity", "0");
  }
  const geometry = await page.evaluate((selector) => {
    const bar = document.querySelector<HTMLElement>("[data-testid='runtime-now-bar']")!;
    const barRect = bar.getBoundingClientRect();
    const barStyle = getComputedStyle(bar);
    const scrollRoot = document.querySelector<HTMLElement>(".app-content")!;
    const scrollRect = scrollRoot.getBoundingClientRect();
    // Collapsed activity intentionally scrolls within this clipped viewport.
    // BoundingClientRect alone also includes pixels hidden behind its clip edge.
    const clipped = barStyle.position === "relative"
      && /auto|scroll|hidden/.test(getComputedStyle(scrollRoot).overflowY);
    const visibleBar = {
      left: clipped ? Math.max(barRect.left, scrollRect.left) : barRect.left,
      right: clipped ? Math.min(barRect.right, scrollRect.right) : barRect.right,
      top: clipped ? Math.max(barRect.top, scrollRect.top) : barRect.top,
      bottom: clipped ? Math.min(barRect.bottom, scrollRect.bottom) : barRect.bottom,
    };
    const appBar = document.querySelector<HTMLElement>(".one-ui-top-app-bar")!;
    const overlapsAppBarBeforeClip = barRect.top < appBar.getBoundingClientRect().bottom && barRect.bottom > 0;
    const hiddenPointY = Math.max(1, Math.min(scrollRect.top - 1, barRect.bottom - 1));
    const headerOwnsClippedPoint = !overlapsAppBarBeforeClip || appBar.contains(document.elementFromPoint((barRect.left + barRect.right) / 2, hiddenPointY));
    const lane = bar.closest<HTMLElement>(".one-ui-activity-lane")!;
    const laneRect = lane.getBoundingClientRect();
    const pageRect = document.querySelector<HTMLElement>("#collector-content > .page")!.getBoundingClientRect();
    const collisions = barStyle.opacity === "0" ? [] : [...document.querySelectorAll<HTMLElement>(selector)].filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || !rect.width || !rect.height) return false;
      return visibleBar.right > visibleBar.left && visibleBar.bottom > visibleBar.top
        && visibleBar.left < rect.right && visibleBar.right > rect.left
        && visibleBar.top < rect.bottom && visibleBar.bottom > rect.top;
    }).map((element) => ({
      className: typeof element.className === "string" ? element.className : element.tagName,
      text: element.textContent?.trim().slice(0, 80),
    }));
    return {
      collisions,
      pageTop: pageRect.top,
      laneBottom: laneRect.bottom,
      layout: bar.dataset.layout,
      position: barStyle.position,
      headerOwnsClippedPoint,
      visibleBar,
      unclippedBar: { top: barRect.top, bottom: barRect.bottom },
    };
  }, protectedContentSelector);
  expect(geometry.layout).toBe("reserved");
  expect(geometry.position).toBe("relative");
  expect(geometry.pageTop).toBeGreaterThanOrEqual(geometry.laneBottom);
  expect(geometry.headerOwnsClippedPoint).toBe(true);
  expect(geometry.collisions).toEqual([]);
  if (process.env.ONE_UI9_REVIEW === "1") await writeFile(path.join(artifactRoot, "collision-clipping.json"), JSON.stringify(geometry, null, 2));
}

type ScrollLayout = {
  scrollTop: number;
  maxScroll: number;
  laneHeight: number;
  laneTop: number;
  laneBottom: number;
  pageTop: number;
  rootBottom: number;
  appBar: { top: number; bottom: number; left: number; right: number };
  navigation: { top: number; bottom: number; left: number; right: number } | null;
  commandSize: { width: number; height: number };
  chartSizes: Array<{ width: number; height: number }>;
  laneParentIsScrollRoot: boolean;
  lanePosition: string;
  laneTransform: string;
  barPosition: string;
  barTransform: string;
  documentScrollTop: number;
};

async function readScrollLayout(page: Page): Promise<ScrollLayout> {
  return await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>("#collector-content")!;
    const lane = root.querySelector<HTMLElement>(":scope > .one-ui-activity-lane")!;
    const bar = lane.querySelector<HTMLElement>("[data-testid='runtime-now-bar']")!;
    const contentPage = root.querySelector<HTMLElement>(":scope > .page")!;
    const appBar = document.querySelector<HTMLElement>(".one-ui-top-app-bar")!;
    const navigation = document.querySelector<HTMLElement>(".landscape-app-rail, .compact-app-navigation");
    const command = root.querySelector<HTMLElement>(".chart-command-group")!;
    const rect = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      return { top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right };
    };
    const size = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      return { width: bounds.width, height: bounds.height };
    };
    const laneRect = lane.getBoundingClientRect();
    const pageRect = contentPage.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const laneStyle = getComputedStyle(lane);
    const barStyle = getComputedStyle(bar);
    return {
      scrollTop: root.scrollTop,
      maxScroll: root.scrollHeight - root.clientHeight,
      laneHeight: laneRect.height,
      laneTop: laneRect.top,
      laneBottom: laneRect.bottom,
      pageTop: pageRect.top,
      rootBottom: rootRect.bottom,
      appBar: rect(appBar),
      navigation: navigation ? rect(navigation) : null,
      commandSize: size(command),
      chartSizes: [...root.querySelectorAll<HTMLElement>(".chart-card")].map(size),
      laneParentIsScrollRoot: lane.parentElement === root,
      lanePosition: laneStyle.position,
      laneTransform: laneStyle.transform,
      barPosition: barStyle.position,
      barTransform: barStyle.transform,
      documentScrollTop: document.scrollingElement?.scrollTop ?? -1,
    };
  });
}

async function scrollCollector(page: Page, position: "top" | "middle" | "lower") {
  await page.locator("#collector-content").evaluate((element, target) => {
    const root = element as HTMLElement;
    const maxScroll = root.scrollHeight - root.clientHeight;
    const top = target === "top" ? 0 : target === "middle" ? maxScroll / 2 : maxScroll;
    root.scrollTo({ top, behavior: "instant" });
  }, position);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

function expectFrozenChromeStable(current: ScrollLayout, initial: ScrollLayout) {
  for (const edge of ["top", "bottom", "left", "right"] as const) {
    expect(current.appBar[edge]).toBeCloseTo(initial.appBar[edge], 1);
  }
  expect(current.navigation).not.toBeNull();
  expect(initial.navigation).not.toBeNull();
  for (const edge of ["top", "bottom", "left", "right"] as const) {
    expect(current.navigation![edge]).toBeCloseTo(initial.navigation![edge], 1);
  }
  expect(current.commandSize.width).toBeCloseTo(initial.commandSize.width, 1);
  expect(current.commandSize.height).toBeCloseTo(initial.commandSize.height, 1);
  expect(current.chartSizes).toHaveLength(initial.chartSizes.length);
  current.chartSizes.forEach((size, index) => {
    expect(size.width).toBeCloseTo(initial.chartSizes[index].width, 1);
    expect(size.height).toBeCloseTo(initial.chartSizes[index].height, 1);
  });
}

async function expectFullyReachable(page: Page, selector: string, index = 0) {
  const target = page.locator(selector).nth(index);
  await expect(target).toBeVisible();
  await target.evaluate((element) => element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" }));
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const bounds = await target.boundingBox();
  const usable = await page.evaluate(() => {
    const appBar = document.querySelector<HTMLElement>(".one-ui-top-app-bar")!.getBoundingClientRect();
    const root = document.querySelector<HTMLElement>("#collector-content")!.getBoundingClientRect();
    return { top: appBar.bottom, bottom: root.bottom };
  });
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(usable.top - 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(usable.bottom + 1);
}

async function neutralizeIncidentalStates(page: Page, dismissSnackbar = true) {
  const snackbar = page.locator(".one-ui-snackbar");
  if (dismissSnackbar && await snackbar.isVisible()) {
    // Success feedback may finish its 4200ms lifetime between the visibility
    // check and click. Do not spend the whole test waiting for an expired notice.
    try {
      await snackbar.getByRole("button", { name: "Đóng thông báo", exact: true }).click({ timeout: 1000 });
    } catch (error) {
      if (await snackbar.isVisible()) throw error;
    }
    await expect(snackbar).toBeHidden();
  }
  await page.mouse.move(2, Math.floor((page.viewportSize()?.height ?? 2) / 2));
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLElement>("[data-tooltip]")].some((element) => {
    const tooltip = getComputedStyle(element, "::after");
    return tooltip.display !== "none" && Number.parseFloat(tooltip.opacity) > 0.01;
  }))).toBe(false);
}

async function readSharedActivityGeometry(page: Page) {
  return await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>("#collector-content")!;
    const lane = root.querySelector<HTMLElement>(":scope > .one-ui-activity-lane")!;
    const anchor = lane.querySelector<HTMLElement>(".runtime-now-bar-anchor")!;
    const bar = lane.querySelector<HTMLElement>("[data-testid='runtime-now-bar']")!;
    const details = bar.querySelector<HTMLElement>("#runtime-now-bar-details")!;
    const contentPage = root.querySelector<HTMLElement>(":scope > .page")!;
    const appBar = document.querySelector<HTMLElement>(".one-ui-top-app-bar")!;
    const navigation = document.querySelector<HTMLElement>(".landscape-app-rail, .compact-app-navigation")!;
    const bounds = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
    };
    return {
      root: bounds(root),
      lane: bounds(lane),
      anchor: bounds(anchor),
      bar: bounds(bar),
      details: bounds(details),
      detailsHidden: details.inert && details.getAttribute("aria-hidden") === "true",
      page: bounds(contentPage),
      appBar: bounds(appBar),
      navigation: bounds(navigation),
      parentIsScrollRoot: lane.parentElement === root,
      barPosition: getComputedStyle(bar).position,
      barTransform: getComputedStyle(bar).transform,
      rootOverflow: getComputedStyle(root).overflowY,
      pageInert: contentPage.inert,
      phase: bar.dataset.phase,
      documentScrollTop: document.scrollingElement?.scrollTop ?? -1,
    };
  });
}

function expectSharedActivityInFlow(geometry: Awaited<ReturnType<typeof readSharedActivityGeometry>>) {
  expect(geometry.parentIsScrollRoot).toBe(true);
  expect(geometry.barPosition).toBe("relative");
  expect(geometry.barTransform).toBe("none");
  expect(geometry.appBar.top).toBeCloseTo(0, 1);
  expect(geometry.appBar.height).toBeCloseTo(76, 1);
  expect(geometry.bar.top).toBeGreaterThanOrEqual(geometry.appBar.bottom);
  expect(geometry.bar.left).toBeGreaterThanOrEqual(geometry.root.left);
  expect(geometry.bar.right).toBeLessThanOrEqual(geometry.root.right);
  expect(geometry.page.top).toBeGreaterThanOrEqual(geometry.lane.bottom);
  expect(geometry.detailsHidden).toBe(true);
  expect(geometry.documentScrollTop).toBe(0);
}

async function readPageControlGeometry(page: Page) {
  return await page.evaluate(() => {
    const selectors = [".page-toolbar", ".live-control-bar", ".metric-strip", ".raw-card", ".chart-card"];
    return Object.fromEntries(selectors.map((selector) => {
      const rect = document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      return [selector, { top: rect.top, left: rect.left, width: rect.width, height: rect.height }];
    }));
  });
}

function expectGeometryUnchanged(
  actual: Awaited<ReturnType<typeof readPageControlGeometry>>,
  expected: Awaited<ReturnType<typeof readPageControlGeometry>>,
) {
  for (const selector of Object.keys(expected)) {
    for (const key of ["top", "left", "width", "height"] as const) {
      expect(actual[selector][key], `${selector} ${key}`).toBeCloseTo(expected[selector][key], 0);
    }
  }
}

test("P.2.1 Now Bar and Notification Center preserve truth, focus and collision safety", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);

  // A real simulator operation feeds both feedback surfaces, but only the snackbar
  // is a live region.
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  const snackbar = page.locator('.one-ui-snackbar[role="status"]');
  await expect(snackbar).toBeVisible();
  const quickTrigger = page.getByRole("button", { name: "Quick Status", exact: true });
  await quickTrigger.click();
  const utilitySheet = page.locator(".one-ui-side-sheet");
  await utilitySheet.evaluate((node) => { node.dataset.atomicIdentity = "quick-to-notifications"; });
  await page.getByRole("button", { name: /^Notifications/ }).click();
  const notificationCenter = page.getByTestId("notification-center");
  await expect(notificationCenter).toBeFocused();
  await expect(utilitySheet.getByText("Session activity", { exact: true })).toBeVisible();
  await expect(utilitySheet.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
  await expect(notificationCenter.getByText(/\d+ unread/, { exact: true })).toBeVisible();
  await expect(notificationCenter.getByRole("button", { name: "Mark all read", exact: true })).toBeVisible();
  await expect(notificationCenter.getByRole("button", { name: "Clear read", exact: true })).toBeVisible();
  await expect(notificationCenter.getByRole("button", { name: "Mark as read", exact: true }).first()).toBeVisible();
  await expect(notificationCenter.getByRole("button", { name: "Dismiss", exact: true }).first()).toBeVisible();
  await expect(page.locator(".quick-status-button")).not.toBeFocused();
  await expect(page.locator(".one-ui-overlay-layer")).toHaveCount(1);
  await expect(utilitySheet).toHaveAttribute("data-atomic-identity", "quick-to-notifications");
  await expect(page.locator('.notification-item[role="status"], .notification-item[role="alert"]')).toHaveCount(0);
  await expect(snackbar).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(utilitySheet).toBeHidden();
  await expect(quickTrigger).toBeFocused();

  await page.getByRole("button", { name: "Kết nối tất cả", exact: true }).click();
  await expect(page.locator('.device-status[data-tone="positive"]')).toHaveCount(2);
  await page.getByRole("button", { name: "Đóng thông báo" }).click();
  const nowBar = page.getByTestId("runtime-now-bar");
  await expect(nowBar).toContainText("Live telemetry");
  await expect(nowBar).not.toContainText(/ghi|dataset/i);
  await expect(page.getByRole("heading", { name: "Device Manager", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Điều hướng ứng dụng" }).locator(".nav-destination__label"))
    .toHaveText(["Devices", "Monitor", "Account"]);
  const topStatus = page.locator(".one-ui-top-app-bar__states .one-ui-status-indicator");
  await expect(topStatus).toHaveText(["Đã kết nối", "SIM 2/2"]);
  expect(await topStatus.evaluateAll((indicators) => indicators.map((indicator) => indicator.getAttribute("data-emphasis")))).toEqual(["tonal", "tonal"]);
  for (const indicator of await topStatus.all()) {
    const colors = await indicator.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      mark: getComputedStyle(element.querySelector(".one-ui-status-indicator__mark")!).backgroundColor,
    }));
    expect(colors.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(colors.mark).not.toBe("rgba(0, 0, 0, 0)");
  }
  await expectCollisionSafe(page);

  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  const monitor = page.getByTestId("live-monitor");
  await expect(page.getByRole("heading", { name: "Live Monitor", exact: true })).toBeVisible();
  await expect(monitor.getByText("Acquisition", { exact: true })).toBeVisible();
  await expect(monitor.getByText("Avg. sample rate", { exact: true })).toBeVisible();
  await expect(monitor.getByText("Packets received", { exact: true })).toBeVisible();
  await expect(monitor.getByText("Packets lost", { exact: true })).toBeVisible();
  await expect(monitor.getByText("Raw signals", { exact: true })).toBeVisible();
  await expect(monitor.getByText("Live", { exact: true }).first()).toBeVisible();
  await expect.poll(async () => Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(20);
  const pause = page.getByRole("button", { name: "Tạm dừng biểu đồ" });
  const pauseGeometry = await pause.boundingBox();
  await pause.click();
  const resume = page.getByRole("button", { name: "Tiếp tục biểu đồ" });
  expect(await resume.boundingBox()).toEqual(pauseGeometry);
  await expect(nowBar).toContainText("Biểu đồ tạm dừng");
  await expect(nowBar).toContainText("Cảm biến vẫn đang gửi dữ liệu.");
  const packetCount = Number(await monitor.getAttribute("data-total-packets"));
  await expect.poll(async () => Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(packetCount);
  await nowBar.locator(".runtime-now-bar__summary").click();
  await nowBar.getByRole("button", { name: "Tiếp tục biểu đồ" }).click();
  await expect(monitor.getByRole("button", { name: "Tạm dừng biểu đồ" })).toHaveAttribute("aria-pressed", "false");
  await nowBar.locator(".runtime-now-bar__summary").click();
  await expect.poll(async () => nowBar.evaluate((element) => getComputedStyle(element).position)).toBe("relative");

  await expectCollisionSafe(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Devices", exact: true }).click();
  await expectCollisionSafe(page);
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await expectCollisionSafe(page);
  await page.getByTestId("theme-control").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByRole("button", { name: "Devices", exact: true }).click();
  await expectCollisionSafe(page);
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await expectCollisionSafe(page);
  await page.setViewportSize({ width: 800, height: 1100 });
  await page.getByRole("button", { name: "Devices", exact: true }).click();
  await expectCollisionSafe(page);
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await page.getByTestId("theme-control").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expectCollisionSafe(page);

  await nowBar.locator(".runtime-now-bar__summary").click();
  const scrollBeforeNotificationCenter = await page.locator("#collector-content").evaluate((element) => element.scrollTop);
  await quickTrigger.click();
  await page.getByRole("button", { name: /^Notifications/ }).click();
  expect(await utilitySheet.evaluate((sheet) => sheet.contains(document.activeElement))).toBe(true);
  await expectCollisionSafe(page, false);
  await page.keyboard.press("Escape");
  await expect(utilitySheet).toBeHidden();
  await expect(quickTrigger).toBeFocused();
  expect(await page.locator("#collector-content").evaluate((element) => element.scrollTop)).toBe(scrollBeforeNotificationCenter);
  await expectNoPageOverflow(page);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);
});

test("P.2.1.1 activity lane scrolls with Live Monitor content at every approved viewport", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);

  const connectAll = page.getByRole("button", { name: "Kết nối tất cả", exact: true });
  if (await connectAll.count()) await connectAll.click();
  await expect(page.getByTestId("runtime-now-bar")).toBeVisible();
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  const monitor = page.getByTestId("live-monitor");
  await expect(monitor).toBeVisible();
  await expect.poll(async () => Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(20);
  const snackbarClose = page.locator(".one-ui-snackbar button");
  if (await snackbarClose.isVisible()) await snackbarClose.click();

  const viewports = [
    { width: 1440, height: 900, screenshot: "desktop" as const },
    { width: 1280, height: 720, screenshot: null },
    { width: 800, height: 1100, screenshot: "compact" as const },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    if (viewport.screenshot === "desktop" && await page.locator("html").getAttribute("data-theme") !== "dark") {
      await page.getByTestId("theme-control").click();
    }
    if (viewport.screenshot === "compact" && await page.locator("html").getAttribute("data-theme") !== "light") {
      await page.getByTestId("theme-control").click();
    }

    await scrollCollector(page, "top");
    await expectCollisionSafe(page);
    const top = await readScrollLayout(page);
    expect(top.scrollTop).toBe(0);
    expect(top.maxScroll).toBeGreaterThan(top.laneHeight);
    expect(top.laneParentIsScrollRoot).toBe(true);
    expect(top.lanePosition).toBe("static");
    expect(top.laneTransform).toBe("none");
    expect(top.barPosition).toBe("relative");
    expect(top.barTransform).toBe("none");
    expect(top.laneTop).toBeGreaterThanOrEqual(top.appBar.bottom);
    expect(top.pageTop).toBeGreaterThanOrEqual(top.laneBottom);
    expect(top.documentScrollTop).toBe(0);

    await scrollCollector(page, "middle");
    const middle = await readScrollLayout(page);
    expect(middle.scrollTop).toBeGreaterThan(top.laneHeight);
    expect(middle.laneBottom).toBeLessThanOrEqual(middle.appBar.bottom);
    expect(middle.documentScrollTop).toBe(0);
    expectFrozenChromeStable(middle, top);

    await expectFullyReachable(page, ".live-control-bar");
    await expectFullyReachable(page, ".channel-panel .panel-title");
    for (let index = 0; index < 2; index += 1) {
      await expectFullyReachable(page, ".chart-card header", index);
      await expectFullyReachable(page, ".plot-host", index);
    }

    await scrollCollector(page, "lower");
    const lower = await readScrollLayout(page);
    expect(lower.scrollTop).toBeCloseTo(lower.maxScroll, 0);
    expect(lower.laneBottom).toBeLessThanOrEqual(lower.appBar.bottom);
    expect(lower.documentScrollTop).toBe(0);
    expectFrozenChromeStable(lower, top);
    const rawCardBottom = await page.locator(".raw-card").evaluate((element) => element.getBoundingClientRect().bottom);
    expect(rawCardBottom).toBeLessThanOrEqual(lower.rootBottom + 1);

  }

  await expectNoPageOverflow(page);
});

test("Approved Now Bar morphs into an anchored modal activity overlay without page reflow", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCollector(page);
  const connectAll = page.getByRole("button", { name: "Kết nối tất cả", exact: true });
  if (await connectAll.count()) await connectAll.click();
  const snackbarClose = page.locator(".one-ui-snackbar button");
  if (await snackbarClose.isVisible()) await snackbarClose.click();
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  const monitor = page.getByTestId("live-monitor");
  await expect.poll(async () => Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(20);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "no-preference" });
  if (await page.locator("html").getAttribute("data-theme") !== "dark") await page.getByTestId("theme-control").click();
  await scrollCollector(page, "top");

  const nowBar = page.getByTestId("runtime-now-bar");
  const summary = nowBar.locator(".runtime-now-bar__summary");
  const details = nowBar.locator("#runtime-now-bar-details");
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  await expect(summary).toHaveAttribute("aria-controls", "runtime-now-bar-details");
  await expect(details).toHaveAttribute("aria-hidden", "true");
  await expect(summary).toHaveAccessibleName("Expand Live telemetry");
  await expect(nowBar).toContainText("Đang nhận dữ liệu cảm biến");
  await expect(nowBar).toContainText("2/2 nguồn");
  await expect(nowBar).toContainText(/\d+\.\d Hz/);
  expect(await summary.evaluate((element) => element.tagName)).toBe("BUTTON");
  await expect(nowBar.locator('[role="menu"], [role="menuitem"], [role="listbox"], nav')).toHaveCount(0);
  await expect(nowBar).not.toContainText(/Account|Settings|Theme|User management/i);

  const collapsedGeometry = await readSharedActivityGeometry(page);
  expectSharedActivityInFlow(collapsedGeometry);
  const baselineControls = await readPageControlGeometry(page);
  const collapsedHandle = await nowBar.elementHandle();
  const immediate = await summary.evaluate(async (button) => {
    const surface = button.closest<HTMLElement>(".runtime-now-bar")!;
    const before = surface.getBoundingClientRect();
    button.click();
    await Promise.resolve();
    const after = surface.getBoundingClientRect();
    return {
      phase: surface.dataset.phase,
      inlineStyle: surface.getAttribute("style"),
      anchorWidth: getComputedStyle(surface).getPropertyValue("--runtime-now-bar-anchor-width"),
      before: { top: before.top, left: before.left, width: before.width, height: before.height },
      after: { top: after.top, left: after.left, width: after.width, height: after.height },
    };
  });
  expect(["opening", "open"]).toContain(immediate.phase);
  expect(immediate.inlineStyle).toContain("--runtime-now-bar-anchor-width");
  expect(immediate.anchorWidth).toBe("400px");
  expect(immediate.after.top).toBeCloseTo(immediate.before.top, 0);
  expect(immediate.after.left).toBeCloseTo(immediate.before.left, 0);
  expect(immediate.after.width).toBeCloseTo(immediate.before.width, 0);
  expect(immediate.after.height).toBeCloseTo(immediate.before.height, 0);

  await expect(summary).toHaveAttribute("aria-expanded", "true");
  await expect(nowBar).toHaveAttribute("role", "dialog");
  await expect(nowBar).toHaveAttribute("aria-modal", "true");
  await expect(details).toHaveAttribute("aria-hidden", "false");
  await expect(details).toBeVisible();
  await expect(page.getByTestId("runtime-now-bar-backdrop")).toBeVisible();
  expect(await nowBar.evaluate((element, original) => element === original, collapsedHandle)).toBe(true);
  await expect(details.getByRole("listitem")).toHaveCount(2);
  await expect(details).toContainText("Tổng tốc độ lấy mẫu");
  await expect(details).not.toContainText(/Packets received|Packets lost|Chart state/);
  await expect(nowBar.locator(".runtime-now-bar__chevron, .runtime-now-bar__expand")).toHaveCount(0);
  await expect(details.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true })).toBeFocused();
  await expect(details.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true })).toBeVisible();
  await expect(details.getByRole("button")).toHaveCount(1);
  await page.waitForTimeout(300);

  const expandedGeometry = await readSharedActivityGeometry(page);
  expect(expandedGeometry.barPosition).toBe("fixed");
  expect(expandedGeometry.phase).toBe("open");
  expect(expandedGeometry.bar.top).toBeCloseTo(collapsedGeometry.bar.top, 0);
  expect(expandedGeometry.bar.left).toBeCloseTo(collapsedGeometry.bar.left, 0);
  expect(expandedGeometry.anchor).toEqual(collapsedGeometry.anchor);
  expect(expandedGeometry.bar.width).toBeGreaterThan(collapsedGeometry.bar.width);
  expect(expandedGeometry.bar.width).toBe(520);
  expect(expandedGeometry.bar.height).toBeGreaterThanOrEqual(280);
  expect(expandedGeometry.bar.bottom).toBeLessThanOrEqual(expandedGeometry.root.bottom - 15);
  expect(expandedGeometry.rootOverflow).toBe("hidden");
  expect(expandedGeometry.pageInert).toBe(true);
  expectGeometryUnchanged(await readPageControlGeometry(page), baselineControls);
  const overlapsTopBar = expandedGeometry.bar.top < expandedGeometry.appBar.bottom;
  const overlapsNavigation = expandedGeometry.bar.left < expandedGeometry.navigation.right
    && expandedGeometry.bar.right > expandedGeometry.navigation.left
    && expandedGeometry.bar.top < expandedGeometry.navigation.bottom
    && expandedGeometry.bar.bottom > expandedGeometry.navigation.top;
  expect(overlapsTopBar).toBe(false);
  expect(overlapsNavigation).toBe(false);
  const normalMotion = await nowBar.evaluate((element) => ({
    surface: getComputedStyle(element).transitionDuration,
    details: getComputedStyle(element.querySelector(".runtime-now-bar__details")!).transitionDuration,
    delay: getComputedStyle(element.querySelector(".runtime-now-bar__details")!).transitionDelay,
  }));
  expect(normalMotion.surface).toContain("0.24s");
  expect(normalMotion.details).toContain("0.24s");
  expect(normalMotion.delay.split(",").every((delay) => Number.parseFloat(delay) === 0)).toBe(true);
  await expectNoPageOverflow(page);

  const scrollTop = await page.locator("#collector-content").evaluate((element) => element.scrollTop);
  await page.mouse.wheel(0, 600);
  expect(await page.locator("#collector-content").evaluate((element) => element.scrollTop)).toBe(scrollTop);
  await page.keyboard.press("Shift+Tab");
  await expect(summary).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(details.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  await expect(summary).toBeFocused();
  await expect.poll(async () => (await readSharedActivityGeometry(page)).barPosition).toBe("relative");
  expectGeometryUnchanged(await readPageControlGeometry(page), baselineControls);
  expect(await page.locator("#collector-content").evaluate((element) => element.scrollTop)).toBe(scrollTop);

  await summary.press("Enter");
  await expect(details.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true })).toBeFocused();
  await page.getByTestId("runtime-now-bar-backdrop").click({ position: { x: 20, y: 400 } });
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  await expect(summary).toBeFocused();
  await expect.poll(async () => (await readSharedActivityGeometry(page)).barPosition).toBe("relative");

  await summary.press("Space");
  await expect(details.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true })).toBeFocused();
  const packetsBeforePause = Number(await monitor.getAttribute("data-total-packets"));
  await details.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true }).click();
  await expect(details.getByRole("button", { name: "Tiếp tục biểu đồ", exact: true })).toBeVisible();
  await expect(monitor.getByRole("button", { name: "Tiếp tục biểu đồ", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(packetsBeforePause);
  await details.getByRole("button", { name: "Tiếp tục biểu đồ", exact: true }).click();
  await expect(monitor.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true })).toHaveAttribute("aria-pressed", "false");

  const scrollBeforeCenter = await page.locator("#collector-content").evaluate((element) => element.scrollTop);
  await page.getByRole("button", { name: "Quick Status", exact: true }).click();
  await page.getByRole("button", { name: /^Notifications/ }).click();
  const notificationCenter = page.getByTestId("notification-center");
  const utilitySheet = page.locator(".one-ui-side-sheet");
  await expect(notificationCenter).toBeVisible();
  expect(await utilitySheet.evaluate((sheet) => sheet.contains(document.activeElement))).toBe(true);
  await expect(page.getByTestId("runtime-now-bar-backdrop")).toHaveCount(0);
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Escape");
  await expect(notificationCenter).toBeHidden();
  await expect(page.getByRole("button", { name: "Quick Status", exact: true })).toBeFocused();
  expect(await page.locator("#collector-content").evaluate((element) => element.scrollTop)).toBe(scrollBeforeCenter);

  await summary.click();
  await expect(details.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true })).toBeFocused();
  await page.getByTestId("theme-control").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  await expect.poll(async () => (await readSharedActivityGeometry(page)).barPosition).toBe("relative");

  await summary.click();
  await expect(details.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true })).toBeFocused();
  const quickStatusButton = page.getByRole("button", { name: "Quick Status", exact: true });
  await quickStatusButton.click();
  await expect(page.locator("#quick-status-panel")).toBeVisible();
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("runtime-now-bar-backdrop")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(quickStatusButton).toBeFocused();

  await summary.click();
  await expect(details.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true })).toBeFocused();
  const accountButton = page.getByRole("button", { name: /^Account / });
  await accountButton.click();
  await expect(page.locator("#account-panel")).toBeVisible();
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("runtime-now-bar-backdrop")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(accountButton).toBeFocused();

  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await summary.click();
  await expect(nowBar).toHaveAttribute("data-phase", "open");
  const reducedMotion = await nowBar.evaluate((element) => ({
    surface: getComputedStyle(element).transitionDuration,
    details: getComputedStyle(element.querySelector(".runtime-now-bar__details")!).transitionDuration,
    detailsTransform: getComputedStyle(element.querySelector(".runtime-now-bar__details")!).transform,
  }));
  expect(reducedMotion.surface).not.toContain("0.24s");
  expect(reducedMotion.details).not.toContain("0.24s");
  expect(reducedMotion.detailsTransform).toBe("none");
  await page.keyboard.press("Escape");
  await expect.poll(async () => (await readSharedActivityGeometry(page)).barPosition).toBe("relative");

  for (const viewport of [
    { width: 1440, height: 900, compact: false },
    { width: 1280, height: 720, compact: false },
    { width: 800, height: 1100, compact: true },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ colorScheme: viewport.compact ? "light" : "dark", reducedMotion: "no-preference" });
    if (viewport.compact !== ((await page.locator("html").getAttribute("data-theme")) === "light")) {
      await page.getByTestId("theme-control").click();
    }
    await scrollCollector(page, "top");
    await neutralizeIncidentalStates(page);
    const before = await readPageControlGeometry(page);
    const origin = await readSharedActivityGeometry(page);
    await summary.click();
    await expect(nowBar).toHaveAttribute("data-phase", "open");
    await page.waitForTimeout(300);
    const overlay = await readSharedActivityGeometry(page);
    expect(overlay.bar.top).toBeCloseTo(origin.bar.top, 0);
    expect(overlay.bar.left).toBeCloseTo(origin.bar.left, 0);
    expectGeometryUnchanged(await readPageControlGeometry(page), before);
    expect(overlay.rootOverflow).toBe("hidden");
    expect(overlay.pageInert).toBe(true);
    const overlapsNav = overlay.bar.left < overlay.navigation.right && overlay.bar.right > overlay.navigation.left
      && overlay.bar.top < overlay.navigation.bottom && overlay.bar.bottom > overlay.navigation.top;
    expect(overlapsNav).toBe(false);
    if (process.env.PRODUCTION_REVIEW === "1" && viewport.width === 1440) {
      await neutralizeIncidentalStates(page, false);
      await page.screenshot({ path: path.join(artifactRoot, "now-bar-overlay-expanded-dark-1440x900.png") });
    }
    if (process.env.PRODUCTION_REVIEW === "1" && viewport.compact) {
      await neutralizeIncidentalStates(page, false);
      await page.screenshot({ path: path.join(artifactRoot, "now-bar-overlay-expanded-light-800x1100.png") });
    }
    await summary.focus();
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await readSharedActivityGeometry(page)).barPosition).toBe("relative");
  }

  const accessibility = await new AxeBuilder({ page }).include(".runtime-now-bar").analyze();
  expect(accessibility.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);
});

test("Approved Now Bar preserves interrupted motion, numeric alignment and effective 200% access", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCollector(page);
  const connectAll = page.getByRole("button", { name: "Kết nối tất cả", exact: true });
  if (await connectAll.count()) await connectAll.click();
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await neutralizeIncidentalStates(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const bar = page.getByTestId("runtime-now-bar");
  const trigger = bar.locator(".runtime-now-bar__summary");
  const baseline = await readPageControlGeometry(page);
  const sample = await trigger.evaluate(async (button) => {
    const surface = button.closest<HTMLElement>(".runtime-now-bar")!;
    const rate = surface.querySelector<HTMLElement>(".runtime-now-bar__rate")!;
    const steps = [0, 90, 150, 340, 440, 495];
    const frames: Array<{ width: number; height: number; spacing: number; font: number; scrollHeight: number; clientHeight: number; overflow: string; scrollTop: number }> = [];
    const reversals: Array<{ width: number; spacing: number; font: number }> = [];
    let index = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const frame = () => {
        const elapsed = performance.now() - start;
        if (index < steps.length && elapsed >= steps[index]) {
          const before = rate.getBoundingClientRect();
          const spacing = parseFloat(getComputedStyle(rate).letterSpacing);
          const font = parseFloat(getComputedStyle(rate).fontSize);
          button.click();
          queueMicrotask(() => {
            const after = rate.getBoundingClientRect();
            reversals.push({ width: Math.abs(after.width - before.width),
              spacing: Math.abs(parseFloat(getComputedStyle(rate).letterSpacing) - spacing),
              font: Math.abs(parseFloat(getComputedStyle(rate).fontSize) - font) });
          });
          index += 1;
        }
        const rect = surface.getBoundingClientRect();
        frames.push({ width: rect.width, height: rect.height,
          scrollHeight: surface.scrollHeight, clientHeight: surface.clientHeight,
          overflow: getComputedStyle(surface).overflowY, scrollTop: surface.scrollTop,
          spacing: parseFloat(getComputedStyle(rate).letterSpacing), font: parseFloat(getComputedStyle(rate).fontSize) });
        if (elapsed < 900) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    return { frames, reversals, identities: surface.querySelectorAll(".runtime-now-bar__identity").length,
      rates: surface.querySelectorAll(".runtime-now-bar__rate").length };
  });
  expect(sample.identities).toBe(1);
  expect(sample.rates).toBe(1);
  expect(sample.frames.length).toBeGreaterThan(10);
  expect(sample.reversals).toHaveLength(6);
  for (const reversal of sample.reversals) {
    expect(reversal.width).toBeLessThan(1);
    expect(reversal.spacing).toBeLessThan(.05);
    expect(reversal.font).toBeLessThan(.5);
  }
  for (const frame of sample.frames) {
    expect(frame.width).toBeGreaterThanOrEqual(399);
    expect(frame.width).toBeLessThanOrEqual(521);
    expect(frame.height).toBeGreaterThanOrEqual(59);
    expect(/auto|scroll/.test(frame.overflow) && frame.scrollHeight > frame.clientHeight).toBe(false);
    expect(frame.scrollTop).toBe(0);
  }
  await writeFile(path.join(artifactRoot, "now-bar-reversal.json"), JSON.stringify(sample, null, 2));
  await expect(bar).toHaveAttribute("data-phase", "collapsed");
  expectGeometryUnchanged(await readPageControlGeometry(page), baseline);
  await trigger.click();
  await page.waitForTimeout(300);
  const rates = await bar.locator(".runtime-now-bar__rate").evaluate(async (element) => {
    const read = () => ({ right: element.getBoundingClientRect().right,
      numeric: getComputedStyle(element).fontVariantNumeric, text: element.textContent });
    const first = read();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [first, read()];
  });
  expect(rates[1].right).toBe(rates[0].right);
  expect(rates[0].numeric).toContain("tabular-nums");
  await page.keyboard.press("Escape");
  await expect(bar).toHaveAttribute("data-phase", "collapsed");

  // 1280×720 at effective 200% zoom: preserve shell bounds and scroll the activity,
  // rather than shrinking its type or making its chart action unreachable.
  await page.setViewportSize({ width: 640, height: 360 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await scrollCollector(page, "top");
  for (const theme of ["light", "dark"]) {
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByTestId("theme-control").click();
    await trigger.click();
    await expect(bar).toHaveAttribute("data-phase", "open");
    const geometry = await readSharedActivityGeometry(page);
    expect(geometry.bar.top).toBeGreaterThanOrEqual(76);
    expect(geometry.bar.bottom).toBeLessThanOrEqual(geometry.root.bottom);
    expect(geometry.bar.right).toBeLessThanOrEqual(624);
    const chartAction = bar.getByRole("button", { name: "Tạm dừng biểu đồ", exact: true });
    await chartAction.scrollIntoViewIfNeeded();
    const actionBounds = await chartAction.boundingBox();
    expect(actionBounds!.y).toBeGreaterThanOrEqual(geometry.bar.top);
    expect(actionBounds!.y + actionBounds!.height).toBeLessThanOrEqual(geometry.bar.bottom + 1);
    await expect(bar).toHaveAttribute("data-constrained", "true");
    expect(await bar.evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");
    const constrainedBefore = await bar.evaluate((element) => ({ height: element.clientHeight, scroll: element.scrollHeight, top: element.scrollTop }));
    await chartAction.click();
    const resumeAction = bar.getByRole("button", { name: "Tiếp tục biểu đồ", exact: true });
    await expect(resumeAction).toHaveAttribute("aria-pressed", "true");
    expect(await bar.evaluate((element) => ({ height: element.clientHeight, scroll: element.scrollHeight, top: element.scrollTop }))).toEqual(constrainedBefore);
    const pausedAxe = await new AxeBuilder({ page }).include(".runtime-now-bar").analyze();
    expect(pausedAxe.violations).toEqual([]);
    await resumeAction.click();
    const axe = await new AxeBuilder({ page }).include(".runtime-now-bar").analyze();
    expect(axe.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(bar).toHaveAttribute("data-phase", "collapsed");
    await expectNoPageOverflow(page);
  }
});

test("V3 Now Bar keeps pause geometry stable and scrolls only when constrained", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCollector(page);
  const connect = page.getByRole("button", { name: "Kết nối tất cả", exact: true });
  if (await connect.count()) await connect.click();
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  const monitor = page.getByTestId("live-monitor");
  await expect.poll(async () => Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(20);
  await page.evaluate(() => document.fonts.ready);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root: documentNode } = await cdp.send("DOM.getDocument");
  const fontReport = [];
  for (const selector of [".runtime-now-bar__description", ".live-toolbar > p", ".one-ui-top-app-bar h1"]) {
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: documentNode.nodeId, selector });
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    fontReport.push({ selector, fonts });
  }
  await writeFile(path.join(artifactRoot, "rendered-fonts.json"), JSON.stringify(fontReport, null, 2));
  await cdp.detach();
  const bar = page.getByTestId("runtime-now-bar");
  const trigger = bar.locator(".runtime-now-bar__summary");
  const reports = [];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }, { width: 800, height: 1100 }]) {
  await page.setViewportSize(viewport);
  for (const theme of ["light", "dark"]) {
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByTestId("theme-control").click();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const expanded of [false, true]) {
      await scrollCollector(page, "top");
      if (expanded) {
        await trigger.click();
        await page.waitForTimeout(350);
      }
      const packetsBefore = Number(await monitor.getAttribute("data-total-packets"));
      const frames = await page.evaluate(async (isExpanded) => {
        const surface = document.querySelector<HTMLElement>(".runtime-now-bar")!;
        const root = document.querySelector<HTMLElement>(".app-content")!;
        const command = document.querySelector<HTMLButtonElement>(isExpanded
          ? ".runtime-now-bar__chart-command" : ".chart-command-group button[aria-pressed]")!;
        const read = () => {
          const rect = surface.getBoundingClientRect();
          const style = getComputedStyle(surface);
          return { width: rect.width, height: rect.height, scrollHeight: surface.scrollHeight,
            clientHeight: surface.clientHeight, overflow: style.overflowY, scrollTop: surface.scrollTop,
            pageScroll: root.scrollTop, pageTop: root.querySelector(".page")!.getBoundingClientRect().top,
            paused: command.getAttribute("aria-pressed"),
            scrollbar: /auto|scroll/.test(style.overflowY) && surface.scrollHeight > surface.clientHeight };
        };
        const samples = [read()];
        const start = performance.now();
        const toggles = [0, 500, 650, 800, 950, 1100];
        let index = 0;
        await new Promise<void>((resolve) => {
          const frame = () => {
            const elapsed = performance.now() - start;
            if (index < toggles.length && elapsed >= toggles[index]) { command.click(); index++; }
            samples.push(read());
            if (elapsed < 1600) requestAnimationFrame(frame); else resolve();
          };
          requestAnimationFrame(frame);
        });
        return samples;
      }, expanded);
      reports.push({ viewport, theme, expanded, frames });
      expect(Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(packetsBefore);
      expect(frames.some((frame) => frame.paused === "true")).toBe(true);
      expect(frames.at(-1)!.paused).toBe("false");
      for (const frame of frames) {
          expect(frame.width).toBeCloseTo(frames[0].width, 1);
          expect(frame.height).toBeCloseTo(frames[0].height, 1);
          expect(frame.pageTop).toBeCloseTo(frames[0].pageTop, 1);
          expect(frame.pageScroll).toBe(frames[0].pageScroll);
          expect(frame.scrollbar).toBe(false);
      }
      if (expanded) { await page.keyboard.press("Escape"); await expect(bar).toHaveAttribute("data-phase", "collapsed"); }
    }
  }
  }
  await writeFile(path.join(artifactRoot, "now-bar-after.json"), JSON.stringify(reports, null, 2));
});

test("V3 Now Bar records one normal-speed open pause resume close reversal sequence", async ({ browser }, testInfo) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: testInfo.outputPath("motion-video"), size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const video = page.video();
  await openCollector(page);
  const connectAll = page.getByRole("button", { name: "Kết nối tất cả", exact: true });
  if (await connectAll.count()) await connectAll.click();
  const snackbarClose = page.locator(".one-ui-snackbar button");
  if (await snackbarClose.isVisible()) await snackbarClose.click();
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "no-preference" });
  if (await page.locator("html").getAttribute("data-theme") !== "dark") await page.getByTestId("theme-control").click();
  await neutralizeIncidentalStates(page);
  const summary = page.getByTestId("runtime-now-bar").locator(".runtime-now-bar__summary");
  await summary.click();
  await page.waitForTimeout(700);
  await page.getByTestId("runtime-now-bar").getByRole("button", { name: "Tạm dừng biểu đồ", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByTestId("runtime-now-bar").getByRole("button", { name: "Tiếp tục biểu đồ", exact: true }).click();
  await page.waitForTimeout(500);
  await summary.click();
  await page.waitForTimeout(500);
  await summary.evaluate(async (button) => {
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 90));
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 60));
    button.click();
  });
  await page.waitForTimeout(600);
  await summary.click();
  await page.waitForTimeout(400);
  await context.close();
  await video?.saveAs(path.join(artifactRoot, "now-bar-production-morph.webm"));
});
