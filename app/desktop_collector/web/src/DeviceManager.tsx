import { FormEvent, type MouseEvent, useEffect, useRef, useState } from "react";

import type { DeviceDescriptor } from "./api";
import {
  OneUIButton,
  OneUIDialog,
  OneUIStatusIndicator,
  OneUITextField,
  type SnackbarNotice,
} from "./one-ui";
import type { CollectorState } from "./store";
import { collectorStore } from "./store";
import { collectorAudiences, type RuntimeActivityInput } from "./runtimeActivity";

const stateText = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Receiving data",
  error: "Error",
} as const;

const stateTone = {
  disconnected: "neutral",
  connecting: "waiting",
  connected: "positive",
  error: "negative",
} as const;

function currentFailureReason(): string {
  return collectorStore.getSnapshot().error ?? "The local bridge is temporarily unavailable.";
}


function flexSignals(state: CollectorState, device: DeviceDescriptor) {
  return state.channels.filter((channel) => channel.group === "flex").map((channel) => {
    const sample = state.series[device.device_id]?.values[channel.id]?.at(-1);
    const value = device.state === "connected" && typeof sample === "number" && Number.isFinite(sample)
      ? sample : null;
    return { ...channel, value, height: value == null ? 0 : Math.max(0, Math.min(100, value / 4095 * 100)) };
  });
}
function formatLastPacket(value: string | null | undefined): string {
  if (!value) return "No packet yet";
  const milliseconds = Number(BigInt(value) / 1_000_000n);
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(milliseconds);
}

type DisconnectRequest =
  | { scope: "all" }
  | { scope: "device"; deviceId: string; deviceName: string };

export type DeviceSection = "overview" | "gloves" | "signals" | "simulator";

