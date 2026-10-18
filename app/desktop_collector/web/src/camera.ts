export type CameraState = "camera_off" | "camera_starting" | "camera_ready" | "countdown" | "recording" | "processing" | "error";
export const CAPTURE_MS = 4000;
export const MAX_BYTES = 8 * 1024 * 1024;
export const CAMERA_PROFILES = {
  detail: { width: 1920, height: 1080, label: "1080p · Detail" },
  balanced: { width: 1280, height: 720, label: "720p · Balanced" },
  speed: { width: 960, height: 540, label: "540p · Speed" },
} as const;
export type CameraProfile = keyof typeof CAMERA_PROFILES;
export function cameraError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  return ({ NotAllowedError: "Camera permission denied. Allow camera access and try again.",
    NotFoundError: "No camera found. Connect a camera and refresh the list.",
    NotReadableError: "Camera is busy or unavailable. Close other camera apps and try again.",
    OverconstrainedError: "This camera cannot use the requested settings. Select another camera." } as Record<string,string>)[name]
    ?? (error instanceof Error ? error.message : "Camera unavailable. Try again.");
}

/** Owns one video-only stream and one bounded recording, including late async results. */
export class CameraSession {
  stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private capturing = false;
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private wake?: () => void;
  constructor(private notify: (state: CameraState, message?: string) => void) {}
  async start(deviceId: string, profile: CameraProfile = "detail") {
    this.stop();
    const generation = this.generation;
    this.notify("camera_starting");
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Camera recording is unavailable in this runtime.");
      if (!MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) throw new Error("This runtime cannot record WebM/VP8 video.");
      const { width, height } = CAMERA_PROFILES[profile];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}), width: { ideal: width, max: width },
        height: { ideal: height, max: height }, frameRate: { ideal: 60, max: 60 },
      }});
      if (generation !== this.generation) { stream.getTracks().forEach(track => track.stop()); return; }
      this.stream = stream;
      stream.getVideoTracks().forEach(track => { track.onended = () => {
        this.stop(); this.notify("error", "Camera disconnected. Reconnect it and start again.");
      }; });
      this.notify("camera_ready");
    } catch (error) { if (generation === this.generation) this.notify("error", cameraError(error)); }
  }
  cancel() {
    this.generation++;
    clearTimeout(this.timer); this.wake?.(); this.wake = undefined;
    const recorder = this.recorder;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    this.notify(this.stream ? "camera_ready" : "camera_off");
  }
  stop() {
    this.cancel();
    this.stream?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    this.stream = null;
    this.notify("camera_off");
  }
  finish() {
    if (this.recorder?.state === "recording") this.recorder.stop();
  }
  async capture(options?: { automatic: true; maxDurationMs: number }): Promise<Blob | null> {
    if (!this.stream || this.recorder || this.capturing) return null;
    this.capturing = true;
    const generation = this.generation;
    for (let count = options ? 0 : 3; count > 0; count--) {
      this.notify("countdown", `Ready · ${count}`);
      await new Promise<void>(resolve => { this.wake = resolve; this.timer = setTimeout(resolve, 1000); });
      if (generation !== this.generation) { this.capturing = false; return null; }
    }
    this.wake = undefined;
    const chunks: Blob[] = [];
    let bytes = 0;
    try {
      const recorder = new MediaRecorder(this.stream, { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond: 2_000_000 });
      this.recorder = recorder;
      const blob = await new Promise<Blob>((resolve, reject) => {
        const fail = (message: string) => { reject(new Error(message)); if (recorder.state !== "inactive") recorder.stop(); };
        recorder.ondataavailable = event => {
          bytes += event.data.size;
          if (bytes > MAX_BYTES) fail("Capture exceeded 8 MiB. Try again.");
          else if (event.data.size) chunks.push(event.data);
        };
        recorder.onerror = () => fail("Camera recording failed. Try again.");
        recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
        recorder.start(250);
        this.notify("recording", options ? "Recording sign" : "Recording · perform one sign for 4 seconds");
        this.timer = setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, options?.maxDurationMs ?? CAPTURE_MS);
      });
      if (generation !== this.generation) return null;
      if (!blob.size) throw new Error("Camera returned an empty clip. Try again.");
      this.notify("processing", "Sending local clip");
      return blob;
    } catch (error) {
      if (generation === this.generation) this.notify("error", cameraError(error));
      return null;
    } finally {
      chunks.length = 0;
      clearTimeout(this.timer); this.recorder = null; this.capturing = false;
    }
  }
}
