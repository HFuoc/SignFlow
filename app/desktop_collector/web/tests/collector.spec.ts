import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, writeFile as persistFile } from "node:fs/promises";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const repoRoot = path.resolve(import.meta.dirname, "../../../../");
const python = process.env.PYTHON_EXECUTABLE ?? path.join(repoRoot, ".venv", "Scripts", "python.exe");
const artifactRoot = path.join(repoRoot, ".design-cache", "artifacts", process.env.ONE_UI9_REVIEW === "1" ? "one-ui9-device-manager" : "one-ui-v3");
// Intermediate captures stay in RAM; the final review emits only four contact sheets.
// Together with the two Now Bar stills this enforces the six-image review budget.
const reviewGroups = [
  {
    "filename": "review-auth.png",
    "files": [
      "auth-first-run-light-1280x720.png",
      "auth-login-dark-1280x720.png",
      "forced-password-change-light-1280x720.png",
      "participant-access-light-800x1100.png"
    ]
  },
  {
    "filename": "review-collector.png",
    "files": [
      "device-manager-light-1280x720.png",
      "device-manager-dark-1440x900.png",
      "live-monitor-light-1280x720.png",
      "live-monitor-dark-1440x900.png"
    ]
  },
  {
    "filename": "review-account-users.png",
    "files": [
      "account-surface-dark-1440x900.png",
      "admin-users-light-1440x900.png",
      "admin-create-user-light-1024x768.png",
      "admin-edit-user-light-1024x768.png"
    ]
  },
  {
    "filename": "review-overlays-feedback.png",
    "files": [
      "quick-status-light-1440x900.png",
      "admin-deactivate-confirmation-light-1024x768.png",
      "success-snackbar-light.png",
      "failure-snackbar-light.png"
    ]
  }
];
const reviewImages = new Map<string, Buffer>();
const reviewReports: Record<string, unknown> = {};
const reviewNames = new Set(reviewGroups.flatMap((group) => group.files));
async function captureReview(target: Page | Locator, options: Parameters<Page["screenshot"]>[0] = {}) {
  const name = path.basename(options.path ?? "");
  if (process.env.PRODUCTION_REVIEW !== "1" || !reviewNames.has(name)) return;
  const { path: _outputPath, ...captureOptions } = options;
  reviewImages.set(name, await target.screenshot(captureOptions));
}
async function writeFile(filename: string, data: string, _encoding?: string) {
  reviewReports[path.basename(filename)] = JSON.parse(data);
  if (process.env.ONE_UI9_REVIEW === "1") await persistFile(filename, data);
}
const token = randomBytes(32).toString("base64url");
const administrator = { username: "admin-p1", password: "Admin P.1 passphrase 2026" };
const participant = {
  username: "participant-p1",
  temporaryPassword: "Participant temporary 2026",
  password: "Participant private passphrase 2026",
  resetPassword: "Participant reset temporary 2026",
};
let bridge: ChildProcessWithoutNullStreams;
let port: number;

async function waitForPort(child: ChildProcessWithoutNullStreams): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    let buffer = "";
    const timeout = setTimeout(() => reject(new Error("bridge did not report its port")), 10_000);
    child.stdout.on("data", (chunk) => {
      buffer += String(chunk);
      const match = buffer.match(/PORT=(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(Number(match[1]));
      }
    });
    child.once("exit", (code) => reject(new Error(`bridge exited early (${code})`)));
  });
}

test.beforeAll(async () => {
  await mkdir(artifactRoot, { recursive: true });
  bridge = spawn(
    python,
    ["-m", "app.desktop_collector.shell", "--e2e-server", "--dev", "--vite-origin", "http://127.0.0.1:5173"],
    { cwd: repoRoot, stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
  );
  bridge.stderr.resume();
  bridge.stdin.write(`${token}\n`);
  port = await waitForPort(bridge);
});

test.afterAll(async () => {
  bridge.stdin.write("STOP\n");
  bridge.stdin.end();
  await new Promise<void>((resolve) => {
    bridge.once("exit", () => resolve());
    setTimeout(() => {
      bridge.kill();
      resolve();
    }, 5_000);
  });
});

async function openCollector(page: Page) {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(`/#api=${encodeURIComponent(`http://127.0.0.1:${port}`)}&token=${encodeURIComponent(token)}`);
  const setupHeading = page.getByRole("heading", { name: "Tạo quản trị viên cục bộ" });
  const loginHeading = page.getByRole("heading", { name: "Đăng nhập Dataset Studio" });
  await expect(setupHeading.or(loginHeading).or(page.getByTestId("device-manager"))).toBeVisible({ timeout: 15_000 });
  if (await setupHeading.isVisible()) {
    await page.getByLabel("Tên đăng nhập", { exact: true }).fill(administrator.username);
    await page.getByLabel("Tên hiển thị (không bắt buộc)").fill("Admin P1");
    await page.getByLabel("Mật khẩu", { exact: true }).fill(administrator.password);
    await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(administrator.password);
    await page.getByRole("button", { name: "Tạo quản trị viên", exact: true }).click();
  } else if (await loginHeading.isVisible()) {
    await page.getByLabel("Tên đăng nhập", { exact: true }).fill(administrator.username);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(administrator.password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  }
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

function contrastRatio(foreground: string, background: string): number {
  function luminance(value: string): number {
    const channels = (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const [red, green, blue] = channels.map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
  }
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function expectContrast(locator: Locator, minimum = 4.5, backgroundLocator?: Locator) {
  const foreground = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, background: style.backgroundColor };
  });
  const background = backgroundLocator
    ? await backgroundLocator.evaluate((element) => getComputedStyle(element).backgroundColor)
    : foreground.background;
  expect(contrastRatio(foreground.color, background)).toBeGreaterThanOrEqual(minimum);
}

async function expectSingleThemeControl(page: Page) {
  await expect(page.getByTestId("theme-control")).toHaveCount(1);
  await expect(page.locator('button[aria-label^="Chuyển sang giao diện"]')).toHaveCount(1);
}

async function expectDeviceSourceAnatomy(page: Page) {
  const anatomy = await page.locator(".device-page").evaluate((root) => {
    const style = (selector: string) => getComputedStyle(root.querySelector(selector)!);
    const card = style(".device-card");
    const action = style('.heading-actions [data-variant="primary"]');
    const field = style(".one-ui-text-field input");
    return {
      cardPadding: card.padding, cardRadius: card.borderRadius,
      actionHeight: action.minHeight, actionRadius: action.borderRadius,
      actionFont: action.fontSize, actionWeight: action.fontWeight,
      fieldHeight: field.height, fieldRadius: field.borderRadius,
      fieldFont: field.fontSize, fieldWeight: field.fontWeight,
      bodyFont: style(".sensor-summary").fontSize,
      headingFont: style(".device-identity h2").fontSize,
      fieldCount: root.querySelectorAll('input[type="number"]').length,
    };
  });
  expect(anatomy).toEqual({
    cardPadding: "20px", cardRadius: "28px", actionHeight: "60px", actionRadius: "28px",
    actionFont: "20px", actionWeight: "700", fieldHeight: "58px", fieldRadius: "30px",
    fieldFont: "16px", fieldWeight: "600", bodyFont: "14px", headingFont: "18px", fieldCount: 4,
  });
  // Draft #387AFF/white is 3.89:1. Only these explicitly verified large, bold
  // 20px actions use the 3:1 threshold; small text retains 4.5:1 and axe coverage.
  await expectContrast(page.locator('.heading-actions [data-variant="primary"]'), 3);
  await expectContrast(page.locator(".simulator-apply"), 3);
  return anatomy;
}

async function expectSimulatorBandFits(page: Page, requireFirstViewportClearance = true) {
  const geometry = await page.locator(".settings-card").evaluate((element) => {
    const band = element.getBoundingClientRect();
    const children = Array.from(element.querySelectorAll(".one-ui-text-field, .one-ui-button"))
      .map((child) => child.getBoundingClientRect());
    return {
      band: { left: band.left, right: band.right, top: band.top, bottom: band.bottom },
      viewportBottom: window.innerHeight,
      children: children.map((child) => ({ left: child.left, right: child.right, top: child.top, bottom: child.bottom })),
    };
  });
  if (requireFirstViewportClearance) {
    // The approved fidelity pass replaces fixed-height above-fold compression
    // with native scrolling. Verify actual field reachability, not just containment.
    const scrollTop = await page.locator(".app-content").evaluate((element) => element.scrollTop);
    await page.locator(".settings-card input").last().scrollIntoViewIfNeeded();
    await expect(page.locator(".settings-card input").last()).toBeInViewport();
    await page.locator(".app-content").evaluate((element, value) => { element.scrollTop = value; }, scrollTop);
  }
  for (const child of geometry.children) {
    expect(child.left).toBeGreaterThanOrEqual(geometry.band.left - 1);
    expect(child.right).toBeLessThanOrEqual(geometry.band.right + 1);
    expect(child.top).toBeGreaterThanOrEqual(geometry.band.top - 1);
    expect(child.bottom).toBeLessThanOrEqual(geometry.band.bottom + 1);
  }
}

async function readBundleText(directory: string): Promise<string> {
  const entries = await readdir(directory, { withFileTypes: true });
  const chunks: string[] = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) chunks.push(await readBundleText(target));
    else chunks.push(await readFile(target, "utf8"));
  }
  return chunks.join("\n");
}

async function resetReviewViewport(page: Page) {
  await page.mouse.move(1, 1);
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    const content = document.querySelector(".app-content");
    if (content) content.scrollTop = 0;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect.poll(() => page.locator(".app-content").evaluate(async (element) => {
    element.scrollTop = 0;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return element.scrollTop;
  })).toBe(0);
}

async function expectImmediateLocalSheet(trigger: Locator, selector: string) {
  const state = await trigger.evaluate(async (button, panelSelector) => {
    (button as HTMLButtonElement).click();
    await Promise.resolve();
    const panel = document.querySelector<HTMLElement>(panelSelector);
    return { mounted: !!panel, opacity: panel ? getComputedStyle(panel).opacity : null,
      modal: panel?.getAttribute("aria-modal"), focused: panel?.contains(document.activeElement) };
  }, selector);
  expect(state).toEqual({ mounted: true, opacity: "1", modal: "true", focused: true });
}

async function captureEvidence(page: Page, filename: string, preserveFocus = false) {
  const viewport = page.viewportSize();
  await page.mouse.move(1, Math.max(1, Math.floor((viewport?.height ?? 2) / 2)));
  await page.evaluate((keepFocus) => {
    if (!keepFocus && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, preserveFocus);
  await page.waitForTimeout(300);
  await expect.poll(() => page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("[data-tooltip]")).some((element) => {
    const tooltip = getComputedStyle(element, "::after");
    return tooltip.display !== "none" && Number.parseFloat(tooltip.opacity) > 0.01;
  }))).toBe(false);
  await captureReview(page, { path: path.join(artifactRoot, filename) });
  if (/^auth-(login|first-run)-(light|dark)-1280x720\.png$/.test(filename)) {
    const flat = await page.addStyleTag({ content: ".auth-screen::before { display: none !important; }" });
    await captureReview(page, { path: path.join(artifactRoot, `before-flat-${filename}`) });
    await flat.evaluate((element) => element.remove());
  }
  if (await page.locator(".auth-screen").count()) await reviewAuthContrast(page, filename);
}

async function reviewAuthContrast(page: Page, filename: string) {
  const originalTheme = await page.evaluate(() => document.documentElement.dataset.theme ?? "light");
  const reports = [];
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => document.documentElement.dataset.theme = value, theme);
    await page.waitForTimeout(300);
    const samples = await page.evaluate(() => {
      const shell = document.querySelector<HTMLElement>(".auth-screen")!;
      const pseudo = getComputedStyle(shell, "::before");
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      const rgb = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data);
      };
      const base = rgb(getComputedStyle(shell).backgroundColor);
      const accent = rgb(getComputedStyle(shell).getPropertyValue("--ou-color-accent"));
      const selectors = [".auth-context h2", ".section-eyebrow", ".auth-context > p", ".auth-context li",
        ".auth-context li span", ".auth-card__intro > span", ".auth-card__description", ".one-ui-text-field__label",
        ".one-ui-text-field__message", ".auth-form-error", ".participant-access-note li", ".participant-access-note h2"];
      const nodes = selectors.flatMap((selector) => Array.from(shell.querySelectorAll<HTMLElement>(selector)).map((element) => {
        const style = getComputedStyle(element);
        let ancestor: HTMLElement | null = element;
        let background = base;
        let onCanvas = true;
        while (ancestor && ancestor !== shell) {
          const candidate = rgb(getComputedStyle(ancestor).backgroundColor);
          if (candidate[3] === 255) { background = candidate; onCanvas = false; break; }
          ancestor = ancestor.parentElement;
        }
        return { selector, foreground: rgb(style.color), background, onCanvas,
          fontSize: style.fontSize, fontWeight: style.fontWeight,
          clipped: element.scrollWidth > element.clientWidth + 1 };
      }));
      return { gradient: pseudo.backgroundImage, pointerEvents: pseudo.pointerEvents, animation: pseudo.animationName,
        position: pseudo.position, base, accent, nodes };
    });
    expect(samples.gradient).toContain("radial-gradient");
    expect(samples.pointerEvents).toBe("none");
    expect(samples.animation).toBe("none");
    expect(samples.position).toBe("absolute");
    const contrast = samples.nodes.map((node) => {
      const ratios = Array.from({ length: 101 }, (_, step) => {
        const alpha = node.onCanvas ? step / 1000 : 0;
        const background = node.background.slice(0, 3).map((value, index) => value * (1 - alpha) + samples.accent[index] * alpha);
        return contrastRatio(`rgb(${node.foreground.slice(0, 3).join(",")})`, `rgb(${background.join(",")})`);
      });
      return { ...node, minimumAcrossEntireWash: Math.min(...ratios) };
    });
    for (const node of contrast) {
      expect(node.minimumAcrossEntireWash, `${theme} ${node.selector}`).toBeGreaterThanOrEqual(4.5);
      expect(node.clipped, `${theme} ${node.selector}`).toBe(false);
    }
    const axe = await new AxeBuilder({ page }).include(".auth-screen").analyze();
    expect(axe.violations).toEqual([]);
    // Preserve all manual-review targets; the conservative pixel-color envelope
    // above checks the entire 0–10% wash, not just axe's semantic canvas base.
    const incomplete = axe.incomplete.map((rule) => ({ id: rule.id, nodes: rule.nodes.map((node) => ({ target: node.target, reason: node.failureSummary })) }));
    reports.push({ theme, ...samples, contrast, violations: axe.violations, incomplete });
  }
  await page.evaluate((value) => document.documentElement.dataset.theme = value, originalTheme);
  await expectNoPageOverflow(page);
  await writeFile(path.join(artifactRoot, `${filename.replace(".png", "")}-contrast.json`), JSON.stringify(reports, null, 2));
}

