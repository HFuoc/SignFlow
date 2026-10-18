import { randomBytes } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const root = path.resolve(import.meta.dirname, "../../../..");
const evidence = path.join(root, ".design-cache/reference-viewer-20261013/browser");
const token = randomBytes(32).toString("base64url");
let child: ChildProcessWithoutNullStreams;
let origin: string;
let diagnostics = "";
let exit: Promise<number | null>;

// Authentication exists only in RAM. Do not retain network traces or video.
test.use({ trace: "off", video: "off", launchOptions: { args: [
  "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--disable-gpu",
] } });

test.beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
  child = spawn(path.join(root, ".venv/Scripts/python.exe"), ["-m", "app.desktop_collector.shell",
    "--e2e-server", "--dev", "--vite-origin", "http://127.0.0.1:5173"],
  { cwd: root, windowsHide: true, stdio: "pipe" });
  diagnostics = "";
  child.stderr.on("data", chunk => { diagnostics += String(chunk); });
  exit = new Promise(resolve => child.once("exit", resolve));
  child.stdin.write(token + "\n");
  origin = await new Promise<string>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error("Bridge startup timeout")), 15000);
    child.stdout.on("data", data => {
      output += String(data);
      const match = output.match(/PORT=(\d+)/);
      if (match) { clearTimeout(timer); resolve("http://127.0.0.1:" + match[1]); }
    });
  });
});

test.afterAll(async () => {
  child.stdin.end("STOP\n");
  let timer: ReturnType<typeof setTimeout>;
  const code = await Promise.race([exit,
    new Promise(resolve => { timer = setTimeout(() => resolve("timeout"), 15000); })]);
  clearTimeout(timer!);
  if (code === "timeout") child.kill();
  expect(code, diagnostics.replaceAll(token, "[redacted]")).toBe(0);
});

async function instrument(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__referenceFixture = { created: [], revoked: [], streams: [], cameraRequests: 0 };
    const originalCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = object => {
      const url = originalCreate(object); w.__referenceFixture.created.push(url); return url;
    };
    const originalRevoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = url => { w.__referenceFixture.revoked.push(url); originalRevoke(url); };
    const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 360;
    const context = canvas.getContext("2d")!;
    setInterval(() => { context.fillStyle = "#555"; context.fillRect(0, 0, 640, 360); }, 1000 / 30);
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async (constraints: MediaStreamConstraints) => {
      if (constraints.audio !== false) throw new Error("Audio requested");
      w.__referenceFixture.cameraRequests++;
      const stream = canvas.captureStream(30); w.__referenceFixture.streams.push(stream); return stream;
    } });
  });
}

