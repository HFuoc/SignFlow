import pauseGlyph from "./assets/one-ui/figma/pause.svg";
import playGlyph from "./assets/one-ui/figma/control-play.svg";
import { useCallback, useMemo, useRef, useState } from "react";

import type { ChannelDefinition } from "./api";
import { OneUIButton, OneUICheckboxRow, OneUISegmentedControl } from "./one-ui";
import { SourceStatistics } from "./SourceStatistics";
import { SensorChart } from "./SensorChart";
import type { CollectorState } from "./store";

function PauseGlyph({ paused }: { paused: boolean }) {
  return <img className="one-ui-figma-glyph" src={paused ? playGlyph : pauseGlyph} alt="" />;
}

const groups: Array<{ id: ChannelDefinition["group"]; label: string }> = [
  { id: "flex", label: "Flex sensors" },
  { id: "fsr", label: "Pressure" },
  { id: "accel", label: "Acceleration" },
  { id: "gyro", label: "Gyroscope" },
  { id: "distance", label: "Distance" },
];

function latestValue(state: CollectorState, deviceId: string, channelId: string): number | null {
  const values = state.series[deviceId]?.values[channelId];
  return values?.at(-1) ?? null;
}

export type LiveSection = "overview" | "signals" | "statistics" | "packets" | "channels";

export function useMonitorView(series: CollectorState["series"], paused: boolean) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(["flex_thumb_raw", "flex_index_raw", "fsr_raw"]),
  );
  const [windowSeconds, setWindowSeconds] = useState(10);
  const [followLive, setFollowLive] = useState(true);

  const frozen = useRef(series);
  if (!paused) frozen.current = series;
  const ranges = useRef<Record<string, { min: number; max: number } | null>>({});
  const reset = useCallback(() => {
    setSelected(new Set(["flex_thumb_raw", "flex_index_raw", "fsr_raw"]));
    setWindowSeconds(10);
    setFollowLive(true);
    ranges.current = {};
  }, []);
  return { selected, setSelected, windowSeconds, setWindowSeconds, followLive, setFollowLive, frozen, ranges, reset };
}