async function captureTopChromeEvidence(page: Page, filename: string) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Viewport is required for chrome evidence");
  await page.mouse.move(1, Math.min(viewport.height - 1, 180));
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await captureReview(page, {
    path: path.join(artifactRoot, filename),
    clip: { x: 0, y: 0, width: viewport.width, height: 76 },
  });
}

async function captureLayoutMeasurements(page: Page) {
  return await page.evaluate(() => {
    const rect = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return Object.fromEntries(
        Object.entries({ x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom })
          .map(([key, value]) => [key, Math.round(value * 100) / 100]),
      );
    };
    return {
      navigationMode: document.querySelector(".app-shell")?.getAttribute("data-navigation"),
      topAppBar: rect(document.querySelector(".one-ui-top-app-bar")),
      topAppBarStates: rect(document.querySelector(".one-ui-top-app-bar__states")),
      activityLane: rect(document.querySelector(".one-ui-activity-lane")),
      rail: rect(document.querySelector(".landscape-app-rail")),
      bottomNavigation: rect(document.querySelector(".compact-app-navigation")),
      deviceCards: Array.from(document.querySelectorAll(".device-card"), rect),
      simulatorBand: rect(document.querySelector(".settings-card")),
      liveControls: rect(document.querySelector(".live-control-bar")),
      channelPanel: rect(document.querySelector(".channel-panel")),
      chartCards: Array.from(document.querySelectorAll(".chart-card"), rect),
    };
  });
}

const frozenMonitorGeometry: Record<string, {
  channelPanel: { x: number; y: number; width: number; height: number };
  chartCards: Array<{ x: number; y: number; width: number; height: number }>;
}> = {
  "1280x720": {
    channelPanel: { x: 136, y: 228.75, width: 196, height: 514 },
    chartCards: [{ x: 348, y: 228.75, width: 450, height: 398 }, { x: 814, y: 228.75, width: 450, height: 398 }],
  },
  "1440x900": {
    channelPanel: { x: 136, y: 228.75, width: 196, height: 694 },
    chartCards: [{ x: 348, y: 228.75, width: 530, height: 453 }, { x: 894, y: 228.75, width: 530, height: 453 }],
  },
  "1024x768": {
    channelPanel: { x: 16, y: 280.75, width: 196, height: 562 },
    chartCards: [{ x: 228, y: 280.75, width: 378, height: 446 }, { x: 622, y: 280.75, width: 378, height: 446 }],
  },
  "800x1100": {
    channelPanel: { x: 16, y: 367.05, width: 760, height: 467.8 },
    chartCards: [{ x: 16, y: 850.84, width: 760, height: 413 }, { x: 16, y: 1279.84, width: 760, height: 413 }],
  },
};

function expectFrozenRect(
  actual: Record<string, number> | null,
  expected: { x: number; y: number; width: number; height: number },
  flowOffset = 0,
) {
  expect(actual).not.toBeNull();
  for (const key of ["x", "y", "width", "height"] as const) {
    const expectedValue = key === "y" ? expected[key] + flowOffset : expected[key];
    expect(actual![key], `${key} differs from the approved P.1 baseline`).toBeCloseTo(expectedValue, 0);
  }
}

function expectSourceDeviceAndFrozenMonitorGeometry(
  size: string,
  deviceMeasurements: Awaited<ReturnType<typeof captureLayoutMeasurements>>,
  liveMeasurements: Awaited<ReturnType<typeof captureLayoutMeasurements>>,
) {
  const expected = frozenMonitorGeometry[size];
  const deviceFlowOffset = deviceMeasurements.activityLane?.height ?? 0;
  const liveFlowOffset = liveMeasurements.activityLane?.height ?? 0;
  expect(expected).toBeDefined();
  expect(deviceFlowOffset).toBeGreaterThan(0);
  expect(liveFlowOffset).toBeCloseTo(deviceFlowOffset, 0);
  // Device Manager's old fixed rectangles are historical only. Stage1 replaces
  // them with verified source anatomy plus equal groups/20px separation/flow.
  // The exact Monitor rectangles remain frozen and are checked below unchanged.
  expect(deviceMeasurements.deviceCards).toHaveLength(2);
  const [left, right] = deviceMeasurements.deviceCards;
  expect(left!.width).toBeCloseTo(right!.width, 0);
  expect(left!.height).toBeCloseTo(right!.height, 0);
  if (size === "800x1100") expect(right!.y).toBeCloseTo(left!.y + left!.height + 20, 0);
  else {
    expect(right!.x).toBeCloseTo(left!.x + left!.width + 20, 0);
    expect(right!.y).toBeCloseTo(left!.y, 0);
  }
  expect(deviceMeasurements.simulatorBand!.y).toBeCloseTo(right!.y + right!.height + 20, 0);
  expect(deviceMeasurements.simulatorBand!.x).toBeCloseTo(left!.x, 0);
  expectFrozenRect(liveMeasurements.channelPanel, expected.channelPanel, liveFlowOffset);
  expect(liveMeasurements.chartCards).toHaveLength(expected.chartCards.length);
  liveMeasurements.chartCards.forEach((rect, index) => expectFrozenRect(rect, expected.chartCards[index], liveFlowOffset));
}

async function expectNoUPlotArtifacts(page: Page) {
  await expect(page.locator(".chart-card .uplot, .chart-card canvas, .chart-card .u-axis, .chart-card .u-legend")).toHaveCount(0);
}

async function expectDialogActionAnatomy(page: Page, dialog: Locator) {
  const actionRow = dialog.locator(".dialog-action-row");
  const actions = actionRow.locator(".dialog-action");
  const divider = actionRow.locator(".dialog-action-row__divider");
  await expect(actionRow).toHaveCount(1);
  await expect(actions).toHaveCount(2);
  await expect(divider).toHaveCount(1);
  await page.mouse.move(0, 0);
  const boxes = await actions.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      width: box.width,
      height: box.height,
      backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      borderWidth: style.borderWidth,
    };
  }));
  expect(boxes[0].width).toBeCloseTo(boxes[1].width, 0);
  for (const box of boxes) {
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(box.borderRadius).toBe("12px");
    expect(box.borderWidth).toBe("0px");
  }
  const dividerBox = await divider.boundingBox();
  expect(dividerBox?.width).toBe(1);
  expect(dividerBox?.height).toBe(16);
}

function usesLandscapeRail(viewport: { width: number; height: number }) {
  return viewport.width >= 1260 && viewport.height >= 680 && viewport.width / viewport.height >= 4 / 3;
}

async function expectAdaptiveShell(page: Page, viewport: { width: number; height: number }) {
  const railExpected = usesLandscapeRail(viewport);
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
    };
    return {
      mode: document.querySelector(".app-shell")?.getAttribute("data-navigation"),
      appBar: rect(".one-ui-top-app-bar"),
      status: rect(".one-ui-top-app-bar__states"),
      statusVisible: getComputedStyle(document.querySelector(".one-ui-top-app-bar__states")!).display !== "none",
      rail: rect(".landscape-app-rail"),
      bottom: rect(".compact-app-navigation"),
      h1Count: document.querySelectorAll("h1").length,
      identityCount: Array.from(document.querySelectorAll("body *")).filter((element) => element.children.length === 0 && element.textContent === "Dataset Studio").length,
      globalActions: document.querySelectorAll(".one-ui-top-app-bar__actions button").length,
      navButtons: document.querySelectorAll("nav[aria-label='Điều hướng ứng dụng'] button").length,
      navLabels: Array.from(document.querySelectorAll("nav[aria-label='Điều hướng ứng dụng'] .nav-destination__label"), (element) => element.textContent),
      navIcons: document.querySelectorAll("nav[aria-label='Điều hướng ứng dụng'] .nav-destination__icon svg, nav[aria-label='Điều hướng ứng dụng'] .nav-destination__icon img").length,
      oldShellCount: document.querySelectorAll(".desktop-taskbar, .taskbar-brand, .taskbar-nav, .taskbar-tray, .navigation-rail, .top-app-bar, .one-ui-status-bar, .one-ui-navigation-rail, .one-ui-bottom-navigation").length,
      standaloneStatusCount: document.querySelectorAll(".application-status-strip, .one-ui-status-bar").length,
    };
  });
  expect(geometry.appBar?.height).toBe(76);
  expect(geometry.h1Count).toBe(1);
  expect(geometry.identityCount).toBe(1);
  expect(geometry.globalActions).toBe(3);
  expect(geometry.navButtons).toBe(3);
  expect(geometry.navLabels).toEqual(["Devices", "Monitor", "Account"]);
  expect(geometry.navIcons).toBe(3);
  expect(geometry.oldShellCount).toBe(0);
  expect(geometry.standaloneStatusCount).toBe(0);
  expect(geometry.status).not.toBeNull();
  expect(geometry.statusVisible).toBe(viewport.width > 900);
  if (railExpected) {
    expect(geometry.mode).toBe("rail");
    expect(geometry.rail).not.toBeNull();
    expect(geometry.bottom).toBeNull();
    expect(geometry.rail?.left).toBe(16);
    expect(geometry.rail?.width).toBe(88);
    const representativeScreen = await page.locator(".app-shell").getAttribute("data-page") === "devices";
    if (representativeScreen) {
      expect(geometry.rail?.top).toBe(92);
      expect(geometry.rail?.bottom).toBe(viewport.height - 16);
    } else expect(geometry.rail?.height).toBeLessThanOrEqual(260);
  } else {
    expect(geometry.mode).toBe("bottom");
    expect(geometry.rail).toBeNull();
    expect(geometry.bottom).not.toBeNull();
    expect(geometry.bottom?.bottom).toBeLessThanOrEqual(viewport.height - 8);
    expect(geometry.bottom?.height).toBeGreaterThanOrEqual(60);
  }
}

async function expectRefinedTabletGeometry(page: Page, viewport: { width: number; height: number }) {
  const geometry = await page.evaluate(() => {
    const pageElement = document.querySelector(".page")!;
    const toolbar = document.querySelector(".page-toolbar")!;
    const cards = Array.from(document.querySelectorAll(".device-card"));
    const rect = (element: Element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    return {
      page: rect(pageElement),
      toolbar: rect(toolbar),
      scrollViewport: rect(document.querySelector(".app-content")!),
      bottomNavigation: document.querySelector(".compact-app-navigation")
        ? rect(document.querySelector(".compact-app-navigation")!)
        : null,
      scrollbarWidth: (document.querySelector(".app-content") as HTMLElement).offsetWidth - (document.querySelector(".app-content") as HTMLElement).clientWidth,
      cards: cards.map((element) => {
        const card = rect(element);
        const relativeTop = (selector: string) => element.querySelector(selector)!.getBoundingClientRect().top - card.top;
        return {
          ...card,
          statusTop: relativeTop(".device-status"),
          metricsTop: relativeTop(".device-stats"),
          footerTop: relativeTop(".device-footer"),
          actionTop: relativeTop(".device-footer .one-ui-button"),
        };
      }),
      documentBottomReserve: (() => {
        const scrollRoot = document.querySelector(".app-content")!;
        const scrollRootBox = scrollRoot.getBoundingClientRect();
        const lastContentBottom = Math.max(
          ...Array.from(document.querySelectorAll(".settings-card, .raw-card")).map((element) => {
          const box = element.getBoundingClientRect();
            return box.bottom - scrollRootBox.top + scrollRoot.scrollTop;
          }),
        );
        return scrollRoot.scrollHeight - lastContentBottom;
      })(),
    };
  });
  const expectedPageLeft = usesLandscapeRail(viewport) ? 120 : 0;
  const expectedGutter = 16;
  const expectedRightGutter = usesLandscapeRail(viewport) ? 8 : expectedGutter;
  expect(geometry.page.left).toBe(expectedPageLeft);
  expect(geometry.toolbar.left).toBeCloseTo(expectedPageLeft + expectedGutter, 0);
  expect(geometry.toolbar.right).toBeCloseTo(viewport.width - expectedRightGutter - geometry.scrollbarWidth, 0);
  expect(geometry.cards).toHaveLength(2);
  expect(geometry.cards[0].width).toBeCloseTo(geometry.cards[1].width, 0);
  expect(geometry.cards[0].height).toBeCloseTo(geometry.cards[1].height, 0);
  expect(geometry.cards[0].statusTop).toBeCloseTo(geometry.cards[1].statusTop, 0);
  expect(geometry.cards[0].metricsTop).toBeCloseTo(geometry.cards[1].metricsTop, 0);
  expect(geometry.cards[0].footerTop).toBeCloseTo(geometry.cards[1].footerTop, 0);
  expect(geometry.cards[0].actionTop).toBeCloseTo(geometry.cards[1].actionTop, 0);
  if (viewport.width >= 900) {
    expect(geometry.cards[0].top).toBeCloseTo(geometry.cards[1].top, 0);
    expect(geometry.cards[0].width).toBeGreaterThanOrEqual(viewport.width === 1024 ? 480 : viewport.width === 1280 ? 550 : 630);
  } else {
    expect(geometry.cards[1].top).toBeGreaterThan(geometry.cards[0].top + geometry.cards[0].height);
    expect(geometry.bottomNavigation?.top).toBeGreaterThanOrEqual(geometry.scrollViewport.bottom);
    expect(geometry.documentBottomReserve).toBeGreaterThanOrEqual(24);
  }
}

async function expectDominantLiveCharts(page: Page, viewport: { width: number; height: number }) {
  const geometry = await page.locator(".chart-card").evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { top: box.top, width: box.width, height: box.height };
  }));
  expect(geometry).toHaveLength(2);
  expect(geometry[0].width).toBeCloseTo(geometry[1].width, 0);
  expect(geometry[0].height).toBeCloseTo(geometry[1].height, 0);
  if (viewport.width >= 900) {
    const minimumWidth = viewport.width >= 1440 ? 530 : viewport.width >= 1280 ? 440 : viewport.width >= 1024 ? 378 : 300;
    expect(geometry[0].top).toBeCloseTo(geometry[1].top, 0);
    expect(geometry[0].width).toBeGreaterThanOrEqual(minimumWidth);
  } else {
    expect(geometry[1].top).toBeGreaterThan(geometry[0].top + geometry[0].height);
  }
}

