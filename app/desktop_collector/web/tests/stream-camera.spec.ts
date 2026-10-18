import { randomBytes } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page, type WebSocketRoute } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const root = path.resolve(import.meta.dirname, "../../../..");
const evidence = path.join(root, ".design-cache/camera-performance-20261014/browser");
const token = randomBytes(32).toString("base64url");
let child: ChildProcessWithoutNullStreams;
let origin: string;
let diagnostics = "";
let exit: Promise<number | null>;

// The bridge credential is injected only in RAM. Never retain authenticated traces.
test.use({ trace: "off", video: "off", launchOptions: { args: [
  "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream",
  ...(process.env.SMARTGLOVE_TRACKING_BENCH_GPU === "1" ? [] : ["--disable-gpu"]),
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
  const code = await Promise.race([exit, new Promise(resolve => setTimeout(() => resolve("timeout"), 15000))]);
  if (code === "timeout") child.kill();
  expect(code, diagnostics.replaceAll(token, "[redacted]")).toBe(0);
});

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
  await page.getByRole("button", { name: "Start camera", exact: true }).click();
  await expect(page.getByText("Camera ready", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Auto on", exact: true })).toBeEnabled();
  // Install after navigation so Playwright's WebSocket routing shim is already active.
  await page.evaluate(() => {
    const w = window as any;
    const NativeSocket = WebSocket;
    w.WebSocket = class extends NativeSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        if (String(url).includes("/recognition/stream")) {
          w.__streamFixture.sockets.push(this);
          this.addEventListener("message", event => {
            const frame = JSON.parse(String(event.data));
            if (frame.type !== "frame" || !w.__streamFixture.replies) return;
            const source = w.__streamFixture.source as HTMLVideoElement;
            w.__streamFixture.replies.push({ ...frame, observedAt: performance.now(),
              sourceTime: source.currentTime, replaying: !source.paused && !source.ended });
          });
        }
      }
    };
  });
}

async function syntheticCamera(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 360;
    const context = canvas.getContext("2d")!;
    w.__streamFixture = { mode: "motion", draws: 0, streams: [], sockets: [], recordings: 0 };
    const draw = () => {
      const fixture = w.__streamFixture;
      fixture.draws++;
      context.fillStyle = "#555"; context.fillRect(0, 0, 640, 360);
      if (fixture.mode === "motion") {
        context.fillStyle = fixture.draws % 6 < 3 ? "#ddd" : "#222";
        context.fillRect(220, 90, 200, 180);
      }
    };
    setInterval(draw, 1000 / 30); draw();
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async (constraints: MediaStreamConstraints) => {
      if (constraints.audio !== false) throw new Error("Audio requested");
      const stream = canvas.captureStream(30); w.__streamFixture.streams.push(stream); return stream;
    } });
    const NativeRecorder = MediaRecorder;
    w.MediaRecorder = class extends NativeRecorder {
      start(timeslice?: number) { w.__streamFixture.recordings++; super.start(timeslice); }
    };
  });
}

type FrameHeader = { type: "frame"; sequence: number; timestamp_ms: number };
const prediction = {
  schema_version: "smartglove-prediction-result-v1", sample_id: null, recording_id: null,
  provider_id: "visign-ridge-25", topic_id: "visign25", status: "ok", source_kind: "live_camera_stream",
  preprocessing_id: "visign-body-relative-xy-mask-16-stream-v1", score_kind: "raw_ridge", latency_ms: { total: 40 },
  top_k: [{ label_id: "0", display_name: "Chào", score: 1.4 },
    { label_id: "1", display_name: "Chúng ta", score: -.1 }, { label_id: "2", display_name: "Có thể", score: -.2 }],
  quality: { experimental: true, source_semantics_verified: false, unknown_rejection: false },
};
function ack(frame: FrameHeader, phase: "provisional" | "final" | null = "provisional", segment = 1,
  resetReason: string | null = null) {
  return { type: "frame", sequence: frame.sequence, timestamp_ms: frame.timestamp_ms,
    state: phase === "final" || resetReason ? "ready" : "moving", phase, segment_id: segment,
    prediction: phase ? prediction : null, quality: { reset_reason: resetReason, processing_ms: 32,
      tracking: { schema: "holistic-overlay-v1", xy: Array.from({ length: 75 }, (_, i) => [.2 + i % 5 * .1, .2 + Math.floor(i / 5) * .035]),
        present: Array(75).fill(true), pose_visibility: Array(33).fill(.9), connections: [[11, 12], [33, 34], [54, 55]] } } };
}

