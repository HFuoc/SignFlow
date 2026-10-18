import { randomBytes } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const root = path.resolve(import.meta.dirname, "../../../..");
const evidence = path.join(root, ".design-cache/kvsl-phase5a/dataset-regression");
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

test.use({ trace: "off" }); // Authenticated network traces can contain RAM-only bridge credentials.

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

async function mock(page: Page, options: {unavailable?: boolean; unsupported?: boolean; status?: string; delaySamples?: boolean} = {}) {
  const state = { status: options.status ?? "queued", submitted: 0, polls: 0, cancelled: 0, failPoll: false };
  await page.route("**/api/v1/recognition/**", async route => {
    const url = new URL(route.request().url());
    if (options.delaySamples && url.pathname.endsWith("/samples")) await new Promise(resolve => setTimeout(resolve, 1500));
    let result: unknown;
    if (url.pathname.endsWith("/models")) result = {models: [{...model, availability: options.unavailable ? "unavailable" : "available", reason: options.unavailable ? "Local environment unavailable" : null}]};
    else if (url.pathname.endsWith("/samples")) result = {samples: [{...sample, supported: !options.unsupported},
      {...sample, supported: !options.unsupported, sample_id: "kvsl:do_vat:W00170", recording_id: "kvsl:W00170", filename: "W00170.mp4", display_label: "Nhãn tiếng Việt dài để kiểm tra hiển thị"}]};
    else if (url.pathname.endsWith("/jobs") && route.request().method() === "POST") { state.submitted++; result = job("queued"); }
    else if (url.pathname.endsWith("/jobs")) result = {jobs: []};
    else if (route.request().method() === "DELETE") { state.cancelled++; state.status = "cancelled"; result = job("cancelled"); }
    else { state.polls++; if (state.failPoll) {state.failPoll = false; await route.fulfill({status: 503, json: {code:"backend_error"}}); return;} result = job(state.status); }
    if (result && typeof result === "object" && "job_id" in result) result = {...result, job_id: "test-job-" + state.submitted};
    await route.fulfill({json: result});
  });
  return state;
}

test("sample selection, Unicode, queued/running/top-k, terminal polling", async ({page}) => {
  const state = await mock(page);
  await open(page);
  const run = page.getByRole("button", {name: "Recognize", exact: true});
  await expect(run).toBeEnabled();
  await page.getByRole("combobox", {name: "KVSL recording"}).click();
  await expect(page.getByRole("option", {name: /Nhãn tiếng Việt/})).toBeVisible();
  await page.keyboard.press("Escape");
  await run.click();
  await expect(page.getByRole("status").filter({hasText: "Queued"})).toBeVisible();
  await expect(run).toBeDisabled();
  state.status = "running";
  await expect(page.getByRole("status").filter({hasText: "Running"})).toBeVisible();
  state.status = "succeeded";
  await expect(page.getByRole("heading", {name: "Prediction: ca"})).toBeVisible();
  await expect(page.getByText("Dataset label", {exact: true})).toBeVisible();
  await expect(page.getByRole("region", {name:"Model prediction"})).toContainText("cày");
  await expect(page.getByRole("region", {name:"Model prediction"})).toContainText("bộ sách");
  await expect(page.getByRole("region", {name:"Model prediction"})).toContainText("0.4356");
  const polls = state.polls;
  await page.waitForTimeout(1400);
  expect(state.polls).toBe(polls);
  expect(state.submitted).toBe(1);
});

for (const kind of ["unavailable", "unsupported"] as const) test(kind + " disables recognition", async ({page}) => {
  await mock(page, {[kind]:true}); await open(page);
  await expect(page.getByRole("button", {name:"Recognize", exact:true})).toBeDisabled();
  await expect(page.getByText("Recognition unavailable", {exact:true})).toBeVisible();
});

test("failure, retry connection, and truthful cancellation", async ({page}) => {
  const state = await mock(page, {status:"failed"}); await open(page);
  await page.getByRole("button", {name:"Recognize", exact:true}).click();
  await expect(page.getByText("The recognition worker timed out. You can try again.")).toBeVisible();
  state.status = "running";
  await page.getByRole("button", {name:"Recognize", exact:true}).click();
  await page.getByRole("button", {name:"Cancel recognition", exact:true}).click();
  await expect(page.getByRole("status").filter({hasText:"Cancelled"})).toBeVisible();
  expect(state.cancelled).toBe(1);
});

