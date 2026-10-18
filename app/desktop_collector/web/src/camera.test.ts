import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CameraSession, CAPTURE_MS, type CameraProfile } from "./camera";

class Recorder {
  static isTypeSupported = () => true;
  state = "inactive";
  onstop?: () => void;
  ondataavailable?: (event: {data: Blob}) => void;
  onerror?: () => void;
  start() { this.state = "recording"; }
  stop() { this.state = "inactive"; this.ondataavailable?.({data: new Blob(["video"])}); this.onstop?.(); }
}
describe("camera lifecycle", () => {
  let track: { stop: ReturnType<typeof vi.fn>; onended: (() => void) | null };
  let stream: MediaStream;
  let getUserMedia: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    track = {stop: vi.fn(), onended: null};
    stream = {getTracks: () => [track], getVideoTracks: () => [track]} as unknown as MediaStream;
    getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal("navigator", {mediaDevices: {getUserMedia}});
    vi.stubGlobal("MediaRecorder", Recorder);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
  it("explicit start is video-only; stop releases tracks", async () => {
    const notify = vi.fn(); const camera = new CameraSession(notify);
    expect(getUserMedia).not.toHaveBeenCalled();
    await camera.start("chosen");
    expect(getUserMedia.mock.calls[0][0]).toMatchObject({audio:false, video:{deviceId:{exact:"chosen"},
      frameRate: { ideal: 60, max: 60 }, width: { ideal: 1920 }, height: { ideal: 1080 }}});
    expect(camera.stream).toBe(stream); expect(notify).toHaveBeenLastCalledWith("camera_ready");
    camera.stop(); expect(track.stop).toHaveBeenCalledOnce(); expect(camera.stream).toBeNull();
  });
  it.each(["NotAllowedError", "NotFoundError", "NotReadableError", "OverconstrainedError"])("handles %s", async name => {
    const notify=vi.fn(); const error=new Error(); error.name=name; getUserMedia.mockRejectedValue(error);
    await new CameraSession(notify).start(""); expect(notify).toHaveBeenLastCalledWith("error", expect.any(String));
  });
  it.each([["balanced", 1280, 720], ["speed", 960, 540]] as const)("negotiates %s before starting, with video only and 60 FPS requested", async (profile, width, height) => {
    const camera = new CameraSession(vi.fn());
    await camera.start("", profile as CameraProfile);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: false, video: {
      width: { ideal: width, max: width }, height: { ideal: height, max: height }, frameRate: { ideal: 60, max: 60 },
    } });
    camera.stop();
    expect(track.stop).toHaveBeenCalledOnce();
  });
  it("late permission resolution cannot resurrect a stopped camera", async () => {
    let resolve!: (s: MediaStream) => void;
    getUserMedia.mockReturnValue(new Promise<MediaStream>(r => {resolve=r;}));
    const camera=new CameraSession(vi.fn()); const start=camera.start(""); camera.stop(); resolve(stream); await start;
    expect(track.stop).toHaveBeenCalledOnce(); expect(camera.stream).toBeNull();
  });
  it("counts down, records a bounded fresh clip, and repeats", async () => {
    const notify=vi.fn(); const camera=new CameraSession(notify); await camera.start("");
    const first=camera.capture(); await vi.advanceTimersByTimeAsync(3000);
    expect(notify).toHaveBeenLastCalledWith("recording", expect.any(String));
    await vi.advanceTimersByTimeAsync(CAPTURE_MS); const blob=await first;
    expect(blob?.size).toBeGreaterThan(0); expect(notify).toHaveBeenLastCalledWith("processing", expect.any(String));
    const second=camera.capture(); await vi.advanceTimersByTimeAsync(3000+CAPTURE_MS);
    expect(await second).not.toBe(blob); camera.stop();
  });
  it.each([1000, 3500])("cancel at %sms discards media and keeps preview", async time => {
    const camera=new CameraSession(vi.fn()); await camera.start(""); const clip=camera.capture();
    await vi.advanceTimersByTimeAsync(time); camera.cancel(); expect(await clip).toBeNull();
    expect(camera.stream).toBe(stream); expect(track.stop).not.toHaveBeenCalled(); camera.stop();
  });
  it("disconnect releases the stream and cancels recording", async () => {
    const notify=vi.fn(); const camera=new CameraSession(notify); await camera.start(""); const clip=camera.capture();
    await vi.advanceTimersByTimeAsync(3500); track.onended?.(); expect(await clip).toBeNull();
    expect(camera.stream).toBeNull(); expect(notify).toHaveBeenLastCalledWith("error", expect.stringContaining("disconnected"));
  });
  it("automatic capture starts immediately, finishes on stillness, and keeps tracks", async () => {
    const camera=new CameraSession(vi.fn()); await camera.start("");
    const first=camera.capture({automatic:true,maxDurationMs:5500});
    expect(await camera.capture({automatic:true,maxDurationMs:5500})).toBeNull();
    await vi.advanceTimersByTimeAsync(2200); camera.finish(); expect((await first)?.size).toBeGreaterThan(0);
    expect(track.stop).not.toHaveBeenCalled();
    const second=camera.capture({automatic:true,maxDurationMs:5500});
    await vi.advanceTimersByTimeAsync(5500); expect((await second)?.size).toBeGreaterThan(0);
    camera.stop(); expect(vi.getTimerCount()).toBe(0);
  });
  it("countdown cannot create overlapping recorders", async () => {
    const camera=new CameraSession(vi.fn()); await camera.start(""); const first=camera.capture();
    expect(await camera.capture()).toBeNull(); camera.cancel(); expect(await first).toBeNull(); camera.stop();
  });
});
