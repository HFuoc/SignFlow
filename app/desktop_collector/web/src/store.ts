import { useSyncExternalStore } from "react";

import type {
  BootstrapPayload,
  BridgeMessage,
  ChannelDefinition,
  ConnectionState,
  DeviceDescriptor,
  DeviceStatistics,
  PacketBlock,
  SimulationConfig,
} from "./api";
import { BridgeClient, userFacingBridgeError } from "./api";

export interface DeviceSeries {
  times: number[];
  values: Record<string, Array<number | null>>;
  latestSequence: number | null;
}

export interface CollectorState {
  ready: boolean;
  error: string | null;
  bridgeStatus: "idle" | "connecting" | "open" | "closed" | "error";
  channels: ChannelDefinition[];
  devices: DeviceDescriptor[];
  statistics: Record<string, DeviceStatistics>;
  series: Record<string, DeviceSeries>;
  simulation: SimulationConfig;
  batchesReceived: number;
  latestResync: {
    deviceId: string;
    sequence: number;
    status: "pending" | "resolved" | "error";
  } | null;
}

const initialSimulation: SimulationConfig = {
  seed: 2026,
  sample_rate_hz: 50,
  noise_std: 7,
  packet_loss_rate: 0.01,
};

const initialState: CollectorState = {
  ready: false,
  error: null,
  bridgeStatus: "idle",
  channels: [],
  devices: [],
  statistics: {},
  series: {},
  simulation: initialSimulation,
  batchesReceived: 0,
  latestResync: null,
};

function emptySeries(channels: ChannelDefinition[]): DeviceSeries {
  return {
    times: [],
    values: Object.fromEntries(channels.map((channel) => [channel.id, []])),
    latestSequence: null,
  };
}

function hostSeconds(timestampNs: string): number {
  return Number(BigInt(timestampNs) / 1_000_000n) / 1_000;
}

function appendBlock(
  current: DeviceSeries,
  block: PacketBlock,
  channels: ChannelDefinition[],
): DeviceSeries {
  if (block.host_timestamp_ns.length === 0) return current;
  const incomingTimes = block.host_timestamp_ns.map(hostSeconds);
  const times = [...current.times, ...incomingTimes];
  const values: Record<string, Array<number | null>> = {};
  for (const channel of channels) {
    const incoming = block.values[channel.id] ?? incomingTimes.map(() => null);
    values[channel.id] = [...(current.values[channel.id] ?? []), ...incoming];
  }
  const cutoff = times[times.length - 1] - 60;
  const firstIndex = Math.max(0, times.findIndex((value) => value >= cutoff));
  return {
    times: times.slice(firstIndex),
    values: Object.fromEntries(
      Object.entries(values).map(([channel, points]) => [channel, points.slice(firstIndex)]),
    ),
    latestSequence: block.sequence_numbers.at(-1) ?? current.latestSequence,
  };
}