async function openCamera(page: Page) {
  const headers = { Authorization: "Bearer " + token, Origin: "http://127.0.0.1:5173" };
  const auth = await (await page.request.get(origin + "/api/v1/auth/status", { headers })).json();
  const password = "Recognition test passphrase 2026";
  const response = await page.request.post(origin + "/api/v1/auth/" + (auth.setup_required ? "setup" : "login"),
    { headers, data: { username: "phase2", password, ...(auth.setup_required ? { password_confirmation: password } : {}) } });
  expect(response.ok()).toBeTruthy();
  await page.route(/\/src\/main\.tsx(?:\?.*)?$/, async route => {
    const original = await route.fetch();
    const body = (await original.text()).replace("consumeLaunchCredentials()", JSON.stringify({ apiOrigin: origin, token }));
    await route.fulfill({ response: original, body });
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("device-manager")).toBeVisible();
  await page.getByRole("button", { name: "Show navigation", exact: true }).click();
  await page.locator("#app-navigation").getByRole("button", { name: "Studio", exact: true }).click();
  await page.getByRole("button", { name: "Open Dataset", exact: true }).click();
  await page.getByRole("button", { name: "Live Camera", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Recognition model", exact: true })).toContainText("ViSign");
}

const reference = (page: Page) => page.getByRole("region", { name: "Reference video", exact: true });
const video = (page: Page) => reference(page).locator("video");
async function decoded(page: Page, name?: string) {
  const player = video(page);
  await expect(player).toHaveCount(1);
  if (name) await expect(player).toHaveAttribute("aria-label", "Reference video: " + name);
  await expect.poll(() => player.evaluate((node: HTMLVideoElement) => node.readyState >= 2
    && Number.isFinite(node.duration) && node.duration > 0 && node.videoWidth > 0)).toBe(true);
  return player;
}
async function choose(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Reference sign", exact: true }).click();
  await page.getByRole("option", { name, exact: true }).click();
  return decoded(page, name);
}

test("all 25 authenticated references decode without starting playback or the camera", async ({ page }) => {
  test.setTimeout(120000);
  await instrument(page);
  let credentialInUrl = false;
  const access: Promise<{ authenticated: boolean; cookie: boolean; media: boolean }>[] = [];
  page.on("request", request => {
    credentialInUrl ||= request.url().includes(token);
    if (!request.url().includes("/recognition/references") || request.method() !== "GET") return;
    access.push(request.allHeaders().then(headers => ({ authenticated: headers.authorization === "Bearer " + token,
      cookie: Boolean(headers.cookie), media: request.url().includes("/media") })));
  });
  await openCamera(page);
  await decoded(page, "Chào");
  await page.getByRole("combobox", { name: "Reference sign", exact: true }).click();
  const names = await page.getByRole("option").allTextContents();
  expect(names).toHaveLength(25);
  await page.keyboard.press("Escape");
  const results: object[] = [];
  for (const name of names) {
    const player = await choose(page, name);
    await expect(page.getByRole("button", { name: "Replay reference", exact: true })).toBeEnabled();
    const info = await player.evaluate((node: HTMLVideoElement) => ({ width: node.videoWidth,
      height: node.videoHeight, duration: node.duration, paused: node.paused,
      muted: node.muted, autoplay: node.autoplay, localBlob: node.currentSrc.startsWith("blob:") }));
    expect(info.paused && info.muted && !info.autoplay && info.localBlob).toBe(true);
    await player.evaluate((node: HTMLVideoElement) => node.play());
    await expect.poll(() => player.evaluate((node: HTMLVideoElement) => node.currentTime > 0)).toBe(true);
    await player.evaluate((node: HTMLVideoElement) => node.pause());
    results.push({ name, ...info, playedOnRequest: true });
  }
  expect(await page.evaluate(() => (window as any).__referenceFixture.cameraRequests)).toBe(0);
  expect(credentialInUrl).toBe(false);
  expect(await page.evaluate(secret => [localStorage, sessionStorage].some(storage =>
    Object.values(storage).some(value => String(value).includes(secret))), token)).toBe(false);
  const requests = await Promise.all(access);
  expect(requests.length).toBeGreaterThanOrEqual(26);
  expect(requests.every(request => request.authenticated && request.cookie)).toBe(true);
  await writeFile(path.join(evidence, "reference-decodes.json"), JSON.stringify({
    references: results, authenticatedRequests: requests.length, mediaRequests: requests.filter(request => request.media).length,
    credentialInUrl, cameraRequests: 0, sourceSemanticsVerified: false,
  }, null, 2));
});

test("reference playback, speed, replacement and unmount stay independent of the camera", async ({ page }) => {
  await instrument(page); await openCamera(page); await decoded(page, "Chào");
  await page.getByRole("button", { name: "Start camera", exact: true }).click();
  await expect(page.getByText("Camera ready", { exact: true })).toBeVisible();
  await page.evaluate(() => { (window as any).__cameraNode = document.querySelector(".live-camera-video"); });
  const first = await video(page).getAttribute("src");
  await page.getByRole("button", { name: "Replay reference", exact: true }).click();
  await expect.poll(() => video(page).evaluate((node: HTMLVideoElement) => !node.paused && node.currentTime > 0)).toBe(true);
  await page.getByRole("combobox", { name: "Playback speed", exact: true }).click();
  await page.getByRole("option", { name: /0\.5/ }).click();
  await expect.poll(() => video(page).evaluate((node: HTMLVideoElement) => node.playbackRate)).toBe(.5);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => video(page).evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await choose(page, "Chúng ta");
  expect(await page.evaluate(url => (window as any).__referenceFixture.revoked.includes(url), first)).toBe(true);
  await expect.poll(() => video(page).evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
  const second = await video(page).getAttribute("src");
  await page.getByRole("combobox", { name: "Recognition model", exact: true }).click();
  await page.getByRole("option", { name: "KVSL · topic models", exact: true }).click();
  await expect(reference(page)).toHaveCount(0);
  expect(await page.evaluate(url => (window as any).__referenceFixture.revoked.includes(url), second)).toBe(true);
  await expect(page.getByText("Camera ready", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__referenceFixture.streams.length)).toBe(1);
  expect(await page.evaluate(() => (window as any).__referenceFixture.streams[0].getVideoTracks()[0].readyState)).toBe("live");
  expect(await page.evaluate(() => (window as any).__cameraNode === document.querySelector(".live-camera-video"))).toBe(true);
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
});

test("late media cannot replace a newly selected reference, and failed media can be retried", async ({ page }) => {
  await instrument(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let waiting = false;
  let completed = false;
  await page.route(/\/recognition\/references\/visign25-00\/media$/, async route => {
    const response = await route.fetch(); waiting = true;
    await gate;
    await route.fulfill({ response }); completed = true;
  });
  await openCamera(page);
  await expect.poll(() => waiting).toBe(true);
  await choose(page, "Chúng ta");
  const current = await video(page).getAttribute("src");
  release(); await expect.poll(() => completed).toBe(true);
  await expect(video(page)).toHaveAttribute("aria-label", "Reference video: Chúng ta");
  await expect(video(page)).toHaveAttribute("src", current!);
  await page.unroute(/\/recognition\/references\/visign25-00\/media$/);
  let failed = true;
  await page.route(/\/recognition\/references\/visign25-02\/media$/, async route => {
    if (failed) await route.fulfill({ status: 503, contentType: "application/json",
      body: JSON.stringify({ code: "reference_unavailable", detail: "The local reference preview is missing." }) });
    else await route.continue();
  });
  await page.getByRole("combobox", { name: "Reference sign", exact: true }).click();
  await page.getByRole("option", { name: "Có thể", exact: true }).click();
  await expect(reference(page).getByText("Reference unavailable", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Replay reference", exact: true })).toBeDisabled();
  expect(await page.evaluate(url => (window as any).__referenceFixture.revoked.includes(url), current)).toBe(true);
  failed = false;
  await page.getByRole("button", { name: "Retry reference", exact: true }).click();
  await decoded(page, "Có thể");
  await expect(reference(page).getByText("Reference unavailable", { exact: true })).toHaveCount(0);
  const recovered = await video(page).getAttribute("src");
  await video(page).evaluate(node => node.dispatchEvent(new Event("error")));
  await expect(reference(page).getByText("This reference video could not be played. Retry to load it again.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Retry reference", exact: true }).click();
  await decoded(page, "Có thể");
  expect(await page.evaluate(url => (window as any).__referenceFixture.revoked.includes(url), recovered)).toBe(true);
  const last = await video(page).getAttribute("src");
  await page.getByRole("button", { name: "Dataset", exact: true }).last().click();
  await expect(reference(page)).toHaveCount(0);
  expect(await page.evaluate(url => (window as any).__referenceFixture.revoked.includes(url), last)).toBe(true);
  expect(await page.evaluate(() => (window as any).__referenceFixture.cameraRequests)).toBe(0);
});

test("a missing reference catalog reports a recoverable error while the camera stays available", async ({ page }) => {
  await instrument(page);
  let failed = true;
  await page.route(/\/recognition\/references\?provider_id=visign-ridge-25$/, async route => {
    if (failed) {
      const response = await route.fetch();
      const catalog = await response.json();
      await route.fulfill({ response, json: { references: catalog.references.map((item: object) => ({ ...item, available: false })) } });
    }
    else await route.continue();
  });
  await openCamera(page);
  await expect(reference(page).getByText("Reference unavailable", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start camera", exact: true }).click();
  await expect(page.getByText("Camera ready", { exact: true })).toBeVisible();
  failed = false;
  await page.getByRole("button", { name: "Retry reference", exact: true }).click();
  await decoded(page, "Chào");
  await expect(page.getByText("Camera ready", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__referenceFixture.cameraRequests)).toBe(1);
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
});

test("reference and camera composition passes light/dark responsive accessibility review", async ({ page }) => {
  test.setTimeout(90000);
  await instrument(page); await openCamera(page); await decoded(page, "Chào");
  // A settled source frame is a real decoded preview, not a generated mockup.
  await video(page).evaluate((node: HTMLVideoElement) => { node.currentTime = Math.min(.8, node.duration / 2); });
  await expect.poll(() => video(page).evaluate((node: HTMLVideoElement) => !node.seeking)).toBe(true);
  const renders: object[] = [];
  for (const [width, height] of [[1280, 720], [1440, 900], [768, 1024]]) {
    for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      await page.locator(".live-camera-workspace").evaluate(node => node.scrollIntoView({ block: "center" }));
      // Repaint a paused native video after resize/theme before taking evidence.
      await video(page).evaluate(async (node: HTMLVideoElement) => {
        node.currentTime = Math.min(.8, node.duration / 2);
        const frame = new Promise<void>(resolve => node.requestVideoFrameCallback(() => resolve()));
        await node.play(); await frame; node.pause();
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const violations = (await new AxeBuilder({ page }).include(".recognition-card").withTags(["wcag2a", "wcag2aa"]).analyze()).violations;
      expect(violations).toEqual([]);
      await page.screenshot({ path: path.join(evidence, `reference-${theme}-${width}.png`), fullPage: true, animations: "disabled" });
      renders.push({ width, height, theme, violations: violations.length });
    }
  }
  await writeFile(path.join(evidence, "reference-visual-review.json"), JSON.stringify({ actualApp: true,
    sourceVideo: "visign25-00", cameraOff: true, sourceSemanticsVerified: false, renders }, null, 2));
});