test("temporary polling error recovers and unmount stops polling", async ({page}) => {
  const state = await mock(page, {status:"running"}); await open(page);
  state.failPoll = true;
  await page.getByRole("button", {name:"Recognize", exact:true}).click();
  await expect(page.getByText("Status temporarily unavailable", {exact:true})).toBeVisible();
  await expect(page.getByRole("status").filter({hasText:"Running"})).toBeVisible();
  await expect(page.getByText("Status temporarily unavailable", {exact:true})).toHaveCount(0);
  await page.getByRole("button", {name:"Show navigation", exact:true}).click();
  await page.locator("#app-navigation").getByRole("button", {name:"Devices", exact:true}).click();
  await expect(page.getByTestId("device-manager")).toBeVisible();
  const polls = state.polls;
  await page.waitForTimeout(1400);
  expect(state.polls).toBe(polls);
});

test("real W00395 through Studio and real worker", async ({page}) => {
  test.skip(process.env.RECOGNITION_REAL !== "1", "Explicit local ML smoke only");
  test.setTimeout(150000);
  await open(page);
  await page.getByRole("combobox", {name:"KVSL topic", exact:true}).click();
  await page.getByRole("option", {name:"Đồ vật", exact:true}).click();
  await page.getByRole("combobox", {name:"KVSL recording"}).click();
  await page.getByRole("option", {name:"W00395.mp4 · ca", exact:true}).click();
  const response = page.waitForResponse(r => r.url().endsWith("/recognition/jobs") && r.request().method() === "POST");
  await page.getByRole("button", {name:"Recognize", exact:true}).click();
  const submitted = await (await response).json();
  await expect(page.getByRole("heading", {name:"Prediction: ca"})).toBeVisible({timeout:60000});
  const headers = {Authorization:"Bearer " + token, Origin:"http://127.0.0.1:5173"};
  const result = await (await page.request.get(origin + "/api/v1/recognition/jobs/" + submitted.job_id, {headers})).json();
  expect(result.prediction.top_k.map((x: {display_name:string}) => x.display_name)).toEqual(["ca", "cày", "bộ sách"]);
  expect(result.prediction.quality.worker_exit_status).toBeNull();
  await writeFile(path.join(evidence,"real-ui-result.json"),JSON.stringify(result,null,2));
  await page.getByRole("combobox", {name:"KVSL topic", exact:true}).click();
  await page.getByRole("option", {name:"Câu hỏi", exact:true}).click();
  await expect(page.getByRole("region", {name:"Model prediction"})).toHaveCount(0);
  await page.getByRole("combobox", {name:"KVSL recording"}).click();
  await page.getByRole("option", {name:"D0098.mp4 · có … không?", exact:true}).click();
  const newResponse = page.waitForResponse(r => r.url().endsWith("/recognition/jobs") && r.request().method() === "POST");
  await page.getByRole("button", {name:"Recognize", exact:true}).click();
  const newJob = await (await newResponse).json();
  expect(newJob.provider_id).toBe("kvsl-gcn-cau-hoi");
  await expect(page.getByRole("combobox", {name:"KVSL topic", exact:true})).toBeDisabled();
  await expect(page.getByRole("heading", {name:"Prediction: có … không?", exact:true})).toBeVisible({timeout:60000});
  const newResult = await (await page.request.get(origin + "/api/v1/recognition/jobs/" + newJob.job_id, {headers})).json();
  expect(newResult.prediction.quality.worker_exit_status).toBeNull();
  expect(newResult.prediction.topic_id).toBe("cau_hoi");
  expect(newResult.prediction.top_k.map((x: {display_name:string}) => x.display_name)).toEqual(["có … không?", "bao nhiêu?", "bao giờ?"]);
  await writeFile(path.join(evidence,"real-ui-new-topic.json"),JSON.stringify(newResult,null,2));
  for(const [width,height] of [[1440,900],[1280,720],[820,1180]]) for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height});
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    await page.locator(".recognition-card").scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(evidence,theme+"-"+width+".png"),fullPage:true});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({page}).include(".recognition-card").withTags(["wcag2a","wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  }
});