type MeasuredRect = {
  bottom: number;
  height: number;
  right: number;
  width: number;
  x: number;
  y: number;
};

type ChartCommandGeometry = {
  chartCards: MeasuredRect[];
  commandGroup: MeasuredRect;
  pauseAction: MeasuredRect;
  pauseIcon: MeasuredRect;
  plotHosts: MeasuredRect[];
  restoreAction: MeasuredRect;
  timeSelector: MeasuredRect;
};

async function measureChartCommandGeometry(page: Page): Promise<ChartCommandGeometry> {
  return await page.evaluate(() => {
    const rect = (selector: string): MeasuredRect => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing geometry target: ${selector}`);
      const box = element.getBoundingClientRect();
      return {
        bottom: box.bottom,
        height: box.height,
        right: box.right,
        width: box.width,
        x: box.x,
        y: box.y,
      };
    };
    const rects = (selector: string): MeasuredRect[] => Array.from(
      document.querySelectorAll(selector),
      (element) => {
        const box = element.getBoundingClientRect();
        return {
          bottom: box.bottom,
          height: box.height,
          right: box.right,
          width: box.width,
          x: box.x,
          y: box.y,
        };
      },
    );
    return {
      chartCards: rects(".chart-card"),
      commandGroup: rect(".chart-command-group"),
      pauseAction: rect(".chart-command-group .one-ui-button:last-child"),
      pauseIcon: rect(".chart-command-group .one-ui-button:last-child .one-ui-button__icon"),
      plotHosts: rects(".plot-host"),
      restoreAction: rect(".chart-command-group .one-ui-button:first-child"),
      timeSelector: rect(".live-control-bar > .one-ui-segmented-control"),
    };
  });
}

function expectRectStable(actual: MeasuredRect, baseline: MeasuredRect) {
  for (const key of ["x", "y", "width", "height", "right", "bottom"] as const) {
    expect(Math.abs(actual[key] - baseline[key]), `${key} changed beyond 1 CSS px`).toBeLessThanOrEqual(1);
  }
}

function expectChartCommandGeometryStable(actual: ChartCommandGeometry, baseline: ChartCommandGeometry) {
  expectRectStable(actual.commandGroup, baseline.commandGroup);
  expectRectStable(actual.pauseAction, baseline.pauseAction);
  expectRectStable(actual.pauseIcon, baseline.pauseIcon);
  expectRectStable(actual.restoreAction, baseline.restoreAction);
  expectRectStable(actual.timeSelector, baseline.timeSelector);
  expect(actual.chartCards).toHaveLength(baseline.chartCards.length);
  expect(actual.plotHosts).toHaveLength(baseline.plotHosts.length);
  actual.chartCards.forEach((box, index) => expectRectStable(box, baseline.chartCards[index]));
  actual.plotHosts.forEach((box, index) => expectRectStable(box, baseline.plotHosts[index]));
}

async function expectChartCommandsFit(page: Page) {
  const fit = await page.evaluate(() => {
    const timeSelector = document.querySelector(".live-control-bar > .one-ui-segmented-control")!;
    const commandGroup = document.querySelector(".chart-command-group")!;
    const restore = commandGroup.querySelector(".one-ui-button:first-child")!;
    const pause = commandGroup.querySelector(".one-ui-button:last-child")!;
    const box = (element: Element) => element.getBoundingClientRect();
    const timeBox = box(timeSelector);
    const groupBox = box(commandGroup);
    const restoreBox = box(restore);
    const pauseBox = box(pause);
    const overlaps = (first: DOMRect, second: DOMRect) => (
      first.left < second.right - 1
      && first.right > second.left + 1
      && first.top < second.bottom - 1
      && first.bottom > second.top + 1
    );
    return {
      actionsOverlap: overlaps(restoreBox, pauseBox),
      controlsOverlap: overlaps(timeBox, groupBox),
      groupContainsActions: restoreBox.left >= groupBox.left - 1
        && pauseBox.right <= groupBox.right + 1
        && restoreBox.top >= groupBox.top - 1
        && pauseBox.bottom <= groupBox.bottom + 1,
      labelsFit: Array.from(commandGroup.querySelectorAll<HTMLElement>(".one-ui-button__label span"))
        .every((element) => element.scrollWidth <= element.clientWidth + 1),
    };
  });
  expect(fit.actionsOverlap).toBe(false);
  expect(fit.controlsOverlap).toBe(false);
  expect(fit.groupContainsActions).toBe(true);
  expect(fit.labelsFit).toBe(true);
}

async function expectPauseState(page: Page, paused: boolean) {
  const activeName = paused ? "Tiếp tục biểu đồ" : "Tạm dừng biểu đồ";
  const inactiveName = paused ? "Tạm dừng biểu đồ" : "Tiếp tục biểu đồ";
  const action = page.getByRole("button", { name: activeName });
  await expect(action).toHaveAttribute("aria-label", activeName);
  await expect(action).toHaveAttribute("aria-pressed", String(paused));
  await expect(page.getByRole("button", { name: inactiveName })).toHaveCount(0);
  await expect(page.locator(".chart-pause-label__state:not([aria-hidden])")).toHaveText(activeName);
  const inactiveLabel = page.locator(`.chart-pause-label__state[aria-hidden="true"]`, { hasText: inactiveName });
  await expect(inactiveLabel).toHaveCount(1);
  await expect(inactiveLabel).toBeHidden();
  return action;
}

async function captureCommandGeometryEvidence(page: Page, filename: string) {
  await page.mouse.move(1, 1);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(100);
  await captureReview(page.locator(".live-control-bar"), { path: path.join(artifactRoot, filename) });
}

test("P.1 first-run setup, session restore, forced password change and role-shaped UI", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(`/#api=${encodeURIComponent(`http://127.0.0.1:${port}`)}&token=${encodeURIComponent(token)}`);
  await expect(page.getByRole("heading", { name: "Tạo quản trị viên cục bộ" })).toBeVisible();
  await expectSingleThemeControl(page);
  const authComposition = await page.evaluate(() => {
    const context = document.querySelector(".auth-context")!.getBoundingClientRect();
    const card = document.querySelector(".auth-card")!.getBoundingClientRect();
    return { contextRight: context.right, cardLeft: card.left, cardWidth: card.width };
  });
  expect(authComposition.contextRight).toBeLessThan(authComposition.cardLeft);
  expect(authComposition.cardWidth).toBeLessThanOrEqual(520);
  await expect(page.getByRole("heading", { name: "Một phiên làm việc rõ ràng cho dữ liệu găng tay." })).toHaveCount(1);
  await captureEvidence(page, "auth-first-run-light-1280x720.png");
  await page.setViewportSize({ width: 640, height: 360 });
  await captureEvidence(page, "auth-effective-200-light-640x360.png");
  await page.getByRole("button", { name: "Tạo quản trị viên", exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Tạo quản trị viên", exact: true })).toBeInViewport();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await captureEvidence(page, "auth-first-run-dark-1280x720.png");
  await page.getByRole("button", { name: "Chuyển sang giao diện sáng" }).click();

  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(administrator.username);
  await page.getByLabel("Tên hiển thị (không bắt buộc)").fill("Admin P1");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("too short");
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill("too short");
  await page.getByRole("button", { name: "Tạo quản trị viên", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("ít nhất 12 ký tự");
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeFocused();

  await page.getByLabel("Mật khẩu", { exact: true }).fill(administrator.password);
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(administrator.password);
  await page.getByRole("button", { name: "Tạo quản trị viên", exact: true }).click();
  await expect(page.getByTestId("device-manager")).toBeVisible({ timeout: 15_000 });
  await expect(page).not.toHaveURL(/token=/);
  expect(await page.evaluate(() => document.cookie)).not.toContain("smartglove_user_session");
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(["smartglove-collector-theme"]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);

  await page.goto(`/#api=${encodeURIComponent(`http://127.0.0.1:${port}`)}&token=${encodeURIComponent(token)}`);
  await expect(page.getByTestId("device-manager")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Đăng nhập Dataset Studio" })).toHaveCount(0);
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(page.getByTestId("user-management")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  const wideAdminComposition = await page.evaluate(() => {
    const accounts = document.querySelector(".user-management__accounts")!.getBoundingClientRect();
    const audit = document.querySelector(".audit-panel")!.getBoundingClientRect();
    return { accountsRight: accounts.right, auditLeft: audit.left, auditWidth: audit.width };
  });
  expect(wideAdminComposition.accountsRight).toBeLessThan(wideAdminComposition.auditLeft);
  expect(wideAdminComposition.auditWidth).toBeGreaterThanOrEqual(310);
  await captureEvidence(page, "admin-users-light-1440x900.png");

  await page.setViewportSize({ width: 1024, height: 768 });
  const compactAdminComposition = await page.evaluate(() => {
    const accounts = document.querySelector(".user-management__accounts")!.getBoundingClientRect();
    const audit = document.querySelector(".audit-panel")!.getBoundingClientRect();
    return { accountsBottom: accounts.bottom, auditTop: audit.top };
  });
  expect(compactAdminComposition.auditTop).toBeGreaterThan(compactAdminComposition.accountsBottom);
  await expectImmediateLocalSheet(page.getByRole("button", { name: "Tạo tài khoản", exact: true }), "#create-user-sheet");
  const createSheet = page.getByRole("dialog", { name: "Tạo tài khoản" });
  await captureEvidence(page, "admin-create-user-light-1024x768.png");
  await createSheet.getByLabel("Tên đăng nhập", { exact: true }).fill(participant.username);
  await createSheet.getByLabel("Tên hiển thị (không bắt buộc)").fill("Participant P1");
  await createSheet.getByLabel("Mật khẩu tạm", { exact: true }).fill(participant.temporaryPassword);
  await createSheet.getByLabel("Vai trò").selectOption("participant");
  await page.route("**/api/v1/admin/users", async (route) => {
    if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  await createSheet.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();
  await expect(createSheet.getByRole("button", { name: "Đang tạo tài khoản" })).toHaveAttribute("aria-busy", "true");
  await createSheet.getByLabel("Mật khẩu tạm", { exact: true }).evaluate((element: HTMLInputElement) => { element.value = ""; });
  await captureEvidence(page, "admin-create-user-pending-light-1024x768.png");
  await expect(createSheet).toBeHidden();
  await page.unroute("**/api/v1/admin/users");
  const participantRow = page.locator(".user-row").filter({ hasText: "@participant-p1" });
  await expect(participantRow).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hoạt động xác thực gần đây" })).toBeVisible();
  await captureEvidence(page, "admin-create-user-success-light-1024x768.png");
  await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });
  await expectImmediateLocalSheet(participantRow.getByRole("button", { name: "Quản lý" }), "#edit-user-sheet");
  await captureEvidence(page, "admin-edit-user-light-1024x768.png");
  await page.getByRole("dialog", { name: "Quản lý tài khoản" }).getByRole("button", { name: "Vô hiệu hóa tài khoản" }).click();
  const deactivateDialog = page.getByRole("dialog", { name: "Vô hiệu hóa tài khoản?" });
  await expect(deactivateDialog).toBeVisible();
  await captureEvidence(page, "admin-deactivate-confirmation-light-1024x768.png");
  await deactivateDialog.getByRole("button", { name: "Giữ nguyên" }).click();
  const managementAccessibility = await new AxeBuilder({ page }).include(".user-management").analyze();
  expect(managementAccessibility.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await captureEvidence(page, "admin-users-dark-1440x900.png");

  await page.getByRole("button", { name: /Account Admin P1/ }).click();
  const accountSheet = page.getByRole("dialog", { name: "Account" });
  await captureEvidence(page, "account-surface-dark-1440x900.png");
  await accountSheet.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page.getByRole("heading", { name: "Đăng nhập Dataset Studio" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });
  await captureEvidence(page, "auth-login-dark-1280x720.png");
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill("missing-user");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("invalid credential value");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("không đúng");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("");
  await captureEvidence(page, "auth-invalid-login-dark-1280x720.png");
  await page.getByRole("button", { name: "Chuyển sang giao diện sáng" }).click();
  await captureEvidence(page, "auth-login-light-1280x720.png");

  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(participant.username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(participant.temporaryPassword);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Đổi mật khẩu tạm thời" })).toBeVisible();
  await captureEvidence(page, "forced-password-change-light-1280x720.png");
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(participant.temporaryPassword);
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill(participant.password);
  await page.getByLabel("Xác nhận mật khẩu mới", { exact: true }).fill(participant.password);
  await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Quyền truy cập giới hạn" })).toBeVisible();
  await expect(page.getByTestId("device-manager")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Devices" })).toHaveCount(0);
  await page.setViewportSize({ width: 800, height: 1100 });
  const compactAuthComposition = await page.evaluate(() => {
    const context = document.querySelector(".auth-context")!.getBoundingClientRect();
    const card = document.querySelector(".auth-card")!.getBoundingClientRect();
    return { contextBottom: context.bottom, cardTop: card.top };
  });
  expect(compactAuthComposition.cardTop).toBeGreaterThanOrEqual(compactAuthComposition.contextBottom);
  await expect(page.getByText(/P\.1|workflow|collector/i)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Bạn có thể làm gì lúc này?" })).toBeVisible();
  await captureEvidence(page, "participant-access-light-800x1100.png");
  const participantAccessibility = await new AxeBuilder({ page }).include(".auth-card").analyze();
  expect(participantAccessibility.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(administrator.username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(administrator.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByTestId("device-manager")).toBeVisible({ timeout: 15_000 });
});

test("administrator filter, localized roles, reset, deactivate and activate flows", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);
  await page.getByRole("button", { name: "Account", exact: true }).click();
  const search = page.getByLabel("Tìm trong tài khoản", { exact: true });
  await search.fill("người tham gia");
  await expect(page.locator(".user-row")).toHaveCount(1);
  const participantRow = page.locator(".user-row").filter({ hasText: `@${participant.username}` });
  await expect(participantRow).toContainText("Người tham gia");
  await search.fill("");
  await expect(page.locator(".user-row")).toHaveCount(2);

  await participantRow.getByRole("button", { name: "Quản lý" }).click();
  const editor = page.getByRole("dialog", { name: "Quản lý tài khoản" });
  const roleOptions = await editor.getByLabel("Vai trò").locator("option").evaluateAll((options) => options.map((option) => ({
    label: option.textContent,
    value: (option as HTMLOptionElement).value,
  })));
  expect(roleOptions).toEqual([
    { label: "Người tham gia", value: "participant" },
    { label: "Nghiên cứu viên", value: "researcher" },
    { label: "Quản trị viên", value: "administrator" },
    { label: "Nhà phát triển", value: "developer" },
  ]);
  await editor.getByRole("textbox", { name: "Mật khẩu tạm mới" }).fill(participant.resetPassword);
  await editor.getByRole("button", { name: "Đặt mật khẩu tạm" }).click();
  let confirmation = page.getByRole("dialog", { name: "Đặt mật khẩu tạm mới?" });
  await expect(confirmation).toContainText("phải dùng mật khẩu tạm mới");
  await confirmation.getByRole("button", { name: "Đặt lại mật khẩu" }).click();
  await expect(page.locator(".one-ui-snackbar")).toContainText("Đã đặt mật khẩu tạm");
  await page.locator(".one-ui-snackbar__dismiss").click();

  await participantRow.getByRole("button", { name: "Quản lý" }).click();
  await editor.getByRole("button", { name: "Vô hiệu hóa tài khoản" }).click();
  confirmation = page.getByRole("dialog", { name: "Vô hiệu hóa tài khoản?" });
  await expect(confirmation).toContainText("không thể đăng nhập");
  await confirmation.getByRole("button", { name: "Vô hiệu hóa" }).click();
  await expect(participantRow).toContainText("Đã vô hiệu hóa");
  await page.locator(".one-ui-snackbar__dismiss").click();

  await participantRow.getByRole("button", { name: "Quản lý" }).click();
  await editor.getByRole("button", { name: "Kích hoạt tài khoản" }).click();
  await expect(participantRow).toContainText("Đang hoạt động");
  await page.locator(".one-ui-snackbar__dismiss").click();
});

test("session revocation replaces protected UI and announces the next action", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);
  await page.getByRole("button", { name: "Account", exact: true }).click();
  const currentUserRow = page.locator(".user-row").filter({ hasText: "@admin-p1 · Bạn" });
  await currentUserRow.getByRole("button", { name: "Quản lý" }).click();
  const editor = page.getByRole("dialog", { name: "Quản lý tài khoản" });
  await editor.getByRole("button", { name: "Thu hồi mọi phiên đăng nhập" }).click();
  const confirmation = page.getByRole("dialog", { name: "Thu hồi mọi phiên?" });
  await expect(confirmation).toContainText("tài khoản vẫn có thể đăng nhập lại");
  await confirmation.getByRole("button", { name: "Thu hồi phiên" }).click();

  await expect(page.getByRole("heading", { name: "Đăng nhập Dataset Studio" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("alert")).toContainText("Phiên đăng nhập đã hết hạn hoặc bị thu hồi");
  await expect(page.getByTestId("device-manager")).toHaveCount(0);
  await captureEvidence(page, "session-revoked-auth-announcement-light-1280x720.png");
  const authAccessibility = await new AxeBuilder({ page }).include(".auth-stage").analyze();
  expect(authAccessibility.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);

  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(administrator.username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(administrator.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByTestId("device-manager")).toBeVisible({ timeout: 15_000 });
});

test("authentication transition is brief and removed for reduced motion", async ({ page }) => {
  const launchUrl = `/#api=${encodeURIComponent(`http://127.0.0.1:${port}`)}&token=${encodeURIComponent(token)}`;
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto(launchUrl);
  const heading = page.getByRole("heading", { name: "Đăng nhập Dataset Studio" });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  const normalDuration = await page.locator(".auth-stage").evaluate((element) => Number.parseFloat(getComputedStyle(element).animationDuration));
  expect(normalDuration).toBeGreaterThanOrEqual(0.1);
  expect(normalDuration).toBeLessThanOrEqual(0.36);
  await captureEvidence(page, "auth-transition-normal-light-1280x720.png", true);

  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(launchUrl);
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  const reducedDuration = await page.locator(".auth-stage").evaluate((element) => Number.parseFloat(getComputedStyle(element).animationDuration));
  expect(reducedDuration).toBeLessThanOrEqual(0.001);
});

test("bounded One UI component roles and application-owned chrome", async ({ page }) => {
  const shellSource = await readFile(path.join(repoRoot, "app", "desktop_collector", "web", "src", "one-ui", "shell.tsx"), "utf8");
  const shellStyles = await readFile(path.join(repoRoot, "app", "desktop_collector", "web", "src", "one-ui", "shell.css"), "utf8");
  const requiredRailQuery = "(min-width: 1260px) and (min-height: 680px) and (min-aspect-ratio: 4/3)";
  expect(shellSource.split(requiredRailQuery)).toHaveLength(2);
  expect(shellSource).not.toContain("useLocalTime");
  expect(shellSource).not.toContain("<time");
  expect(shellSource).not.toContain("ApplicationStatusStrip");
  expect(shellStyles).toContain("env(safe-area-inset-top, 0px)");
  expect(shellStyles).toContain("env(safe-area-inset-bottom, 0px)");
  expect(shellStyles).not.toContain(".one-ui-status-bar");
  expect(shellStyles).not.toContain(".application-status-strip");

  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);
  const statusStrip = page.getByLabel("Trạng thái ứng dụng");
  await expect(statusStrip).toBeVisible();
  await expect(statusStrip.locator("time")).toHaveCount(0);
  await expect(page.getByRole("banner", { name: "Thanh ứng dụng" })).toBeVisible();
  await expect(statusStrip.getByText("Dataset Studio", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Dataset Studio", { exact: true })).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expectSingleThemeControl(page);
  await expect(page.getByRole("button", { name: "Quick Status", exact: true })).toHaveCount(1);
  await expect(page.locator(".page-toolbar > p strong")).toHaveCount(0);
  await expect(page.locator(".landscape-app-rail")).toBeVisible();
  await expect(page.locator(".compact-app-navigation")).toHaveCount(0);
  await expect(page.locator(".landscape-app-rail .nav-destination__label")).toHaveText(["Devices", "Monitor", "Account"]);
  await expect(page.locator(".landscape-app-rail .nav-destination__icon svg, .landscape-app-rail .nav-destination__icon img")).toHaveCount(3);
  expect((await page.locator(".landscape-app-rail").boundingBox())?.height).toBeLessThanOrEqual(260);

  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  const timeSelector = page.getByRole("group", { name: "Cửa sổ thời gian" });
  const commandGroup = page.getByRole("group", { name: "Tác vụ biểu đồ" });
  await expect(timeSelector.getByRole("button")).toHaveCount(4);
  await expect(commandGroup.getByRole("button")).toHaveCount(2);
  await expect(commandGroup.locator(".one-ui-button__icon svg")).toHaveCount(2);
  await expect(commandGroup.locator(".one-ui-button:first-child .one-ui-button__label > span:last-child")).toHaveText("Về mới nhất");
  await expect(commandGroup.locator(".chart-pause-label__state:not([aria-hidden])")).toHaveText("Tạm dừng biểu đồ");
  await expect(timeSelector.getByRole("button", { name: /Khôi phục|Tạm dừng|Tiếp tục/ })).toHaveCount(0);
  await expect(commandGroup.locator(".one-ui-segmented-control")).toHaveCount(0);
  await expect(page.locator(".one-ui-checkbox-row input")).toHaveCount(13);
  const frozenCommands = await page.evaluate(() => {
    const box = (selector: string) => {
      const rect = document.querySelector(selector)!.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };
    return {
      group: box(".chart-command-group"),
      restore: box(".chart-command-group .one-ui-button:first-child"),
      pause: box(".chart-command-group .one-ui-button:last-child"),
    };
  });
  expect(frozenCommands.group).toEqual({ width: 209, height: 60 });
  expect(frozenCommands.restore).toEqual({ width: 88, height: 48 });
  expect(frozenCommands.pause).toEqual({ width: 107, height: 48 });

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator(".landscape-app-rail")).toHaveCount(0);
  await expect(page.locator(".compact-app-navigation")).toBeVisible();
  await expect(page.locator(".compact-app-navigation .nav-destination__label")).toHaveText(["Devices", "Monitor", "Account"]);
});

test("two-glove vertical slice, batching, pause, heartbeat and accessibility", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);
  const wordmark = page.locator(".one-ui-top-app-bar__identity");
  await expect(wordmark).toHaveText("Dataset Studio");
  await expect(page.getByText("Dataset Studio", { exact: true })).toHaveCount(1);
  await expect(wordmark.locator("img, svg")).toHaveCount(0);
  await expect(page.getByLabel("Trạng thái ứng dụng").locator("time")).toHaveCount(0);
  await expect(page.locator(".one-ui-top-app-bar__heading")).toContainText("Dataset Studio");
  await expect(page.locator(".page-toolbar > p strong")).toHaveCount(0);
  await expect(page.getByText("SG", { exact: true })).toHaveCount(0);
  await expect(page.locator(".brand-error, .desktop-taskbar, .taskbar-brand")).toHaveCount(0);
  await expectAdaptiveShell(page, { width: 1280, height: 720 });
  await expectSingleThemeControl(page);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("A");
  await expect(page.getByRole("link", { name: "Bỏ qua điều hướng" })).toBeFocused();
  expect(await page.locator(":focus").evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
  await page.evaluate(() => {
    (window as Window & { collectorHeartbeat?: number }).collectorHeartbeat = 0;
    window.setInterval(() => {
      const target = window as Window & { collectorHeartbeat?: number };
      target.collectorHeartbeat = (target.collectorHeartbeat ?? 0) + 1;
    }, 20);
  });
  await page.getByLabel("Tần số lấy mẫu").fill("200");
  await page.getByLabel("Tỷ lệ mất gói").fill("2");
  await expect(page.locator('.settings-card input[type="number"]')).toHaveCount(4);
  await expect(page.getByLabel("Tần số lấy mẫu")).toHaveAttribute("min", "1");
  await expect(page.getByLabel("Tần số lấy mẫu")).toHaveAttribute("max", "500");
  await expect(page.getByLabel("Tỷ lệ mất gói")).toHaveAttribute("step", "0.1");
  await expectDeviceSourceAnatomy(page);
  await expectContrast(page.locator(".settings-copy"), 4.5, page.locator(".settings-card"));
  await expectSimulatorBandFits(page);

  const themeControl = page.getByTestId("theme-control");
  await expect(themeControl).toHaveAccessibleName("Chuyển sang giao diện tối");
  await themeControl.focus();
  expect(await themeControl.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
  await themeControl.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themeControl).toHaveAccessibleName("Chuyển sang giao diện sáng");
  await expectDeviceSourceAnatomy(page);
  expect(await page.evaluate(() => localStorage.getItem("smartglove-collector-theme"))).toBe("dark");
  await themeControl.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => localStorage.getItem("smartglove-collector-theme"))).toBe("light");

  await page.getByRole("button", { name: "Áp dụng" }).click();
  await page.getByRole("button", { name: "Kết nối tất cả" }).click();
  await expect(page.locator('.device-status[data-tone="positive"]')).toHaveCount(2);
  await expect(page.locator(".sensor-summary")).toHaveCount(2);
  const deviceVisualMetrics = await page.evaluate(() => ({
    titleSize: parseFloat(getComputedStyle(document.querySelector("h1")!).fontSize),
    bodySize: parseFloat(getComputedStyle(document.querySelector(".page-toolbar p")!).fontSize),
    navigationTarget: document.querySelector("nav[aria-label='Điều hướng ứng dụng'] button")!.getBoundingClientRect().height,
  }));
  expect(deviceVisualMetrics.titleSize).toBeGreaterThanOrEqual(20);
  expect(deviceVisualMetrics.titleSize).toBeLessThanOrEqual(24);
  expect(deviceVisualMetrics.bodySize).toBeGreaterThanOrEqual(11);
  expect(deviceVisualMetrics.navigationTarget).toBeGreaterThanOrEqual(48);
  const firstDestination = page.getByRole("button", { name: "Devices" });
  await firstDestination.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Monitor", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  const monitor = page.getByTestId("live-monitor");
  await expect(monitor).toBeVisible();
  await expect(page.locator(".chart-card")).toHaveCount(2);
  await expect(page.locator(".one-ui-checkbox-row input")).toHaveCount(13);
  expect(await page.locator(".one-ui-checkbox-row").first().evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(40);
  const timeWindow = page.getByRole("group", { name: "Cửa sổ thời gian" });
  const chartCommands = page.getByRole("group", { name: "Tác vụ biểu đồ" });
  await expect(timeWindow.getByRole("button")).toHaveCount(4);
  await expect(chartCommands.getByRole("button")).toHaveCount(2);
  await expect(timeWindow.locator(".chart-command-group")).toHaveCount(0);
  await expect(chartCommands.locator(".one-ui-segmented-control")).toHaveCount(0);
  await expect(timeWindow.getByRole("button", { name: "10s" })).toHaveAttribute("aria-pressed", "true");
  await timeWindow.getByRole("button", { name: "30s" }).click();
  await expect(timeWindow.getByRole("button", { name: "30s" })).toHaveAttribute("aria-pressed", "true");
  const firstChannel = page.locator(".one-ui-checkbox-row input").first();
  await timeWindow.getByRole("button", { name: "60s" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Tạm dừng biểu đồ" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(firstChannel).toBeFocused();
  expect(await page.locator(".one-ui-checkbox-row__shape").first().evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
  await firstChannel.press("Space");
  await expect(page.locator(".channel-title > strong")).toContainText("2/13");
  await firstChannel.press("Space");
  await expect(page.locator(".channel-title > strong")).toContainText("3/13");
  const restoreLive = page.getByRole("button", { name: "Về dữ liệu mới nhất" });
  await expect(restoreLive).toBeDisabled();
  await page.locator(".plot-host").first().dispatchEvent("wheel", { deltaY: 120 });
  await expect(restoreLive).toBeEnabled();
  await timeWindow.getByRole("button", { name: "60s" }).focus();
  await page.keyboard.press("Tab");
  await expect(restoreLive).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Tạm dừng biểu đồ" })).toBeFocused();
  await restoreLive.click();
  await expect(restoreLive).toBeDisabled();
  await expect(page.locator(".metric-group")).toHaveCount(3);
  await expect(page.locator(".raw-card tbody tr")).toHaveCount(13);
  await expect(page.locator(".chart-status")).toHaveCount(2);
  await expect(page.locator(".chart-status").first()).toContainText(/Live|Offline/);
  await expect.poll(async () => Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(20);
  await expect.poll(async () => Number(await monitor.getAttribute("data-mean-rate"))).toBeGreaterThan(150);

  const quickStatusButton = page.getByRole("button", { name: "Quick Status", exact: true });
  await quickStatusButton.click();
  const quickStatusPanel = page.getByRole("dialog", { name: "Quick Status" });
  await expect(quickStatusPanel).toBeVisible();
  await expect(quickStatusPanel.getByRole("button", { name: "Đóng" })).toBeFocused();
  await expect(quickStatusPanel).toHaveAttribute("aria-modal", "true");
  await expect(page.locator(".app-shell")).toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  expect(await page.locator(".quick-status-button").evaluate((element) => getComputedStyle(element, "::after").display)).toBe("none");
  await expect(quickStatusPanel.getByText("Đã xác thực · chỉ trong bộ nhớ")).toBeVisible();
  await expect(quickStatusPanel.getByText("Găng mô phỏng trái")).toBeVisible();
  await expect(quickStatusPanel.getByText("Găng mô phỏng phải")).toBeVisible();
  await expectSingleThemeControl(page);
  await expect(quickStatusPanel.getByRole("button", { name: /^Chuyển sang giao diện/ })).toHaveCount(0);
  await expectContrast(quickStatusPanel.locator(".quick-rate"));
  expect(await quickStatusPanel.evaluate((element) => parseFloat(getComputedStyle(element).animationDuration))).toBeLessThanOrEqual(0.001);
  const panelBox = await quickStatusPanel.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.x).toBeGreaterThanOrEqual(0);
  expect(panelBox!.y).toBeGreaterThanOrEqual(0);
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
  expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));
  expect(await page.locator("body").innerText()).not.toContain(token);
  const beforeQuickStatus = Number(await monitor.getAttribute("data-total-packets"));
  await page.waitForTimeout(500);
  expect(Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(beforeQuickStatus);
  const panelAccessibility = await new AxeBuilder({ page }).analyze();
  expect(panelAccessibility.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(quickStatusPanel).toBeHidden();
  await expect(quickStatusButton).toBeFocused();
  await expect(page.locator(".app-shell")).not.toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await quickStatusButton.dispatchEvent("click");
  await expect(quickStatusPanel).toBeVisible();
  await page.locator(".one-ui-side-sheet-layer .one-ui-overlay-scrim").dispatchEvent("click");
  await expect(quickStatusPanel).toBeHidden();
  await expect(quickStatusButton).toBeFocused();

  await page.getByRole("button", { name: "Tạm dừng biểu đồ" }).click();
  await expect(page.getByRole("button", { name: "Tiếp tục biểu đồ" })).toHaveAttribute("aria-pressed", "true");
  const before = Number(await monitor.getAttribute("data-total-packets"));
  await page.waitForTimeout(700);
  const after = Number(await monitor.getAttribute("data-total-packets"));
  expect(after).toBeGreaterThan(before);
  await expect(page.getByText("Tạm dừng · vẫn thu")).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { collectorHeartbeat?: number }).collectorHeartbeat ?? 0)).toBeGreaterThan(25);
  await expectNoPageOverflow(page);
  expect(await page.evaluate(() => performance.getEntriesByType("resource").some((entry) => /one-ui-(master|secondary)\.svg/i.test(entry.name)))).toBe(false);
  expect(await page.evaluate(() => performance.getEntriesByType("resource").some((entry) => /samsung\.com/i.test(entry.name)))).toBe(false);

  const pressedContrastReports = [];
  const verifyPressedContrast = async (theme: string) => {
    const controls = page.locator('.one-ui-segmented-control__item[data-selected="true"], .chart-command-group button[aria-pressed="true"]');
    await expect(controls).toHaveCount(2);
    await controls.evaluateAll((elements) => Promise.all(elements.flatMap((element) => element.getAnimations().map((animation) => animation.finished))));
    const colors = await controls.evaluateAll((elements) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      const rgb = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return `rgb(${[...context.getImageData(0, 0, 1, 1).data].slice(0, 3).join(",")})`;
      };
      return elements.map((element) => ({ label: element.getAttribute("aria-label") ?? element.textContent,
        foreground: rgb(getComputedStyle(element).color), background: rgb(getComputedStyle(element).backgroundColor) }));
    });
    for (const color of colors) expect(contrastRatio(color.foreground, color.background)).toBeGreaterThanOrEqual(4.5);
    pressedContrastReports.push({ theme, controls: colors.map((color) => ({ ...color, ratio: contrastRatio(color.foreground, color.background) })) });
  };
  await verifyPressedContrast("light");
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);

  await themeControl.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await verifyPressedContrast("dark");
  await writeFile(path.join(artifactRoot, "v3-pressed-control-contrast.json"), JSON.stringify(pressedContrastReports, null, 2));
  await page.goto("about:blank");
  await page.goto(`/#api=${encodeURIComponent(`http://127.0.0.1:${port}`)}&token=${encodeURIComponent(token)}`);
  await expect(page.getByTestId("device-manager")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page).not.toHaveURL(/token=/);
  expect(await page.evaluate(
    (sessionToken) => Object.values(localStorage).some((value) => value.includes(sessionToken)),
    token,
  )).toBe(false);
  await expectSingleThemeControl(page);
});

test("pause and resume preserve command geometry across responsive layouts", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  const monitor = page.getByTestId("live-monitor");
  await expect.poll(async () => Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(20);
  await page.addStyleTag({ content: `
    .live-control-bar > .one-ui-segmented-control { outline: 2px solid #8b5cf6; outline-offset: 2px; }
    .chart-command-group { outline: 2px solid #ef4444; outline-offset: 2px; }
    .chart-command-group .one-ui-button:first-child { outline: 2px solid #0ea5e9; outline-offset: -2px; }
    .chart-command-group .one-ui-button:last-child { outline: 2px solid #22c55e; outline-offset: -2px; }
  ` });

  for (const review of [
    { viewport: { width: 1280, height: 720 }, theme: "light" },
    { viewport: { width: 1280, height: 720 }, theme: "dark" },
    { viewport: { width: 1024, height: 768 }, theme: "light" },
    { viewport: { width: 800, height: 1100 }, theme: "light" },
  ] as const) {
    await page.setViewportSize(review.viewport);
    const currentTheme = await page.locator("html").getAttribute("data-theme");
    if (currentTheme !== review.theme) {
      await page.getByTestId("theme-control").click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", review.theme);
    }
    await resetReviewViewport(page);
    await expectNoPageOverflow(page);
    await expectAdaptiveShell(page, review.viewport);
    await expectDominantLiveCharts(page, review.viewport);
    await expect(page.locator(".chart-card .uplot")).toHaveCount(2);
    await expectPauseState(page, false);
    await expectChartCommandsFit(page);

    const size = `${review.viewport.width}x${review.viewport.height}-${review.theme}`;
    const measurements: Record<string, ChartCommandGeometry> = {};
    measurements.running = await measureChartCommandGeometry(page);
    await captureCommandGeometryEvidence(page, `pause-geometry-${size}-running.png`);

    const keyboardAction = await expectPauseState(page, false);
    await page.getByRole("button", { name: "60s" }).focus();
    await page.keyboard.press("Tab");
    await expect(keyboardAction).toBeFocused();
    expect(await keyboardAction.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
    await keyboardAction.press("Space");
    const focusedPausedAction = await expectPauseState(page, true);
    await expect(focusedPausedAction).toBeFocused();
    expect(await focusedPausedAction.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
    measurements.paused = await measureChartCommandGeometry(page);
    expectChartCommandGeometryStable(measurements.paused, measurements.running);
    await expectChartCommandsFit(page);
    const packetCountWhilePaused = Number(await monitor.getAttribute("data-total-packets"));
    await page.waitForTimeout(500);
    expect(Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(packetCountWhilePaused);
    await expect(page.getByText("Tạm dừng · vẫn thu")).toBeVisible();
    await expect(page.locator(".chart-card .uplot")).toHaveCount(2);
    await captureCommandGeometryEvidence(page, `pause-geometry-${size}-paused.png`);

    await page.getByRole("button", { name: "Tiếp tục biểu đồ" }).click();
    await expectPauseState(page, false);
    measurements.resumed = await measureChartCommandGeometry(page);
    expectChartCommandGeometryStable(measurements.resumed, measurements.running);
    await expectChartCommandsFit(page);
    await captureCommandGeometryEvidence(page, `pause-geometry-${size}-resumed.png`);

    await page.getByRole("button", { name: "Tạm dừng biểu đồ" }).click();
    await expectPauseState(page, true);
    measurements.secondPause = await measureChartCommandGeometry(page);
    expectChartCommandGeometryStable(measurements.secondPause, measurements.running);
    await expect(page.locator(".chart-card .uplot")).toHaveCount(2);
    await page.getByRole("button", { name: "Tiếp tục biểu đồ" }).click();
    await expectPauseState(page, false);
    measurements.secondResume = await measureChartCommandGeometry(page);
    expectChartCommandGeometryStable(measurements.secondResume, measurements.running);
    await expect(page.locator(".chart-card .uplot")).toHaveCount(2);
    await writeFile(
      path.join(artifactRoot, `pause-geometry-${size}.json`),
      `${JSON.stringify({ viewport: review.viewport, theme: review.theme, measurements }, null, 2)}\n`,
      "utf8",
    );
  }
});

test("confirmation dialogs, real progress, content states and snackbar feedback", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);

  const connectAll = page.getByRole("button", { name: "Kết nối tất cả" });
  await page.route("**/api/v1/devices/*/connect", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  const readyBounds = (await connectAll.boundingBox())!;
  await connectAll.click();
  const pendingConnect = page.getByRole("button", { name: "Đang kết nối tất cả", exact: true });
  await expect(pendingConnect).toBeDisabled();
  await expect(pendingConnect).toHaveAttribute("aria-busy", "true");
  await pendingConnect.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const pendingBounds = (await pendingConnect.boundingBox())!;
  expect(pendingBounds.width).toBeCloseTo(readyBounds.width, 1);
  expect(pendingBounds.height).toBeCloseTo(readyBounds.height, 1);
  expect(await pendingConnect.evaluate((element) => {
    const surface = element.getBoundingClientRect();
    const label = element.querySelector(".one-ui-button__pending")!.getBoundingClientRect();
    return label.left >= surface.left && label.right <= surface.right && label.top >= surface.top && label.bottom <= surface.bottom;
  })).toBe(true);
  const successSnackbar = page.locator('.one-ui-snackbar[role="status"]');
  await expect(successSnackbar).toContainText("Đã kết nối tất cả thiết bị.");
  await page.unroute("**/api/v1/devices/*/connect");
  await expect(page.locator(".one-ui-snackbar")).toHaveCount(1);
  await captureEvidence(page, "success-snackbar-light.png");
  await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });

  const firstDisconnect = page.getByRole("button", { name: "Ngắt kết nối", exact: true }).first();
  await firstDisconnect.click();
  let dialog = page.getByRole("dialog", { name: /Ngắt kết nối Găng mô phỏng trái/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Hủy" })).toBeFocused();
  await expect(page.locator(".app-shell")).toHaveAttribute("inert", "");
  expect(await dialog.getByRole("button").allTextContents()).toEqual(["Hủy", "Ngắt kết nối"]);
  await expectDialogActionAnatomy(page, dialog);
  expect(await dialog.getByRole("button", { name: "Ngắt kết nối" }).evaluate((element) => getComputedStyle(element, "::before").content)).toBe('"!"');
  expect(await dialog.getByRole("button", { name: "Hủy" }).evaluate((element) => element.matches(":focus-visible"))).toBe(false);
  await captureEvidence(page, "disconnect-one-dialog-light.png");
  await dialog.getByRole("button", { name: "Hủy" }).focus();
  const scrollBefore = await page.locator(".app-content").evaluate((element) => element.scrollTop);
  await page.mouse.move(20, 400);
  await page.mouse.wheel(0, 600);
  expect(await page.locator(".app-content").evaluate((element) => element.scrollTop)).toBe(scrollBefore);
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Ngắt kết nối" })).toBeFocused();
  expect(await dialog.getByRole("button", { name: "Ngắt kết nối" }).evaluate((element) => getComputedStyle(element).boxShadow)).toContain("inset");
  await captureEvidence(page, "dialog-keyboard-focus-light.png", true);
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Hủy" })).toBeFocused();
  const dialogAccessibility = await new AxeBuilder({ page }).include(".one-ui-dialog").analyze();
  expect(dialogAccessibility.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(firstDisconnect).toBeFocused();

  let disconnectCalls = 0;
  await page.route("**/api/v1/devices/*/disconnect", async (route) => {
    disconnectCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await firstDisconnect.click();
  dialog = page.getByRole("dialog", { name: /Ngắt kết nối Găng mô phỏng trái/ });
  await page.locator(".device-card .device-footer button").first().evaluate((element: HTMLButtonElement) => element.click());
  await expect(dialog).toHaveCount(1);
  expect(disconnectCalls).toBe(0);
  const confirmButton = dialog.getByRole("button", { name: "Ngắt kết nối" });
  await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const confirmWidth = (await confirmButton.boundingBox())!.width;
  await confirmButton.click();
  const pendingButton = dialog.getByRole("button", { name: "Đang ngắt kết nối" });
  await expect(pendingButton).toBeDisabled();
  await expect(pendingButton).toHaveAttribute("aria-busy", "true");
  await expect(pendingButton).toContainText("Đang ngắt…");
  await expect(dialog.getByRole("progressbar", { name: "Đang ngắt kết nối" })).toBeVisible();
  expect((await pendingButton.boundingBox())!.width).toBeCloseTo(confirmWidth, 0);
  await expect(page.locator(".device-card .device-status").first()).toContainText("Đang nhận dữ liệu");
  await expect(page.locator(".device-card .device-status").first()).not.toContainText("Đã ngắt");
  await pendingButton.evaluate((element: HTMLButtonElement) => element.click());
  await captureEvidence(page, "pending-disconnect-light.png");
  await expect(dialog).toBeHidden();
  expect(disconnectCalls).toBe(1);
  await expect(page.locator(".device-card .device-status").first()).toContainText("Đã ngắt");
  await expect(successSnackbar).toContainText("Đã ngắt kết nối Găng mô phỏng trái.");
  await page.unroute("**/api/v1/devices/*/disconnect");
  await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });

  const disconnectAll = page.getByRole("button", { name: "Ngắt tất cả" });
  await disconnectAll.click();
  dialog = page.getByRole("dialog", { name: "Ngắt kết nối tất cả?" });
  await expect(dialog).toBeVisible();
  expect(await dialog.getByRole("button").allTextContents()).toEqual(["Hủy", "Ngắt tất cả"]);
  await expectDialogActionAnatomy(page, dialog);
  await captureEvidence(page, "disconnect-all-dialog-light.png");
  await page.locator(".one-ui-dialog-layer .one-ui-overlay-scrim").click({ position: { x: 8, y: 8 } });
  await expect(dialog).toBeHidden();
  await expect(disconnectAll).toBeFocused();

  await disconnectAll.click();
  dialog = page.getByRole("dialog", { name: "Ngắt kết nối tất cả?" });
  await dialog.getByRole("button", { name: "Ngắt tất cả" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await expect(page.getByText("Chưa có nguồn dữ liệu", { exact: true })).toHaveCount(2);
  await expectNoUPlotArtifacts(page);
  await captureEvidence(page, "no-connected-source-light.png");
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await expectNoUPlotArtifacts(page);
  await captureEvidence(page, "no-connected-source-dark.png");
  await page.getByRole("button", { name: "Chuyển sang giao diện sáng" }).click();

  const checkedChannels = page.locator('.one-ui-checkbox-row input[type="checkbox"]:checked');
  while (await checkedChannels.count()) await checkedChannels.first().uncheck({ force: true });
  await expect(page.locator(".channel-title > strong")).toContainText("0/13");
  await expect(page.getByText("Chưa chọn kênh", { exact: true })).toHaveCount(2);
  await expectNoUPlotArtifacts(page);
  await captureEvidence(page, "no-channels-selected-light.png");
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await expectNoUPlotArtifacts(page);
  await captureEvidence(page, "no-channels-selected-dark.png");
  await page.getByRole("button", { name: "Chuyển sang giao diện sáng" }).click();

  await page.getByRole("button", { name: "Devices" }).click();
  await page.getByRole("button", { name: "Kết nối", exact: true }).first().click();
  await expect(successSnackbar).toContainText("Đã kết nối Găng mô phỏng trái.");
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await page.mouse.move(640, 360);
  await captureEvidence(page, "success-snackbar-dark.png");
  await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });

  await page.getByRole("button", { name: "Ngắt kết nối", exact: true }).first().click();
  dialog = page.getByRole("dialog", { name: /Ngắt kết nối Găng mô phỏng trái/ });
  await captureEvidence(page, "disconnect-one-dialog-dark.png");
  await dialog.getByRole("button", { name: "Hủy" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Ngắt kết nối" })).toBeFocused();
  expect(await dialog.getByRole("button", { name: "Ngắt kết nối" }).evaluate((element) => getComputedStyle(element).boxShadow)).toContain("inset");
  await captureEvidence(page, "dialog-keyboard-focus-dark.png", true);
  await page.keyboard.press("Escape");

  disconnectCalls = 0;
  await page.route("**/api/v1/devices/*/disconnect", async (route) => {
    disconnectCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.getByRole("button", { name: "Ngắt kết nối", exact: true }).first().click();
  dialog = page.getByRole("dialog", { name: /Ngắt kết nối Găng mô phỏng trái/ });
  const darkConfirmButton = dialog.getByRole("button", { name: "Ngắt kết nối" });
  await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const darkConfirmWidth = (await darkConfirmButton.boundingBox())!.width;
  await darkConfirmButton.click();
  const darkPendingButton = dialog.getByRole("button", { name: "Đang ngắt kết nối" });
  await expect(darkPendingButton).toContainText("Đang ngắt…");
  await expect(darkPendingButton).toHaveAttribute("aria-busy", "true");
  expect((await darkPendingButton.boundingBox())!.width).toBeCloseTo(darkConfirmWidth, 0);
  await expect(page.locator(".device-card .device-status").first()).toContainText("Đang nhận dữ liệu");
  await captureEvidence(page, "pending-disconnect-dark.png");
  await expect(dialog).toBeHidden();
  expect(disconnectCalls).toBe(1);
  await expect(page.locator(".device-card .device-status").first()).toContainText("Đã ngắt");
  await page.unroute("**/api/v1/devices/*/disconnect");
  await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });

  await page.getByRole("button", { name: "Kết nối", exact: true }).first().click();
  await expect(page.locator(".device-card .device-status").first()).toContainText("Đang nhận dữ liệu");
  await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });
  await disconnectAll.click();
  dialog = page.getByRole("dialog", { name: "Ngắt kết nối tất cả?" });
  await captureEvidence(page, "disconnect-all-dialog-dark.png");
  await page.keyboard.press("Escape");

  const sensitiveMarker = "Bearer private-session-token raw-stack-trace";
  await page.route("**/api/v1/devices/*/disconnect", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: sensitiveMarker, stack: "at local-bridge:9999" }),
    });
  });
  await page.getByRole("button", { name: "Ngắt kết nối", exact: true }).first().click();
  dialog = page.getByRole("dialog", { name: /Ngắt kết nối Găng mô phỏng trái/ });
  await dialog.getByRole("button", { name: "Ngắt kết nối" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".device-card .device-status").first()).toContainText("Đang nhận dữ liệu");
  const failedDisconnectSnackbar = page.locator('.one-ui-snackbar[role="alert"]');
  await expect(failedDisconnectSnackbar).toHaveText("Không thể ngắt kết nối Găng mô phỏng trái. Kết nối dữ liệu tạm thời không phản hồi.");
  await expect(page.locator("body")).not.toContainText(sensitiveMarker);
  await expect(page.locator("body")).not.toContainText("local-bridge:9999");
  await page.unroute("**/api/v1/devices/*/disconnect");
  await page.waitForTimeout(4400);
  await expect(failedDisconnectSnackbar).toBeVisible();
  await failedDisconnectSnackbar.getByRole("button", { name: "Đóng thông báo" }).focus();
  await page.keyboard.press("Enter");
  await expect(failedDisconnectSnackbar).toBeHidden();

  await page.route("**/api/v1/simulator/config", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: sensitiveMarker, authorization: "Bearer private-session-token" }),
    });
  });
  await page.getByRole("button", { name: "Áp dụng" }).click();
  const failureSnackbar = page.locator('.one-ui-snackbar[role="alert"]');
  await expect(failureSnackbar).toContainText("Không thể áp dụng cấu hình. Kết nối dữ liệu tạm thời không phản hồi.");
  await expect(page.locator("body")).not.toContainText(sensitiveMarker);
  await expect(page.locator("body")).not.toContainText("Bearer private-session-token");
  await page.mouse.move(640, 360);
  await captureEvidence(page, "failure-snackbar-dark.png");
  await page.getByRole("button", { name: "Chuyển sang giao diện sáng" }).click();
  await page.mouse.move(640, 360);
  await captureEvidence(page, "failure-snackbar-light.png");
  await expect(failureSnackbar.getByRole("button", { name: "Đóng thông báo" })).toBeVisible();
  await page.unroute("**/api/v1/simulator/config");
  await failureSnackbar.getByRole("button", { name: "Thử lại" }).click();
  const recoveredSnackbar = page.locator('.one-ui-snackbar[role="status"]');
  await expect(recoveredSnackbar).toContainText("Đã áp dụng cấu hình mô phỏng.");
  await recoveredSnackbar.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(recoveredSnackbar).toBeHidden();
});

test("chart instances unmount for content states and recreate without interrupting acquisition", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);
  await page.getByRole("button", { name: "Kết nối tất cả" }).click();
  await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  const monitor = page.getByTestId("live-monitor");
  await expect(page.locator(".chart-card .plot-host > .uplot")).toHaveCount(2);
  const before = Number(await monitor.getAttribute("data-total-packets"));

  for (let cycle = 0; cycle < 2; cycle += 1) {
    const checkedChannels = page.locator('.one-ui-checkbox-row input[type="checkbox"]:checked');
    while (await checkedChannels.count()) await checkedChannels.first().uncheck({ force: true });
    await expect(page.getByText("Chưa chọn kênh", { exact: true })).toHaveCount(2);
    await expectNoUPlotArtifacts(page);
    await page.locator('.one-ui-checkbox-row input[type="checkbox"]').first().check({ force: true });
    await expect(page.getByText("Chưa chọn kênh", { exact: true })).toHaveCount(0);
    await expect(page.locator(".chart-card .plot-host > .uplot")).toHaveCount(2);
  }

  await expect.poll(async () => Number(await monitor.getAttribute("data-total-packets"))).toBeGreaterThan(before);
  await expect(page.locator(".chart-card .uplot")).toHaveCount(2);
});