export function LiveMonitor({
  state,
  dark,
  paused,
  onPausedChange,
  section = "overview",
  view,
}: {
  state: CollectorState;
  dark: boolean;
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
  section?: LiveSection;
  view: ReturnType<typeof useMonitorView>;
}) {
  const { selected, setSelected, windowSeconds, setWindowSeconds, followLive, setFollowLive } = view;

  const connectedDevices = state.bridgeStatus === "open" ? state.devices.filter((device) => device.state === "connected").length : 0;
  const totalPackets = Object.values(state.statistics).reduce(
    (total, stats) => total + stats.received_packets,
    0,
  );
  const totalSampleRate = useMemo(
    () => state.bridgeStatus === "open" ? state.devices.filter(device => device.state === "connected").reduce((total, device) => total + (state.statistics[device.device_id]?.sample_rate_hz ?? 0), 0) : 0,
    [state.statistics, state.devices, state.bridgeStatus],
  );

  function toggleChannel(channelId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  }

  const sectionCopy = {
    overview: ["Live Monitor", "Monitor sensor data in real time · both gloves remain independently visible"],
    signals: ["Signals", "Inspect live chart traces from both gloves."],
    statistics: ["Statistics", "Review acquisition health and current throughput."],
    packets: ["Packets", "Inspect the latest channel values and packet-quality details."],
    channels: ["Channels", "Choose which sensor channels are included in the live signal view."],
  } as const;
  const showStats = section === "overview" || section === "statistics";
  const showChannels = section === "overview" || section === "channels";
  const showCharts = section === "overview" || section === "signals";
  const showTable = section === "overview" || section === "packets";
  const showChartTools = section === "overview" || section === "signals";

  return (
    <section
      id="live-section"
      className="page live-page health-live-page health-live-exact"
      aria-labelledby="page-title"
      data-testid="live-monitor"
      data-section={section}
      data-total-packets={totalPackets}
      data-total-rate={totalSampleRate}
    >
      <header id="live-overview" className="health-live-heading one-ui-page-heading">
        <div className="health-live-heading__copy">
          <h1 id="page-title" tabIndex={-1}>{sectionCopy[section][0]}</h1>
          <p>{sectionCopy[section][1]}</p>
        </div>

        {showChartTools ? <div className="health-live-tools" role="group" aria-label="Chart controls">
          <OneUISegmentedControl
            className="health-window-control"
            data-size="compact"
            ariaLabel="Time window"
            value={windowSeconds}
            options={[5, 10, 30, 60].map((seconds) => ({ label: `${seconds}s`, value: seconds }))}
            onChange={(seconds) => {
              setWindowSeconds(seconds);
              setFollowLive(true);
            }}
          />
          <OneUIButton
            className="health-pause-button"
            data-size="compact"
            type="button"
            icon={<PauseGlyph paused={paused} />}
            aria-label={paused ? "Resume charts" : "Pause charts"}
            aria-pressed={paused}
            onClick={() => onPausedChange(!paused)}
          >
            <span className="chart-pause-label">
              <span className="chart-pause-label__state" aria-hidden={paused || undefined}>Pause</span>
              <span className="chart-pause-label__state" aria-hidden={!paused || undefined}>Resume</span>
            </span>
          </OneUIButton>
        </div> : null}
      </header>

      {showStats ? <div id="live-signals" className="health-live-stats" role="group" aria-label="Acquisition summary">
        <div className="health-live-stat health-live-stat--green">
          <span>Acquisition</span>
          <strong>{connectedDevices}/{state.devices.length} active</strong>
        </div>
        <div className="health-live-stat health-live-stat--blue">
          <span>Total sample rate</span>
          <strong>{connectedDevices ? `${totalSampleRate.toFixed(1)} Hz` : "—"}</strong>
        </div>
        <div className="health-live-stat health-live-stat--orange">
          <span>Packets received</span>
          <strong>{totalPackets.toLocaleString("en-US")}</strong>
        </div>
        <div className="health-live-stat health-live-stat--purple">
          <span>Charts</span>
          <strong>{paused
            ? (connectedDevices ? "Paused · acquisition continues" : "Paused")
            : (!connectedDevices ? "No connected sources" : followLive ? "Following live" : "Exploring history")}</strong>
        </div>
      </div> : null}

      {section === "statistics" ? <SourceStatistics state={state} /> : null}

      {(showChannels || showCharts) ? <section className="health-live-workspace" data-subview={section}>
        {showChannels ? <aside id="live-channels" className="channel-panel health-live-channels" aria-label="Select displayed channels">
          <div className="health-live-channel-title">
            <div>
              <h2>Raw signals</h2>
              <p>Select channels to display</p>
            </div>
            <strong>{selected.size}<small>/13</small></strong>
          </div>

          <div className="health-live-channel-scroll one-ui-checkbox-scroll">
            {groups.map((group) => (
              <fieldset key={group.id}>
                <legend>{group.label}</legend>
                {state.channels.filter((channel) => channel.group === group.id).map((channel) => (
                  <OneUICheckboxRow
                    key={channel.id}
                    checked={selected.has(channel.id)}
                    label={channel.label}
                    meta={channel.unit}
                    onChange={() => toggleChannel(channel.id)}
                  />
                ))}
              </fieldset>
            ))}
          </div>
        </aside> : null}

        {showCharts ? <div id="live-charts" className="health-live-charts">
          {state.devices.map((device) => (
            <SensorChart
              key={device.device_id}
              device={device}
              channels={state.channels}
              source={view.frozen.current[device.device_id]}
                rangeCache={view.ranges}
              selected={selected}
              windowSeconds={windowSeconds}
              paused={paused}
              dark={dark}
              followLive={followLive}
              onExplore={() => setFollowLive(false)}
            />
          ))}
        </div> : null}
      </section> : null}

      {!followLive && showCharts ? (
        <OneUIButton className="health-return-live" data-size="compact" type="button" onClick={() => setFollowLive(true)}>
          Return to live
        </OneUIButton>
      ) : null}

      {showTable ? <section id="live-table" className="raw-card health-live-table one-ui-surface" aria-labelledby="raw-title">
        <div className="panel-title">
          <div><span className="section-context">Latest sample</span><h2 id="raw-title">Raw values &amp; quality</h2></div>
          <span>13 channels</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Channel</th>{state.devices.map((device) => <th key={device.device_id}>{device.display_name}<small>{device.hand === "left" ? "Left glove" : "Right glove"}</small></th>)}<th>Unit</th></tr></thead>
            <tbody>
              {state.channels.map((channel) => (
                <tr key={channel.id}>
                  <th>{channel.label}<small>{channel.id}</small></th>
                  {state.devices.map((device) => {
                    const value = latestValue(state, device.device_id, channel.id);
                    const stats = state.statistics[device.device_id];
                    return <td key={device.device_id}><strong>{value == null ? "—" : Math.round(value).toLocaleString("en-US")}</strong><span className={value == null || device.state !== "connected" ? "signal missing" : "signal good"}>{value == null
                      ? "No data"
                      : `${device.state === "connected" ? "Receiving" : "Last sample · source disconnected"} · σ ${stats?.channel_stddev[channel.id]?.toFixed(1) ?? "—"} · p-p ${stats?.channel_peak_to_peak[channel.id]?.toFixed(0) ?? "—"}`}</span></td>;
                  })}
                  <td>{channel.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section> : null}
    </section>
  );
}
