import { randomBytes } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const root = path.resolve(import.meta.dirname, "../../../..");
const evidence = path.join(root, ".design-cache/kvsl-phase5b/browser");
const token = randomBytes(32).toString("base64url");
let child: ChildProcessWithoutNullStreams;
let origin: string;
let diagnostics = "";
let exit: Promise<number | null>;
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

async function cameraFixture(page: Page) {
  const reference = await readFile(path.join(root, ".design-cache/kvsl-phase0a/assets/W00395.mp4"));
  await page.addInitScript(({reference}) => {
    const w = window as any;
    const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 360;
    const ctx = canvas.getContext("2d")!;
    const source = document.createElement("video"); source.muted = true; source.playsInline = true;
    source.src = URL.createObjectURL(new Blob([Uint8Array.from(atob(reference), x=>x.charCodeAt(0))], {type:"video/mp4"}));
    let mode = "still", counter = 0;
    w.__media = { events: [], streams: [], recorders: 0, maximumRecorders: 0, frames: 0 };
    const draw = () => {
      counter++; w.__media.frames++;
      ctx.fillStyle = mode === "brightness" ? "#bbb" : "#555"; ctx.fillRect(0,0,640,360);
      if (mode === "reference" && source.readyState >= 2) ctx.drawImage(source,0,0,640,360);
      else if (mode === "motion") { ctx.fillStyle = counter%6<3 ? "#ddd" : "#222"; ctx.fillRect(220,90,200,180); }
      else if (mode === "small") { ctx.fillStyle = counter%6<3 ? "#ddd" : "#222"; ctx.fillRect(300,150,12,12); }
      else if (mode === "edge") { ctx.fillStyle = counter%6<3 ? "#ddd" : "#222"; ctx.fillRect(0,0,45,360); }
    };
    setInterval(draw,1000/30); draw();
    w.__pattern = async (next: string) => {
      source.pause(); mode = next;
      w.__media.events.push({kind:"pattern",value:next,time:performance.now()});
      if(next === "reference") { source.currentTime = 0; await source.play(); }
    };
    Object.defineProperty(navigator.mediaDevices,"getUserMedia", {value: async (constraints: MediaStreamConstraints) => {
      if(constraints.audio !== false) throw new Error("Audio requested");
      const stream = canvas.captureStream(30); w.__media.streams.push(stream); return stream;
    }});
    const NativeRecorder = MediaRecorder;
    w.MediaRecorder = class extends NativeRecorder {
      start(timeslice?: number) {
        w.__media.recorders++; w.__media.maximumRecorders = Math.max(w.__media.maximumRecorders,w.__media.recorders);
        w.__media.events.push({kind:"record_start",time:performance.now()});
        this.addEventListener("stop",()=>{w.__media.recorders--;w.__media.events.push({kind:"record_stop",time:performance.now()});},{once:true});
        super.start(timeslice);
      }
    };
    new MutationObserver(()=>{
      const state=document.querySelector("[data-activity-state]")?.getAttribute("data-activity-state");
      if(state && state!==w.__media.lastState) {w.__media.lastState=state;w.__media.events.push({kind:"state",value:state,time:performance.now()});}
    }).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:["data-activity-state"]});
  }, {reference:reference.toString("base64")});
}
const state = (page:Page) => page.locator("[data-activity-state]");
async function pattern(page:Page, value:string) { await page.evaluate(value=>(window as any).__pattern(value),value); }
async function ready(page:Page) {
  await cameraFixture(page); await open(page);
  await page.getByRole("button",{name:"Live Camera",exact:true}).click();
  await page.getByRole("combobox",{name:"Recognition model",exact:true}).click();
  await page.getByRole("option",{name:"KVSL · topic models",exact:true}).click();
  await expect(page.getByRole("button",{name:"Auto off",exact:true})).toHaveAttribute("aria-pressed","true");
  await page.getByRole("button",{name:"Start camera",exact:true}).click();
  await expect(page.getByText("Camera ready",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Auto on",exact:true})).toBeDisabled();
  await page.getByRole("combobox",{name:"KVSL topic",exact:true}).click();
  await page.getByRole("option",{name:"Đồ vật",exact:true}).click();
  await page.getByRole("button",{name:"Auto on",exact:true}).click();
  await expect(state(page)).toHaveAttribute("data-activity-state","calibrating");
  await expect(state(page)).toHaveAttribute("data-activity-state","armed");
}

test("three automatic reference-camera clips use real ML, recover cancellation and retain one stream", async ({page}) => {
  test.setTimeout(240000); await ready(page);
  const results:any[]=[]; const posts:string[]=[];
  page.on("response",response=>{if(response.url().includes("/recognition/live-jobs")) posts.push(response.url());});
  await expect(page.getByRole("combobox",{name:"KVSL topic",exact:true})).toBeDisabled();
  await expect(page.getByRole("button",{name:"Capture sign",exact:true})).toBeDisabled();
  // Quiet, small local adjustment, peripheral movement and uniform exposure change.
  for(const name of ["still","small","edge","brightness","still"]) { await pattern(page,name); await page.waitForTimeout(1200); }
  expect(posts).toHaveLength(0);
  for(let index=0;index<3;index++) {
    const posted=page.waitForResponse(r=>r.url().includes("/recognition/live-jobs") && r.request().method()==="POST");
    await pattern(page,"reference");
    await expect(state(page)).toHaveAttribute("data-activity-state",/recording|ending/,{timeout:8000});
    const response=await posted; expect(response.status()).toBe(202); const submitted=await response.json();
    if(index===0) await writeFile(path.join(root,".design-cache/kvsl-phase5b/synthetic.webm"),response.request().postDataBuffer()!);
    await expect(page.getByRole("region",{name:"Model prediction"})).toBeVisible({timeout:60000});
    await expect(state(page)).toHaveAttribute("data-activity-state","armed",{timeout:10000});
    const result=await (await page.request.get(origin+"/api/v1/recognition/jobs/"+submitted.job_id,
      {headers:{Authorization:"Bearer "+token,Origin:"http://127.0.0.1:5173"}})).json();
    expect(result.status).toBe("succeeded"); expect(result.prediction.source_kind).toBe("live_camera_capture");
    expect(result.prediction.sample_id).toBeNull(); expect(result.prediction.quality.cache_hit).toBe(index>0);
    results.push(result);
  }
  expect(new Set(results.map(x=>x.capture_id)).size).toBe(3);
  expect(new Set(results.map(x=>x.job_id)).size).toBe(3); expect(posts).toHaveLength(3);
  await writeFile(path.join(evidence,"real-ml-auto.json"),JSON.stringify(results,null,2));
  for(const [width,height] of [[1440,900],[1280,720],[820,1180]]) for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height}); await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await page.getByRole("group",{name:"Automatic recognition",exact:true}).scrollIntoViewIfNeeded();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    expect((await new AxeBuilder({page}).include(".recognition-card").withTags(["wcag2a","wcag2aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({path:path.join(evidence,`${theme}-${width}.png`),fullPage:true});
  }
  await pattern(page,"motion"); await expect(state(page)).toHaveAttribute("data-activity-state","recording");
  await page.getByRole("button",{name:"Cancel capture",exact:true}).click(); await pattern(page,"still");
  await expect(state(page)).toHaveAttribute("data-activity-state","armed"); expect(posts).toHaveLength(3);
  await pattern(page,"reference");
  await expect(page.getByRole("button",{name:"Cancel recognition",exact:true})).toBeVisible({timeout:15000});
  await page.getByRole("button",{name:"Cancel recognition",exact:true}).click();
  await expect(state(page)).toHaveAttribute("data-activity-state","armed",{timeout:15000});
  await pattern(page,"reference");
  await expect(state(page)).toHaveAttribute("data-activity-state",/recording|ending/);
  await expect(page.getByRole("region",{name:"Model prediction"})).toBeVisible({timeout:60000});
  await expect(state(page)).toHaveAttribute("data-activity-state","armed");
  const stats=await page.evaluate(()=>{
    const m=(window as any).__media; return {events:m.events,maximumRecorders:m.maximumRecorders,recorders:m.recorders,streams:m.streams.length,
      liveTracks:m.streams.flatMap((s:MediaStream)=>s.getTracks()).filter((t:MediaStreamTrack)=>t.readyState==="live").length};
  });
  expect(stats.maximumRecorders).toBe(1); expect(stats.recorders).toBe(0); expect(stats.streams).toBe(1); expect(stats.liveTracks).toBe(1);
  await writeFile(path.join(evidence,"repeat-cycle.json"),JSON.stringify({posts:posts.length,...stats},null,2));
  await page.getByRole("button",{name:"Dataset",exact:true}).last().click();
  expect(await page.evaluate(()=>(window as any).__media.streams.every((s:MediaStream)=>s.getTracks().every(t=>t.readyState==="ended")))).toBe(true);
});

test("false start, max duration, failed jobs, off/stop/disconnect and navigation clean up", async ({page})=>{
  test.setTimeout(120000);
  let posts=0;
  await page.route("**/api/v1/recognition/live-jobs?**", async route=>{
    posts++;
    await route.fulfill({status:202,json:{schema_version:"smartglove-recognition-job-v1",job_id:"auto-failure-"+posts,source_kind:"live_camera_capture",status:"running",cancel_requested:false}});
  });
  await page.route(/\/api\/v1\/recognition\/jobs\/auto-failure-/, async route=>{
    await route.fulfill({json:{schema_version:"smartglove-recognition-job-v1",job_id:"auto-failure-"+posts,source_kind:"live_camera_capture",status:"failed",error:{code:"worker_timeout",message:"Test timeout"},cancel_requested:false}});
  });
  await ready(page);
  await pattern(page,"motion"); await page.waitForTimeout(110); await pattern(page,"still");
  await page.waitForTimeout(1000); expect(posts).toBe(0); await expect(state(page)).toHaveAttribute("data-activity-state","armed");
  await pattern(page,"motion"); await expect(state(page)).toHaveAttribute("data-activity-state","recording");
  await expect(page.getByText("Test timeout",{exact:true})).toBeVisible({timeout:15000});
  await expect(state(page)).toHaveAttribute("data-activity-state","cooldown");
  await page.waitForTimeout(1500); expect(posts).toBe(1); // continuous motion cannot re-arm
  await pattern(page,"still"); await expect(state(page)).toHaveAttribute("data-activity-state","armed");
  await pattern(page,"motion"); await expect(state(page)).toHaveAttribute("data-activity-state","recording");
  await page.getByRole("button",{name:"Auto off",exact:true}).click(); await pattern(page,"still");
  await expect(state(page)).toHaveAttribute("data-activity-state","off"); expect(posts).toBe(1);
  await expect(page.getByRole("button",{name:"Capture sign",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Auto on",exact:true}).click();
  await page.getByRole("button",{name:"Auto off",exact:true}).focus(); await page.keyboard.press("Enter");
  await expect(state(page)).toHaveAttribute("data-activity-state","off");
  await page.getByRole("button",{name:"Auto on",exact:true}).click();
  await page.getByRole("button",{name:"Stop camera",exact:true}).click();
  await expect(state(page)).toHaveAttribute("data-activity-state","off");
  expect(await page.evaluate(()=>(window as any).__media.streams.every((s:MediaStream)=>s.getTracks().every(t=>t.readyState==="ended")))).toBe(true);
  await page.getByRole("button",{name:"Start camera",exact:true}).click();
  await expect(page.getByText("Camera ready",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Auto on",exact:true}).click();
  await page.evaluate(()=>{const track=(window as any).__media.streams.at(-1).getVideoTracks()[0];track.dispatchEvent(new Event("ended"));});
  await expect(state(page)).toHaveText("Camera disconnected. Reconnect it and start again.");
  await expect(state(page)).toHaveAttribute("data-activity-state","off");
  await writeFile(path.join(evidence,"failure-lifecycle.json"),JSON.stringify({posts,passed:true},null,2));
});


