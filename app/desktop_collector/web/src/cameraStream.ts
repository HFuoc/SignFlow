import type { RecognitionPrediction } from "./api";

export type StreamState = "connecting" | "ready" | "moving" | "ending";
export interface StreamFrame {
  type: "frame";
  sequence: number;
  timestamp_ms: number;
  state: Exclude<StreamState, "connecting">;
  phase: "provisional" | "final" | null;
  segment_id: number | null;
  prediction: RecognitionPrediction | null;
  quality: Record<string, unknown>;
}

const PROTOCOL = "smartglove-recognition-stream-v1";
const MAX_BYTES = 8 * 1024 * 1024;

/** One lossless frame being prepared OR awaiting acknowledgement; no frame queue. */
export class CameraStream {
  private canvas = document.createElement("canvas");
  private stopped = false;
  private ready = false;
  private pending: { sequence: number; timestamp: number } | null = null;
  private sequence = -1;
  private lastVideoTime = -1;
  private lastFreshFrame = performance.now();
  private intervalMs = 1000 / 15;
  private format: "rgba8" | "png" = "png";
  private maxBytes = MAX_BYTES;
  private timer?: ReturnType<typeof setTimeout>;
  private deadline?: ReturnType<typeof setTimeout>;
  private videoCallback?: number;
  private captureMs = 0;
  private payloadBytes = 0;
  private manualFinish = false;
  private activeSegment: number | null = null;
  private finishSegment: number | null = null;

  /** Attach one segment-specific boundary to the next fresh frame, without a queue. */
  finishSign(): boolean {
    if (this.stopped || !this.ready || !this.manualFinish || this.activeSegment === null || this.finishSegment !== null) return false;
    this.finishSegment = this.activeSegment;
    return true;
  }

  constructor(private socket: WebSocket, private video: HTMLVideoElement,
    private onState: (state: StreamState) => void,
    private onFrame: (frame: StreamFrame, roundTripMs: number) => void,
    private onError: (message: string) => void,
    private providerId = "visign-ridge-25") {
    onState("connecting");
    socket.addEventListener("message", this.receive);
    socket.addEventListener("close", this.closed);
    socket.addEventListener("error", this.failed);
    this.deadline = setTimeout(() => this.fail("Live recognition did not become ready. Turn Auto on to retry."),
      providerId === "visign-videomae-25" ? 125000 : 45000);
  }

  private fail(message: string) {
    if (this.stopped) return;
    this.stop(); this.onError(message);
  }
  private failed = () => this.fail("Live recognition connection failed. Turn Auto on to retry.");
  private closed = () => this.fail("Live recognition stopped. Turn Auto on to reconnect.");
  private receive = (event: MessageEvent) => {
    if (this.stopped) return;
    try {
      const data = JSON.parse(String(event.data));
      if (data.type === "error") {
        this.fail(typeof data.message === "string" ? data.message : "Live recognition could not complete."); return;
      }
      if (!this.ready) {
        if ((data.provider_id !== undefined || this.providerId !== "visign-ridge-25")
          && data.provider_id !== this.providerId) throw new Error();
        if (data.type !== "ready" || data.protocol !== PROTOCOL || !Number.isFinite(data.max_fps) || data.max_fps <= 0
          || !Number.isSafeInteger(data.max_frame_bytes) || data.max_frame_bytes <= 0) throw new Error();
        this.format = Array.isArray(data.frame_formats) && data.frame_formats.includes("rgba8") ? "rgba8" : "png";
        this.intervalMs = 1000 / Math.min(60, data.max_fps);
        this.maxBytes = Math.min(MAX_BYTES, data.max_frame_bytes);
        this.manualFinish = data.manual_finish === true;
        this.ready = true; clearTimeout(this.deadline); this.lastFreshFrame = performance.now();
        this.onState("ready"); this.schedule(0); return;
      }
      const pending = this.pending;
      if (data.type !== "frame" || !pending || data.sequence !== pending.sequence || data.timestamp_ms !== pending.timestamp
        || !["ready", "moving", "ending"].includes(data.state) || ![null, "provisional", "final"].includes(data.phase)
        || !(data.segment_id === null || Number.isSafeInteger(data.segment_id))
        || (data.prediction !== null && (!Array.isArray(data.prediction?.top_k)
          || data.prediction.score_kind !== (this.providerId !== "visign-ridge-25" ? "uncalibrated_softmax_subset" : "raw_ridge")
          || (this.providerId !== "visign-ridge-25" && data.prediction.provider_id !== this.providerId)))) throw new Error();
      clearTimeout(this.deadline); this.pending = null;
      this.activeSegment = data.state !== "ready" && Number.isSafeInteger(data.segment_id) && data.segment_id > 0 ? data.segment_id : null;
      if (this.finishSegment !== this.activeSegment) this.finishSegment = null;
      this.onState(data.state);
      this.onFrame({ ...data, quality: { ...data.quality, capture_ms: this.captureMs,
        payload_bytes: this.payloadBytes } } as StreamFrame, Math.max(0, performance.now() - pending.timestamp));
      this.schedule(Math.max(0, Math.ceil(this.intervalMs - (performance.now() - pending.timestamp))));
    } catch { this.fail("Live recognition returned an invalid response. Turn Auto on to retry."); }
  };

