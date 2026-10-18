import { randomBytes } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const root = path.resolve(import.meta.dirname, "../../../..");
const evidence = path.join(root, ".design-cache/kvsl-phase5a/browser");
const modelEvidence = path.join(root, ".design-cache/visign-app-20261012/browser");
const token = randomBytes(32).toString("base64url");
let child: ChildProcessWithoutNullStreams;
let origin: string;
let diagnostics = "";
let exit: Promise<number | null>;
const sample = { sample_id: "kvsl:do_vat:W00395", recording_id: "kvsl:W00395", filename: "W00395.mp4",
  topic_id: "do_vat", label_id: "kvsl:do_vat:7", display_label: "ca", asset_status: "valid",
  provider_id: "kvsl-gcn-do-vat", supported: true, reason: null };
const model = { provider_id: sample.provider_id, topic_id: "do_vat", display_name: "KVSL GCN", class_count: 20,
  modality: "mediapipe_keypoints", preprocessing_id: "kvsl-gcn-do-vat-60x65x3-v1", availability: "available", reason: null };
const prediction = { schema_version: "smartglove-prediction-result-v1", sample_id: sample.sample_id,
  recording_id: sample.recording_id, provider_id: sample.provider_id, topic_id: "do_vat", status: "ok",
  preprocessing_id: model.preprocessing_id, score_kind: "uncalibrated_softmax", latency_ms: {total: 123},
  top_k: [{label_id: "7", display_name: "ca", score: .4356}, {label_id: "13", display_name: "cày", score: .1357},
    {label_id: "5", display_name: "bộ sách", score: .1329}] };
const job = (status: string) => ({schema_version: "smartglove-recognition-job-v1", job_id: "test-job", sample_id: sample.sample_id,
  provider_id: sample.provider_id, status, created_at: "2026-10-10T00:00:00Z", started_at: null, finished_at: null,
  prediction: status === "succeeded" ? prediction : null, error: status === "failed" ? {code: "worker_timeout", message: "test"} : null,
  cancel_requested: false});

