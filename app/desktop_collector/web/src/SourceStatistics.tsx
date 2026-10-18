import type { CollectorState } from "./store";
import { OneUICard, OneUIKeyValueList, OneUIStatusIndicator } from "./one-ui";
import "./source-statistics.css";

/** Existing acquisition statistics, composed from Card 245:399 and key/value rows. */
export function SourceStatistics({ state }: { state: CollectorState }) {
  const bridgeOnline = state.bridgeStatus === "open";
  return <section className="source-statistics" aria-label="Statistics by source">
    {state.devices.map(device => {
      const stats = state.statistics[device.device_id];
      const current = bridgeOnline && device.state === "connected";
      const resync = state.latestResync?.deviceId === device.device_id && state.latestResync.status === "pending";
      const label = !bridgeOnline ? "Bridge unavailable" : resync ? "Resynchronizing" : current ? "Receiving data" : device.state === "error" ? "Source error" : device.state === "connecting" ? "Connecting" : "Disconnected";
      return <OneUICard key={device.device_id} className="source-statistics__card" title={device.display_name}
        description={`${device.simulated ? "SIM · " : ""}${device.device_id}`}
        eyebrow={device.hand === "left" ? "Left glove" : "Right glove"}
        accessory={<OneUIStatusIndicator emphasis="quiet" label={label} tone={resync || !bridgeOnline ? "warning" : current ? "positive" : "neutral"} />}>
        <div className="source-statistics__rate"><strong>{current && stats ? stats.sample_rate_hz.toFixed(1) : "—"}</strong><span>Hz</span><small>Nominal {device.nominal_sample_rate_hz} Hz</small></div>
        <OneUIKeyValueList rows={[
          [bridgeOnline ? "Packets received" : "Last received count", stats?.received_packets.toLocaleString("en-US") ?? "—"],
          ["Packets lost · cumulative", stats?.lost_packets.toLocaleString("en-US") ?? "—"],
          ["Loss rate · cumulative", stats ? `${stats.packet_loss_percent.toFixed(2)}%` : "—"],
          ["Latest sequence", state.series[device.device_id]?.latestSequence?.toLocaleString("en-US") ?? "—"],
          ["Sensor channels", state.channels.length],
        ]} />
      </OneUICard>;
    })}
  </section>;
}