export class CollectorStore {
  private state: CollectorState = initialState;
  private listeners = new Set<() => void>();
  private bridge: BridgeClient | null = null;
  private closeSocket: (() => void) | null = null;
  private pendingDeviceTargets = new Map<string, ConnectionState>();
  private startEpoch = 0;
  private resyncSequence = 0;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): CollectorState => this.state;

  private update(update: Partial<CollectorState>): void {
    this.state = { ...this.state, ...update };
    this.listeners.forEach((listener) => listener());
  }

  async start(bridge: BridgeClient): Promise<void> {
    const epoch = ++this.startEpoch;
    this.closeSocket?.();
    this.closeSocket = null;
    this.bridge = bridge;
    this.update({ ...initialState });
    try {
      const bootstrap = await bridge.bootstrap();
      if (epoch !== this.startEpoch || this.bridge !== bridge) return;
      this.applyBootstrap(bootstrap);
      this.closeSocket = bridge.openTelemetry(
        (message) => void this.handleMessage(message),
        (bridgeStatus) => this.update({ bridgeStatus }),
      );
    } catch (error) {
      if (epoch !== this.startEpoch) return;
      this.update({ error: userFacingBridgeError(error) });
    }
  }

  stop(): void {
    this.startEpoch += 1;
    this.closeSocket?.();
    this.closeSocket = null;
    this.pendingDeviceTargets.clear();
    this.bridge = null;
    this.update({ ...initialState });
  }

  private applyBootstrap(bootstrap: BootstrapPayload): void {
    const currentSeries = this.state.series;
    this.update({
      ready: true,
      error: null,
      channels: bootstrap.channels,
      devices: bootstrap.devices,
      simulation: bootstrap.simulation,
      series: Object.fromEntries(
        bootstrap.devices.map((device) => [
          device.device_id,
          currentSeries[device.device_id] ?? emptySeries(bootstrap.channels),
        ]),
      ),
    });
  }

  private async handleMessage(message: BridgeMessage): Promise<void> {
    switch (message.type) {
      case "hello":
        this.applyBootstrap(message);
        break;
      case "device_state":
        if (!(this.pendingDeviceTargets.get(message.device_id) === "disconnected" && message.state === "disconnected")) {
          this.updateDeviceState(message.device_id, message.state);
        }
        break;
      case "statistics":
        this.update({
          statistics: {
            ...this.state.statistics,
            ...Object.fromEntries(message.devices.map((stats) => [stats.device_id, stats])),
          },
        });
        break;
      case "telemetry_batch": {
        const series = { ...this.state.series };
        for (const block of message.devices) {
          series[block.device_id] = appendBlock(
            series[block.device_id] ?? emptySeries(this.state.channels),
            block,
            this.state.channels,
          );
        }
        this.update({ series, batchesReceived: this.state.batchesReceived + 1 });
        break;
      }
      case "resync_required":
        await this.resync(message.device_id);
        break;
      default:
        break;
    }
  }

  private updateDeviceState(deviceId: string, state: ConnectionState): void {
    this.update({
      devices: this.state.devices.map((device) =>
        device.device_id === deviceId ? { ...device, state } : device,
      ),
    });
  }

  async setConnected(deviceId: string, connect: boolean): Promise<boolean> {
    if (!this.bridge) return false;
    const previousState = this.state.devices.find((device) => device.device_id === deviceId)?.state ?? "disconnected";
    const targetState = connect ? "connected" : "disconnected";
    this.pendingDeviceTargets.set(deviceId, targetState);
    if (connect) this.updateDeviceState(deviceId, "connecting");
    try {
      const response = await this.bridge.setConnected(deviceId, connect);
      this.pendingDeviceTargets.delete(deviceId);
      this.update({ error: null });
      const currentState = this.state.devices.find((device) => device.device_id === deviceId)?.state;
      const connectionAdvancedWhilePending = connect && currentState === "connected" && response.state === "connecting";
      if (!connectionAdvancedWhilePending) this.updateDeviceState(deviceId, response.state);
      return response.state === targetState || (connect && response.state === "connecting");
    } catch (error) {
      this.pendingDeviceTargets.delete(deviceId);
      this.update({ error: userFacingBridgeError(error) });
      this.updateDeviceState(deviceId, connect ? "error" : previousState);
      return false;
    }
  }

  async setAllConnected(connect: boolean): Promise<boolean> {
    const results = await Promise.all(
      this.state.devices.map((device) => this.setConnected(device.device_id, connect)),
    );
    return results.every(Boolean);
  }

  async configureSimulator(config: SimulationConfig): Promise<boolean> {
    if (!this.bridge) return false;
    try {
      const simulation = await this.bridge.configureSimulator(config);
      this.update({
        error: null,
        simulation,
        series: Object.fromEntries(
          this.state.devices.map((device) => [device.device_id, emptySeries(this.state.channels)]),
        ),
      });
      return true;
    } catch (error) {
      this.update({ error: userFacingBridgeError(error) });
      return false;
    }
  }

  async resync(deviceId = "all"): Promise<boolean> {
    if (!this.bridge) return false;
    const sequence = ++this.resyncSequence;
    this.update({ latestResync: { deviceId, sequence, status: "pending" } });
    try {
      const snapshot = await this.bridge.snapshot(60);
      const series = Object.fromEntries(
        this.state.devices.map((device) => [device.device_id, emptySeries(this.state.channels)]),
      );
      for (const block of snapshot.devices) {
        series[block.device_id] = appendBlock(
          series[block.device_id],
          block,
          this.state.channels,
        );
      }
      this.update({ error: null, latestResync: { deviceId, sequence, status: "resolved" }, series });
      return true;
    } catch (error) {
      this.update({
        error: userFacingBridgeError(error),
        latestResync: { deviceId, sequence, status: "error" },
      });
      return false;
    }
  }
}

export const collectorStore = new CollectorStore();

export function useCollectorState(): CollectorState {
  return useSyncExternalStore(collectorStore.subscribe, collectorStore.getSnapshot);
}