export function DeviceManager({
  onActivity,
  onNotify,
  section = "overview",
  state,
}: {
  onActivity: (activity: RuntimeActivityInput) => void;
  onNotify: (notice: Omit<SnackbarNotice, "id">) => void;
  section?: DeviceSection;
  state: CollectorState;
}) {
  const [draft, setDraft] = useState(state.simulation);
  const [saving, setSaving] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<string | null>(null);
  const [disconnectRequest, setDisconnectRequest] = useState<DisconnectRequest | null>(null);
  const connectionLockRef = useRef(false);
  const savingLockRef = useRef(false);
  const dialogReturnRef = useRef<HTMLElement>(null);

  useEffect(() => setDraft(state.simulation), [state.simulation]);

  async function applySimulator() {
    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const succeeded = await collectorStore.configureSimulator(draft);
      onActivity(succeeded
        ? {
            key: "simulator-config",
            kind: "simulator",
            surface: "center",
            severity: "success",
            title: "Simulation settings applied",
            message: `${draft.sample_rate_hz} Hz · packet loss ${(draft.packet_loss_rate * 100).toFixed(1)}%.`,
            audiences: collectorAudiences,
            active: false,
            dismissible: true,
            actionLabel: "Open Devices",
            command: { kind: "navigate", page: "devices" },
            announcedBySnackbar: true,
          }
        : {
            key: "simulator-config",
            kind: "simulator",
            surface: "both",
            severity: "error",
            title: "Could not apply simulation settings",
            message: currentFailureReason(),
            audiences: collectorAudiences,
            active: true,
            dismissible: false,
            actionLabel: "Retry",
            command: { kind: "retry-simulator", config: { ...draft } },
            announcedBySnackbar: true,
            markUnread: "always",
          });
      onNotify(succeeded
        ? { message: "Simulation settings applied.", tone: "success" }
        : {
            actionLabel: "Retry",
            message: `Could not apply settings. ${currentFailureReason()}`,
            onAction: () => void applySimulator(),
            tone: "error",
          });
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await applySimulator();
  }

  async function setDeviceConnected(device: DeviceDescriptor, connect: boolean) {
    if (connectionLockRef.current) return;
    connectionLockRef.current = true;
    setPendingConnection(`${connect ? "connect" : "disconnect"}:${device.device_id}`);
    try {
      const succeeded = await collectorStore.setConnected(device.device_id, connect);
      const verb = connect ? "connect" : "disconnect";
      onActivity({
        key: `device-operation:${device.device_id}:${connect ? "connect" : "disconnect"}`,
        kind: "device",
        surface: succeeded ? "center" : "both",
        severity: succeeded ? "success" : "error",
        title: succeeded ? `Device ${connect ? "connected" : "disconnected"}` : `Could not ${verb} device`,
        message: succeeded ? `${device.display_name} confirmed the new state.` : `${device.display_name}. ${currentFailureReason()}`,
        audiences: collectorAudiences,
        active: !succeeded,
        dismissible: succeeded,
        actionLabel: connect && !succeeded ? "Retry" : "Open Devices",
        command: connect && !succeeded
          ? { kind: "retry-device", connect: true, deviceId: device.device_id, deviceName: device.display_name }
          : { kind: "navigate", page: "devices" },
        announcedBySnackbar: true,
        markUnread: succeeded ? "new-only" : "always",
      });
      onNotify(succeeded
        ? { message: `${device.display_name} ${connect ? "connected" : "disconnected"}.`, tone: "success" }
        : { message: `Could not ${verb} ${device.display_name}. ${currentFailureReason()}`, tone: "error" });
    } finally {
      connectionLockRef.current = false;
      setPendingConnection(null);
    }
  }

  async function setAllConnected(connect: boolean) {
    if (connectionLockRef.current) return;
    connectionLockRef.current = true;
    setPendingConnection(connect ? "connect:all" : "disconnect:all");
    try {
      const succeeded = await collectorStore.setAllConnected(connect);
      onActivity({
        key: `device-operation:all:${connect ? "connect" : "disconnect"}`,
        kind: "device",
        surface: succeeded ? "center" : "both",
        severity: succeeded ? "success" : "error",
        title: succeeded
          ? (connect ? "All devices connected" : "All devices disconnected")
          : (connect ? "Could not connect all devices" : "Could not disconnect all devices"),
        message: succeeded ? "Both sources confirmed the requested state." : currentFailureReason(),
        audiences: collectorAudiences,
        active: !succeeded,
        dismissible: succeeded,
        actionLabel: connect && !succeeded ? "Retry" : "Open Devices",
        command: connect && !succeeded
          ? { kind: "retry-all-devices", connect: true }
          : { kind: "navigate", page: "devices" },
        announcedBySnackbar: true,
        markUnread: succeeded ? "new-only" : "always",
      });
      onNotify(succeeded
        ? { message: connect ? "All devices connected." : "All devices disconnected.", tone: "success" }
        : { message: `${connect ? "Could not connect all devices." : "Could not disconnect all devices."} ${currentFailureReason()}`, tone: "error" });
    } finally {
      connectionLockRef.current = false;
      setPendingConnection(null);
    }
  }

  function requestDisconnect(event: MouseEvent<HTMLButtonElement>, request: DisconnectRequest) {
    if (disconnectRequest || connectionLockRef.current) return;
    dialogReturnRef.current = event.currentTarget;
    setDisconnectRequest(request);
  }

  async function confirmDisconnect() {
    if (!disconnectRequest || connectionLockRef.current) return;
    const request = disconnectRequest;
    if (request.scope === "all") {
      await setAllConnected(false);
    } else {
      const device = state.devices.find((candidate) => candidate.device_id === request.deviceId);
      if (device) await setDeviceConnected(device, false);
    }
    setDisconnectRequest(null);
  }

  const sectionCopy = {
    overview: ["Device Manager", "Two gloves, two independent sources · monitor connection state and data quality"],
    gloves: ["Gloves", "Manage source connectivity, packet health, and device state."],
    signals: ["Sensor signals", "Inspect the current flex profile and sensor-channel availability for each glove."],
    simulator: ["Simulator", "Tune both simulated sources while keeping their data streams independent."],
  } as const;
  const showCards = section !== "simulator";
  const showVisual = section === "overview" || section === "signals";
  const showMetrics = section === "overview" || section === "gloves";
  const showSettings = section === "overview" || section === "simulator";

  return (
    <section className="page device-page health-device-page" aria-labelledby="page-title" data-testid="device-manager">
      <header id="device-overview" className="page-toolbar health-section-head one-ui-page-heading">
        <div className="device-page-intro health-section-copy">
          <h1 id="page-title" tabIndex={-1}>{sectionCopy[section][0]}</h1>
          <p>{sectionCopy[section][1]}</p>
        </div>
        {section !== "signals" && section !== "simulator" ? <div className="heading-actions health-heading-actions">
          <OneUIButton
            variant="secondary"
            type="button"
            disabled={pendingConnection != null}
            onClick={(event) => requestDisconnect(event, { scope: "all" })}
          >
            Disconnect all
          </OneUIButton>
          <OneUIButton
            variant="primary"
            type="button"
            disabled={pendingConnection != null}
            loading={pendingConnection === "connect:all"}
            loadingLabel="Connecting all"
            loadingText="Connecting…"
            onClick={() => void setAllConnected(true)}
          >
            Connect all
          </OneUIButton>
        </div> : null}
      </header>

      {showCards ? <div id="device-gloves" className="device-grid health-device-grid" data-subview={section}>
        {state.devices.map((device) => {
          const stats = state.statistics[device.device_id];
          const connected = device.state === "connected";
          const signals = flexSignals(state, device);
          return (
            <article
              id={`device-${device.hand}`}
              className="device-card health-device-card one-ui-surface"
              key={device.device_id}
              data-hand={device.hand}
              data-state={device.state}
            >
              <div className="device-card-top health-device-card-top">
                <div className="health-device-identity-wrap">
                  <span className={`hand-mark ${device.hand}`} role="img" aria-label={`${device.hand_label} glove marker`}>
                    {device.hand_label}
                  </span>
                  <div className="device-identity">
                    <h2>{device.display_name}</h2>
                    <code>{device.device_id}</code>
                    <OneUIStatusIndicator
                      className="device-status"
                      emphasis="quiet"
                      label={stateText[device.state]}
                      size="medium"
                      tone={stateTone[device.state]}
                    />
                  </div>
                </div>
                <div className="health-rate">
                  <small>Sample rate</small>
                  <strong>{connected ? stats?.sample_rate_hz.toFixed(1) ?? "0.0" : "—"}</strong><span>Hz</span>
                </div>
              </div>

              {showVisual ? <div id={device.hand === "left" ? "device-signals" : undefined} className="health-visual-row">
                <div className="health-signal-card">
                  <span>Flex signal</span>
                  <div className="health-flex-bars" role="img" aria-label={signals.map((signal) => `${signal.label}: ${signal.value == null ? "no data" : `${Math.round(signal.value)} ${signal.unit}`}`).join(", ")}>
                    {signals.map((signal) => <i key={signal.id} data-missing={signal.value == null || undefined} style={{ height: `${signal.height}%` }} />)}
                  </div>
                  {!connected && <small className="health-signal-note">No live data</small>}
                </div>
                <div className="health-sensor-card">
                  <span>{state.channels.length} sensor channels</span>
                  <div className="health-sensor-ring">{state.channels.length}</div>
                  <small>Flex · IMU · FSR · distance</small>
                </div>
              </div> : null}

              {showMetrics ? <div className="health-device-metrics" role="group" aria-label={`${device.display_name} metrics`}>
                <div><span>Packets received</span><strong>{stats?.received_packets.toLocaleString("en-US") ?? "0"}</strong></div>
                <div className={(stats?.lost_packets ?? 0) > 0 ? "is-warning" : ""}><span>Packets lost</span><strong>{stats?.lost_packets.toLocaleString("en-US") ?? "0"}</strong></div>
                <div><span>Latest packet</span><strong>{formatLastPacket(stats?.last_packet_host_ns)}</strong></div>
              </div> : null}

              {showMetrics ? <div className="device-footer health-device-footer">
                <div className="health-sensor-copy">
                  <strong>{device.simulated ? "Simulator source" : device.source_kind}</strong>
                  <span>Nominal rate {device.nominal_sample_rate_hz} Hz</span>
                </div>
                <OneUIButton
                  variant={connected ? "danger-quiet" : "secondary"}
                  type="button"
                  disabled={device.state === "connecting" || pendingConnection != null}
                  loading={pendingConnection === `${connected ? "disconnect" : "connect"}:${device.device_id}`}
                  loadingLabel={connected ? "Disconnecting" : "Connecting"}
                  loadingText={connected ? "Disconnecting…" : "Connecting…"}
                  onClick={(event) => connected
                    ? requestDisconnect(event, { scope: "device", deviceId: device.device_id, deviceName: device.display_name })
                    : void setDeviceConnected(device, true)}
                >
                  {connected ? "Disconnect" : "Connect"}
                </OneUIButton>
              </div> : null}
            </article>
          );
        })}
      </div> : null}

      {showSettings ? <form id="device-settings" className="settings-card health-settings-card one-ui-surface" onSubmit={submit} aria-labelledby="simulator-title">
        <div className="settings-copy">
          <h2 id="simulator-title">Simulation settings</h2>
          <p>Apply to both sources while keeping their data streams independent.</p>
        </div>
        <div className="simulator-fields">
          <OneUITextField
            label="Seed"
            type="number"
            value={draft.seed}
            onChange={(event) => setDraft({ ...draft, seed: Number(event.target.value) })}
          />
          <OneUITextField
            label="Rate"
            type="number"
            min="1"
            max="500"
            step="1"
            suffix="Hz"
            value={draft.sample_rate_hz}
            onChange={(event) => setDraft({ ...draft, sample_rate_hz: Number(event.target.value) })}
          />
          <OneUITextField
            label="Noise σ"
            type="number"
            min="0"
            max="500"
            step="0.5"
            value={draft.noise_std}
            onChange={(event) => setDraft({ ...draft, noise_std: Number(event.target.value) })}
          />
          <OneUITextField
            label="Packet loss"
            type="number"
            min="0"
            max="99"
            step="0.1"
            suffix="%"
            value={draft.packet_loss_rate * 100}
            onChange={(event) => setDraft({ ...draft, packet_loss_rate: Number(event.target.value) / 100 })}
          />
        </div>
        <OneUIButton className="simulator-apply" variant="primary" type="submit" loading={saving} loadingLabel="Applying settings" loadingText="Applying…">
          Apply
        </OneUIButton>
      </form> : null}

      <OneUIDialog
        open={disconnectRequest != null}
        title={disconnectRequest?.scope === "all" ? "Disconnect all devices?" : `Disconnect ${disconnectRequest?.deviceName ?? "device"}?`}
        description={disconnectRequest?.scope === "all"
          ? "Live data from both gloves will stop displaying. You can reconnect the sources at any time."
          : "Live data from this glove will stop displaying. You can reconnect it from Device Manager."}
        confirmLabel={disconnectRequest?.scope === "all" ? "Disconnect all" : "Disconnect"}
        destructive
        pending={pendingConnection?.startsWith("disconnect:") ?? false}
        pendingLabel="Disconnecting"
        pendingText="Disconnecting…"
        returnFocusRef={dialogReturnRef}
        onConfirm={() => void confirmDisconnect()}
        onDismiss={() => { if (!pendingConnection) setDisconnectRequest(null); }}
      />
    </section>
  );
}