test("Quick Status compact sheet and snackbar timeout behavior", async ({ page }) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 800, height: 1100 });
  await openCollector(page);
  const trigger = page.getByRole("button", { name: "Quick Status", exact: true });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Quick Status" });
  const bottomNavigation = page.locator(".compact-app-navigation");
  const sheetBox = (await sheet.boundingBox())!;
  const navigationBox = (await bottomNavigation.boundingBox())!;
  expect(sheetBox.x).toBeGreaterThanOrEqual(12);
  expect(sheetBox.x + sheetBox.width).toBeLessThanOrEqual(788);
  expect(sheetBox.y + sheetBox.height).toBeLessThanOrEqual(navigationBox.y - 12);
  const sheetAccessibility = await new AxeBuilder({ page }).include(".one-ui-side-sheet").analyze();
  expect(sheetAccessibility.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);
  await captureEvidence(page, "quick-status-compact-light-800x1100.png");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
  await trigger.click();
  await captureEvidence(page, "quick-status-compact-dark-800x1100.png");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Kết nối tất cả" }).click();
  const snackbar = page.locator('.one-ui-snackbar[role="status"]');
  await expect(snackbar).toBeVisible();
  await snackbar.hover();
  await page.waitForTimeout(4400);
  await expect(snackbar).toBeVisible();
  await page.mouse.move(1, 1);
  await expect(snackbar).toBeHidden({ timeout: 5000 });

  await page.getByRole("button", { name: "Áp dụng" }).click();
  await expect(snackbar).toBeVisible();
  const snackbarDismiss = snackbar.getByRole("button", { name: "Đóng thông báo" });
  await snackbarDismiss.focus();
  await page.waitForTimeout(4400);
  await expect(snackbar).toBeVisible();
  await page.locator(".page-toolbar").click({ position: { x: 4, y: 4 } });
  await expect(snackbar).toBeHidden({ timeout: 5000 });
});

