import type { NowBarTelemetrySnapshot } from "./RuntimeActivityView";

export type TelemetryActivityState = "idle" | "connecting" | "live" | "degraded" | "disconnected";

/** Presentation only: pause belongs to the existing chart state, not acquisition. */
export function telemetryActivity(snapshot: NowBarTelemetrySnapshot) {
  const bridge = snapshot.bridgeStatus;
  const connected = snapshot.sources.filter((source) => source.state === "connected");
  const offline = snapshot.sources.filter((source) => source.state === "disconnected" || source.state === "error");
  let state: TelemetryActivityState;
  let issue = "";
  if (bridge === undefined || bridge === "idle") state = "idle";
  else if (bridge === "connecting") state = "connecting";
  else if (bridge === "closed" || bridge === "error") {
    state = "disconnected";
    issue = "Bridge connection interrupted. Last reported device counters are retained below.";
  } else if (!snapshot.sources.length) state = "idle";
  else if (!connected.length) state = snapshot.sources.some((source) => source.state === "connecting") ? "connecting" : "disconnected";
  else if (offline.length || snapshot.resyncPending || snapshot.recentPacketLoss) {
    state = "degraded";
    issue = offline.length ? `${offline.length} ${offline.length === 1 ? "source is" : "sources are"} offline.`
      : snapshot.resyncPending ? "Telemetry is being resynchronized." : "Packet gaps were observed in the last 10 seconds.";
  } else if (snapshot.sources.some((source) => source.state === "connecting")
    || !connected.some((source) => source.statisticsAvailable !== false && source.receivedPackets > 0)) state = "connecting";
  else state = "live";
  const labels: Record<TelemetryActivityState, string> = {
    idle: "No active sources", connecting: "Connecting…", live: "Receiving data",
    degraded: offline.length === 1 ? "1 source offline" : "Connection degraded",
    disconnected: bridge === "closed" || bridge === "error" ? "Bridge disconnected" : "No active sources",
  };
  const current = bridge === "open";
  const sourceRateAvailable = (source: NowBarTelemetrySnapshot["sources"][number]) => (
    current && source.state === "connected" && source.statisticsAvailable !== false
    && source.receivedPackets > 0 && Number.isFinite(source.sampleRate) && source.sampleRate >= 0
  );
  const rateAvailable = connected.length > 0 && connected.every(sourceRateAvailable);
  const compactLabels: Record<TelemetryActivityState, string> = {
    idle: "No sources", connecting: "Connecting…", live: snapshot.chartPaused ? "Charts paused" : "Receiving",
    degraded: offline.length ? `${offline.length} offline` : snapshot.resyncPending ? "Resyncing" : "Packet gaps",
    disconnected: "Disconnected",
  };
  const simulatedSources = snapshot.sources.filter((source) => source.simulated).length;
  return { state, label: labels[state], issue,
    compactLabel: compactLabels[state],
    sourceMode: simulatedSources === 0 ? "sensor" : simulatedSources === snapshot.sources.length ? "simulated" : "mixed",
    online: current ? connected.length : 0,
    rate: rateAvailable ? connected.reduce((sum, source) => sum + source.sampleRate, 0) : null,
    current,
    hasCounters: snapshot.sources.some((source) => source.statisticsAvailable),
    sources: snapshot.sources.map((source) => ({ ...source,
      health: !current ? "Status unavailable" : source.state === "connecting" ? "Connecting…"
        : source.state === "error" ? "Connection error" : source.state === "disconnected" ? "Offline"
        : source.statisticsAvailable === false || !source.receivedPackets ? "Awaiting data" : "Receiving data",
      rateLabel: sourceRateAvailable(source)
        ? `${source.sampleRate.toFixed(1)} Hz` : null,
    })),
  };
}

/** A local wall-clock annotation, never a sensor timestamp or dataset record. */
export interface TelemetryMarkerContext {
  bridgeStatus: NowBarTelemetrySnapshot["bridgeStatus"];
  chartPaused: boolean;
  receivedPackets: number;
  lostPackets: number;
  sources: Array<{ id: string; state: NowBarTelemetrySnapshot["sources"][number]["state"]; simulated: boolean }>;
}

export function createTelemetryMarker(context: TelemetryMarkerContext) {
  return { id: crypto.randomUUID(), createdAt: Date.now(), scope: "local-session" as const, context };
}

export type LocalTelemetryMarker = ReturnType<typeof createTelemetryMarker>;