async function mockStream(page: Page, providerId = "visign-ridge-25") {
  const sessions: { route: WebSocketRoute; frames: FrameHeader[]; closed: boolean }[] = [];
  const control = { hold: false, phase: "provisional" as "provisional" | "final" | null,
    segment: 1, resetReason: null as string | null, rejected: false };
  await page.routeWebSocket(/\/api\/v1\/recognition\/stream$/, socket => {
    const session = { route: socket, frames: [] as FrameHeader[], closed: false };
    sessions.push(session);
    let authenticated = false;
    socket.onClose(() => { session.closed = true; });
    socket.onMessage(message => {
      if (typeof message === "string") {
        const hello = JSON.parse(message);
        expect(hello.type === "authenticate" && hello.token === token).toBe(true);
        expect(hello.provider_id).toBe(providerId);
        authenticated = true;
        socket.send(JSON.stringify({ type: "ready", protocol: "smartglove-recognition-stream-v1", provider_id: providerId,
          max_fps: 60, frame_formats: ["rgba8", "png"], max_frame_bytes: 8 * 1024 * 1024, max_width: 1920, max_height: 1080,
          max_pixels: 2073600, idle_timeout_seconds: 10, max_session_seconds: 1800 }));
        return;
      }
      expect(authenticated).toBe(true);
      const length = message.readUInt32BE(0);
      const header = JSON.parse(message.subarray(4, 4 + length).toString("utf8")) as FrameHeader;
      expect(header.type).toBe("frame");
      expect(header).toMatchObject({ format: "rgba8", width: 640, height: 360 });
      expect(message.length - 4 - length).toBe(640 * 360 * 4);
      const previous = session.frames.at(-1);
      if (previous) { expect(header.sequence).toBeGreaterThan(previous.sequence); expect(header.timestamp_ms).toBeGreaterThan(previous.timestamp_ms); }
      else expect(header.sequence).toBe(0);
      session.frames.push(header);
      if (!control.hold) {
        const response = ack(header, control.phase, control.segment, control.resetReason);
        const gpuPrediction = response.prediction && providerId === "visign-videomae-25" ? {
          ...response.prediction, provider_id: providerId, topic_id: "visign25_rgb",
          score_kind: "uncalibrated_softmax_subset", status: control.rejected ? "rejected" : "ok",
          top_k: control.rejected ? [] : [{ label_id: "visign:visign25:14", display_name: "Thức dậy", score: .96 }],
          error_code: control.rejected ? "uncertain_sign" : null,
          rejection_reason: control.rejected ? "Not confident enough to name this sign. Try one complete sign again." : null,
        } : response.prediction;
        socket.send(JSON.stringify({ ...response, prediction: gpuPrediction }));
      }
    });
  });
  return { sessions, control };
}

