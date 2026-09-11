import { describe, expect, it, vi } from "vitest";

import type { BootstrapPayload, BridgeMessage, PacketBlock } from "./api";
import type { BridgeClient } from "./api";
import { CollectorStore } from "./store";

const channels = Array.from({ length: 13 }, (_, index) => ({
  id: `channel_${index}`,
  label: `Channel ${index}`,
  unit: "raw",
  group: (index < 5 ? "flex" : index === 5 ? "fsr" : index < 9 ? "accel" : index < 12 ? "gyro" : "distance") as "flex" | "fsr" | "accel" | "gyro" | "distance",
}));

const bootstrap: BootstrapPayload = {
  bridge_schema_version: "1.0",
  display_fps: 25,
  display_fps_limits: [10, 30],
  channels,
  devices: ["L", "R"].map((hand) => ({
    device_id: `SIM-${hand}`,
    display_name: `Glove ${hand}`,
    hand: hand === "L" ? "left" : "right",
    hand_label: hand as "L" | "R",
    source_kind: "simulator",
    nominal_sample_rate_hz: 50,
    simulated: true,
    state: "connected",
    capabilities: { flex_channels: [true, true, true, true, true], fsr: true, accelerometer: true, gyroscope: true, distance: true },
  })),
  simulation: { seed: 2026, sample_rate_hz: 50, noise_std: 7, packet_loss_rate: 0.01 },
};

function block(deviceId: string, startSeconds: number, value: number): PacketBlock {
  const timestamps = [startSeconds, startSeconds + 1].map((second) => `${BigInt(second) * 1_000_000_000n}`);
  return {
    device_id: deviceId,
    sequence_numbers: [value, value + 1],
    device_timestamp_ms: [0, 20],
    host_timestamp_ns: timestamps,
    status_flags: [0, 0],
    quality_flags: [1, 1],
    simulated: [true, true],
    values: Object.fromEntries(channels.map((channel) => [channel.id, [value, value + 1]])),
  };
}