test.use({ trace: "off", launchOptions: {args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--disable-gpu"]} }); // Authenticated network traces can contain RAM-only bridge credentials.

test.beforeAll(async () => {
  await mkdir(evidence, {recursive: true});
  child = spawn(path.join(root, ".venv/Scripts/python.exe"), ["-m", "app.desktop_collector.shell", "--e2e-server", "--dev", "--vite-origin", "http://127.0.0.1:5173"],
    {cwd: root, windowsHide: true, stdio: "pipe"});
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
  const code = await Promise.race([exit, new Promise(resolve => setTimeout(() => resolve("timeout"), 10000))]);
  if (code === "timeout") child.kill();
  expect(code, diagnostics.replaceAll(token, "[redacted]")).toBe(0);
});

async function open(page: Page) {
  const headers = {Authorization: "Bearer " + token, Origin: "http://127.0.0.1:5173"};
  const auth = await (await page.request.get(origin + "/api/v1/auth/status", {headers})).json();
  const password = "Recognition test passphrase 2026";
  const route = auth.setup_required ? "setup" : "login";
  const response = await page.request.post(origin + "/api/v1/auth/" + route,
    {headers, data: {username: "phase2", password, ...(auth.setup_required ? {password_confirmation: password} : {})}});
  expect(response.ok()).toBeTruthy();
  // Test harness injects credentials in RAM into the real app entry. No secret in URLs/storage/artifacts.
  await page.route(/\/src\/main\.tsx(?:\?.*)?$/, async route => {
    const original = await route.fetch();
    const body = (await original.text()).replace("consumeLaunchCredentials()", JSON.stringify({apiOrigin: origin, token}));
    await route.fulfill({response: original, body});
  });
  await page.emulateMedia({colorScheme: "light", reducedMotion: "reduce"});
  await page.goto("/");
  await expect(page.getByTestId("device-manager")).toBeVisible();
  await page.getByRole("button", {name: "Show navigation", exact: true}).click();
  await page.locator("#app-navigation").getByRole("button", {name: "Studio", exact: true}).click();
  await page.getByRole("button", {name: "Open Dataset", exact: true}).click();
  await expect(page.getByRole("heading", {name: "KVSL Dataset", exact: true})).toBeVisible();
}


test("fake camera records twice through real worker, cancels, and releases on navigation", async ({page}) => {
  test.setTimeout(180000);
  await open(page);
  await page.getByRole("button", {name:"Live Camera",exact:true}).click();
  await page.getByRole("combobox", {name:"Recognition model",exact:true}).click();
  await page.getByRole("option", {name:"KVSL · topic models",exact:true}).click();
  await page.getByRole("button", {name:"Start camera",exact:true}).click();
  await expect(page.getByText("Camera ready", {exact:true})).toBeVisible();
  await expect.poll(() => page.locator("video").evaluate((element: HTMLVideoElement) => element.videoWidth)).toBeGreaterThan(0);
  await page.getByRole("combobox", {name:"KVSL topic",exact:true}).click();
  await page.getByRole("option", {name:"Đồ vật",exact:true}).click();
  const results: unknown[]=[];
  for (let index=0;index<2;index++) {
    const posted=page.waitForResponse(response => response.url().includes("/recognition/live-jobs") && response.request().method()==="POST");
    await page.getByRole("button", {name:index ? "Capture again" : "Capture sign",exact:true}).click();
    await expect(page.getByText("Ready · 3",{exact:true})).toBeVisible();
    await expect(page.getByRole("combobox",{name:"KVSL topic",exact:true})).toBeDisabled();
    await expect(page.getByText("Recording · perform one sign for 4 seconds",{exact:true})).toBeVisible();
    const response=await posted; expect(response.status()).toBe(202);
    const submitted=await response.json();
    // Synthetic fake-device media only, transient input for independent lifecycle probes.
    if(index===0) await writeFile(path.join(root,".design-cache/kvsl-phase5a/synthetic.webm"),response.request().postDataBuffer()!);
    await expect(page.getByRole("region", {name:"Model prediction"})).toBeVisible({timeout:60000});
    const result=await (await page.request.get(origin+"/api/v1/recognition/jobs/"+submitted.job_id,
      {headers:{Authorization:"Bearer "+token,Origin:"http://127.0.0.1:5173"}})).json();
    expect(result.prediction.source_kind).toBe("live_camera_capture");
    expect(result.prediction.sample_id).toBeNull();
    expect(result.prediction.quality.cache_hit).toBe(index===1);
    expect(result.prediction.top_k).toHaveLength(3);
    results.push(result);
  }
  await writeFile(path.join(evidence,"synthetic-results.json"),JSON.stringify(results,null,2));
  for(const [width,height] of [[1440,900],[1280,720],[820,1180]]) for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height});
    await page.evaluate(theme => document.documentElement.dataset.theme=theme,theme);
    await page.locator(".recognition-card").scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(evidence,theme+"-"+width+".png"),fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    expect((await new AxeBuilder({page}).include(".recognition-card").withTags(["wcag2a","wcag2aa"]).analyze()).violations).toEqual([]);
  }
  await page.getByRole("button",{name:"Capture again",exact:true}).click();
  await page.getByRole("button",{name:"Cancel capture",exact:true}).click();
  await expect(page.getByRole("button",{name:"Capture sign",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Capture sign",exact:true}).click();
  await expect(page.getByRole("button",{name:"Cancel recognition",exact:true})).toBeVisible({timeout:20000});
  await page.getByRole("button",{name:"Cancel recognition",exact:true}).click();
  await expect(page.getByText("Cancelled",{exact:true})).toBeVisible({timeout:15000});
  await expect(page.getByRole("button",{name:"Capture again",exact:true})).toBeEnabled();
  await page.evaluate(()=>{(window as any).__testTracks=(document.querySelector("video")!.srcObject as MediaStream).getTracks();});
  await page.getByRole("button",{name:"Dataset",exact:true}).last().click();
  expect(await page.evaluate(()=>(window as any).__testTracks.every((track:MediaStreamTrack)=>track.readyState==="ended"))).toBe(true);
});

test("experimental model needs no topic, locks during capture, renders signed scores and switches back", async ({page}) => {
  test.setTimeout(60000);
  let status = "running";
  let submittedTopic = "";
  const responseJob = () => ({...job(status), provider_id: "visign-ridge-25", sample_id: null,
    source_kind: "live_camera_capture", capture_id: "a".repeat(32),
    prediction: status === "succeeded" ? {...prediction, provider_id: "visign-ridge-25", topic_id: "visign25",
      sample_id: null, recording_id: null, score_kind: "raw_ridge",
      top_k: [{label_id:"0", display_name:"Chào", score:1.4}, {label_id:"1",display_name:"Chúng ta",score:-.1},
        {label_id:"2",display_name:"Có thể",score:-.2}]} : null});
  await page.route("**/api/v1/recognition/live-jobs?*", async route => {
    submittedTopic = new URL(route.request().url()).searchParams.get("topic_id") ?? "";
    await route.fulfill({status:202,json:responseJob()});
  });
  await page.route("**/api/v1/recognition/jobs/test-job", route => route.fulfill({json:responseJob()}));
  await open(page);
  await page.getByRole("button",{name:"Live Camera",exact:true}).click();
  const picker = page.getByRole("combobox",{name:"Recognition model",exact:true});
  await expect(picker).toContainText("ViSign");
  await expect(page.getByRole("combobox",{name:"KVSL topic",exact:true})).toHaveCount(0);
  await page.getByText("25 supported signs",{exact:true}).click();
  await expect(page.getByRole("region",{name:"Recognition model",exact:true})).toContainText("Đồng ý");
  await page.getByRole("button",{name:"Start camera",exact:true}).click();
  await expect(page.getByRole("button",{name:"Capture sign",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Capture sign",exact:true}).click();
  await expect(picker).toBeDisabled();
  await expect.poll(()=>submittedTopic,{timeout:15000}).toBe("visign25");
  await expect(picker).toBeDisabled();
  status = "succeeded";
  await expect(page.getByRole("heading",{name:"Prediction: Chào"})).toBeVisible();
  await page.getByText("Scores and model details", {exact:true}).click();
  await expect(page.getByText("Raw model scores; these are not probabilities or accuracy measurements.",{exact:true})).toBeVisible();
  await expect(page.getByText("-0.1000",{exact:true})).toBeVisible();
  await mkdir(modelEvidence,{recursive:true});
  for(const [width,height] of [[1440,900],[1280,720],[820,1180]]) for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height});
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await page.getByRole("region",{name:"Recognition model",exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(modelEvidence,theme+"-"+width+".png"),fullPage:true,animations:"disabled"});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    expect((await new AxeBuilder({page}).include(".recognition-card").withTags(["wcag2a","wcag2aa"]).analyze()).violations).toEqual([]);
  }
  await page.getByRole("button",{name:"Auto on",exact:true}).click();
  await expect(picker).toBeDisabled();
  await page.getByRole("button",{name:"Auto off",exact:true}).click();
  await picker.click();
  await page.getByRole("option",{name:"KVSL · topic models",exact:true}).click();
  await expect(page.getByRole("region",{name:"Model prediction"})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Capture sign",exact:true})).toBeDisabled();
  await page.getByRole("combobox",{name:"KVSL topic",exact:true}).click();
  await page.getByRole("option",{name:"Đồ vật",exact:true}).click();
  await expect(page.getByRole("button",{name:"Capture sign",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Stop camera",exact:true}).click();
});

test("loading catalog cannot overwrite a user's model choice", async ({page}) => {
  await page.route("**/api/v1/recognition/models", async route => {
    const response = await route.fetch();
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.fulfill({response});
  });
  await open(page);
  await page.getByRole("button",{name:"Live Camera",exact:true}).click();
  const picker = page.getByRole("combobox",{name:"Recognition model",exact:true});
  await expect(picker).toBeDisabled();
  await expect(picker).toBeEnabled();
  await picker.click();
  await page.getByRole("option",{name:"KVSL · topic models",exact:true}).click();
  await expect(page.getByRole("combobox",{name:"KVSL topic",exact:true})).toBeVisible();
  await expect(picker).toContainText("KVSL");
});

test("real research worker rejects fake camera without hands through authenticated live jobs", async ({page}) => {
  test.setTimeout(60000);
  await open(page);
  await page.getByRole("button",{name:"Live Camera",exact:true}).click();
  await expect(page.getByRole("combobox",{name:"Recognition model",exact:true})).toContainText("ViSign");
  await page.getByRole("button",{name:"Start camera",exact:true}).click();
  const posted = page.waitForResponse(r=>r.url().includes("/recognition/live-jobs") && r.request().method()==="POST");
  await page.getByRole("button",{name:"Capture sign",exact:true}).click();
  const response = await posted;
  expect(response.status()).toBe(202);
  expect((await response.json()).provider_id).toBe("visign-ridge-25");
  await expect(page.getByText("Keep both hands and your upper body visible, then try again.",{exact:true})).toBeVisible({timeout:40000});
  await expect(page.getByRole("button",{name:"Capture again",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Stop camera",exact:true}).click();
});

test("TCN capture, landmark replay and Auto use the real workers with the new vocabulary", async ({page}) => {
  test.setTimeout(180000);
  await open(page);
  await page.getByRole("button", {name:"Live Camera", exact:true}).click();
  const picker = page.getByRole("combobox", {name:"Recognition model", exact:true});
  await picker.click();
  await page.getByRole("option", {name:"TCN · 25 signs + OTHER (Experimental)", exact:true}).click();
  await expect(page.getByRole("combobox", {name:"KVSL topic", exact:true})).toHaveCount(0);
  await page.getByText("25 supported signs", {exact:true}).click();
  await expect(page.getByRole("region", {name:"Recognition model", exact:true})).toContainText("HUYẾT-ÁP");
  await expect(page.getByRole("region", {name:"Landmark replay", exact:true})).toBeVisible();
  const reference = page.getByLabel("Landmark replay: TÔI", {exact:true});
  await expect.poll(() => reference.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThanOrEqual(2);
  await page.getByRole("button", {name:"Start camera", exact:true}).click();
  await expect(page.getByRole("button", {name:"Capture sign", exact:true})).toBeEnabled();
  await expect(page.getByRole("button", {name:"Auto on", exact:true})).toBeEnabled();
  const results = [];
  for (let index = 0; index < 2; index++) {
    const posted = page.waitForResponse(r => r.url().includes("/recognition/live-jobs") && r.request().method() === "POST");
    await page.getByRole("button", {name:index ? "Capture again" : "Capture sign", exact:true}).click();
    await expect(picker).toBeDisabled();
    const finish = page.getByRole("button", {name:"Finish capture", exact:true});
    await expect(finish).toBeVisible();
    await page.waitForTimeout(1000); // Enough fake-device frames to exercise landmark preprocessing.
    await finish.click();
    const response = await posted;
    expect(response.status()).toBe(202);
    const submitted = await response.json();
    expect(submitted.provider_id).toBe("vsl-gh-tcn-25");
    await expect(page.getByText("Keep both hands and your upper body visible, then try again.", {exact:true})).toBeVisible({timeout:60000});
    const result = await (await page.request.get(origin + "/api/v1/recognition/jobs/" + submitted.job_id,
      {headers:{Authorization:"Bearer " + token, Origin:"http://127.0.0.1:5173"}})).json();
    expect(result.provider_id).toBe("vsl-gh-tcn-25");
    expect(result.status).toBe("failed");
    expect(result.error.code).toBe("hands_missing");
    expect(result.prediction).toBeNull();
    results.push(result);
    await expect(page.getByRole("button", {name:"Capture again", exact:true})).toBeEnabled();
  }
  const replies: any[] = [];
  page.on("websocket", socket => {
    if (!socket.url().includes("/recognition/stream")) return;
    socket.on("framereceived", event => {
      const value = JSON.parse(String(event.payload));
      if (replies.length < 20 && ["ready", "frame", "error"].includes(value.type)) replies.push(value);
    });
  });
  await page.getByRole("button", {name:"Auto on", exact:true}).click();
  await expect.poll(() => replies.some(r => r.type === "ready" && r.provider_id === "vsl-gh-tcn-25"), {timeout:60000}).toBe(true);
  await expect.poll(() => replies.filter(r => r.type === "frame").length, {timeout:30000}).toBeGreaterThanOrEqual(3);
  expect(replies.some(r => r.type === "error")).toBe(false);
  expect(replies.filter(r => r.type === "frame").every(r => r.prediction === null)).toBe(true);
  await expect(page.getByTestId("camera-tracking-overlay")).toBeVisible();
  await page.getByRole("button", {name:"Replay reference", exact:true}).click();
  await expect.poll(() => reference.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0);
  await expect(picker).toBeDisabled();
  await page.getByRole("button", {name:"Auto off", exact:true}).click();
  await expect(picker).toBeEnabled();
  const folder = path.join(root, ".design-cache/gh-tcn-auto-20261018/browser");
  await mkdir(folder, {recursive:true});
  await writeFile(path.join(folder, "synthetic-results.json"), JSON.stringify(results, null, 2));
  await writeFile(path.join(folder, "synthetic-stream.json"), JSON.stringify(replies, null, 2));
  for (const [width, height] of [[1440,900], [1280,720], [820,1180]]) {
    await page.setViewportSize({width,height});
    await page.getByRole("region", {name:"Recognition model", exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(folder, `tcn-${width}.png`), fullPage:true});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  expect((await new AxeBuilder({page}).include(".recognition-card").withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("button", {name:"Stop camera", exact:true}).click();
});
