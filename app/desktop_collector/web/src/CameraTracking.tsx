import { useEffect, useState, type RefObject } from "react";
import { FrameRate, readTracking, visiblePoint } from "./trackingMetrics";
import type { StreamFrame } from "./cameraStream";

export interface CameraTelemetry { frame: StreamFrame; roundTripMs: number; receivedAt: number; fps: number | null }

export function CameraTracking({ video, on, telemetry, streaming, recognitionStopped = false, onReady }: {
  video: RefObject<HTMLVideoElement | null>; on: boolean; telemetry: CameraTelemetry | null; streaming: boolean;
  recognitionStopped?: boolean;
  onReady: () => void;
}) {
  const [clock, setClock] = useState(performance.now());
  const [cameraFps, setCameraFps] = useState<number | null>(null);
  useEffect(() => {
    const target = video.current;
    setCameraFps(null);
    if (!on || !target) return;
    const rate = new FrameRate();
    let callback = 0;
    let presented: number | undefined;
    const sample = (now: number, metadata: VideoFrameCallbackMetadata) => {
      rate.add(now, presented === undefined ? 1 : Math.max(0, metadata.presentedFrames - presented));
      presented = metadata.presentedFrames;
      callback = target.requestVideoFrameCallback(sample);
    };
    if (target.requestVideoFrameCallback) callback = target.requestVideoFrameCallback(sample);
    const timer = setInterval(() => { const now = performance.now(); setClock(now); setCameraFps(rate.value(now)); }, 250);
    return () => { clearInterval(timer); if (callback) target.cancelVideoFrameCallback(callback); };
  }, [on, video]);
  const fresh = on && streaming && telemetry && Math.max(clock, performance.now()) - telemetry.receivedAt < 1000;
  const tracking = fresh ? readTracking(telemetry.frame.quality?.tracking) : null;
  const width = video.current?.videoWidth || 16, height = video.current?.videoHeight || 9;
  const number = (value: unknown, suffix = "") => typeof value === "number" && Number.isFinite(value) && value >= 0 ? `${value.toFixed(suffix ? 0 : 1)}${suffix}` : "—";
  const left = tracking?.present.slice(33, 54).some(Boolean), right = tracking?.present.slice(54).some(Boolean);
  const settings = (video.current?.srcObject as MediaStream | null)?.getVideoTracks()[0]?.getSettings();
  return <>
    <div className="camera-preview">
    <video ref={video} autoPlay muted playsInline onLoadedData={onReady} className="live-camera-video" aria-label="Live camera preview; mirrored" />
    {tracking && <svg className="camera-tracking-overlay" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-testid="camera-tracking-overlay">
      {tracking.connections.map(([a, b]) => visiblePoint(tracking, a) && visiblePoint(tracking, b) && <line key={`${a}-${b}`} x1={tracking.xy[a][0] * width} y1={tracking.xy[a][1] * height}
        x2={tracking.xy[b][0] * width} y2={tracking.xy[b][1] * height} className={a < 33 ? "tracking-pose" : a < 54 ? "tracking-left" : "tracking-right"} />)}
      {tracking.xy.map(([x, y], i) => visiblePoint(tracking, i) && <circle key={i} cx={x * width} cy={y * height} r={Math.max(width, height) / 240} className={i < 33 ? "tracking-pose" : i < 54 ? "tracking-left" : "tracking-right"} />)}
    </svg>}
    </div>
    <div className="camera-telemetry" aria-label="Camera performance">
      <dl>
        <div><dt>Camera FPS</dt><dd>{on ? number(cameraFps) : "—"}</dd></div>
        <div><dt>Tracking FPS</dt><dd>{fresh ? number(telemetry.fps) : "—"}</dd></div>
        <div><dt>Frame RTT</dt><dd>{fresh ? number(telemetry.roundTripMs, " ms") : "—"}</dd></div>
        <div><dt>Processing</dt><dd>{fresh ? number(telemetry.frame.quality?.processing_ms, " ms") : "—"}</dd></div>
      </dl>
      {on && settings?.width && settings?.height && <p className="studio-note">Camera input: {settings.width} × {settings.height}
        {settings.frameRate ? ` · ${Math.round(settings.frameRate)} FPS negotiated` : ""} · requested 60 FPS</p>}
      <p className="studio-note">{tracking ? `MediaPipe · Left ${left ? "detected" : "missing"} · Right ${right ? "detected" : "missing"}` : recognitionStopped ? "Tracking stopped with recognition. Resolve the error below, then enable Auto again." : streaming ? "Waiting for fresh tracking…" : "Tracking: select ViSign, VideoMAE or TCN and enable Auto"}</p>
      <p className="studio-note">Frame RTT includes encoding, local transport and processing; it is not network ping. Overlay follows the latest processed frame.</p>
      {fresh && telemetry.frame.quality?.tracker_profile === "holistic-cpu2-recovery-v2" && <p className="studio-note">
        Experimental hand recovery is active for TCN Auto. It searches again when a visible hand loses tracking;
        results can differ from manual Capture. 60 FPS is a target, not a guaranteed tracking rate.
      </p>}
    </div>
  </>;
}