test("V.2.1 immediate sheets, browser-internal response and complete rail labels", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Network cannot be a prerequisite for these already-local surfaces.
  await page.route("**/api/**", (route) => route.abort());
  const measurements: Record<string, unknown[]> = {};
  for (const [name, selector] of [["account", "#account-panel"], ["quick-status", "#quick-status-panel"]]) {
    measurements[name] = [];
    const trigger = page.locator(`button[aria-controls="${selector.slice(1)}"]`);
    for (let index = 0; index < 12; index += 1) {
      const result = await trigger.evaluate(async (button, panelSelector) => {
        const start = performance.now();
        let focusMs: number | null = null;
        const focusListener = (event: FocusEvent) => {
          if ((event.target as HTMLElement)?.closest(panelSelector)) focusMs ??= performance.now() - start;
        };
        document.addEventListener("focusin", focusListener);
        (button as HTMLButtonElement).click();
        // React discrete-event state is committed by the microtask checkpoint.
        await Promise.resolve();
        const mountedBeforeFrame = !!document.querySelector(panelSelector);
        return await new Promise<Record<string, unknown>>((resolve) => requestAnimationFrame(() => {
          const panel = document.querySelector<HTMLElement>(panelSelector)!;
          const style = getComputedStyle(panel);
          const surfaceMs = performance.now() - start;
          const firstFrame = { opacity: style.opacity, visibility: style.visibility, display: style.display,
            background: style.backgroundColor, state: panel.dataset.state, modal: panel.getAttribute("aria-modal"),
            focused: panel.contains(document.activeElement), inert: document.querySelector<HTMLElement>(".app-shell")!.inert };
          const finish = () => {
            if (panel.dataset.state !== "open") { requestAnimationFrame(finish); return; }
            document.removeEventListener("focusin", focusListener);
            resolve({ mountedBeforeFrame, surfaceMs, focusMs, settledMs: performance.now() - start, firstFrame });
          };
          finish();
        }));
      }, selector);
      expect(result.mountedBeforeFrame).toBe(true);
      expect(result.firstFrame).toMatchObject({ opacity: "1", visibility: "visible", modal: "true", focused: true, inert: true });
      measurements[name].push({ iteration: index, temperature: index === 0 ? "cold" : "warm", ...result });
      if (index === 0) await captureReview(page, { path: path.join(artifactRoot, `${name}-settled.png`) });
      await page.keyboard.press("Escape");
      await expect(page.locator(selector)).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    for (const key of ["Enter", "Space"]) {
      await trigger.focus();
      await page.keyboard.press(key);
      await expect(page.locator(selector)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator(selector)).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    // Hold only the measured first-frame transform for review photography; the
    // unmodified 12-opening timing run above remains the performance evidence.
    const frame = await trigger.evaluate(async (button, panelSelector) => {
      (button as HTMLButtonElement).click();
      await Promise.resolve();
      return await new Promise((resolve) => requestAnimationFrame(() => {
        const panel = document.querySelector<HTMLElement>(panelSelector)!;
        const style = getComputedStyle(panel);
        const snapshot = { state: panel.dataset.state, opacity: style.opacity, transform: style.transform };
        panel.style.transform = style.transform;
        panel.style.animation = "none";
        resolve(snapshot);
      }));
    }, selector);
    await captureReview(page, { path: path.join(artifactRoot, `${name}-first-frame-held.png`) });
    await writeFile(path.join(artifactRoot, `${name}-first-frame-held.json`), JSON.stringify(frame, null, 2));
    await page.locator(selector).evaluate((panel: HTMLElement) => { panel.style.transform = ""; panel.style.animation = ""; });
    await page.keyboard.press("Escape");
    await captureReview(page, { path: path.join(artifactRoot, `${name}-closing.png`) });
    await expect(page.locator(selector)).toHaveCount(0);
    const interrupted = await trigger.evaluate(async (button, panelSelector) => {
      (button as HTMLButtonElement).click();
      await Promise.resolve();
      const opening = document.querySelector<HTMLElement>(panelSelector)?.dataset.state;
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await Promise.resolve();
      return { opening, afterEscape: document.querySelector<HTMLElement>(panelSelector)?.dataset.state };
    }, selector);
    expect(interrupted).toEqual({ opening: "opening", afterEscape: "closing" });
    await expect(page.locator(selector)).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await trigger.click();
    await expect(page.locator(selector)).toBeVisible();
    await captureReview(page, { path: path.join(artifactRoot, `${name}-reduced-motion.png`) });
    await page.keyboard.press("Escape");
    await expect(page.locator(selector)).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  await writeFile(path.join(artifactRoot, "overlay-response-measurements.json"), JSON.stringify(measurements, null, 2));
  await page.unroute("**/api/**");
  const geometry = [];
  for (const width of [1259, 1260, 1280, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 720 });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-navigation", width < 1260 ? "bottom" : "rail");
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => document.documentElement.dataset.theme = value, theme);
      const navigation = page.locator(width < 1260 ? ".compact-app-navigation" : ".landscape-app-rail");
      const account = navigation.getByRole("button", { name: "Account", exact: true });
      await expect(account.locator(".nav-destination__label")).toHaveText("Account");
      for (const selected of [false, true]) {
        if (selected) await account.click();
        await page.keyboard.press("Tab");
        await account.focus();
        const metrics = await account.evaluate((button) => {
          const label = button.querySelector<HTMLElement>(".nav-destination__label")!;
          const box = button.getBoundingClientRect();
          const labelBox = label.getBoundingClientRect();
          return { width: box.width, height: box.height, labelWidth: labelBox.width, scrollWidth: label.scrollWidth,
            centered: Math.abs((labelBox.left + labelBox.right) / 2 - (box.left + box.right) / 2),
            overflow: getComputedStyle(label).overflow, textOverflow: getComputedStyle(label).textOverflow,
            selected: button.classList.contains("is-selected"), focusVisible: button.matches(":focus-visible") };
        });
        expect(metrics.selected).toBe(selected);
        expect(metrics.focusVisible).toBe(true);
        if (width >= 1260) {
          expect(metrics.width).toBe(54);
          expect(metrics.height).toBe(await page.locator(".app-shell").getAttribute("data-page") === "devices" ? 74 : 62);
          expect(metrics.scrollWidth).toBeLessThanOrEqual(Math.ceil(metrics.labelWidth));
          expect(metrics.textOverflow).toBe("clip");
          expect(metrics.centered).toBeLessThan(1);
          expect((await navigation.boundingBox())!.width).toBe(88);
        }
        geometry.push({ viewportWidth: width, theme, ...metrics });
        await captureReview(page, { path: path.join(artifactRoot, `rail-${width}-${theme}-${selected ? "selected" : "unselected"}-focus.png`) });
      }
      await navigation.getByRole("button", { name: "Devices", exact: true }).click();
    }
  }
  await writeFile(path.join(artifactRoot, "rail-label-measurements.json"), JSON.stringify(geometry, null, 2));
});

