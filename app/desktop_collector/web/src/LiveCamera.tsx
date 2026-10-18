import { useEffect, useRef, useState } from "react";
import { type BridgeClient, type RecognitionJob, type RecognitionModel, userFacingBridgeError } from "./api";
import { CameraSession, type CameraState, cameraError, CAMERA_PROFILES, type CameraProfile } from "./camera";
import { ACTIVITY_CONFIG, ActivitySegmenter, type ActivityState, watchActivity } from "./activity";
import { CameraStream, type StreamFrame, type StreamState } from "./cameraStream";
import { PredictionView } from "./Recognition";
import { ReferenceVideo } from "./ReferenceVideo";
import { CameraTracking, type CameraTelemetry } from "./CameraTracking";
import { FrameRate } from "./trackingMetrics";
import { OneUIButton, OneUICard, OneUISelectField, OneUISegmentedControl, OneUIStateMessage, OneUIStatusIndicator } from "./one-ui";

const active = (job: RecognitionJob | null) => job?.status === "queued" || job?.status === "running";
export function LiveCamera({ bridge }: { bridge: BridgeClient }) {
  const [state, setState] = useState<CameraState>("camera_off");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [models, setModels] = useState<RecognitionModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [topic, setTopic] = useState("");
  const [family, setFamily] = useState("kvsl");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [device, setDevice] = useState("");
  const [cameraProfile, setCameraProfile] = useState<CameraProfile>("detail");
  const [job, setJob] = useState<RecognitionJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [autoState, setAutoState] = useState<ActivityState>("off");
  const [streamState, setStreamState] = useState<StreamState | "off">("off");
  const [streamNotice, setStreamNotice] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [streamResult, setStreamResult] = useState<{ frame: StreamFrame; roundTripMs: number } | null>(null);
  const stream = useRef<CameraStream | null>(null);
  const [telemetry, setTelemetry] = useState<CameraTelemetry | null>(null);
  const trackingRate = useRef(new FrameRate());
  const streamSegment = useRef<number | null>(null);
  const segmenter = useRef(new ActivitySegmenter());
  const stopAnalysis = useRef<(() => void) | null>(null);
  const autoCapture = useRef<() => void>(() => {});
  const autoOn = streamState !== "off" || !["off", "error"].includes(autoState);
  const mounted = useRef(false);
  const action = useRef(false);
  const currentJob = useRef<RecognitionJob | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const camera = useRef<CameraSession | null>(null);
  const locked = busy || active(job) || ["countdown", "recording", "processing", "camera_starting"].includes(state);
  const model = models.find(item => item.topic_id === topic);
  const research = models.find(item => item.provider_id === "visign-ridge-25");
  const rgbModel = models.find(item => item.provider_id === "visign-videomae-25");
  const tcnModel = models.find(item => item.provider_id === "vsl-gh-tcn-25");
  const tcnMode = family === "gh_tcn";
  const researchMode = family === "visign" || family === "videomae" || tcnMode;
  function changeModel(value: string) {
    setFamily(value); setTopic(value === "gh_tcn" ? tcnModel?.topic_id ?? "" : value === "videomae" ? rgbModel?.topic_id ?? "" : value === "visign" ? research?.topic_id ?? "" : "");
    setJob(null); currentJob.current = null; setError(""); setStreamResult(null);
  }
  function disableAuto() {
    setFinishing(false);
    setTelemetry(null); trackingRate.current = new FrameRate();
    stream.current?.stop(); stream.current = null; streamSegment.current = null;
    setStreamState("off"); setStreamResult(null); setStreamNotice("");
    stopAnalysis.current?.(); stopAnalysis.current = null;
    const wasRecording = ["recording", "ending"].includes(segmenter.current.state);
    segmenter.current.reset(); setAutoState("off");
    if (wasRecording) camera.current?.cancel();
  }
  function cooldown() {
    segmenter.current.complete(performance.now()); setAutoState(segmenter.current.state);
  }
  function enableAuto() {
    if (locked || !previewReady || !model || model.availability !== "available" || !video.current || !camera.current?.stream) return;
    disableAuto(); setError("");
    if (researchMode) {
      setJob(null); currentJob.current = null;
      try {
        stream.current = new CameraStream(bridge.openRecognitionStream(model.provider_id), video.current,
          next => { if (mounted.current) setStreamState(next); },
          (frame, roundTripMs) => {
            if (!mounted.current) return;
            const receivedAt = performance.now();
            setTelemetry({ frame, roundTripMs, receivedAt, fps: trackingRate.current.add(receivedAt) });
            const interrupted = "Movement was interrupted. Hold still, then repeat the complete sign.";
            setStreamNotice(previous => frame.quality?.reset_reason === "frame_gap" ? interrupted
              : frame.quality?.awaiting_quiet === true ? "Segment ended. Hold your hands still to begin a new sign."
              : frame.quality?.hands_present === false ? "Keep your hands and upper body visible."
              : frame.state === "ready" && previous === interrupted ? previous : "");
            if (frame.quality?.reset_reason) setStreamResult(null);
            if (frame.phase === "final" || frame.state === "ready" || frame.quality?.reset_reason) setFinishing(false);
            if (frame.segment_id !== streamSegment.current) { setStreamResult(null); streamSegment.current = frame.segment_id; }
            if (frame.prediction && frame.phase) setStreamResult({ frame, roundTripMs });
            else if (frame.state === "ready") setStreamResult(previous => previous?.frame.phase === "final" ? previous : null);
          },
          text => { if (mounted.current) { disableAuto(); setAutoState("error"); setError(text); } }, model.provider_id);
      } catch { disableAuto(); setAutoState("error"); setError("Live recognition could not start. Turn Auto on to retry."); }
      return;
    }
    segmenter.current.enable(performance.now()); setAutoState("calibrating");
    stopAnalysis.current = watchActivity(video.current, (time, score) => {
      const event = segmenter.current.sample(time, score);
      setAutoState(segmenter.current.state);
      if (event === "segment_start") autoCapture.current();
      if (event === "segment_end") camera.current?.finish();
      if (event === "sample_gap") { camera.current?.cancel(); setError("Camera frames paused. Hold still to recalibrate."); }
    }, cause => {
      disableAuto(); segmenter.current.fail(); setAutoState("error"); camera.current?.cancel(); setError(cause.message);
    });
  }
  function accept(next: RecognitionJob) {
    if (currentJob.current?.job_id === next.job_id && !active(currentJob.current)) return;
    currentJob.current = next; setJob(next); setMessage("");
  }
  async function refreshDevices() {
    try {
      const list = await navigator.mediaDevices?.enumerateDevices();
      if (mounted.current) setDevices((list ?? []).filter(item => item.kind === "videoinput"));
    } catch (cause) { if (mounted.current) setError(cameraError(cause)); }
  }
  useEffect(() => {
    mounted.current = true;
    camera.current = new CameraSession((next, text = "") => {
      if (!mounted.current) return;
      setState(next); setMessage(text);
      if (next === "camera_off" || next === "error") disableAuto();
      if (next === "error") { setState("error"); setError(text); }
      if (video.current && video.current.srcObject !== (camera.current?.stream ?? null)) {
        video.current.srcObject = camera.current?.stream ?? null;
        setPreviewReady(false);
      }
    });
    const abort = new AbortController();
    setLoadingModels(true);
    void bridge.recognitionModels(abort.signal).then(data => {
      if (!abort.signal.aborted) {
        setModels(data.models);
        const initial = data.models.find(item => item.provider_id === "visign-ridge-25" && item.availability === "available");
        if (initial) { setFamily("visign"); setTopic(initial.topic_id); }
      }
    }).catch(cause => { if (!abort.signal.aborted) setError(userFacingBridgeError(cause)); })
      .finally(() => { if (!abort.signal.aborted) setLoadingModels(false); });
    void refreshDevices();
    const leave = () => { disableAuto(); camera.current?.stop(); };
    const hidden = () => { if (document.hidden) disableAuto(); };
    window.addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", hidden);
    navigator.mediaDevices?.addEventListener("devicechange", refreshDevices);
    return () => {
      stream.current?.stop(); stream.current = null;
      mounted.current = false; abort.abort(); stopAnalysis.current?.(); stopAnalysis.current = null; segmenter.current.reset(); camera.current?.stop();
      window.removeEventListener("pagehide", leave);
      document.removeEventListener("visibilitychange", hidden);
      navigator.mediaDevices?.removeEventListener("devicechange", refreshDevices);
      if (active(currentJob.current)) void bridge.cancelRecognition(currentJob.current!.job_id).catch(() => {});
    };
  }, [bridge]);
  useEffect(() => {
    if (!job || !active(job)) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const next = await bridge.recognitionJob(job!.job_id, abort.signal);
        if (abort.signal.aborted) return;
        accept(next); setError("");
        if (!active(next)) { setState(camera.current?.stream ? "camera_ready" : "camera_off"); cooldown(); return; }
      } catch (cause) { if (!abort.signal.aborted) setError(userFacingBridgeError(cause)); }
      if (!abort.signal.aborted) timer = setTimeout(poll, 250);
    }
    timer = setTimeout(poll, 250);
    return () => { abort.abort(); clearTimeout(timer); };
  }, [bridge, job?.job_id, job?.status]);
  async function start() {
    setError(""); await camera.current?.start(device, cameraProfile); await refreshDevices();
    if (video.current && camera.current?.stream) {
      video.current.srcObject = camera.current.stream;
      const target = camera.current.stream;
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([video.current.play(), new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("preview timeout")), 10000);
        })]);
      } catch {
        if (mounted.current && camera.current?.stream === target) {
          camera.current.stop(); setError("Camera preview could not start. Select another camera or try again.");
        }
      } finally { clearTimeout(timer); }
    }
  }
  async function capture(automatic = false) {
    if (action.current || locked || !previewReady || !model || !camera.current?.stream || (!automatic && autoOn)) return;
    action.current = true; setBusy(true); setError(""); setJob(null); currentJob.current = null;
    const started = performance.now();
    try {
      const blob = await camera.current.capture(automatic ? { automatic: true, maxDurationMs: ACTIVITY_CONFIG.maxSegmentMs } : undefined);
      if (!mounted.current) return;
      if (!blob) { if (automatic && segmenter.current.state !== "calibrating") cooldown(); return; }
      if (automatic && performance.now() - started < ACTIVITY_CONFIG.minSegmentMs) {
        setError("Sign was too short — try again."); setState("camera_ready"); cooldown(); return;
      }
      if (automatic && !["off", "error"].includes(segmenter.current.state)) {
        // The recorder also has an independent hard deadline if frame sampling stalls.
        if (segmenter.current.state !== "recognizing") segmenter.current.stopReason = "max_duration";
        segmenter.current.state = "recognizing"; setAutoState("recognizing");
      }
      const next = await bridge.uploadLiveCapture(blob, topic);
      if (mounted.current) accept(next);
      else await bridge.cancelRecognition(next.job_id);
    } catch (cause) {
      if (mounted.current) { setError(userFacingBridgeError(cause)); setMessage(""); setState(camera.current?.stream ? "camera_ready" : "camera_off"); }
      // Recover a lost POST reply before another capture can be submitted.
      try {
        const data = await bridge.recognitionJobs();
        for (const pending of data.jobs.filter(item => item.source_kind === "live_camera_capture" && active(item))) {
          if (mounted.current) accept(pending); else await bridge.cancelRecognition(pending.job_id);
        }
      } catch { disableAuto(); /* An uncertain POST is not automatically retried. */ }
      if (automatic && !active(currentJob.current)) cooldown();
    } finally { action.current = false; if (mounted.current) setBusy(false); }
  }
  autoCapture.current = () => { void capture(true); };
  async function cancel() {
    if (active(currentJob.current)) {
      try {
        const next = await bridge.cancelRecognition(currentJob.current!.job_id);
        accept(next);
        if (!active(next)) { setState(camera.current?.stream ? "camera_ready" : "camera_off"); cooldown(); }
      }
      catch (cause) { setError(userFacingBridgeError(cause)); }
    } else { camera.current?.cancel(); cooldown(); }
  }
  const on = !!camera.current?.stream;
  const autoStatus: Record<ActivityState, string> = { off: "", error: "Automatic recognition stopped", calibrating: "Hold still for calibration…", armed: "Ready — perform one sign", candidate: "Movement detected", recording: "Recording sign", ending: "Recording sign · hold still to finish", recognizing: "Recognizing…", cooldown: "Ready for next sign · hold still" };
  const streamStatus: Record<StreamState, string> = { connecting: "Starting live recognition…", ready: "Ready — perform a sign", moving: "Following hand movement…", ending: "Finishing sign…" };
  const recognitionStopped = autoState === "error" && !!error;
  const status = recognitionStopped ? "Automatic recognition stopped — camera preview only" : streamState !== "off" ? streamNotice || streamStatus[streamState] : autoOn ? autoStatus[autoState] : active(job) ? (job?.cancel_requested ? "Stopping recognition" : job?.status === "queued" ? "Queued" : "Recognizing")
    : job?.status === "succeeded" ? "Completed" : job?.status === "failed" ? "Recognition failed — capture again" : job?.status === "cancelled" ? "Cancelled" : on && !previewReady ? "Waiting for camera frames" : message || ({ camera_off: "Camera off", camera_starting: "Starting camera", camera_ready: "Camera ready", error: "Camera error", countdown: "Ready", recording: "Recording", processing: "Processing" })[state];
  return <OneUICard title="Live Camera" description="Choose a model, then try one sign at a time" className="recognition-card live-camera-card"
    accessory={<OneUIStatusIndicator label={on ? "Camera on" : "Camera off"} tone={on ? "positive" : "neutral"} />}>
    <div className="studio-form">
      <div className="live-camera-setup">
      <section aria-label="Recognition model" className="studio-form">
        <OneUISelectField label="Recognition model" value={family} disabled={loadingModels || locked || autoOn} onChange={event => changeModel(event.target.value)}>
          <option value="gh_tcn" disabled={!tcnModel || tcnModel.availability !== "available"}>TCN · 25 signs + OTHER (Experimental)</option>
          <option value="visign" disabled={!research || research.availability !== "available"}>ViSign · 25 signs (Experimental)</option>
          <option value="videomae" disabled={!rgbModel || rgbModel.availability !== "available"}>VideoMAE GPU · 25 signs (Experimental)</option>
          <option value="kvsl">KVSL · topic models</option>
        </OneUISelectField>
        {researchMode ? <>
          <p className="studio-note">{tcnMode
            ? "TCN · 25 signs + OTHER. Watch the landmark replay, then enable Auto or capture one sign. Finish with Recognize now if Auto keeps following movement. Unconfirmed candidates are shown separately. Webcam accuracy is unverified."
            : family === "videomae"
            ? "VideoMAE GPU · Experimental. Keep your face, upper body and both hands inside the center square of the camera. Uncertain results are withheld; accepted words can still be wrong. First startup may take up to two minutes."
            : "Experimental · 25 Vietnamese signs, no topic selection. Source labels have not been independently reviewed. Signs outside this vocabulary may receive a wrong word."}</p>
          <details><summary>25 supported signs</summary><p className="studio-note">{model?.supported_words?.join(" · ")}</p></details>
        </> : <>
          <OneUISelectField label="KVSL topic" value={topic} disabled={loadingModels || locked || autoOn} onChange={event => { setTopic(event.target.value); setJob(null); currentJob.current = null; setError(""); }}>
            <option value="">Select a topic</option>
            {models.filter(item => item.requires_topic !== false).map(item => <option key={item.topic_id} value={item.topic_id} disabled={item.availability !== "available"}>{item.display_name}</option>)}
          </OneUISelectField>
          <p className="studio-note">Results are limited to the selected topic. Generalization to live signers is unverified.</p>
          {(!research || research.availability !== "available") && <p className="studio-note">The experimental 25-sign model is unavailable. Its local checkpoint and isolated environment are required.</p>}
        </>}
      </section>
      <div className="studio-form">
      <OneUISelectField label="Camera" value={device} disabled={locked || on} onChange={event => setDevice(event.target.value)}>
        <option value="">Default camera</option>
        {devices.map((item, index) => <option key={item.deviceId || index} value={item.deviceId}>{item.label.replace(/[\x00-\x1f]/g, "").slice(0, 100) || `Camera ${index + 1}`}</option>)}
      </OneUISelectField>
      <OneUISelectField label="Camera quality" value={cameraProfile} disabled={locked || on}
        onChange={event => setCameraProfile(event.target.value as CameraProfile)}>
        {Object.entries(CAMERA_PROFILES).map(([value, profile]) => <option key={value} value={value}>{profile.label}</option>)}
      </OneUISelectField>
      <p className="studio-note">All modes request 60 camera FPS. Lower resolution reduces delay but can lose finger detail.
        Stop the camera to change quality; compare Tracking FPS and hand detection below.</p>
      <div className="studio-actions"><OneUIButton onClick={() => void start()} disabled={locked || on}>Start camera</OneUIButton>
        <OneUIButton onClick={() => camera.current?.stop()} disabled={!on && state !== "camera_starting"}>Stop camera</OneUIButton>
        <OneUIButton variant="quiet" onClick={() => void refreshDevices()} disabled={locked}>Refresh cameras</OneUIButton></div>
      </div>
      </div>
      <div className="live-camera-workspace">
        <div className="studio-form live-camera-workspace__camera">
          <h3>Your camera</h3>
          <CameraTracking video={video} on={on} telemetry={telemetry} streaming={streamState !== "off"} recognitionStopped={recognitionStopped} onReady={() => setPreviewReady(true)} />
      <OneUISegmentedControl ariaLabel="Automatic recognition" value={autoOn ? "on" : "off"} options={[
        { value: "off", label: "Auto off" },
        { value: "on", label: "Auto on", disabled: !autoOn && (!on || !previewReady || locked || !model || model.availability !== "available") },
      ]} onChange={value => value === "on" ? enableAuto() : disableAuto()} />
      {autoOn && <p className="studio-note">{family === "videomae" || tcnMode
        ? "Perform one complete sign, then hold still or press Recognize now immediately when finished. Keep the sign under 5.5 seconds. Wait for the result before starting the next sign."
        : researchMode
        ? "Keep your upper body and hands visible. Tentative words update during movement and may change as the sign develops. Auto keeps following your hands between signs."
        : "Keep your upper body and hands near the center. Perform one sign, then hold still. Wait for the result and ready status before the next sign."}</p>}
      <div className="studio-actions"><OneUIButton variant="primary" disabled={!on || !previewReady || locked || autoOn || !model || model.availability !== "available"} onClick={() => void capture()}>{job ? "Capture again" : "Capture sign"}</OneUIButton>
        {researchMode && streamState !== "off" && <OneUIButton variant="primary"
          disabled={finishing || !["moving", "ending"].includes(streamState)}
          onClick={() => { if (stream.current?.finishSign()) setFinishing(true); }}>Recognize now</OneUIButton>}
        {state === "recording" && <OneUIButton onClick={() => camera.current?.finish()}>Finish capture</OneUIButton>}
        {(["countdown", "recording"].includes(state) || active(job)) && <OneUIButton onClick={() => void cancel()} disabled={job?.cancel_requested}>{active(job) ? "Cancel recognition" : "Cancel capture"}</OneUIButton>}</div>
      <p role="status" aria-live="polite" data-activity-state={autoState} data-stream-state={streamState !== "off" ? streamState : undefined}>{status}</p>
      {active(job) && <p className="studio-note">Processing locally. Video preprocessing can take several seconds.</p>}
      {(state === "error" || error || job?.status === "failed") && <OneUIStateMessage title={recognitionStopped ? "Live recognition stopped" : "Capture could not complete"} tone="error" description={error || (job?.status === "failed" ? job.error?.message : message) || "The clip could not be recognized. Try another capture."} />}
          <p className="studio-note">Preview is mirrored. Recognition receives the original, unmirrored video. No microphone is used.</p>
        </div>
        <div className="studio-form live-camera-workspace__side">
          <div className="live-camera-output" aria-label="Live recognition result">
      {job?.prediction && <><p>Input: Live camera · Model: {model?.display_name}</p><PredictionView prediction={job.prediction} prominent /></>}
      {streamResult?.frame.prediction?.status === "ok" && <>
        <PredictionView prediction={streamResult.frame.prediction} title={streamResult.frame.phase === "final" ? "Completed sign" : "Tentative prediction"} showLatency={false} prominent />
        <p className="studio-note">Experimental prediction · {streamResult.frame.phase === "final" ? "The movement has ended; the word is not independently verified." : "The sign is still developing; this word may be wrong."} Frame to update: {Math.round(streamResult.roundTripMs)} ms, excluding screen rendering.</p>
      </>}
      {streamResult?.frame.prediction && streamResult.frame.prediction.status !== "ok" &&
        <PredictionView prediction={streamResult.frame.prediction} prominent />}
            {!job?.prediction && !streamResult?.frame.prediction && <div className="live-camera-output__empty">
              <h3>Recognition result</h3>
              <p className="studio-note">{autoOn ? "Perform a sign to see the predicted word here." : "Start your camera, then enable Auto or capture one sign."}</p>
            </div>}
          </div>
          {researchMode && <ReferenceVideo key={model?.provider_id} bridge={bridge} providerId={model?.provider_id} />}
        </div>
      </div>
      {researchMode && <p className="studio-note">Auto processes camera frames locally in memory. Frames are discarded as the stream advances and are not saved as recordings.</p>}
      <p className="studio-note">Captured clips are stored temporarily on this device for recognition and then deleted. They are not added to a dataset or uploaded to a cloud service.</p>
    </div>
  </OneUICard>;
}