test("VideoMAE selection withholds uncertain words, shows completed sign and preserves V25 choice", async ({ page }) => {
  test.setTimeout(90000);
  await syntheticCamera(page);
  const { sessions, control } = await mockStream(page, "visign-videomae-25");
  control.rejected = true;
  await openCamera(page);
  const model = page.getByRole("combobox", { name: "Recognition model", exact: true });
  await model.click();
  await page.getByRole("option", { name: "VideoMAE GPU · 25 signs (Experimental)", exact: true }).click();
  await expect(page.getByText(/First startup may take up to two minutes/)).toBeVisible();
  await page.getByRole("button", { name: "Auto on", exact: true }).click();
  await expect(page.getByText("Not confident enough to name this sign. Try one complete sign again.", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Model prediction", exact: true })).toHaveCount(0);
  control.rejected = false; control.phase = "final";
  await expect(page.getByRole("heading", { name: "Completed sign: Thức dậy", exact: true })).toBeVisible();
  const gpuEvidence = path.join(root, ".design-cache/videomae-integration-20261015/browser");
  await mkdir(gpuEvidence, { recursive: true });
  for (const [width, height] of [[1280, 720], [1440, 900], [768, 1024]]) {
    for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      await page.locator(".camera-preview").evaluate(node => node.scrollIntoView({ block: "center" }));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).include(".recognition-card").withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
      await page.screenshot({ path: path.join(gpuEvidence, `gpu-${theme}-${width}.png`), fullPage: true, animations: "disabled" });
    }
  }
  await page.getByRole("button", { name: "Auto off", exact: true }).click();
  await expect.poll(() => sessions.at(-1)!.closed).toBe(true);
  await model.click();
  await page.getByRole("option", { name: "ViSign · 25 signs (Experimental)", exact: true }).click();
  await expect(model).toHaveText("ViSign · 25 signs (Experimental)");
  await expect(page.getByRole("region", { name: "Model prediction", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  await writeFile(path.join(gpuEvidence, "review.json"), JSON.stringify({
    syntheticMedia: true, mockedInference: true, accuracyEvidence: false,
    rejectedWordWithheld: true, completedWordVisible: true, legacySelectable: true,
    widths: [1280, 1440, 768], themes: ["light", "dark"], accessibilityViolations: 0,
  }, null, 2));
});

test("worker failure reports stopped recognition and permits Auto recovery", async ({ page }) => {
  await syntheticCamera(page);
  const { sessions } = await mockStream(page);
  await openCamera(page);
  await page.getByRole("button", { name: "Auto on", exact: true }).click();
  await expect(page.getByTestId("camera-tracking-overlay").locator("circle")).toHaveCount(75);
  sessions[0].route.send(JSON.stringify({ type: "error", message: "Windows could not allocate enough memory for recognition." }));
  await expect(page.getByText("Automatic recognition stopped — camera preview only", { exact: true })).toBeVisible();
  await expect(page.getByText("Live recognition stopped", { exact: true })).toBeVisible();
  await expect(page.getByText(/Tracking stopped with recognition/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Model prediction", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Auto on", exact: true }).click();
  await expect(page.getByTestId("camera-tracking-overlay").locator("circle")).toHaveCount(75);
  await expect(page.getByText("Live recognition stopped", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
});

test("failed capture upload clears Sending local clip and permits retry", async ({ page }) => {
  test.setTimeout(45000);
  await syntheticCamera(page);
  await openCamera(page);
  await page.route("**/api/v1/recognition/live-jobs?*", route => route.fulfill({ status: 503,
    contentType: "application/json", body: JSON.stringify({ detail: "Unavailable" }) }));
  await page.getByRole("button", { name: "Capture sign", exact: true }).click();
  await expect(page.getByText("Capture could not complete", { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Sending local clip", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Capture sign", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
});

test("real VideoMAE CUDA capture reaches UI and Auto returns tracking", async ({ page }) => {
  test.setTimeout(240000);
  const source = ".design-cache/visign-references-20261014-v2/visign25-14.webm";
  const media = await readFile(path.join(root, source));
  await referenceCamera(page, false, source);
  await openCamera(page);
  await page.getByRole("combobox", { name: "Recognition model", exact: true }).click();
  await page.getByRole("option", { name: "VideoMAE GPU · 25 signs (Experimental)", exact: true }).click();
  // Supply a known existing reference to the real authenticated POST/queue/worker.
  // This verifies the complete result path, not a physical user's camera accuracy.
  await page.route("**/api/v1/recognition/live-jobs?*", route => route.continue({ postData: media }));
  const jobs: any[] = [];
  const folder = path.join(root, ".design-cache/auto-sequence-20261016/browser");
  await mkdir(folder, { recursive: true });
  page.on("response", async response => {
    if (/\/recognition\/jobs\/[a-f0-9]+$/.test(response.url()) && response.ok()) {
      const job = await response.json();
      if (job.prediction || job.error) jobs.push(job);
    }
  });
  await page.getByRole("button", { name: "Capture sign", exact: true }).click();
  await expect.poll(() => jobs.length, { timeout: 150000 }).toBeGreaterThan(0);
  await writeFile(path.join(folder, "real-capture.json"), JSON.stringify(jobs.at(-1), null, 2));
  expect(jobs.at(-1)?.status, JSON.stringify(jobs.at(-1)?.error)).toBe("succeeded");
  await expect(page.getByRole("heading", { name: "Prediction: Thức dậy", exact: true })).toBeVisible();
  expect(jobs.at(-1)?.prediction.quality.device).toBe("cuda:0");
  expect(jobs.at(-1)?.prediction.provider_id).toBe("visign-videomae-25");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator(".recognition-result").evaluate(node => node.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: path.join(folder, "real-capture.png"), fullPage: true });
  await page.getByRole("button", { name: "Auto on", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.length), { timeout: 125000 }).toBeGreaterThan(2);
  await page.evaluate(() => (window as any).__playReference());
  await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.some((f: any) =>
    f.quality.tracking?.present.slice(33).some(Boolean))), { timeout: 20000 }).toBe(true);
  await expect(page.getByTestId("camera-tracking-overlay")).toBeVisible();
  await page.locator(".camera-preview").evaluate(node => node.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: path.join(folder, "real-auto-tracking.png"), fullPage: true });
  // A completed response can be a visible abstention; that is not word accuracy.
  let completionError: unknown;
  try {
    await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.some((f: any) =>
      f.phase === "final" && f.prediction)), { timeout: 30000 }).toBe(true);
  } catch (error) { completionError = error; }
  const frames = await page.evaluate(() => (window as any).__streamFixture.replies);
  await writeFile(path.join(folder, `real-auto-completion-${Date.now()}.json`), JSON.stringify({
    physicalCamera: false, independentAccuracy: false, completionObserved: !completionError, frames }, null, 2));
  if (completionError) throw completionError;
  expect(frames.some((f: any) => f.phase === "provisional")).toBe(false);
  const completed = frames.findLast((f: any) => f.phase === "final").prediction;
  expect(completed.provider_id).toBe("visign-videomae-25");
  if (completed.status === "ok") {
    await expect(page.getByRole("heading", { name: "Completed sign: " + completed.top_k[0].display_name, exact: true })).toBeVisible();
  } else {
    await expect(page.getByText(completed.rejection_reason, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  await writeFile(path.join(folder, "real-gpu.json"), JSON.stringify({ physicalCamera: false,
    independentAccuracy: false, realHttpAndWorker: true, capture: jobs.at(-1), frames }, null, 2));
});

test("failed recognition job replaces sending status and enables another capture", async ({ page }) => {
  test.setTimeout(45000);
  await syntheticCamera(page);
  await openCamera(page);
  const job = { job_id: "camera-failure-fixture", source_kind: "live_camera_capture", status: "queued",
    provider_id: "visign-ridge-25", prediction: null, error: null, cancel_requested: false };
  await page.route("**/api/v1/recognition/live-jobs?*", route => route.fulfill({ status: 202,
    contentType: "application/json", body: JSON.stringify(job) }));
  await page.route("**/api/v1/recognition/jobs/camera-failure-fixture", route => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ ...job, status: "failed",
      error: { code: "host_memory", message: "Windows could not allocate enough memory for recognition." } }) }));
  await page.getByRole("button", { name: "Capture sign", exact: true }).click();
  await expect(page.getByText("Recognition failed — capture again", { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Sending local clip", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Capture again", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
});

test("ViSign Auto shows a tentative word during motion and completed sign after final response", async ({ page }) => {
  test.setTimeout(90000);
  await syntheticCamera(page);
  const { sessions, control } = await mockStream(page);
  let clips = 0;
  page.on("request", request => { if (request.url().includes("/recognition/live-jobs") && request.method() === "POST") clips++; });
  await openCamera(page);
  await page.getByRole("button", { name: "Auto on", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tentative prediction: Chào", exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__streamFixture.mode)).toBe("motion");
  await expect(page.getByRole("combobox", { name: "Recognition model", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Capture sign", exact: true })).toBeDisabled();
  expect(clips).toBe(0);
  expect(await page.evaluate(() => (window as any).__streamFixture.recordings)).toBe(0);
  const renders: object[] = [];
  await expect(page.getByTestId("camera-tracking-overlay").locator("circle")).toHaveCount(75);
  await expect(page.getByText("MediaPipe · Left detected · Right detected", { exact: true })).toBeVisible();
  await expect(page.locator(".camera-telemetry")).toContainText("32 ms");
  for (const [width, height] of [[1280, 720], [1440, 900], [768, 1024]]) {
    for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      await page.locator(".camera-preview").evaluate(node => node.scrollIntoView({ block: "center" }));
      const geometry = await page.locator(".camera-preview").evaluate(node => {
        const video = node.querySelector("video")!.getBoundingClientRect();
        const svg = node.querySelector("svg")!.getBoundingClientRect();
        return Math.abs(video.width - svg.width) + Math.abs(video.height - svg.height) + Math.abs(video.x - svg.x) + Math.abs(video.y - svg.y);
      });
      expect(geometry).toBeLessThan(1);
      const preview = await page.locator(".camera-preview").boundingBox();
      const word = await page.locator(".recognition-result__word").boundingBox();
      expect(preview!.width).toBeGreaterThan(width >= 1280 ? 700 : 600);
      if (width >= 1280) {
        expect(word!.x).toBeGreaterThan(preview!.x + preview!.width);
        expect(word!.y).toBeGreaterThanOrEqual(80);
        expect(word!.y + word!.height).toBeLessThan(height);
        expect(preview!.y).toBeGreaterThanOrEqual(80);
        expect(preview!.y + preview!.height).toBeLessThan(height);
      }
      await expect(page.getByText("Scores and model details", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const violations = (await new AxeBuilder({ page }).include(".recognition-card").withTags(["wcag2a", "wcag2aa"]).analyze()).violations;
      expect(violations).toEqual([]);
      await page.screenshot({ path: path.join(evidence, `tentative-${theme}-${width}.png`), fullPage: true, animations: "disabled" });
      renders.push({ width, height, theme, violations: violations.length });
    }
  }
  // Hold one reply: acquisition must not queue additional frames behind it.
  control.hold = true;
  const session = sessions.at(-1)!;
  const before = session.frames.length;
  await expect.poll(() => session.frames.length).toBeGreaterThan(before);
  const blocked = session.frames.length;
  await page.waitForTimeout(350);
  expect(session.frames.length).toBe(blocked);
  await expect(page.getByTestId("camera-tracking-overlay")).toHaveCount(0);
  await expect(page.getByText("Waiting for fresh tracking…", { exact: true })).toBeVisible();
  control.hold = false; control.phase = "final";
  session.route.send(JSON.stringify(ack(session.frames.at(-1)!, "final")));
  await expect(page.getByRole("heading", { name: "Completed sign: Chào", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Auto off", exact: true }).click();
  await expect.poll(() => session.closed).toBe(true);
  await expect(page.getByTestId("camera-tracking-overlay")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Model prediction", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  await writeFile(path.join(evidence, "mocked-stream-review.json"), JSON.stringify({
    syntheticMedia: true, mockedInference: true, accuracyEvidence: false, frames: blocked,
    clipUploads: clips, oneFrameInFlight: true, renders,
  }, null, 2));
});

test("Auto off, hidden page, stopped camera, disconnection and navigation release stream and ignore late predictions", async ({ page }) => {
  test.setTimeout(90000);
  await syntheticCamera(page);
  const { sessions } = await mockStream(page);
  await openCamera(page);
  async function enable() {
    const count = sessions.length;
    await page.getByRole("button", { name: "Auto on", exact: true }).click();
    await expect.poll(() => sessions.length).toBe(count + 1);
    await expect(page.getByRole("heading", { name: "Tentative prediction: Chào", exact: true })).toBeVisible();
    return sessions.at(-1)!;
  }
  async function stopped(session: typeof sessions[number]) {
    await expect.poll(() => session.closed).toBe(true);
    await expect(page.getByRole("button", { name: "Auto off", exact: true })).toHaveAttribute("aria-pressed", "true");
    // A queued callback from the old socket must not repopulate React state.
    await page.evaluate(payload => {
      const old = (window as any).__streamFixture.sockets.at(-1) as WebSocket;
      old.dispatchEvent(new MessageEvent("message", { data: payload }));
    }, JSON.stringify(ack(session.frames.at(-1)!)));
    await expect(page.getByRole("region", { name: "Model prediction", exact: true })).toHaveCount(0);
  }
  let session = await enable();
  await page.getByRole("button", { name: "Auto off", exact: true }).click(); await stopped(session);
  session = await enable();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await stopped(session);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  session = await enable();
  await page.getByRole("button", { name: "Stop camera", exact: true }).click(); await stopped(session);
  expect(await page.evaluate(() => (window as any).__streamFixture.streams.every((stream: MediaStream) =>
    stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
  await page.getByRole("button", { name: "Start camera", exact: true }).click();
  await expect(page.getByText("Camera ready", { exact: true })).toBeVisible();
  session = await enable();
  await page.evaluate(() => { (window as any).__streamFixture.streams.at(-1).getVideoTracks()[0].dispatchEvent(new Event("ended")); });
  await stopped(session);
  await page.getByRole("button", { name: "Start camera", exact: true }).click();
  await expect(page.getByText("Camera ready", { exact: true })).toBeVisible();
  session = await enable();
  await page.getByRole("button", { name: "Dataset", exact: true }).last().click();
  await expect.poll(() => session.closed).toBe(true);
  expect(await page.evaluate(() => (window as any).__streamFixture.streams.every((stream: MediaStream) =>
    stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
  await page.getByRole("button", { name: "Live Camera", exact: true }).click();
  await expect(page.getByRole("region", { name: "Model prediction", exact: true })).toHaveCount(0);
  await writeFile(path.join(evidence, "mocked-stream-lifecycle.json"), JSON.stringify({
    sessions: sessions.length, allClosed: sessions.every(item => item.closed), staleResultsIgnored: true,
  }, null, 2));
});

test("a new segment and frame gap clear the previous word until a fresh prediction arrives", async ({ page }) => {
  await syntheticCamera(page);
  const { control } = await mockStream(page);
  await openCamera(page);
  await page.getByRole("button", { name: "Auto on", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tentative prediction: Chào", exact: true })).toBeVisible();
  control.phase = "final";
  await expect(page.getByRole("heading", { name: "Completed sign: Chào", exact: true })).toBeVisible();
  control.phase = null; control.segment = 2;
  await expect(page.getByRole("region", { name: "Model prediction", exact: true })).toHaveCount(0);
  control.phase = "provisional";
  await expect(page.getByRole("heading", { name: "Tentative prediction: Chào", exact: true })).toBeVisible();
  control.phase = null; control.resetReason = "frame_gap";
  await expect(page.getByRole("region", { name: "Model prediction", exact: true })).toHaveCount(0);
  await expect(page.getByText("Movement was interrupted. Hold still, then repeat the complete sign.", { exact: true })).toBeVisible();
  control.phase = "provisional"; control.resetReason = null;
  await expect(page.getByRole("heading", { name: "Tentative prediction: Chào", exact: true })).toBeVisible();
  await expect(page.getByText("Movement was interrupted. Hold still, then repeat the complete sign.", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Auto off", exact: true }).click();
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
});

test("real ViSign stream acknowledges no-hand camera frames without producing a word", async ({ page }) => {
  test.setTimeout(90000);
  await syntheticCamera(page);
  const replies: any[] = [];
  let closed = false;
  page.on("websocket", socket => {
    if (!socket.url().includes("/recognition/stream")) return;
    socket.on("framereceived", frame => {
      if (typeof frame.payload === "string") replies.push(JSON.parse(frame.payload));
    });
    socket.on("close", () => { closed = true; });
  });
  await openCamera(page);
  await page.evaluate(() => { (window as any).__streamFixture.mode = "still"; });
  await page.getByRole("button", { name: "Auto on", exact: true }).click();
  await expect.poll(() => replies.filter(reply => reply.type === "frame").length, { timeout: 45000 }).toBeGreaterThanOrEqual(8);
  const frames = replies.filter(reply => reply.type === "frame");
  expect(frames.every(frame => frame.prediction === null)).toBe(true);
  expect(replies.some(reply => reply.type === "error")).toBe(false);
  await expect(page.getByRole("region", { name: "Model prediction", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Auto off", exact: true }).click();
  await expect.poll(() => closed).toBe(true);
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  await writeFile(path.join(evidence, "real-stream-no-hands.json"), JSON.stringify({
    syntheticMedia: true, realWorker: true, acknowledgedFrames: frames.length,
    noPrediction: frames.every(frame => frame.prediction === null), closed,
  }, null, 2));
});

async function referenceCamera(page: Page, fullHD = false, relativeSource = ".design-cache/visign-app-20261012/reference.webm") {
  // Original MP4 uses a codec unavailable in the review browser. This existing
  // VP8 derivative preserves its dimensions, source frame count and playback rate.
  const media = await readFile(path.join(root, relativeSource));
  await page.addInitScript(({ reference, fullHD }) => {
    const w = window as any;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const source = document.createElement("video"); source.muted = true; source.playsInline = true;
    source.src = URL.createObjectURL(new Blob([Uint8Array.from(atob(reference), x => x.charCodeAt(0))], { type: "video/webm" }));
    const loaded = new Promise<void>((resolve, reject) => {
      source.onloadeddata = () => { canvas.width = fullHD ? 1920 : source.videoWidth; canvas.height = fullHD ? 1080 : source.videoHeight; resolve(); };
      source.onerror = () => reject(new Error("Reference fixture did not decode"));
    });
    w.__streamFixture = { mode: "still", source, streams: [], sockets: [], recordings: 0, replies: [], displayed: [], endedAt: null };
    source.addEventListener("ended", () => { w.__streamFixture.endedAt = performance.now(); });
    setInterval(() => {
      context.fillStyle = "#555"; context.fillRect(0, 0, canvas.width, canvas.height);
      if (w.__streamFixture.mode === "reference" && source.readyState >= 2) {
        const scale = Math.min(canvas.width / source.videoWidth, canvas.height / source.videoHeight);
        const width = source.videoWidth * scale, height = source.videoHeight * scale;
        context.drawImage(source, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      }
    }, 1000 / (fullHD ? 60 : 30));
    w.__playReference = async () => {
      await loaded; source.currentTime = 0; w.__streamFixture.mode = "reference";
      w.__streamFixture.startedAt = performance.now(); await source.play();
    };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async (constraints: MediaStreamConstraints) => {
      if (constraints.audio !== false) throw new Error("Audio requested");
      await loaded;
      if (fullHD && typeof constraints.video === "object") {
        const width = constraints.video.width as ConstrainULongRange;
        const height = constraints.video.height as ConstrainULongRange;
        canvas.width = Math.min(1920, width.max ?? 1920);
        canvas.height = Math.min(1080, height.max ?? 1080);
      }
      const stream = canvas.captureStream(fullHD ? 60 : 30); w.__streamFixture.streams.push(stream); return stream;
    } });
    const NativeRecorder = MediaRecorder;
    w.MediaRecorder = class extends NativeRecorder {
      start(timeslice?: number) { w.__streamFixture.recordings++; super.start(timeslice); }
    };
    new MutationObserver(() => {
      const heading = document.querySelector(".recognition-result h3")?.textContent;
      if (heading && heading !== w.__streamFixture.lastHeading) {
        w.__streamFixture.lastHeading = heading;
        w.__streamFixture.displayed.push({ heading, observedAt: performance.now(),
          sourceTime: source.currentTime, replaying: !source.paused && !source.ended });
      }
    }).observe(document, { subtree: true, childList: true, characterData: true });
  }, { reference: media.toString("base64"), fullHD });
}

test("TCN manual finish reaches the real classifier and shows unconfirmed candidates", async ({ page }) => {
  test.setTimeout(90000);
  const output = path.join(root, ".design-cache/recognition-result-20261019/browser");
  await mkdir(output, { recursive: true });
  await referenceCamera(page, false, ".design-cache/visign-references-20261014-v2/visign25-00.webm");
  await openCamera(page);
  await page.getByRole("combobox", { name: "Recognition model", exact: true }).click();
  await page.getByRole("option", { name: "TCN · 25 signs + OTHER (Experimental)", exact: true }).click();
  await page.getByRole("button", { name: "Auto on", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.length), { timeout: 45000 }).toBeGreaterThanOrEqual(8);
  await page.evaluate(() => {
    const source = (window as any).__streamFixture.source as HTMLVideoElement;
    source.loop = true; source.playbackRate = .7;
    return (window as any).__playReference();
  });
  const finish = page.getByRole("button", { name: "Recognize now", exact: true });
  await expect(finish).toBeEnabled();
  await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.at(-1)?.quality.history_frames), { timeout: 3000 }).toBeGreaterThanOrEqual(15);
  await finish.click();
  await page.evaluate(() => (window as any).__streamFixture.source.pause());
  await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.some((f: any) =>
    f.prediction?.quality.boundary_reason === "manual_finish")), { timeout: 10000 }).toBe(true);
  const result = await page.evaluate(() => (window as any).__streamFixture.replies.find((f: any) =>
    f.prediction?.quality.boundary_reason === "manual_finish").prediction);
  // Chao belongs to another vocabulary; this is a pipeline test, not GH accuracy.
  expect(result.status).toBe("rejected");
  expect(result.top_k).toEqual([]);
  expect(result.quality.candidate_top_k).toHaveLength(3);
  expect(result.quality.hand_coverage).toBeGreaterThanOrEqual(.5);
  const panel = page.getByRole("region", { name: "Model prediction", exact: true });
  await expect(panel.getByRole("heading", { name: "Sign not confirmed", exact: true })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Closest supported signs · unconfirmed", exact: true })).toBeVisible();
  for (const candidate of result.quality.candidate_top_k) {
    await expect(panel.getByText(candidate.display_name, { exact: true })).toBeVisible();
    await expect(panel.getByText(candidate.score.toFixed(6), { exact: true })).toBeVisible();
  }
  await expect(panel.locator(".recognition-result__word")).toHaveCount(0);
  for (const [width, height] of [[1440, 900], [1280, 720], [820, 1180]]) {
    await page.setViewportSize({ width, height });
    await panel.evaluate(node => node.scrollIntoView({ block: "center" }));
    await page.screenshot({ path: path.join(output, `manual-result-${width}.png`), fullPage: true });
  }
  const accessibility = await new AxeBuilder({ page }).include(".live-camera-card").analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("button", { name: "Auto off", exact: true }).click();
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.sockets.every((socket: WebSocket) => socket.readyState === WebSocket.CLOSED))).toBe(true);
  await writeFile(path.join(output, "manual-result.json"), JSON.stringify({ realWorker: true,
    physicalCamera: false, accuracyAcceptance: false, sourceVocabularyMatchesGH: false, result }, null, 2));
});

test("TCN tracking uses fresh frames and reports measured CPU and recovery costs", async ({ page }) => {
  test.setTimeout(180000);
  await referenceCamera(page, true, ".design-cache/visign-references-20261014-v2/visign25-00.webm");
  await openCamera(page);
  await page.getByRole("combobox", { name: "Recognition model", exact: true }).click();
  await page.getByRole("option", { name: "TCN · 25 signs + OTHER (Experimental)", exact: true }).click();
  await page.evaluate(() => {
    const w = window as any;
    w.__streamFixture.source.loop = true;
  });
  const runs: object[] = [];
  const output = path.join(root, ".design-cache/tracking-20261019/browser");
  await mkdir(output, { recursive: true });
  for (const [quality, width, height] of [["1080p · Detail", 1920, 1080], ["720p · Balanced", 1280, 720], ["540p · Speed", 960, 540]] as const) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => { (window as any).__streamFixture.replies = []; });
    if (quality !== "1080p · Detail") {
      await page.getByRole("combobox", { name: "Camera quality", exact: true }).click();
      await page.getByRole("option", { name: quality, exact: true }).click();
      await page.getByRole("button", { name: "Start camera", exact: true }).click();
      await expect(page.getByRole("button", { name: "Auto on", exact: true })).toBeEnabled();
    }
    await page.evaluate(() => (window as any).__playReference());
    await page.getByRole("button", { name: "Auto on", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.length), { timeout: 45000 }).toBeGreaterThanOrEqual(8);
    await page.evaluate(() => { (window as any).__streamFixture.replies = []; });
    await page.waitForTimeout(12000);
    const frames = await page.evaluate(() => (window as any).__streamFixture.replies);
    expect(frames.length).toBeGreaterThan(20);
    expect(frames.every((f: any) => f.quality.tracker_profile === "holistic-cpu2-recovery-v2")).toBe(true);
    expect(frames.every((f: any) => f.quality.resolution[0] === width && f.quality.resolution[1] === height)).toBe(true);
    expect(frames.every((f: any) => Number.isFinite(f.quality.bridge_ms) && Number.isFinite(f.quality.recovery_ms))).toBe(true);
    expect(frames.some((f: any) => f.quality.tracking.present.slice(33).some(Boolean))).toBe(true);
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i].sequence).toBe(frames[i-1].sequence + 1);
      expect(frames[i].timestamp_ms).toBeGreaterThan(frames[i-1].timestamp_ms);
    }
    await expect(page.getByText(/Experimental hand recovery is active/)).toBeVisible();
    for (const [viewWidth, viewHeight] of [[1440, 900], [1280, 720], [820, 1180]]) {
      await page.setViewportSize({ width: viewWidth, height: viewHeight });
      await page.screenshot({ path: path.join(output, `tracking-${width}-${viewWidth}.png`), fullPage: true });
    }
    await page.getByRole("button", { name: "Auto off", exact: true }).click();
    await page.getByRole("button", { name: "Stop camera", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.sockets.every((socket: WebSocket) =>
      socket.readyState === WebSocket.CLOSED))).toBe(true);
    // Socket closure precedes native worker teardown. This benchmark compares
    // steady state; rapid stop/start is a separate lifecycle concern.
    await page.waitForTimeout(1500);
    runs.push({ quality, frames, fps: (frames.length - 1) * 1000 / (frames.at(-1).observedAt - frames[0].observedAt) });
  }
  await writeFile(path.join(output, "tracking.json"), JSON.stringify({ realWorker: true,
    physicalCamera: false, sourceUpscaledForTransportLoad: true, accuracyAcceptance: false,
    browserGpuEnabled: process.env.SMARTGLOVE_TRACKING_BENCH_GPU === "1", runs,
  }, null, 2));
});

test("1080p lossless transport comparison measures real tracking without a pixel queue", async ({ page }) => {
  test.setTimeout(180000);
  await referenceCamera(page, true);
  await openCamera(page);
  // Adjust only the handshake delivered to the client. Keep binary camera frames
  // on the native socket: a Playwright proxy would skew large-frame throughput.
  await page.evaluate(() => {
    const w = window as any;
    const NativeSocket = WebSocket;
    w.WebSocket = class extends NativeSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        if (!String(url).includes("/recognition/stream")) return;
        this.addEventListener("message", event => {
          const data = JSON.parse(String(event.data));
          if (w.__forcePng && data.type === "ready") {
            delete data.frame_formats; data.max_fps = 15;
            Object.defineProperty(event, "data", { value: JSON.stringify(data) });
          }
        });
      }
    };
  });
  const runs: object[] = [];
  for (const mode of ["png-15", "rgba-60"]) {
    const legacy = mode === "png-15";
    await page.evaluate(value => { (window as any).__forcePng = value; }, legacy);
    await page.evaluate(() => { (window as any).__streamFixture.replies = []; });
    await page.getByRole("button", { name: "Auto on", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.length), { timeout: 45000 }).toBeGreaterThanOrEqual(8);
    await page.evaluate(() => { (window as any).__streamFixture.replies = []; });
    for (let repeat = 0; repeat < 3; repeat++) {
      await page.evaluate(() => (window as any).__playReference());
      await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.source.ended), { timeout: 15000 }).toBe(true);
    }
    const frames = await page.evaluate(() => (window as any).__streamFixture.replies.filter((f: any) => f.replaying));
    expect(frames.length).toBeGreaterThan(15);
    expect(frames.every((f: any) => f.quality.resolution[0] === 1920 && f.quality.resolution[1] === 1080)).toBe(true);
    expect(frames.every((f: any) => f.quality.frame_format === (legacy ? "png" : "rgba8"))).toBe(true);
    expect(frames.some((f: any) => f.quality.tracking.present.slice(33).some(Boolean))).toBe(true);
    runs.push({ mode, frames });
    await page.getByRole("button", { name: "Auto off", exact: true }).click();
    await page.waitForTimeout(500);
  }
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  await writeFile(path.join(evidence, "1080p-transport-comparison.json"), JSON.stringify({
    realWorker: true, physicalCamera: false, sourceUpscaledForTransportLoad: true,
    accuracyAcceptance: false, historicalBinaryBaseline: false, runs,
  }, null, 2));
});

test("real Chào reference replay produces provisional words while video is moving", async ({ page }) => {
  test.setTimeout(90000);
  await referenceCamera(page);
  let clips = 0;
  page.on("request", request => { if (request.url().includes("/recognition/live-jobs") && request.method() === "POST") clips++; });
  await openCamera(page);
  await page.getByRole("button", { name: "Auto on", exact: true }).click();
  // Prime the actual worker with neutral frames before the source starts. This keeps
  // model startup separate from gesture timing without bypassing any inference.
  await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.length), { timeout: 45000 }).toBeGreaterThanOrEqual(8);
  await page.evaluate(() => (window as any).__playReference());
  await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.some((frame: any) =>
    frame.phase === "provisional" && frame.prediction?.status === "ok" && frame.replaying)), { timeout: 15000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__streamFixture.replies.some((frame: any) =>
    frame.phase === "final")), { timeout: 15000 }).toBe(true);
  const result = await page.evaluate(() => {
    const fixture = (window as any).__streamFixture;
    return { startedAt: fixture.startedAt, endedAt: fixture.endedAt, duration: fixture.source.duration,
      playbackRate: fixture.source.playbackRate, width: fixture.source.videoWidth, height: fixture.source.videoHeight,
      replies: fixture.replies, displayed: fixture.displayed, recordings: fixture.recordings };
  });
  const provisional = result.replies.filter((frame: any) => frame.phase === "provisional");
  expect(result.replies.some((frame: any) => frame.quality.tracking?.schema === "holistic-overlay-v1"
    && frame.quality.tracking.xy.length === 75 && frame.quality.tracking.present.slice(33).some(Boolean))).toBe(true);
  expect(result.displayed.some((frame: any) => frame.heading.startsWith("Tentative prediction:") && frame.replaying)).toBe(true);
  expect(provisional.some((frame: any) => frame.prediction?.status === "ok")).toBe(true);
  expect(result.recordings).toBe(0); expect(clips).toBe(0);
  await page.getByRole("region", { name: "Model prediction", exact: true }).evaluate(node => node.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: path.join(evidence, "real-chao-replay.png"), fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Auto off", exact: true }).click();
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  await writeFile(path.join(evidence, "real-chao-replay.json"), JSON.stringify({
    sourceLabel: "Chào", sourceSha256: "2d48e37cacbf514df6b41ddab124b0435cbf262c380cfaad637dbfc687560f60",
    fixturePath: ".design-cache/visign-app-20261012/reference.webm", derivedCodec: "VP8",
    syntheticMedia: true, realWorker: true, physicalCamera: false, accuracyAcceptance: false,
    clipUploads: clips, ...result,
  }, null, 2));
});
