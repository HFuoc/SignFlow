import { randomBytes } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { test, expect, type Page, type WebSocket } from "@playwright/test";

// Actual application and isolated, authenticated simulator. Credentials remain in
// RAM: no URL bootstrap, saved browser state or production database is used.
test.use({ trace: "off", screenshot: "off" });
const root = path.resolve(import.meta.dirname, "../../../..");
const token = randomBytes(32).toString("base64url");
const administratorPassword = randomBytes(24).toString("base64url");
let bridge: ChildProcessWithoutNullStreams;
let apiOrigin: string, cookie: string;
let bridgeErrors = "";
const sockets = new Map<Page, Set<WebSocket>>();

test("profile edits and avatar persist without replacing the session", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
  if (await page.locator("html").getAttribute("data-theme") !== "dark") await page.getByTestId("theme-control").click();
  await page.setViewportSize({ width: 1280, height: 720 });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const originalCookie = (await page.context().cookies(apiOrigin)).find(c => c.name === "smartglove_user_session")!.value;
  await page.getByRole("button", { name: /^Account:/ }).click();
  await expect.poll(() => page.locator("#account-panel").evaluate(e => e.getAnimations().length)).toBe(0);
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Nguyễn Văn An");
  await page.getByLabel("Contact email", { exact: true }).fill("an@example.test");
  await page.getByLabel("Organization / team", { exact: true }).fill("Gesture research");
  await page.locator('#account-panel input[type="file"]').setInputFiles(path.join(root, "app/desktop_collector/web/src/assets/one-ui/figma/account-avatar.png"));
  await expect(page.getByRole("button", { name: "Remove avatar", exact: true })).toBeVisible();
  const out = path.join(root, ".design-cache/account-motion-20261004/verified"); await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, "profile-editor-dark-1280.png") });
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  await expect(page.locator("#account-panel")).toContainText("Nguyễn Văn An");
  await expect(page.locator("#account-panel")).toContainText("Gesture research");
  await expect(page.getByRole("button", { name: "Edit profile", exact: true })).toBeFocused();
  const image = page.locator("#account-panel .account-profile__avatar");
  await expect(image).toHaveAttribute("data-custom", "true");
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(256);
  expect((await page.context().cookies(apiOrigin)).find(c => c.name === "smartglove_user_session")!.value).toBe(originalCookie);
  await page.screenshot({ path: path.join(out, "profile-saved-dark-1280.png") });
  await page.getByRole("button", { name: "Back from Account", exact: true }).click();
  await expect(page.locator("#account-panel")).toHaveCount(0);
  await page.getByTestId("theme-control").click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: /^Account:/ }).click();
  await expect.poll(() => page.locator("#account-panel").evaluate(e => e.getAnimations().length)).toBe(0);
  await expect(page.locator("#account-panel")).toContainText("an@example.test");
  await page.screenshot({ path: path.join(out, "profile-light-1440.png") });
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page.getByRole("button", { name: "Remove avatar", exact: true }).click();
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  await expect(image).toHaveAttribute("data-custom", "false");
  expect(errors).toEqual([]);
});