  private schedule(delay: number) {
    if (!this.stopped) this.timer = setTimeout(() => this.capture(), delay);
  }
  private waitForVideo() {
    if (!this.video.requestVideoFrameCallback) { this.schedule(this.intervalMs); return; }
    // Wait for an actual camera frame instead of sleeping another whole frame
    // interval after just missing one. Keep a separate frozen-camera watchdog.
    this.videoCallback = this.video.requestVideoFrameCallback(() => {
      this.videoCallback = undefined; clearTimeout(this.timer);
      if (!this.stopped) this.capture();
    });
    this.timer = setTimeout(() => this.fail("Camera frames paused. Restart the camera and try Auto again."),
      Math.max(1, 5001 - (performance.now() - this.lastFreshFrame)));
  }
  private capture() {
    if (this.stopped || this.pending) return;
    const now = performance.now();
    if (this.video.readyState < 2 || this.video.currentTime === this.lastVideoTime) {
      if (now - this.lastFreshFrame > 5000) this.fail("Camera frames paused. Restart the camera and try Auto again.");
      else this.waitForVideo();
      return;
    }
    const width = this.video.videoWidth, height = this.video.videoHeight;
    if (Math.min(width, height) < 16 || width > 1920 || height > 1080 || width * height > 1920 * 1080) {
      this.fail("Live recognition requires camera frames up to 1920 × 1080."); return;
    }
    this.lastVideoTime = this.video.currentTime; this.lastFreshFrame = now;
    const pending = { sequence: ++this.sequence, timestamp: now }; this.pending = pending;
    // Snapshot at acquisition time, not after asynchronous PNG encoding.
    const finishSegment = this.finishSegment; this.finishSegment = null;
    this.deadline = setTimeout(() => this.fail("Live recognition timed out. Turn Auto on to retry."), 30000);
    try {
      if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
      const context = this.canvas.getContext("2d", { willReadFrequently: this.format === "rgba8" });
      if (!context) throw new Error();
      // Preview mirroring is CSS only. Preserve the full source frame without resizing.
      context.drawImage(this.video, 0, 0, width, height);
      const send = (pixels: Blob | Uint8ClampedArray<ArrayBuffer>) => {
        if (this.stopped) return;
        const size = pixels instanceof Blob ? pixels.size : pixels.byteLength;
        if (size > this.maxBytes) { this.fail("Camera frame exceeds the live recognition limit."); return; }
        if (this.socket.readyState !== WebSocket.OPEN || this.socket.bufferedAmount > 0) { this.failed(); return; }
        this.captureMs = performance.now() - now;
        this.payloadBytes = size;
        const header = new TextEncoder().encode(JSON.stringify({ type: "frame", sequence: pending.sequence, timestamp_ms: pending.timestamp,
          ...(finishSegment !== null ? { finish_segment: finishSegment } : {}),
          ...(this.format === "rgba8" ? { format: "rgba8", width, height } : {}) }));
        const length = new ArrayBuffer(4); new DataView(length).setUint32(0, header.length, false);
        try { this.socket.send(new Blob([length, header, pixels], { type: "application/octet-stream" })); }
        catch { this.failed(); }
      };
      if (this.format === "rgba8") {
        // Same sRGB canvas pixels as PNG; no resize, lossy codec, or pixel queue.
        send(context.getImageData(0, 0, width, height).data);
      } else {
        this.canvas.toBlob(png => {
          if (this.stopped) return;
          if (!png) { this.fail("Camera frame could not be encoded."); return; }
          send(png);
        }, "image/png");
      }
    } catch { this.fail("Camera frame could not be read. Restart the camera and try again."); }
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true; clearTimeout(this.timer); clearTimeout(this.deadline); this.pending = null;
    if (this.videoCallback !== undefined) this.video.cancelVideoFrameCallback(this.videoCallback);
    this.videoCallback = undefined;
    this.socket.removeEventListener("message", this.receive);
    this.socket.removeEventListener("close", this.closed);
    this.socket.removeEventListener("error", this.failed);
    this.socket.close(1000, "automatic recognition stopped");
    this.canvas.width = 0; this.canvas.height = 0;
  }
}