test("V.2 overlay exit lifecycle, dismiss policy and reduced motion", async ({ page }) => {
  test.setTimeout(60_000);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });

  const trigger = page.getByRole("button", { name: "Quick Status", exact: true });
  await trigger.click();
  const layer = page.locator(".one-ui-side-sheet-layer");
  const sheet = page.getByRole("dialog", { name: "Quick Status" });
  await expect(layer).toHaveAttribute("data-state", "open");
  await page.waitForTimeout(60);
  await captureReview(page, { path: path.join(artifactRoot, "motion-sheet-entering-normal.png") });
  await page.waitForTimeout(240);
  await captureReview(page, { path: path.join(artifactRoot, "motion-sheet-settled-normal.png") });
  const normalMotion = await sheet.evaluate((element) => ({
    transitionDuration: getComputedStyle(element).transitionDuration,
    transitionTimingFunction: getComputedStyle(element).transitionTimingFunction,
  }));
  await page.keyboard.press("Escape");
  await expect(layer).toHaveAttribute("data-state", "closing");
  const focusDuringExit = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  expect(focusDuringExit).not.toBe("Quick Status");
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(40);
  await captureReview(page, { path: path.join(artifactRoot, "motion-sheet-exiting-normal.png") });
  await expect(sheet).toBeHidden({ timeout: 1000 });
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".one-ui-side-sheet-layer")).toHaveCount(0, { timeout: 1000 });
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(layer).toHaveAttribute("data-state", "open");
  await sheet.getByRole("button", { name: "Đóng" }).evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(page.locator(".one-ui-side-sheet-layer")).toHaveCount(0, { timeout: 1000 });
  await expect(trigger).toBeFocused();

  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await trigger.click();
  await expect(layer).toHaveAttribute("data-state", "open");
  const reducedMotion = await sheet.evaluate((element) => ({
    transitionDuration: getComputedStyle(element).transitionDuration,
    transform: getComputedStyle(element).transform,
  }));
  await captureReview(page, { path: path.join(artifactRoot, "motion-sheet-open-reduced.png") });
  await page.keyboard.press("Escape");
  await expect(page.locator(".one-ui-side-sheet-layer")).toHaveCount(0, { timeout: 500 });
  await expect(trigger).toBeFocused();
  await captureReview(page, { path: path.join(artifactRoot, "motion-sheet-closed-reduced.png") });

  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Kết nối tất cả" }).click();
  const success = page.locator('.one-ui-snackbar[role="status"]');
  await expect(success.getByRole("button", { name: "Đóng thông báo" })).toBeVisible();
  const successDismiss = success.getByRole("button", { name: "Đóng thông báo" });
  await successDismiss.focus();
  const snackbarClosingState = await successDismiss.evaluate(async (button: HTMLButtonElement) => {
    button.click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return button.closest<HTMLElement>(".one-ui-snackbar")?.dataset.state;
  });
  expect(snackbarClosingState).toBe("closing");
  await expect(success).toBeHidden();

  expect(runtimeErrors).toEqual([]);
  await writeFile(
    path.join(artifactRoot, "motion-computed-values.json"),
    `${JSON.stringify({ normalMotion, reducedMotion }, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(artifactRoot, "runtime-console-errors.json"),
    `${JSON.stringify({ errors: runtimeErrors, result: "PASS" }, null, 2)}\n`,
    "utf8",
  );
});

test("V.2 forced colors, grayscale redundancy and helper text floor", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openCollector(page);
  await page.getByRole("button", { name: "Kết nối tất cả" }).click();
  await page.locator(".one-ui-snackbar__dismiss").click();
  await page.getByRole("button", { name: "Monitor", exact: true }).click();

  const helperSizes = await page.locator(".section-context, .channel-title p, .channel-panel legend, .chart-card header p, .signal, .one-ui-checkbox-row__meta").evaluateAll(
    (elements) => elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  );
  expect(helperSizes.length).toBeGreaterThan(0);
  expect(Math.min(...helperSizes)).toBeGreaterThanOrEqual(11);

  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce", forcedColors: "active" });
  await expect(page.locator(".hand-mark.left").first()).toContainText("L");
  await expect(page.locator(".hand-mark.right").first()).toContainText("R");
  expect(await page.locator(".hand-mark.right").first().evaluate((element) => getComputedStyle(element).borderStyle)).toBe("dashed");
  await captureEvidence(page, "forced-colors-live-1280x720.png");
  const forcedColorAxe = await new AxeBuilder({ page }).analyze();
  expect(forcedColorAxe.violations.filter((item) => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);

  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce", forcedColors: "none" });
  await page.addStyleTag({ content: "html { filter: grayscale(1); }" });
  await expect(page.locator(".chart-card[data-hand='left'] .hand-mark")).toContainText("L");
  await expect(page.locator(".chart-card[data-hand='right'] .hand-mark")).toContainText("R");
  expect(await page.locator(".chart-card[data-hand='right'] .hand-mark").evaluate((element) => getComputedStyle(element).borderStyle)).toBe("dashed");
  await captureEvidence(page, "grayscale-live-1280x720.png");
});

test("V.2 accessibility inventory retains every axe manual-review target", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce", forcedColors: "none" });
  await page.goto(`/#api=${encodeURIComponent(`http://127.0.0.1:${port}`)}&token=${encodeURIComponent(token)}`);

  const scans: Array<Record<string, unknown>> = [];
  const scan = async (state: string, include?: string) => {
    let builder = new AxeBuilder({ page });
    if (include) builder = builder.include(include);
    const result = await builder.analyze();
    expect(result.violations).toEqual([]);
    scans.push({
      state,
      passes: result.passes.length,
      violations: result.violations,
      incomplete: result.incomplete.map((rule) => ({
        id: rule.id,
        impact: rule.impact,
        help: rule.help,
        nodes: rule.nodes.map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
          checks: [...node.any, ...node.all, ...node.none].map((check) => ({
            id: check.id,
            message: check.message,
            data: check.data,
          })),
        })),
      })),
    });
  };

  const authState = await page.locator(".auth-stage").getAttribute("data-screen");
  await scan(`authentication: ${authState ?? "initial"}`, ".auth-stage");
  await page.goto("about:blank");
  await openCollector(page);
  await scan("device manager", "[data-testid='device-manager']");

  await page.getByRole("button", { name: "Kết nối tất cả" }).click();
  await page.locator(".one-ui-snackbar__dismiss").click();
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await scan("live monitor", "[data-testid='live-monitor']");

  await page.locator(".quick-status-button").click();
  await scan("quick status", ".one-ui-side-sheet");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Account", exact: true }).click();
  await scan("administrator user list", ".user-management");
  await page.getByRole("button", { name: "Tạo tài khoản", exact: true }).click();
  await scan("create-user sheet", ".one-ui-side-sheet");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await page.setViewportSize({ width: 640, height: 360 });
  await scan("effective 200 percent live monitor", "[data-testid='live-monitor']");

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce", forcedColors: "active" });
  await scan("forced colors live monitor", "[data-testid='live-monitor']");

  await writeFile(
    path.join(artifactRoot, "accessibility-axe-inventory.json"),
    `${JSON.stringify({ engine: "axe-core via Playwright", scans }, null, 2)}\n`,
    "utf8",
  );
});

