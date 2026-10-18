import { useEffect, useRef, useState } from "react";
import { BridgeClient, BridgeRequestError, userFacingBridgeError, type RecognitionJob, type RecognitionModel, type RecognitionSample, type RecognitionPrediction } from "./api";
import { OneUIButton, OneUICard, OneUIKeyValueList, OneUISelectField, OneUIStateMessage } from "./one-ui";

const active = (job: RecognitionJob | null) => job?.status === "queued" || job?.status === "running";
const labels = { queued: "Queued", running: "Running", succeeded: "Completed", failed: "Failed", cancelled: "Cancelled" };
const errors: Record<string, string> = {
  worker_timeout: "The recognition worker timed out. You can try again.",
  worker_exit: "The recognition worker stopped unexpectedly.",
  worker_protocol: "The worker returned an invalid result.",
  missing_asset: "The selected local video is unavailable.",
  missing_executable: "The isolated ML environment is unavailable.",
  missing_model: "The verified model checkpoint is unavailable.",
};

export function Recognition({ bridge }: { bridge: BridgeClient }) {
  const [models, setModels] = useState<RecognitionModel[]>([]);
  const [samples, setSamples] = useState<RecognitionSample[]>([]);
  const [selected, setSelected] = useState("");
  const [topic, setTopic] = useState("");
  const [job, setJob] = useState<RecognitionJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pollError, setPollError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const mounted = useRef(false);
  const action = useRef(false);
  const sample = samples.find(item => item.sample_id === selected);
  const model = models.find(item => item.topic_id === topic);
  const topicSamples = samples.filter(item => item.topic_id === topic && item.provider_id === model?.provider_id);
  const running = active(job);
  const prediction = job?.sample_id === selected ? job.prediction : null;

  function accept(next: RecognitionJob) {
    setJob(previous => previous?.job_id === next.job_id && !active(previous) ? previous : next);
  }

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void Promise.all([
      bridge.recognitionModels(controller.signal), bridge.recognitionSamples(controller.signal),
      bridge.recognitionJobs(controller.signal),
    ]).then(([modelData, sampleData, jobData]) => {
      if (controller.signal.aborted) return;
      setModels(modelData.models.filter(item => item.requires_topic !== false));
      setSamples(sampleData.samples);
      const datasetJobs = jobData.jobs.filter(item => item.source_kind !== "live_camera_capture");
      const latest = datasetJobs.find(active) ?? datasetJobs.at(-1) ?? null;
      setJob(latest);
      const initial = sampleData.samples.find(item => item.sample_id === latest?.sample_id)
        ?? sampleData.samples.find(item => item.supported) ?? sampleData.samples[0];
      setSelected(initial?.sample_id ?? "");
      setTopic(initial?.topic_id ?? modelData.models[0]?.topic_id ?? "");
    }).catch(cause => {
      if (!controller.signal.aborted) setError(userFacingBridgeError(cause));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [bridge, refresh]);

  useEffect(() => {
    if (!job || !active(job)) return;
    const id = job.job_id;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      let again = true;
      try {
        const next = await bridge.recognitionJob(id, controller.signal);
        if (controller.signal.aborted) return;
        accept(next);
        setPollError("");
        again = active(next);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setPollError(userFacingBridgeError(cause));
        if (cause instanceof BridgeRequestError && [401, 403, 404].includes(cause.status)) again = false;
      }
      if (again && !controller.signal.aborted) timer = setTimeout(poll, 1000);
    }
    timer = setTimeout(poll, 750);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [bridge, job?.job_id, job?.status, refresh]);

  async function run() {
    if (!sample || !model || action.current || running) return;
    action.current = true;
    setBusy(true); setError(""); setPollError("");
    try {
      const next = await bridge.submitRecognition(sample.sample_id, model.provider_id);
      if (mounted.current) accept(next);
    } catch (cause) {
      if (mounted.current) setError(userFacingBridgeError(cause));
      // A lost POST response may still have created a job. Recover by session identity.
      try {
        const data = await bridge.recognitionJobs();
        if (mounted.current) {
          const pending = data.jobs.find(item => item.source_kind !== "live_camera_capture" && active(item));
          if (pending) { accept(pending); setSelected(pending.sample_id ?? ""); setTopic(samples.find(item => item.sample_id === pending.sample_id)?.topic_id ?? ""); }
        }
      } catch { /* Preserve the original safe error; duplicate submissions are rejected server-side. */ }
    } finally {
      action.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function cancel() {
    if (!job || action.current) return;
    action.current = true; setBusy(true); setError("");
    try {
      const next = await bridge.cancelRecognition(job.job_id);
      if (mounted.current) accept(next);
    } catch (cause) {
      if (mounted.current) setError(userFacingBridgeError(cause));
    } finally {
      action.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return <OneUICard title="KVSL Dataset" description={loading ? "KVSL experimental recognition" :
    `KVSL experimental recognition · ${models.length} verified topics · ${models.reduce((total, item) => total + item.class_count, 0)} verified classes · ${samples.length} manifest samples`} className="recognition-card">
    {loading ? <OneUIStateMessage title="Loading local dataset" pending /> : <>
      {models.length > 0 && <div className="studio-form">
        <OneUISelectField label="KVSL topic" value={topic} disabled={running || busy}
          onChange={event => {
            if (running || busy) return;
            const next = event.target.value;
            setTopic(next);
            const choices = samples.filter(item => item.topic_id === next);
            setSelected((choices.find(item => item.supported) ?? choices[0])?.sample_id ?? "");
            setJob(null); setError(""); setPollError("");
          }}>
          {models.map(item => <option key={item.provider_id} value={item.topic_id} disabled={item.availability !== "available"}>
            {item.display_name + (item.availability !== "available" ? " · Unavailable" : "")}
          </option>)}
        </OneUISelectField>
        <OneUISelectField label="KVSL recording" value={selected} disabled={running || busy}
          onChange={event => { setSelected(event.target.value); setJob(null); setError(""); setPollError(""); }}>
          {topicSamples.map(item => <option key={item.sample_id} value={item.sample_id}>{item.filename + " · " + item.display_label}</option>)}
        </OneUISelectField>
        {sample && <OneUIKeyValueList rows={[["Recording", sample.recording_id], ["Dataset label", sample.display_label],
          ["Topic", model?.display_name ?? sample.topic_id], ["Provider", sample.provider_id], ["Local video", sample.asset_status === "valid" ? "Available" : "Unavailable"]]} />}
        {(!sample?.supported || model?.availability !== "available") && <OneUIStateMessage title="Recognition unavailable"
          description={sample?.reason ?? model?.reason ?? "A supported local sample and provider are required."} />}
        <div className="studio-actions">
          <OneUIButton variant="primary" onClick={() => void run()} disabled={busy || running || !sample?.supported || model?.availability !== "available"}>Recognize</OneUIButton>
          {running && <OneUIButton onClick={() => void cancel()} disabled={busy || job?.cancel_requested}>Cancel recognition</OneUIButton>}
        </div>
      </div>}
      {!samples.length && !error && <OneUIStateMessage title="No supported samples" description="Configure the local manifest and verified video assets." />}
    </>}
    <div role="status" aria-live="polite" aria-atomic="true" className="recognition-status">
      {job && <span>{labels[job.status]}{running && job.cancel_requested ? " · Cancellation requested; waiting for worker to stop" : ""}</span>}
    </div>
    {running && <p className="studio-note">One job runs at a time. Model startup and video processing may take 10 seconds or longer.</p>}
    {job?.status === "failed" && <OneUIStateMessage title="Recognition failed" tone="error" description={errors[job.error?.code ?? ""] ?? "Recognition could not complete. Check local artifacts and try again."} />}
    {prediction && <PredictionView prediction={prediction} />}
    {(error || pollError) && <OneUIStateMessage title={pollError ? "Status temporarily unavailable" : "Recognition unavailable"} tone="error" description={error || pollError}
      action={<OneUIButton variant="quiet" disabled={busy || loading} onClick={() => setRefresh(value => value + 1)}>Retry connection</OneUIButton>} />}
    <p className="studio-note">Job history is session-local and clears when the app closes. Video preview is not available.</p>
  </OneUICard>;
}

export function PredictionView({ prediction, title, showLatency = true, prominent = false }: { prediction: RecognitionPrediction; title?: string; showLatency?: boolean; prominent?: boolean }) {
  if (prediction.status !== "ok") {
    const quality = prediction.quality;
    const candidates = prediction.status === "rejected" ? quality?.candidate_top_k ?? [] : [];
    const coverage = quality?.hand_coverage ?? quality?.hand_present_fraction;
    return <section aria-label="Model prediction" className="recognition-result">
      <h3>{prediction.status === "rejected" ? "Sign not confirmed" : "Sign could not be evaluated"}</h3>
      <p role="status">{prediction.rejection_reason ?? "Capture one complete sign and try again."}</p>
      {candidates.length > 0 && <>
        <h4>Closest supported signs · unconfirmed</h4>
        {quality?.native_winner_supported === false && <p className="studio-note">The model's highest score is outside the supported vocabulary. These alternatives are not an accepted prediction.</p>}
        <ol>{candidates.map(item => <li key={item.label_id}><span>{item.display_name}</span><span>Model score <strong>{item.score.toFixed(6)}</strong></span></li>)}</ol>
        <p className="studio-note">These are the model's guesses, not recognized words. Scores are not accuracy measurements.</p>
        {quality?.accept_threshold !== undefined && <p className="studio-note">Acceptance threshold: {quality.accept_threshold.toFixed(6)}{quality.other_score !== undefined ? ` · Outside-vocabulary score: ${quality.other_score.toFixed(6)}` : ""}.</p>}
      </>}
      <details><summary>Capture details</summary><OneUIKeyValueList rows={[
        ["Model", prediction.provider_id], ["Frames evaluated", String(quality?.frames_decoded ?? "Unavailable")],
        ["Frames with a hand", coverage === undefined ? "Unavailable" : `${Math.round(coverage * 100)}%`],
        ["Segment ended by", quality?.boundary_reason === "manual_finish" ? "Recognize now" : quality?.boundary_reason ?? "Manual capture"],
      ]} /></details>
    </section>;
  }
  const details = <>
      <ol>{prediction.top_k.map(item => <li key={item.label_id}><span>{item.display_name}</span><span>Model score <strong>{item.score.toFixed(4)}</strong></span></li>)}</ol>
      <p className="studio-note">{prediction.score_kind === "raw_ridge"
        ? "Raw model scores; these are not probabilities or accuracy measurements."
        : "Uncalibrated softmax scores; these are not accuracy measurements."}</p>
      {showLatency && Number.isFinite(prediction.latency_ms.total) && <p className="studio-note">Processing time: {(prediction.latency_ms.total / 1000).toFixed(2)} s · excludes recording time.</p>}
      {prediction.quality?.frames_decoded && Object.values(prediction.quality.missing_group_frames ?? {}).some(count => count === prediction.quality!.frames_decoded) ?
        <p className="studio-note">At least one landmark group was absent in every decoded frame. This can limit the usefulness of the prediction.</p> : null}
      <OneUIKeyValueList rows={[["Model", prediction.provider_id], ["Preprocessing", prediction.preprocessing_id]]} />
  </>;
  return <section aria-label="Model prediction" className={`recognition-result${prominent ? " recognition-result--prominent" : ""}`}>
      <h3>{prominent ? <><span className="recognition-result__label">{title ?? "Prediction"}: </span><span className="recognition-result__word">{prediction.top_k[0]?.display_name}</span></> : <>{title ?? "Prediction"}: {prediction.top_k[0]?.display_name}</>}</h3>
      {prominent ? <details className="recognition-result__details"><summary>Scores and model details</summary>{details}</details> : details}
    </section>;
}
