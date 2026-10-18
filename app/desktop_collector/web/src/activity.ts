/** Browser-local activity only; this is not a hand detector or a sign classifier. */
export const ACTIVITY_CONFIG = Object.freeze({
  version: "frame-difference-v1", width: 160, height: 90, fps: 10, roi: 0.8,
  pixelNoise: 12, smoothing: 0.5, calibrationMs: 1500,
  startMin: 0.018, startMax: 0.06, endMin: 0.008, endMax: 0.03,
  startHoldMs: 200, endHoldMs: 600, minSegmentMs: 2000, maxSegmentMs: 5500,
  cooldownMs: 1000, maxSampleGapMs: 500,
});
export type ActivityState = "off" | "calibrating" | "armed" | "candidate" | "recording" | "ending" | "recognizing" | "cooldown" | "error";
export type ActivityEvent = "segment_start" | "segment_end" | "sample_gap" | null;

/** Ratio of changed pixels after compensating a uniform luminance shift, in [0,1]. */
export function motionScore(previous: Float32Array, current: Float32Array): number {
  if (!current.length || previous.length !== current.length) throw new Error("Mismatched activity frames");
  let shift = 0;
  for (let i = 0; i < current.length; i++) shift += current[i] - previous[i];
  shift /= current.length;
  let changed = 0;
  for (let i = 0; i < current.length; i++) if (Math.abs(current[i] - previous[i] - shift) > ACTIVITY_CONFIG.pixelNoise) changed++;
  return changed / current.length;
}

/** Pure, monotonic-time state machine. Media and recognition side effects belong to its owner. */
export class ActivitySegmenter {
  state: ActivityState = "off";
  score = 0;
  startThreshold: number = ACTIVITY_CONFIG.startMin;
  endThreshold: number = ACTIVITY_CONFIG.endMin;
  stopReason: "stillness" | "max_duration" | null = null;
  private since = 0;
  private started = 0;
  private quiet: number | null = null;
  private last: number | null = null;
  private baseline: number[] = [];
  enable(now: number) { this.reset(); this.state = "calibrating"; this.since = now; }
  reset() {
    this.state = "off"; this.score = 0; this.last = null; this.quiet = null;
    this.baseline = []; this.stopReason = null;
    this.startThreshold = ACTIVITY_CONFIG.startMin; this.endThreshold = ACTIVITY_CONFIG.endMin;
  }
  fail() { this.reset(); this.state = "error"; }
  complete(now: number) {
    if (this.state === "off" || this.state === "error") return;
    this.state = "cooldown"; this.since = now; this.quiet = null; this.score = 0; this.last = null;
  }
  sample(now: number, raw: number): ActivityEvent {
    const c = ACTIVITY_CONFIG;
    if (["off", "error", "recognizing"].includes(this.state)) return null;
    if (!Number.isFinite(now) || !Number.isFinite(raw) || raw < 0 || raw > 1 || (this.last !== null && now <= this.last)) return null;
    if (this.last !== null && now - this.last > c.maxSampleGapMs) {
      const wasRecording = this.state === "recording" || this.state === "ending";
      this.enable(now);
      if (wasRecording) return "sample_gap";
    }
    this.last = now;
    this.score = c.smoothing * raw + (1 - c.smoothing) * this.score;
    if (this.state === "calibrating") {
      this.baseline.push(raw);
      if (now - this.since >= c.calibrationMs && this.baseline.length >= 10) {
        const sorted = this.baseline.sort((a,b) => a-b);
        const noise = sorted[Math.floor((sorted.length - 1) * 0.9)];
        this.startThreshold = Math.min(c.startMax, Math.max(c.startMin, noise * 3 + c.startMin));
        this.endThreshold = Math.min(c.endMax, Math.max(c.endMin, noise * 1.5 + c.endMin));
        this.baseline = []; this.score = 0; this.state = "armed";
      }
      return null;
    }
    if (this.state === "cooldown") {
      this.quiet = this.score <= this.endThreshold ? this.quiet ?? now : null;
      if (now - this.since >= c.cooldownMs && this.quiet !== null && now - this.quiet >= c.endHoldMs) this.state = "armed";
      return null;
    }
    if (this.state === "armed" || this.state === "candidate") {
      // Raw persistence as well as smoothed persistence prevents an EMA tail from
      // converting one large exposure/frame spike into a sustained candidate.
      if (raw < this.startThreshold || this.score < this.startThreshold) { this.state = "armed"; return null; }
      if (this.state === "armed") { this.state = "candidate"; this.since = now; }
      else if (now - this.since >= c.startHoldMs) {
        this.state = "recording"; this.started = now; this.quiet = null; this.stopReason = null;
        return "segment_start";
      }
      return null;
    }
    if (now - this.started >= c.maxSegmentMs) {
      this.stopReason = "max_duration"; this.state = "recognizing"; return "segment_end";
    }
    if (this.score <= this.endThreshold) {
      this.quiet ??= now; this.state = "ending";
      if (now - this.started >= c.minSegmentMs && now - this.quiet >= c.endHoldMs) {
        this.stopReason = "stillness"; this.state = "recognizing"; return "segment_end";
      }
    } else { this.quiet = null; this.state = "recording"; }
    return null;
  }
}

/** One bounded timer; samples decoded video, not the mirrored preview geometry. */
export function watchActivity(video: HTMLVideoElement, receive: (time: number, score: number) => void, fail: (error: Error) => void): () => void {
  const c = ACTIVITY_CONFIG;
  const canvas = document.createElement("canvas"); canvas.width = c.width; canvas.height = c.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  let previous: Float32Array | null = null;
  let lastVideoTime = -1;
  const timer = setInterval(() => {
    try {
      if (!context) throw new Error("Camera activity analysis is unavailable.");
      if (video.readyState < 2 || !video.videoWidth || video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;
      const margin = (1 - c.roi) / 2;
      context.drawImage(video, video.videoWidth * margin, video.videoHeight * margin, video.videoWidth * c.roi, video.videoHeight * c.roi, 0, 0, c.width, c.height);
      const pixels = context.getImageData(0, 0, c.width, c.height).data;
      const current = new Float32Array(c.width * c.height);
      for (let i = 0; i < current.length; i++) current[i] = (77*pixels[i*4] + 150*pixels[i*4+1] + 29*pixels[i*4+2]) / 256;
      if (previous) receive(performance.now(), motionScore(previous, current));
      previous = current;
    } catch (cause) { clearInterval(timer); previous = null; fail(cause instanceof Error ? cause : new Error("Camera activity analysis failed.")); }
  }, 1000 / c.fps);
  return () => { clearInterval(timer); previous = null; canvas.width = 0; canvas.height = 0; };
}