class FakeBridge {
  handler: ((message: BridgeMessage) => void) | null = null;
  closed = 0;
  bootstrap = async () => bootstrap;
  snapshot = async () => ({
    type: "telemetry_snapshot" as const,
    bridge_schema_version: "1.0",
    window_seconds: 60,
    devices: [block("SIM-L", 100, 8), block("SIM-R", 100, 9)],
  });
  openTelemetry(handler: (message: BridgeMessage) => void) {
    this.handler = handler;
    return () => { this.closed += 1; };
  }
  dispose() {}
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe("CollectorStore", () => {
  it("moves one glove from a bridge batch into all 13 channel series", async () => {
    const store = new CollectorStore();
    const bridge = new FakeBridge();
    await store.start(bridge as unknown as BridgeClient);
    bridge.handler?.({ type: "telemetry_batch", bridge_schema_version: "1.0", batch_sequence: 1, sent_host_ns: "1", devices: [block("SIM-L", 100, 4)] });

    const state = store.getSnapshot();
    expect(state.ready).toBe(true);
    expect(Object.keys(state.series["SIM-L"].values)).toHaveLength(13);
    expect(state.series["SIM-L"].values.channel_12).toEqual([4, 5]);
    expect(state.batchesReceived).toBe(1);
  });

  it("keeps two glove timelines independent and bounds display history to 60 seconds", async () => {
    const store = new CollectorStore();
    const bridge = new FakeBridge();
    await store.start(bridge as unknown as BridgeClient);
    bridge.handler?.({ type: "telemetry_batch", bridge_schema_version: "1.0", batch_sequence: 1, sent_host_ns: "1", devices: [block("SIM-L", 1, 10), block("SIM-R", 10, 20)] });
    bridge.handler?.({ type: "telemetry_batch", bridge_schema_version: "1.0", batch_sequence: 2, sent_host_ns: "2", devices: [block("SIM-L", 80, 30)] });

    const state = store.getSnapshot();
    expect(state.series["SIM-L"].times).toHaveLength(2);
    expect(state.series["SIM-L"].latestSequence).toBe(31);
    expect(state.series["SIM-R"].times).toHaveLength(2);
    expect(state.series["SIM-R"].latestSequence).toBe(21);
  });

  it("keeps a connected glove visible until a confirmed disconnect resolves", async () => {
    const store = new CollectorStore();
    const bridge = new FakeBridge();
    const request = deferred<{ device_id: string; state: "disconnected" }>();
    Object.assign(bridge, { setConnected: () => request.promise });
    await store.start(bridge as unknown as BridgeClient);

    const pending = store.setConnected("SIM-L", false);
    expect(store.getSnapshot().devices[0].state).toBe("connected");
    bridge.handler?.({ type: "device_state", device_id: "SIM-L", state: "disconnected" });
    expect(store.getSnapshot().devices[0].state).toBe("connected");

    request.resolve({ device_id: "SIM-L", state: "disconnected" });
    await expect(pending).resolves.toBe(true);
    expect(store.getSnapshot().devices[0].state).toBe("disconnected");
  });

  it("preserves a connected event that arrives before a pending connect response", async () => {
    const store = new CollectorStore();
    const bridge = new FakeBridge();
    bridge.bootstrap = async () => ({
      ...bootstrap,
      devices: bootstrap.devices.map((device) => ({ ...device, state: "disconnected" as const })),
    });
    const request = deferred<{ device_id: string; state: "connecting" }>();
    Object.assign(bridge, { setConnected: () => request.promise });
    await store.start(bridge as unknown as BridgeClient);

    const pending = store.setConnected("SIM-L", true);
    expect(store.getSnapshot().devices[0].state).toBe("connecting");
    bridge.handler?.({ type: "device_state", device_id: "SIM-L", state: "connected" });
    expect(store.getSnapshot().devices[0].state).toBe("connected");

    request.resolve({ device_id: "SIM-L", state: "connecting" });
    await expect(pending).resolves.toBe(true);
    expect(store.getSnapshot().devices[0].state).toBe("connected");
  });

  it("restores connected state and sanitizes an unknown disconnect failure", async () => {
    const store = new CollectorStore();
    const bridge = new FakeBridge();
    Object.assign(bridge, {
      setConnected: async () => {
        throw new Error('{"detail":"Bearer private-token","stack":"local path"}');
      },
    });
    await store.start(bridge as unknown as BridgeClient);

    await expect(store.setConnected("SIM-L", false)).resolves.toBe(false);
    expect(store.getSnapshot().devices[0].state).toBe("connected");
    expect(store.getSnapshot().error).toBe("The data connection is temporarily unavailable.");
    expect(JSON.stringify(store.getSnapshot())).not.toContain("private-token");
  });

  it("stops telemetry and clears collector data without destroying reusable bridge credentials", async () => {
    const store = new CollectorStore();
    const bridge = new FakeBridge();
    const dispose = vi.fn();
    bridge.dispose = dispose;
    await store.start(bridge as unknown as BridgeClient);

    store.stop();

    expect(bridge.closed).toBe(1);
    expect(dispose).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toMatchObject({ ready: false, bridgeStatus: "idle", devices: [] });
  });

  it("publishes one typed resync lifecycle and returns a recoverable result", async () => {
    const store = new CollectorStore();
    const bridge = new FakeBridge();
    await store.start(bridge as unknown as BridgeClient);

    await expect(store.resync("SIM-L")).resolves.toBe(true);
    expect(store.getSnapshot().latestResync).toMatchObject({
      deviceId: "SIM-L",
      sequence: 1,
      status: "resolved",
    });
    expect(store.getSnapshot().series["SIM-L"].latestSequence).toBe(9);

    bridge.snapshot = async () => { throw new Error("private token in raw response"); };
    await expect(store.resync("SIM-L")).resolves.toBe(false);
    expect(store.getSnapshot().latestResync).toMatchObject({
      deviceId: "SIM-L",
      sequence: 2,
      status: "error",
    });
    expect(store.getSnapshot().error).toBe("The data connection is temporarily unavailable.");
  });
});