test("production bundle excludes Samsung code, assets and fonts", async () => {
  const bundle = (await readBundleText(path.join(repoRoot, "app", "desktop_collector", "web", "build"))).toLowerCase();
  expect(bundle).not.toContain("samsung.com");
  expect(bundle).not.toContain("samsungone");
  expect(bundle).not.toContain("samsung sharp sans");
  expect(bundle).not.toContain("one-ui-master.svg");
  expect(bundle).not.toContain("one-ui-secondary.svg");
});

test("frozen chart and rail breakpoints remain exact around 899/900 and 1259/1260", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 899, height: 700 });
  await openCollector(page);
  await page.getByRole("button", { name: "Kết nối tất cả" }).click();
  await page.locator(".one-ui-snackbar__dismiss").click();
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  const measurements: Array<Record<string, unknown>> = [];

  for (const viewport of [
    { width: 899, height: 700 },
    { width: 900, height: 700 },
    { width: 1259, height: 720 },
    { width: 1260, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await resetReviewViewport(page);
    await expectAdaptiveShell(page, viewport);
    await expectDominantLiveCharts(page, viewport);
    const measured = await page.evaluate(() => {
      const rect = (selector: string) => {
        const box = document.querySelector(selector)?.getBoundingClientRect();
        return box ? { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom } : null;
      };
      return {
        navigation: document.querySelector(".app-shell")?.getAttribute("data-navigation"),
        appBar: rect(".one-ui-top-app-bar"),
        rail: rect(".landscape-app-rail"),
        bottomNavigation: rect(".compact-app-navigation"),
        chartCards: Array.from(document.querySelectorAll(".chart-card"), (element) => {
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom };
        }),
      };
    });
    expect(measured.appBar?.height).toBe(76);
    measurements.push({ viewport, ...measured });
    await captureEvidence(page, `breakpoint-${viewport.width}x${viewport.height}-light.png`);
  }

  await writeFile(
    path.join(artifactRoot, "frozen-breakpoint-measurements.json"),
    `${JSON.stringify({ measurements }, null, 2)}\n`,
    "utf8",
  );
});

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 800, height: 1100 },
]) {
  test(`review captures ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openCollector(page);
    await page.getByRole("button", { name: "Kết nối tất cả" }).click();
    await expect(page.locator('.device-status[data-tone="positive"]')).toHaveCount(2);
    await expect(page.locator(".one-ui-snackbar")).toBeVisible();
    await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });
    const size = `${viewport.width}x${viewport.height}`;
    const isPortraitFlow = viewport.width < 900;
    await resetReviewViewport(page);
    await expectNoPageOverflow(page);
    await expectAdaptiveShell(page, viewport);
    await expectRefinedTabletGeometry(page, viewport);
    await expectDeviceSourceAnatomy(page);
    await expectSimulatorBandFits(page, !isPortraitFlow);
    const deviceMeasurements = await captureLayoutMeasurements(page);
    await captureEvidence(page, `device-manager-light-${size}.png`);
    if (viewport.width === 1440) {
      await captureReview(page.locator(".landscape-app-rail"), { path: path.join(artifactRoot, "landscape-app-rail-light.png") });
      await page.getByRole("button", { name: "Devices", exact: true }).focus();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Monitor", exact: true })).toBeFocused();
      expect(await page.getByRole("button", { name: "Monitor", exact: true }).evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
      await captureReview(page.locator(".landscape-app-rail"), { path: path.join(artifactRoot, "landscape-app-rail-focus-visible-light.png") });
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await captureTopChromeEvidence(page, "top-app-bar-light.png");
      await page.getByRole("button", { name: "Quick Status", exact: true }).click();
      await expectSingleThemeControl(page);
      await expectContrast(page.locator(".quick-rate"));
      await captureEvidence(page, `quick-status-light-${size}.png`);
      await page.keyboard.press("Escape");
    }
    if (viewport.width === 800) {
      await captureReview(page.locator(".compact-app-navigation"), { path: path.join(artifactRoot, "compact-app-navigation-light.png") });
    }
    await page.getByRole("button", { name: "Monitor", exact: true }).click();
    await expect.poll(async () => Number(await page.getByTestId("live-monitor").getAttribute("data-total-packets"))).toBeGreaterThan(10);
    await page.waitForTimeout(900);
    await resetReviewViewport(page);
    await expectNoPageOverflow(page);
    await expectAdaptiveShell(page, viewport);
    await expectDominantLiveCharts(page, viewport);
    const liveMeasurements = await captureLayoutMeasurements(page);
    expectSourceDeviceAndFrozenMonitorGeometry(size, deviceMeasurements, liveMeasurements);
    await writeFile(
      path.join(artifactRoot, `layout-measurements-${size}.json`),
      `${JSON.stringify({ viewport, deviceManager: deviceMeasurements, liveMonitor: liveMeasurements }, null, 2)}\n`,
      "utf8",
    );
    await captureEvidence(page, `live-monitor-light-${size}.png`);
    if (viewport.width === 1280) {
      const liveControls = page.locator(".live-control-bar");
      const restoreLive = page.getByRole("button", { name: "Về dữ liệu mới nhất" });
      await captureReview(liveControls, { path: path.join(artifactRoot, "live-controls-following-light.png") });
      await page.locator(".plot-host").first().dispatchEvent("wheel", { deltaY: 120 });
      await expect(restoreLive).toBeEnabled();
      await captureReview(liveControls, { path: path.join(artifactRoot, "live-controls-not-following-light.png") });
      await page.getByRole("button", { name: "60s" }).focus();
      await page.keyboard.press("Tab");
      await expect(restoreLive).toBeFocused();
      expect(await restoreLive.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
      await captureReview(liveControls, { path: path.join(artifactRoot, "live-controls-focus-visible-light.png") });
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.getByRole("button", { name: "Tạm dừng biểu đồ" }).click();
      await captureReview(liveControls, { path: path.join(artifactRoot, "live-controls-paused-light.png") });
      await page.getByRole("button", { name: "Tiếp tục biểu đồ" }).click();
      await restoreLive.click();
      await expect(restoreLive).toBeDisabled();
    }

    await page.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await resetReviewViewport(page);
    await expectNoPageOverflow(page);
    await expectAdaptiveShell(page, viewport);
    await expectDominantLiveCharts(page, viewport);
    await captureEvidence(page, `live-monitor-dark-${size}.png`);
    if (viewport.width === 1280) {
      const liveControls = page.locator(".live-control-bar");
      const restoreLive = page.getByRole("button", { name: "Về dữ liệu mới nhất" });
      await captureReview(liveControls, { path: path.join(artifactRoot, "live-controls-following-dark.png") });
      await page.locator(".plot-host").first().dispatchEvent("wheel", { deltaY: 120 });
      await expect(restoreLive).toBeEnabled();
      await captureReview(liveControls, { path: path.join(artifactRoot, "live-controls-not-following-dark.png") });
      await page.getByRole("button", { name: "Tạm dừng biểu đồ" }).click();
      await captureReview(liveControls, { path: path.join(artifactRoot, "live-controls-paused-dark.png") });
      await page.getByRole("button", { name: "Tiếp tục biểu đồ" }).click();
      await restoreLive.click();
      await expect(restoreLive).toBeDisabled();
    }
    await page.getByRole("button", { name: "Devices" }).click();
    await resetReviewViewport(page);
    await expectNoPageOverflow(page);
    await expectRefinedTabletGeometry(page, viewport);
    await expectSimulatorBandFits(page, !isPortraitFlow);
    await expectDeviceSourceAnatomy(page);
    await captureEvidence(page, `device-manager-dark-${size}.png`);
    if (viewport.width === 1440) {
      await captureReview(page.locator(".landscape-app-rail"), { path: path.join(artifactRoot, "landscape-app-rail-dark.png") });
      await captureTopChromeEvidence(page, "top-app-bar-dark.png");
      await page.getByRole("button", { name: "Quick Status", exact: true }).click();
      await expectSingleThemeControl(page);
      await expectContrast(page.locator(".quick-rate"));
      await captureEvidence(page, `quick-status-dark-${size}.png`);
      await page.keyboard.press("Escape");
    }
    if (viewport.width === 800) {
      await captureReview(page.locator(".compact-app-navigation"), { path: path.join(artifactRoot, "compact-app-navigation-dark.png") });
    }
  });
}

test("200% effective zoom keeps shell navigation and content reachable", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await openCollector(page);
  await expectAdaptiveShell(page, { width: 640, height: 360 });
  await expectNoPageOverflow(page);
  await expect(page.getByRole("button", { name: "Devices" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Monitor", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await expect(page.getByTestId("live-monitor")).toBeVisible();
  await expect(page.locator(".one-ui-checkbox-row input")).toHaveCount(13);
  await captureEvidence(page, "effective-200-percent-light-640x360.png");
});

test("One UI 9 Device Manager source anatomy and production review", async ({ page }) => {
  test.setTimeout(120_000);
  const evidenceRoot = path.join(repoRoot, ".design-cache/artifacts/one-ui9-device-manager");
  await mkdir(evidenceRoot, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCollector(page);
  await page.getByRole("button", { name: "Kết nối tất cả", exact: true }).click();
  await expect(page.locator('.device-status[data-tone="positive"]')).toHaveCount(2);
  await expect(page.locator(".one-ui-snackbar")).toBeHidden({ timeout: 6_000 });
  const results = [];
  const comparison: Record<string, string> = {};
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 800, height: 1100 }, { width: 640, height: 360 }]) {
    await page.setViewportSize(viewport);
    for (const theme of ["light", "dark"]) {
      if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByTestId("theme-control").click();
      await resetReviewViewport(page);
      const anatomy = await expectDeviceSourceAnatomy(page);
      await expectNoPageOverflow(page);
      await expectSingleThemeControl(page);
      const layout = await captureLayoutMeasurements(page);
      const axe = await new AxeBuilder({ page }).analyze();
      results.push({ viewport, theme, anatomy, layout, violations: axe.violations, incomplete: axe.incomplete });
      // Persist each completed state even when a later assertion fails.
      await persistFile(path.join(evidenceRoot, "device-review.json"), JSON.stringify(results, null, 2));
      expect(axe.violations).toEqual([]);
      if (process.env.ONE_UI9_REVIEW === "1") await page.screenshot({ path: path.join(evidenceRoot, `devices-${viewport.width}x${viewport.height}-${theme}.png`) });
      if (viewport.width === 1440 && process.env.ONE_UI9_REVIEW === "1") {
        comparison[`card-${theme}`] = (await page.locator(".device-card").first().screenshot()).toString("base64");
        comparison[`actions-${theme}`] = (await page.locator(".heading-actions").screenshot()).toString("base64");
      }
      const seed = page.getByLabel("Giá trị khởi tạo (seed)");
      await seed.focus();
      await expect(seed).toBeInViewport();
      expect(await seed.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
      const apply = page.getByRole("button", { name: "Áp dụng", exact: true });
      await apply.focus();
      await expect(apply).toBeInViewport();
      const fieldFits = await page.locator(".one-ui-text-field input").evaluateAll((inputs) => inputs.every((input) => input.scrollWidth <= input.clientWidth + 1));
      expect(fieldFits).toBe(true);
      await expectSimulatorBandFits(page, false);
      if (viewport.width === 1440 && process.env.ONE_UI9_REVIEW === "1") await page.screenshot({ path: path.join(evidenceRoot, `devices-settings-${theme}.png`) });
    }
  }
  if (process.env.ONE_UI9_REVIEW === "1") {
    const sourceContainers = (await readFile(path.join(evidenceRoot, "source-containers.png"))).toString("base64");
    const sourceButtons = (await readFile(path.join(evidenceRoot, "source-buttons.png"))).toString("base64");
    // Compose untouched captures at natural CSS-pixel size. No recreated source,
    // stretched bitmap, or claim of matching the kit's proprietary font/glyphs.
    await page.setViewportSize({ width: 1550, height: 1100 });
    await page.setContent(`<html><head><style>
      *{box-sizing:border-box}body{margin:0;padding:20px;background:#e9e9ee;color:#17171a;font:14px/1.5 "Segoe UI",sans-serif}
      h1{font-size:22px;margin:0 0 6px}h2{font-size:16px;margin:14px 0 8px}p{margin:0 0 16px}
      .comparison{display:grid;grid-template-columns:846px 1fr;gap:20px;align-items:start}img{display:block;max-width:none;margin:0 0 12px}
      </style></head><body><h1>Device Manager — source comparison · 1 CSS px = 1 image pixel</h1>
      <p>Left: exact Figma node exports. Right: actual production UI captures. Segoe UI and product glyphs are disclosed desktop adaptations.</p>
      <div class="comparison"><section><h2>Containers · 247:613 · light / dark</h2><img src="data:image/png;base64,${sourceContainers}">
      <h2>Buttons · 1497:12222 · demonstration frame included</h2><img src="data:image/png;base64,${sourceButtons}"></section>
      <section><h2>Glove container · light</h2><img src="data:image/png;base64,${comparison["card-light"]}">
      <h2>Glove container · dark</h2><img src="data:image/png;base64,${comparison["card-dark"]}">
      <h2>Actual actions · light</h2><img src="data:image/png;base64,${comparison["actions-light"]}">
      <h2>Actual actions · dark</h2><img src="data:image/png;base64,${comparison["actions-dark"]}"></section></div></body></html>`);
    await page.locator("img").evaluateAll((images) => Promise.all(images.map((element) => (element as HTMLImageElement).decode())));
    await page.screenshot({ path: path.join(evidenceRoot, "source-comparison.png"), fullPage: true });
  }
});

test("builds bounded production review contact sheets", async ({ page }) => {
  test.skip(process.env.PRODUCTION_REVIEW !== "1", "Review output is enabled only for the final evidence run.");
  test.setTimeout(90_000);
  for (const group of reviewGroups) {
    const tiles = group.files.map((filename) => {
      const buffer = reviewImages.get(filename);
      expect(buffer, `Current-run capture missing: ${filename}`).toBeDefined();
      return `<figure><figcaption>${filename.replace(".png", "").replaceAll("-", " ")}</figcaption><img src="data:image/png;base64,${buffer!.toString("base64")}"></figure>`;
    });
    // Keep each captured CSS pixel intact; the comparison sheet must not downsample type.
    await page.setViewportSize({ width: 3000, height: 900 });
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;padding:24px;background:#ececf0;color:#17171a;font:14px/1.5 "Segoe UI",sans-serif}
      h1{font-size:24px;margin:0 0 20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
      figure{margin:0;padding:12px;background:white;border-radius:16px;min-width:0}
      figcaption{margin-bottom:10px}img{display:block;max-width:100%;height:auto}
    </style><h1>Production One UI V.3 · ${group.filename.replace("review-", "").replace(".png", "")}</h1><div class="grid">${tiles.join("")}</div>`);
    await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
    await page.screenshot({ path: path.join(artifactRoot, group.filename), fullPage: true });
  }
  await persistFile(path.join(artifactRoot, "verification-data.json"), JSON.stringify(reviewReports, null, 2));
});
