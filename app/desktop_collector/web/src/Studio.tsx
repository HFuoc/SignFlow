import { useState } from "react";

import type { DeviceDescriptor } from "./api";
import {
  OneUIButton,
  OneUICard,
  OneUICheckboxRow,
  OneUIEmptyState,
  OneUIKeyValueList,
  OneUISelectField,
  OneUISegmentedControl,
  OneUIStateMessage,
  OneUIStatusIndicator,
  OneUITextField,
} from "./one-ui";
import type { CollectorState } from "./store";
import {
  createTrainingDraft,
  inputSourceLabels,
  studioSections,
  type MediaPipeFeature,
  type StudioInputSource,
  type StudioSection,
  type StudioTrainingDraft,
} from "./studioModel";
import "./studio.css";

export { studioSections, type StudioSection } from "./studioModel";

function SourceChoice({ value, onChange, label = "Input source" }: {
  value: StudioInputSource;
  onChange: (value: StudioInputSource) => void;
  label?: string;
}) {
  return <fieldset className="studio-fieldset"><legend>{label}</legend><OneUISegmentedControl
    ariaLabel={label}
    className="studio-source-choice"
    value={value}
    onChange={onChange}
    options={(Object.keys(inputSourceLabels) as StudioInputSource[]).map((source) => ({ value: source, label: inputSourceLabels[source] }))}
  /></fieldset>;
}

function sourceStatus(device: DeviceDescriptor, bridgeOpen: boolean) {
  if (!bridgeOpen) return { label: "Status unavailable", tone: "neutral" as const };
  const status = {
    connected: { label: "Receiving data", tone: "positive" as const },
    connecting: { label: "Connecting", tone: "waiting" as const },
    disconnected: { label: "Disconnected", tone: "neutral" as const },
    error: { label: "Connection error", tone: "negative" as const },
  };
  return status[device.state];
}

function SourceReadiness({ state }: { state: CollectorState }) {
  return <OneUICard title="Current sources" description="Connection state from the collector.">
    <div className="studio-source-list">{state.devices.map((device) => {
      const status = sourceStatus(device, state.bridgeStatus === "open");
      return <div className="studio-source-row" key={device.device_id}>
        <span className={`hand-mark compact ${device.hand}`} aria-hidden="true">{device.hand_label}</span>
        <div className="studio-source-copy"><h3>{device.display_name}</h3><p>{device.hand === "left" ? "Left hand" : "Right hand"} · {device.simulated ? "Simulated sensor source" : "Sensor source"}</p>
          <OneUIStatusIndicator {...status} emphasis="quiet" />
        </div>
      </div>;
    })}</div>
    {state.devices.length === 0 && <p className="studio-note">No sensor sources are available in the current collector state.</p>}
    <OneUIKeyValueList rows={[["Camera", "Not initialized"], ["Hand tracking", "Not available"]]} />
    <p className="studio-note">Source connections do not create a dataset. No Studio capture session is active.</p>
  </OneUICard>;
}

const workflow: Array<{ section: StudioSection; label: string; description: string; state: string }> = [
  { section: "dataset", label: "Prepare your dataset", description: "Keep gesture labels and source provenance together.", state: "No dataset loaded" },
  { section: "train", label: "Configure a model", description: "Choose sensor, visual, or combined inputs.", state: "No training run" },
  { section: "evaluate", label: "Review the evidence", description: "Inspect held-out results before using a model.", state: "No evaluated model" },
  { section: "translate", label: "Explore live output", description: "Bring a ready model into a live gesture workspace.", state: "Not ready" },
];