test("Quick Status has one continuous page motion, reversible close and keyboard return", async ({ page }) => {
  await open(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const frames = await page.evaluate(async () => {
    const trigger = document.querySelector<HTMLButtonElement>('button[aria-label="Quick Status"]')!;
    const frames: Array<{ x: number; count: number; opacity: string; animations: number }> = [];
    trigger.click();
    const start = performance.now();
    await new Promise<void>(resolve => {
      function sample(now: number) {
        const page = document.getElementById("quick-status-panel");
        if (page) frames.push({ x: page.getBoundingClientRect().x, count: document.querySelectorAll(".quick-status-content").length,
          opacity: getComputedStyle(page).opacity, animations: page.getAnimations().length });
        if (now - start < 470) requestAnimationFrame(sample); else resolve();
      }
      requestAnimationFrame(sample);
    });
    return frames;
  });
  expect(frames.length).toBeGreaterThan(8);
  expect(frames.every(f => f.count === 1 && f.opacity === "1" && f.animations <= 1)).toBe(true);
  expect(frames.every((f, i) => i === 0 || f.x <= frames[i - 1].x + 1)).toBe(true);
  expect(frames.at(-1)!.x).toBeLessThan(1);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(70);
  const before = await page.locator("#quick-status-panel").evaluate(e => e.getBoundingClientRect().x);
  await page.getByRole("button", { name: "Quick Status", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
  const after = await page.locator("#quick-status-panel").evaluate(e => e.getBoundingClientRect().x);
  expect(after).toBeLessThan(before + 150);
  await expect.poll(() => page.locator("#quick-status-panel").evaluate(e => e.getBoundingClientRect().x)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#quick-status-panel")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Quick Status", exact: true })).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.getByRole("button", { name: "Quick Status", exact: true }).click();
  expect(await page.locator("#quick-status-panel").evaluate(e => e.getAnimations().length)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#quick-status-panel")).toHaveCount(0);
});

test("Participant can edit their own profile on a narrow layout without collector access", async ({ page }) => {
  await open(page);
  const password = randomBytes(24).toString("base64url");
  await page.evaluate(async ({ apiOrigin, token, password }) => {
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    async function request(path: string, body: object) {
      const response = await fetch(apiOrigin + path, { method: "POST", credentials: "include", headers, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(`Test account HTTP ${response.status}`);
    }
    await request("/api/v1/admin/users", { username: "profile-participant", password, role: "participant" });
    await request("/api/v1/auth/logout", {});
  }, { apiOrigin, token, password });
  await page.getByLabel("Username", { exact: true }).waitFor();
  await page.getByLabel("Username", { exact: true }).fill("profile-participant");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByLabel("Current password", { exact: true }).fill(password);
  await page.getByLabel("New password", { exact: true }).fill(password + "new");
  await page.getByLabel("Confirm new password", { exact: true }).fill(password + "new");
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.getByRole("button", { name: "Manage my profile", exact: true }).click();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Participant profile");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.locator("#account-panel")).toContainText("Participant profile");
  await expect(page.locator("#account-panel .role-permissions")).toContainText("Not allowed");
  expect(await page.locator("#account-panel").evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  await page.screenshot({ path: path.join(root, ".design-cache/account-motion-20261004/verified/participant-narrow.png") });
  await page.getByRole("button", { name: "Back from Account", exact: true }).click();
  await expect(page.getByRole("button", { name: "Manage my profile", exact: true })).toBeFocused();
  await expect(page.getByTestId("device-manager")).toHaveCount(0);
  const response = await fetch(`${apiOrigin}/api/v1/auth/login`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Origin: "http://127.0.0.1:5173" },
    body: JSON.stringify({ username: "system-review", password: administratorPassword }),
  });
  expect(response.status).toBe(200);
  cookie = response.headers.get("set-cookie")!.match(/smartglove_user_session=([^;]+)/)![1];
});

test.beforeAll(async () => {
  bridge = spawn(path.join(root, ".venv/Scripts/python.exe"), ["-m", "app.desktop_collector.shell", "--e2e-server", "--dev", "--vite-origin", "http://127.0.0.1:5173"], { cwd: root, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  bridgeErrors = "";
  bridge.stderr.on("data", chunk => { bridgeErrors = (bridgeErrors + String(chunk)).slice(-4000).replaceAll(token, "[redacted]"); });
  const port = await new Promise<number>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error("Bridge startup timeout")), 15000);
    bridge.stdout.on("data", chunk => {
      output += String(chunk);
      const match = output.match(/PORT=(\d+)/);
      if (match) { clearTimeout(timer); resolve(Number(match[1])); }
    });
    bridge.once("exit", code => { clearTimeout(timer); reject(new Error(`Bridge exit ${code}`)); });
    bridge.stdin.write(`${token}\n`);
  });
  apiOrigin = `http://127.0.0.1:${port}`;
  const password = administratorPassword;
  const response = await fetch(`${apiOrigin}/api/v1/auth/setup`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Origin: "http://127.0.0.1:5173" },
    body: JSON.stringify({ username: "system-review", display_name: "System review", password, password_confirmation: password }),
  });
  expect(response.status).toBe(201);
  cookie = response.headers.get("set-cookie")!.match(/smartglove_user_session=([^;]+)/)![1];
});

test.afterEach(async ({ page }) => {
  const closing = [...(sockets.get(page) ?? [])].filter(socket => !socket.isClosed())
    .map(socket => socket.waitForEvent("close", { timeout: 5000 }));
  await page.evaluate(() => (window as any).__unmountReview?.());
  await Promise.all(closing);
  sockets.delete(page);
});

test.afterAll(async () => {
  if (bridge?.exitCode === null) {
    const stopped = new Promise(resolve => bridge.once("exit", resolve));
    bridge.stdin.end("STOP\n");
    await Promise.race([stopped, new Promise(resolve => setTimeout(resolve, 15000))]);
    if (bridge.exitCode === null) bridge.kill();
    expect(bridge.exitCode, bridgeErrors).toBe(0);
  }
});

async function open(page: Page) {
  const active = new Set<WebSocket>();
  sockets.set(page, active);
  page.on("websocket", socket => {
    if (new URL(socket.url()).host === new URL(apiOrigin).host) active.add(socket);
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.context().addCookies([{ name: "smartglove_user_session", value: cookie, url: apiOrigin, httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/src/main.tsx*", route => route.fulfill({ contentType: "application/javascript", body: `import React from '/node_modules/.vite/deps/react.js'; import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js'; import {App} from '/src/App.tsx'; import {BridgeClient} from '/src/api.ts'; import '/src/styles.css'; import '/node_modules/uplot/dist/uPlot.min.css'; window.__mountReview=c=>{const root=ReactDOM.createRoot(document.getElementById('root'));const bridge=new BridgeClient(c);window.__unmountReview=()=>{root.unmount();bridge.dispose();};root.render(React.createElement(App,{bridge}));};` }));
  await page.goto("/");
  await page.waitForFunction(() => typeof (window as any).__mountReview === "function");
  await page.evaluate(c => { (window as any).__mountReview(c); delete (window as any).__mountReview; }, { apiOrigin, token });
  await expect(page.getByTestId("device-manager")).toBeVisible();
  await page.getByLabel("Packet loss", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator(".runtime-now-bar")).toHaveAttribute("data-state", "live");
  await expect.poll(() => page.locator(".runtime-now-bar").evaluate(e => e.getAnimations({ subtree: true }).length)).toBe(0);
}

for (const timing of ["stylesheet", "seconds"] as const) {
  test(`live notification spreads visible travel across the motion with ${timing} durations`, async ({ page }) => {
    await open(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const movements = await page.evaluate(async timing => {
      const surface = document.querySelector<HTMLElement>(".runtime-now-bar")!;
      if (timing === "seconds") {
        // Production CSS minification can express millisecond tokens in seconds.
        surface.style.setProperty("--now-open-duration", ".64s");
        surface.style.setProperty("--now-close-duration", ".52s");
      }
      const button = surface.querySelector<HTMLButtonElement>(".runtime-now-bar__summary")!;
      const clip = surface.querySelector<HTMLElement>(".runtime-now-bar__clip")!;
      const move = async (targetPhase: "open" | "collapsed") => {
        const start = performance.now();
        const read = () => {
          const { left, top, width, height } = surface.getBoundingClientRect();
          return { time: performance.now() - start, left, top, width, height,
            overflow: getComputedStyle(clip).overflowY };
        };
        const frames = [read()];
        button.click();
        await new Promise<void>(resolve => {
          const sample = () => {
            frames.push(read());
            if (surface.dataset.phase === targetPhase || performance.now() - start > 1800) resolve();
            else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        return { frames, phase: surface.dataset.phase };
      };
      return { opening: await move("open"), closing: await move("collapsed") };
    }, timing);
    for (const [direction, movement] of Object.entries(movements)) {
      expect(movement.phase).toBe(direction === "opening" ? "open" : "collapsed");
      const { frames } = movement;
      expect(frames.every(frame => frame.overflow === "hidden")).toBe(true);
      for (const dimension of ["left", "top", "width", "height"] as const) {
        const start = frames[0][dimension], finish = frames.at(-1)![dimension];
        const sign = Math.sign(finish - start);
        expect(Math.abs(finish - start)).toBeGreaterThan(1);
        expect(frames.every((frame, index) => frame[dimension] >= Math.min(start, finish) - 1
          && frame[dimension] <= Math.max(start, finish) + 1
          && (index === 0 || sign * (frame[dimension] - frames[index - 1][dimension]) >= -1))).toBe(true);
      }
      // Measure the rendered 10%-90% travel, not a CSS duration or animation state.
      // A long settling tail must not conceal a near-instant visible expansion.
      for (const dimension of ["width", "height"] as const) {
        const start = frames[0][dimension], distance = frames.at(-1)![dimension] - start;
        const progress = frames.map(frame => ({ time: frame.time, value: (frame[dimension] - start) / distance }));
        const crossing = (threshold: number) => {
          const index = progress.findIndex(frame => frame.value >= threshold);
          expect(index).toBeGreaterThan(0);
          const previous = progress[index - 1], current = progress[index];
          return previous.time + (current.time - previous.time)
            * (threshold - previous.value) / (current.value - previous.value);
        };
        expect(crossing(.9) - crossing(.1)).toBeGreaterThan(direction === "opening" ? 280 : 230);
      }
    }
  });
}

test("live notification keeps its rounded clip through reversals and returns focus", async ({ page }) => {
  await open(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const result = await page.evaluate(async () => {
    const surface = document.querySelector<HTMLElement>(".runtime-now-bar")!;
    const button = surface.querySelector<HTMLButtonElement>(".runtime-now-bar__summary")!;
    const clip = surface.querySelector<HTMLElement>(".runtime-now-bar__clip")!;
    const samples: Array<{ height: number; overflow: string; font: string; compact: number; detail: number }> = [];
    const sample = async (duration: number) => {
      const start = performance.now();
      await new Promise<void>(resolve => {
        const frame = (now: number) => {
          samples.push({ height: surface.getBoundingClientRect().height, overflow: getComputedStyle(clip).overflowY, font: getComputedStyle(surface.querySelector(".runtime-now-bar__rate")!).fontSize,
            compact: Number(getComputedStyle(surface.querySelector(".runtime-now-bar__compact")!).opacity),
            detail: Number(getComputedStyle(surface.querySelector(".runtime-now-bar__expanded-content")!).opacity) });
          if (now - start < duration) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
    };
    button.click(); await sample(60); button.click(); await sample(50); button.click(); await sample(740);
    const open = surface.dataset.phase;
    button.click(); await sample(620);
    return { samples, open, closed: surface.getBoundingClientRect().height };
  });
  expect(result.open).toBe("open");
  expect(result.closed).toBe(32);
  expect(result.samples.every(s => s.overflow === "hidden" && s.font === "26px")).toBe(true);
  expect(result.samples.every(s => s.compact < .01 || s.detail < .01)).toBe(true);
  await page.locator(".runtime-now-bar__summary").click();
  await expect(page.locator(".runtime-now-bar")).toHaveAttribute("data-phase", "open");
  await page.locator(".runtime-now-bar__chart-command").click();
  await expect(page.locator(".runtime-now-bar__chart-command")).toHaveText("Resume charts");
  await page.keyboard.press("Escape");
  await expect(page.locator(".runtime-now-bar__summary")).toBeFocused();
  await expect(page.locator(".runtime-now-bar")).toHaveCSS("outline-style", "solid");
  await expect(page.locator(".runtime-now-bar__summary")).toHaveCSS("outline-style", "none");
});

test("search focus has one rounded owner in both themes and forced colors", async ({ page }) => {
  await open(page);
  for (const theme of ["light", "dark"]) {
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByTestId("theme-control").click();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    const input = page.locator(".one-ui-search-field input");
    await input.fill("device");
    const geometry = await input.evaluate(e => {
      const container = e.parentElement!;
      return { inner: getComputedStyle(e).outlineStyle, outer: getComputedStyle(container).outlineStyle, height: container.getBoundingClientRect().height, radius: getComputedStyle(container).borderRadius };
    });
    expect(geometry).toEqual({ inner: "none", outer: "solid", height: 48, radius: "26px" });
    await page.emulateMedia({ forcedColors: "active" });
    await expect(input).toHaveCSS("outline-style", "none");
    await expect(page.locator(".one-ui-search-field__container")).toHaveCSS("outline-style", "solid");
    await page.emulateMedia({ forcedColors: "none" });
    await page.getByRole("button", { name: "Back from Search", exact: true }).click();
    await expect(page.locator(".global-search-page")).toBeHidden();
  }
});

test("compact hover retains semantic paint and reduced motion removes travel", async ({ page }) => {
  await open(page);
  const summary = page.locator(".runtime-now-bar__summary");
  for (const theme of ["light", "dark"]) {
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByTestId("theme-control").click();
    await page.mouse.move(0, 0);
    await expect.poll(() => page.locator(".runtime-now-bar").evaluate(e => e.getAnimations({ subtree: true }).length)).toBe(0);
    const paint = await page.locator(".runtime-now-bar__clip").evaluate(e => getComputedStyle(e).backgroundColor);
    await summary.hover();
    const hovered = await summary.evaluate(e => ({ layer: getComputedStyle(e, "::before").backgroundColor, base: getComputedStyle(e.nextElementSibling!).backgroundColor }));
    expect(hovered.base).toBe(paint);
    expect(hovered.layer).not.toBe("rgb(0, 0, 0)");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await summary.click();
  await expect(page.locator(".runtime-now-bar")).toHaveAttribute("data-phase", "open");
  expect(await page.locator(".runtime-now-bar").evaluate(e => e.getAnimations().length)).toBe(0);
});

test("scrolling tabs clear the menu and utilities without moving the workspace", async ({ page }) => {
  await open(page);
  for (const width of [1100, 1280, 1440, 1920, 800]) {
    await page.setViewportSize({ width, height: 720 });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-navigation", width < 1100 ? "bottom" : "rail");
    await expect.poll(() => page.evaluate(() => {
      const anchor = document.querySelector(".runtime-now-bar-anchor")!.getBoundingClientRect();
      const capsule = document.querySelector(".runtime-now-bar")!.getBoundingClientRect();
      const actions = document.querySelector(".health-utility-actions")!.getBoundingClientRect();
      return Math.abs(anchor.left - capsule.left) < 1 && capsule.right <= actions.left;
    })).toBe(true);
    // Studio has the longest strip; exercise its horizontal scrolling too.
    if (width >= 1100) await page.getByRole("button", { name: "Show navigation", exact: true }).click();
    await page.locator("#app-navigation").getByRole("button", { name: "Studio", exact: true }).click();
    await expect(page.getByTestId("studio")).toBeVisible();
    await page.waitForTimeout(300);
    const samples = await page.evaluate(async () => {
      const content = document.getElementById("collector-content")!;
      const bounds = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
      const samples = [];
      for (const y of [0, 6, 12, 20, 28, 50, 90, 160, 90, 28, 12, 0]) {
        content.scrollTop = y;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const nav = bounds(".health-context-nav")!, menu = bounds(".health-rail-toggle"), utility = bounds(".health-utility")!;
        samples.push({ x: bounds("#workspace-stage")!.left, navX: nav.left,
          menuOverlap: !!menu && nav.top < menu.bottom && nav.bottom > menu.top && nav.left < menu.right,
          utilityOverlap: nav.top < utility.bottom && nav.right > utility.left - 15,
          overflow: content.scrollWidth > content.clientWidth });
      }
      return samples;
    });
    expect(samples.every(s => !s.menuOverlap && !s.utilityOverlap && !s.overflow)).toBe(true);
    expect(new Set(samples.map(s => s.x)).size).toBe(1);
    expect(samples.at(-1)!.navX).toBe(samples[0].navX);
    const translate = page.locator(".health-context-nav").getByRole("button", { name: "Translate", exact: true });
    await translate.click();
    await expect(page.getByTestId("studio")).toHaveAttribute("data-section", "translate");
    await page.locator(".health-context-nav").getByRole("button", { name: "Overview", exact: true }).click();
  }
});

test("drawer collapses an interrupted notification but retains the live capsule and focus", async ({ page }) => {
  await open(page);
  const surface = page.locator(".runtime-now-bar");
  await page.locator(".runtime-now-bar__summary").click();
  await page.waitForTimeout(120);
  await page.getByRole("button", { name: "Show navigation", exact: true }).click();
  await expect(surface).toHaveAttribute("data-phase", "collapsed");
  await expect(surface).toBeVisible();
  expect(await surface.evaluate(e => (e as HTMLElement).inert)).toBe(true);
  await expect(page.locator("#app-navigation [aria-current]")).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("#app-navigation, .health-rail-toggle"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Show navigation", exact: true })).toBeFocused();
  await expect(surface).toHaveAttribute("data-phase", "collapsed");
  expect(await surface.evaluate(e => (e as HTMLElement).inert)).toBe(false);
});

test("checkbox feedback fits its scroller and hand identity survives monochrome rendering", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Show navigation", exact: true }).click();
  await page.locator("#app-navigation").getByRole("button", { name: "Monitor", exact: true }).click();
  const scroller = page.locator(".health-live-channel-scroll");
  await expect(scroller).toBeVisible();
  for (const index of [0, 6, 12]) {
    const checkbox = scroller.locator("input").nth(index);
    await checkbox.focus();
    await scroller.locator("label").nth(index).hover();
    const safe = await checkbox.evaluate(e => {
      const scroller = e.closest(".health-live-channel-scroll")!.getBoundingClientRect();
      const shape = e.nextElementSibling!.getBoundingClientRect();
      return shape.left - 8 >= scroller.left - .1 && shape.right + 8 <= scroller.right + .1
        && shape.top - 8 >= scroller.top - .1 && shape.bottom + 8 <= scroller.bottom + .1;
    });
    expect(safe).toBe(true);
  }
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.locator("#chart-left header")).toContainText("Left glove · Solid line");
  await expect(page.locator("#chart-right header")).toContainText("Right glove · Dashed line");
  expect(await page.locator(".hand-mark, .runtime-now-bar__hand").count()).toBe(0);
  const last = scroller.locator("input").last();
  await last.focus();
  const checked = await last.isChecked();
  await page.keyboard.press("Space");
  await expect(last).toBeChecked({ checked: !checked });
});