test("topic switching filters samples, clears results and sends the correct provider", async ({page}) => {
  const questionModel = {...model, provider_id:"kvsl-gcn-cau-hoi", topic_id:"cau_hoi", display_name:"Câu hỏi", class_count:10};
  const question = {...sample, sample_id:"kvsl:cau_hoi:D0098", filename:"D0098.mp4", topic_id:"cau_hoi", provider_id:questionModel.provider_id, display_label:"có … không?"};
  let submitted: {sample_id:string; provider_id:string} | null = null;
  let complete = false;
  await page.route("**/api/v1/recognition/**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/models")) return route.fulfill({json:{models:[
      {...model, display_name:"Đồ vật", class_count:20, availability:"available"},
      {...questionModel, availability:"available"},
      {...questionModel, provider_id:"kvsl-gcn-gia-dinh", topic_id:"gia_dinh", display_name:"Gia đình", class_count:24, availability:"unavailable"}]}});
    if (url.pathname.endsWith("/samples")) return route.fulfill({json:{samples:[sample,question]}});
    if (route.request().method() === "POST") submitted = route.request().postDataJSON();
    else if (url.pathname.endsWith("/jobs")) return route.fulfill({json:{jobs:[]}});
    return route.fulfill({json:{...job(complete ? "succeeded" : "running"), ...submitted,
      prediction:complete ? {...prediction, sample_id:question.sample_id, provider_id:question.provider_id,
        top_k:[{label_id:"kvsl:cau_hoi:2", display_name:"có … không?", score:.75}]} : null}});
  });
  await open(page);
  await page.getByRole("combobox", {name:"KVSL topic", exact:true}).click();
  await expect(page.getByRole("option", {name:"Gia đình · Unavailable", exact:true})).toBeDisabled();
  await page.getByRole("option", {name:"Câu hỏi", exact:true}).click();
  await page.getByRole("combobox", {name:"KVSL recording"}).click();
  await expect(page.getByRole("option", {name:/W00395/})).toHaveCount(0);
  await page.getByRole("option", {name:"D0098.mp4 · có … không?", exact:true}).click();
  await page.getByRole("button", {name:"Recognize", exact:true}).click();
  await expect(page.getByRole("combobox", {name:"KVSL topic", exact:true})).toBeDisabled();
  await expect.poll(() => submitted).toEqual({sample_id:question.sample_id,provider_id:question.provider_id});
  complete = true;
  await expect(page.getByRole("heading", {name:"Prediction: có … không?", exact:true})).toBeVisible();
  await page.getByRole("combobox", {name:"KVSL topic", exact:true}).click();
  await page.getByRole("option", {name:"Đồ vật", exact:true}).click();
  await expect(page.getByRole("region", {name:"Model prediction"})).toHaveCount(0);
  await expect(page.getByRole("combobox", {name:"KVSL recording"})).toContainText("W00395");
});


test("loading, long labels, failure and cancel controls in both themes", async ({page}) => {
  const state = await mock(page, {status:"running", delaySamples:true});
  await open(page);
  await expect(page.getByText("Loading local dataset", {exact:true})).toBeVisible();
  await page.screenshot({path:path.join(evidence,"loading.png")});
  await page.setViewportSize({width:1280,height:720});
  await page.getByRole("combobox", {name:"KVSL recording"}).click();
  await page.getByRole("option", {name:/Nhãn tiếng Việt dài/}).click();
  await expect(page.getByText("Dataset label", {exact:true})).toBeVisible();
  await page.getByRole("combobox", {name:"KVSL recording"}).click();
  await page.getByRole("option", {name:"W00395.mp4 · ca", exact:true}).click();
  await page.getByRole("button", {name:"Recognize", exact:true}).click();
  await expect(page.getByRole("status").filter({hasText:"Running"})).toBeVisible();
  for (const theme of ["light","dark"]) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    await page.locator(".recognition-card").scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(evidence,"running-"+theme+".png")});
    const axe = await new AxeBuilder({page}).include(".recognition-card").withTags(["wcag2a","wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  }
  state.status = "failed";
  await expect(page.getByText("The recognition worker timed out. You can try again.")).toBeVisible();
  for (const theme of ["light","dark"]) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    await page.screenshot({path:path.join(evidence,"failure-"+theme+".png")});
  }
});