export function Studio({ section, onSectionChange, state }: {
  section: StudioSection;
  onSectionChange: (section: StudioSection) => void;
  state: CollectorState;
}) {
  const [importOpen, setImportOpen] = useState(false);
  const [importSource, setImportSource] = useState<StudioInputSource>("sensor");
  const [datasetName, setDatasetName] = useState("");
  const [gestureLabels, setGestureLabels] = useState("");
  const [gestureLabel, setGestureLabel] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [training, setTraining] = useState<StudioTrainingDraft>(createTrainingDraft);
  const [translationSource, setTranslationSource] = useState<StudioInputSource>("sensor");
  const current = studioSections.find((item) => item.id === section)!;

  function updateTraining<K extends keyof StudioTrainingDraft>(key: K, value: StudioTrainingDraft[K]) {
    setTraining((draft) => ({ ...draft, [key]: value }));
  }

  function toggleSensorFeature(channelId: string, checked: boolean) {
    setTraining((draft) => ({ ...draft, sensorChannelIds: checked
      ? [...draft.sensorChannelIds, channelId]
      : draft.sensorChannelIds.filter((id) => id !== channelId) }));
  }

  function toggleVisionFeature(feature: MediaPipeFeature, checked: boolean) {
    setTraining((draft) => ({ ...draft, mediaPipeFeatures: checked
      ? [...draft.mediaPipeFeatures, feature]
      : draft.mediaPipeFeatures.filter((id) => id !== feature) }));
  }

  function prepareVisionImport() {
    setImportSource("mediapipe");
    setImportOpen(true);
    onSectionChange("dataset");
  }

  return (
    <section id="studio-section" className="page studio-page" aria-labelledby="page-title" data-testid="studio" data-section={section}>
      <header className="page-toolbar health-section-head one-ui-page-heading">
        <div className="health-section-copy"><h1 id="page-title" tabIndex={-1}>{section === "overview" ? "Studio" : current.label}</h1><p>{current.description}</p></div>
        <OneUIStatusIndicator label={section === "overview" ? "Workspace preview" : "Configuration only"} tone="neutral" />
      </header>

      {section === "overview" && <>
        <div className="studio-layout">
          <OneUICard title="From samples to gestures" description="A place to prepare each step of your development workflow.">
            <ol className="studio-workflow">{workflow.map((step, index) => <li key={step.section}>
              <span className="studio-step-number" aria-hidden="true">{index + 1}</span>
              <div><h3>{step.label}</h3><p>{step.description}</p><span className="studio-note">{step.state}</span></div>
              <OneUIButton variant="quiet" onClick={() => onSectionChange(step.section)} aria-label={`Open ${studioSections.find((item) => item.id === step.section)!.label}`}>Open</OneUIButton>
            </li>)}</ol>
          </OneUICard>
          <SourceReadiness state={state} />
        </div>
        <OneUICard title="One workspace, complementary inputs" className="studio-inputs-card">
          <div className="studio-inputs-grid">
            <div><h3>Glove sensors</h3><p>Independent left and right streams, with device and simulation provenance.</p></div>
            <div><h3>MediaPipe</h3><p>Visual hand tracking with its own source and collection metadata.</p><OneUIButton variant="quiet" onClick={() => onSectionChange("mediapipe")}>Prepare visual collection</OneUIButton></div>
            <div><h3>Combined input</h3><p>Sensor and visual references stay separate until an alignment workflow is available.</p></div>
          </div>
        </OneUICard>
      </>}

      {section === "dataset" && <div className="studio-layout">
        <div className="studio-stack">
          <OneUICard title="Your datasets" accessory={<OneUIButton variant="secondary" aria-expanded={importOpen} aria-controls="studio-import-draft" onClick={() => setImportOpen((open) => !open)}>{importOpen ? "Close import setup" : "Import dataset"}</OneUIButton>}>
            <OneUIEmptyState title="Start with a labeled dataset">No datasets are loaded in Studio. Sensor samples, MediaPipe samples, and combined inputs will appear here with their original provenance.</OneUIEmptyState>
            <div className="studio-dataset-details" aria-label="Dataset information">
              <OneUIKeyValueList rows={[["Gesture classes", "No labels loaded"], ["Samples", "No samples loaded"]]} />
              <OneUIKeyValueList rows={[["Created", "Not available"], ["Last modified", "Not available"]]} />
            </div>
          </OneUICard>
          {importOpen && <OneUICard title="Prepare an import" description="Draft metadata only. File import is not available yet.">
            <div id="studio-import-draft" className="studio-form">
              <OneUITextField label="Dataset name" value={datasetName} onChange={(event) => setDatasetName(event.target.value)} placeholder="Name your dataset" maxLength={120} />
              <SourceChoice label="Dataset source" value={importSource} onChange={setImportSource} />
              <OneUITextField label="Gesture labels" value={gestureLabels} onChange={(event) => setGestureLabels(event.target.value)} placeholder="Comma-separated labels" message="A draft label list; no classes or samples are created." maxLength={500} />
              <OneUIStateMessage title="Import is not available" description="Files cannot be selected or processed in this version. These details stay in this workspace only." />
              <div className="studio-actions"><OneUIButton disabled aria-describedby="studio-import-unavailable">Choose files</OneUIButton><span id="studio-import-unavailable" className="studio-note">Dataset import support is required.</span></div>
            </div>
          </OneUICard>}
        </div>
        <div className="studio-stack">
          <OneUICard title="Split readiness" description="Each partition needs labeled samples."><OneUIKeyValueList rows={[["Train", "Not assigned"], ["Validation", "Not assigned"], ["Test", "Not assigned"]]} /><p className="studio-note">No split has been created.</p></OneUICard>
          <OneUICard title="Source provenance"><OneUIKeyValueList rows={[["Sensor", "Device, hand, session, simulation label"], ["MediaPipe", "Visual source, session, tracking version"], ["Sensor + MediaPipe", "Both sources and an alignment reference"]]} /><p className="studio-note">Original sources stay identifiable. Combined input does not replace either source.</p></OneUICard>
        </div>
      </div>}

      {section === "mediapipe" && <div className="studio-layout">
        <div className="studio-stack">
          <OneUICard title="Camera preview" accessory={<OneUIStatusIndicator label="Inactive" tone="neutral" />}>
            <div className="studio-camera-preview"><OneUIEmptyState title="Camera is not initialized">No camera feed or hand tracking is active. Camera availability has not been checked.</OneUIEmptyState></div>
            <div className="studio-hand-states"><span><span className="hand-mark tiny" aria-hidden="true">L</span>Left hand <strong>Not tracking</strong></span><span><span className="hand-mark tiny right" aria-hidden="true">R</span>Right hand <strong>Not tracking</strong></span></div>
          </OneUICard>
          <OneUICard title="Preview setup" description="Preferences for a future camera session.">
            <div className="studio-form"><OneUISelectField label="Camera source" disabled><option value="">Camera selection unavailable</option></OneUISelectField>
              <OneUICheckboxRow label="Show hand landmark overlay" checked={overlayEnabled} onChange={(event) => setOverlayEnabled(event.target.checked)} meta="Draft" />
              <div className="studio-actions"><OneUIButton disabled aria-describedby="studio-camera-unavailable">Start camera</OneUIButton><span id="studio-camera-unavailable" className="studio-note">Camera and MediaPipe support are not available.</span></div>
            </div>
          </OneUICard>
        </div>
        <div className="studio-stack">
          <OneUICard title="Collection setup" description="Prepare the label and notes before collecting.">
            <div className="studio-form"><OneUITextField label="Gesture label" value={gestureLabel} onChange={(event) => setGestureLabel(event.target.value)} placeholder="Enter a gesture label" maxLength={120} />
              <OneUITextField label="Session notes" value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} placeholder="Optional collection notes" maxLength={500} />
              <OneUIKeyValueList rows={[["Session", "Not started"], ["Collected samples", "No samples collected"]]} />
              <OneUIButton variant="primary" disabled aria-describedby="studio-record-unavailable">Start recording</OneUIButton>
              <p id="studio-record-unavailable" className="studio-note">Recording requires an active camera and collection support.</p>
            </div>
          </OneUICard>
          <OneUICard title="Already have visual samples?" description="Prepare an import for MediaPipe-generated data."><OneUIButton onClick={prepareVisionImport}>Prepare MediaPipe import</OneUIButton></OneUICard>
        </div>
      </div>}

      {section === "train" && <div className="studio-layout">
        <div className="studio-stack">
          <OneUICard title="Training input" description="Draft configuration · kept in memory while Studio is open.">
            <div className="studio-form"><OneUISelectField label="Dataset" disabled><option value="">No dataset available</option></OneUISelectField><SourceChoice value={training.inputSource} onChange={(source) => updateTraining("inputSource", source)} />
              {training.inputSource !== "mediapipe" && <fieldset className="studio-fieldset"><legend>Sensor features</legend>
                {state.channels.length ? <div className="studio-feature-grid">{state.channels.map((channel) => <OneUICheckboxRow key={channel.id} label={channel.label} meta={channel.unit} checked={training.sensorChannelIds.includes(channel.id)} onChange={(event) => toggleSensorFeature(channel.id, event.target.checked)} />)}</div> : <p className="studio-note">Channel definitions will be available after the collector connects.</p>}
              </fieldset>}
              {training.inputSource !== "sensor" && <fieldset className="studio-fieldset"><legend>MediaPipe features</legend>
                <OneUICheckboxRow label="Hand landmark positions" checked={training.mediaPipeFeatures.includes("landmark-position")} onChange={(event) => toggleVisionFeature("landmark-position", event.target.checked)} />
                <OneUICheckboxRow label="Handedness" checked={training.mediaPipeFeatures.includes("handedness")} onChange={(event) => toggleVisionFeature("handedness", event.target.checked)} />
              </fieldset>}
              {training.inputSource === "sensor-mediapipe" && <OneUIStateMessage title="Alignment required" description="Sensor and visual streams need an explicit alignment before combined training can be available." />}
            </div>
          </OneUICard>
          <OneUICard title="Model configuration" description="Configuration choices do not start a training job.">
            <div className="studio-form"><OneUISelectField label="Model type" value={training.modelType} onChange={(event) => updateTraining("modelType", event.currentTarget.value as StudioTrainingDraft["modelType"])}><option value="">Select a model type</option><option value="cnn">CNN</option><option value="gru">GRU</option></OneUISelectField>
              <div className="studio-form-grid"><OneUITextField label="Epochs" type="number" min="1" step="1" value={training.epochs} onChange={(event) => updateTraining("epochs", event.target.value)} placeholder="Not set" /><OneUITextField label="Batch size" type="number" min="1" step="1" value={training.batchSize} onChange={(event) => updateTraining("batchSize", event.target.value)} placeholder="Not set" /></div>
              <OneUITextField label="Learning rate" type="number" min="0" step="any" value={training.learningRate} onChange={(event) => updateTraining("learningRate", event.target.value)} placeholder="Not set" />
              <div className="studio-actions"><OneUIButton variant="quiet" onClick={() => setTraining(createTrainingDraft())}>Reset configuration</OneUIButton></div>
            </div>
          </OneUICard>
        </div>
        <OneUICard title="Training job" accessory={<OneUIStatusIndicator label="Not started" tone="neutral" />}>
          <OneUIEmptyState title="No training run">Progress and run details will appear when a training service is available and a job has actually started.</OneUIEmptyState>
          <OneUIKeyValueList rows={[["Dataset", "Required"], ["Input", inputSourceLabels[training.inputSource]], ["Model", training.modelType ? training.modelType.toUpperCase() : "Not selected"], ["Progress", "Not available"]]} />
          <OneUIButton variant="primary" disabled aria-describedby="studio-training-unavailable">Start training</OneUIButton><p id="studio-training-unavailable" className="studio-note">Training is not available in this version.</p>
        </OneUICard>
      </div>}

      {section === "evaluate" && <>
        <OneUICard title="Evaluation setup" description="Select a trained model and an independent test partition.">
          <div className="studio-form-grid studio-evaluation-setup"><OneUISelectField label="Model / training run" disabled><option value="">No model available</option></OneUISelectField><OneUISelectField label="Evaluation dataset" disabled><option value="">No test dataset available</option></OneUISelectField><OneUIButton variant="primary" disabled aria-describedby="studio-evaluation-unavailable">Run evaluation</OneUIButton></div>
          <p id="studio-evaluation-unavailable" className="studio-note">Evaluation support is not available. No results have been calculated.</p>
        </OneUICard>
        <div className="studio-layout">
          <OneUICard title="Evaluation summary" accessory={<OneUIStatusIndicator label="No results" tone="neutral" />}>
            <div className="studio-metric-placeholders"><div><span>Accuracy</span><strong>Not evaluated</strong></div><div><span>Precision / recall</span><strong>Not evaluated</strong></div></div>
            <div className="studio-result-empty"><OneUIEmptyState title="Confusion matrix">Class comparisons will appear after a real evaluation. No matrix data is available.</OneUIEmptyState></div>
          </OneUICard>
          <div className="studio-stack"><OneUICard title="Per-class results"><OneUIEmptyState title="No class results">Precision, recall, and sample support will be shown for evaluated gesture classes.</OneUIEmptyState></OneUICard><OneUICard title="Error analysis"><OneUIEmptyState title="No samples to inspect">Misclassified samples and their source references will become available with evaluation results.</OneUIEmptyState></OneUICard></div>
        </div>
      </>}

      {section === "translate" && <div className="studio-layout">
        <div className="studio-stack">
          <OneUICard title="Live gesture workspace" accessory={<OneUIStatusIndicator label="Inactive" tone="neutral" />}>
            <div className="studio-form"><SourceChoice value={translationSource} onChange={setTranslationSource} /><OneUISelectField label="Gesture model" disabled><option value="">No model available</option></OneUISelectField></div>
            <OneUIEmptyState title="Waiting for a ready model">Live recognition is not available. No gesture is being detected.</OneUIEmptyState>
            <OneUIKeyValueList rows={[["Detected gesture", "Not available"], ["Confidence", "Not available"], ["Alternate candidates", "No predictions"]]} />
            <div className="studio-actions"><OneUIButton variant="primary" disabled aria-describedby="studio-translate-unavailable">Start translation</OneUIButton><span id="studio-translate-unavailable" className="studio-note">A ready model and inference support are required.</span></div>
          </OneUICard>
          <OneUICard title="Text output" accessory={<div className="studio-actions"><OneUIButton variant="quiet" disabled aria-label="Clear text output; no output to clear">Clear</OneUIButton><OneUIButton variant="quiet" disabled aria-label="Read aloud; speech output unavailable">Read aloud</OneUIButton></div>}>
            <div className="studio-text-output"><p>Recognized words and sentences will appear here.</p></div>
            <p className="studio-note">No text has been generated. Speech output is not available.</p>
          </OneUICard>
        </div>
        <div className="studio-stack"><SourceReadiness state={state} /><OneUICard title="Translation history"><OneUIEmptyState title="No history yet">Completed output will appear here when translation becomes available.</OneUIEmptyState></OneUICard></div>
      </div>}
    </section>
  );
}
