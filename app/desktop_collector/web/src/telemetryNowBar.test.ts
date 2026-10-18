import { describe, expect, it } from "vitest";
import type { NowBarTelemetrySnapshot, NowBarTelemetrySource } from "./RuntimeActivityView";
import { telemetryActivity } from "./telemetryNowBar";

const source = (id: string, hand: "left" | "right"): NowBarTelemetrySource => ({
  id, name: `${hand} glove`, hand, handLabel: hand === "left" ? "L" : "R",
  state: "connected", stateLabel: "Connected", sampleRate: 50,
  receivedPackets: 120, lostPackets: 0, simulated: true, statisticsAvailable: true,
});
const snapshot = (): NowBarTelemetrySnapshot => ({
  bridgeStatus: "open", connectedSources: 2, totalSources: 2, totalSampleRate: 100,
  totalReceivedPackets: 240, totalLostPackets: 0, chartPaused: false,
  sources: [source("left", "left"), source("right", "right")],
});

describe("Now Bar telemetry truth", () => {
  it("sums current source rates and preserves simulation identity", () => {
    const result = telemetryActivity(snapshot());
    expect(result).toMatchObject({ state: "live", rate: 100, online: 2, sourceMode: "simulated" });
    expect(result.sources.map(s => s.rateLabel)).toEqual(["50.0 Hz", "50.0 Hz"]);
  });
  it("keeps acquisition live when only charts are paused", () => {
    expect(telemetryActivity({ ...snapshot(), chartPaused: true })).toMatchObject({
      state: "live", compactLabel: "Charts paused", rate: 100, current: true,
    });
  });
  it.each(["offline", "resync", "gaps"])("does not hide %s behind chart pause", (cause) => {
    const input = snapshot(); input.chartPaused = true;
    if (cause === "offline") input.sources[1].state = "disconnected";
    if (cause === "resync") input.resyncPending = true;
    if (cause === "gaps") input.recentPacketLoss = true;
    expect(telemetryActivity(input).state).toBe("degraded");
    expect(telemetryActivity(input).issue).not.toBe("");
  });
  it("never presents stale rates or online counts after bridge loss", () => {
    const result = telemetryActivity({ ...snapshot(), bridgeStatus: "closed", chartPaused: true });
    expect(result).toMatchObject({ state: "disconnected", rate: null, online: 0, current: false });
    expect(result.sources.every(s => s.rateLabel === null && s.health === "Status unavailable")).toBe(true);
  });
  it("withholds the aggregate when a connected source has no statistics", () => {
    const input = snapshot(); input.sources[0].statisticsAvailable = false;
    expect(telemetryActivity(input).rate).toBeNull();
    expect(telemetryActivity(input).sources[0].rateLabel).toBeNull();
  });
  it("does not turn an empty source list into a zero-Hz measurement", () => {
    const input = { ...snapshot(), sources: [], totalSources: 0, connectedSources: 0 };
    expect(telemetryActivity(input)).toMatchObject({ state: "idle", rate: null, online: 0 });
  });
  it("labels mixed sensor/simulator sources explicitly", () => {
    const input = snapshot(); input.sources[0].simulated = false;
    expect(telemetryActivity(input).sourceMode).toBe("mixed");
  });
});
