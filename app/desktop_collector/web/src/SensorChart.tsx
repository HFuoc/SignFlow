import { useEffect, useMemo, useRef } from "react";
import uPlot, { type AlignedData, type Options, type Series } from "uplot";

import type { ChannelDefinition, DeviceDescriptor } from "./api";
import { OneUIStateMessage, OneUIStatusIndicator } from "./one-ui";
import type { DeviceSeries } from "./store";

// A channel keeps its color when neighboring channels are toggled. Both hands
// share the channel mapping; L/R labels and solid/dashed traces identify hands.
const channelColors = {
  dark: ["#8DB4FF", "#FFB479", "#78D7B5", "#C7AAFF", "#F397C6", "#E7D37C", "#74D7E7", "#B6D98A", "#EFA79E", "#B8C9FF", "#DBA8DD", "#92D3C9", "#D0C3AD"],
  light: ["#2559B8", "#99501D", "#176D4E", "#7243AC", "#A13E78", "#75600C", "#096C80", "#486F1D", "#A24136", "#4A50A9", "#884888", "#176B62", "#736047"],
} as const;

interface SensorChartProps {
  device: DeviceDescriptor;
  channels: ChannelDefinition[];
  source: DeviceSeries | undefined;
  selected: Set<string>;
  windowSeconds: number;
  paused: boolean;
  dark: boolean;
  followLive: boolean;
  onExplore: () => void;
}

export function SensorChart({
  device,
  channels,
  source,
  selected,
  windowSeconds,
  paused,
  dark,
  followLive,
  onExplore,
}: SensorChartProps) {
  const host = useRef<HTMLDivElement>(null);
  const plot = useRef<uPlot | null>(null);
  const previousXRange = useRef<{ min: number; max: number } | null>(null);
  const frozen = useRef<DeviceSeries | undefined>(source);
  if (!paused) frozen.current = source;
  const shown = frozen.current;

  const activeChannels = useMemo(
    () => channels.filter((channel) => selected.has(channel.id)),
    [channels, selected],
  );
  const channelColor = useMemo(() => {
    const palette = dark ? channelColors.dark : channelColors.light;
    return new Map(channels.map((channel, index) => [channel.id, palette[index % palette.length]]));
  }, [channels, dark]);
  const chartAvailable = activeChannels.length > 0 && device.state === "connected";
  const data = useMemo<AlignedData>(() => {
    if (!shown) return [[], ...activeChannels.map(() => [])];
    return [shown.times, ...activeChannels.map((channel) => shown.values[channel.id] ?? [])] as AlignedData;
  }, [shown, activeChannels]);

  useEffect(() => {
    const hostElement = host.current;
    if (!chartAvailable || !hostElement) return;

    const series: Series[] = [
      { label: "Time" },
      ...activeChannels.map((channel) => ({
        label: channel.label,
        stroke: channelColor.get(channel.id),
        width: 1.8,
        dash: device.hand === "right" ? [10, 8] : undefined,
        points: { show: false },
        spanGaps: false,
        value: (_plot: uPlot, value: number | null) =>
          value == null ? "—" : `${Math.round(value)} ${channel.unit}`,
      })),
    ];

    const options: Options = {
      width: Math.max(1, hostElement.clientWidth),
      height: Math.max(1, hostElement.clientHeight),
      padding: [12, 14, 8, 6],
      cursor: {
        drag: { x: true, y: false, setScale: true },
        points: { show: false },
      },
      legend: { show: false },
      scales: { x: { time: true }, y: { auto: true } },
      axes: [
        {
          stroke: dark ? "#B9B9C2" : "#5D5D66",
          font: '11px "Segoe UI", sans-serif',
          size: 46,
          gap: 8,
          space: 64,
          grid: { show: false },
          ticks: { stroke: dark ? "#49494F" : "#CECED5", size: 4 },
        },
        {
          stroke: dark ? "#B9B9C2" : "#5D5D66",
          font: '11px "Segoe UI", sans-serif',
          size: 56,
          gap: 8,
          space: 42,
          grid: { stroke: dark ? "#343439" : "#DFDFE5", width: 1 },
          ticks: { show: false },
        },
      ],
      series,
    };

    const instance = new uPlot(options, data, hostElement);
    plot.current = instance;
    // Recoloring or changing channels must retain the user's time window,
    // including when frozen data does not trigger the update effect below.
    const times = data[0];
    if (followLive && times.length) {
      const max = times[times.length - 1];
      instance.setScale("x", { min: max - windowSeconds, max });
    } else if (previousXRange.current) {
      instance.setScale("x", previousXRange.current);
    }
    const observer = new ResizeObserver(([entry]) => {
      instance.setSize({
        width: Math.max(1, entry.contentRect.width),
        height: Math.max(1, entry.contentRect.height),
      });
    });
    observer.observe(hostElement);

    return () => {
      const { min, max } = instance.scales.x;
      if (min != null && max != null && Number.isFinite(min) && Number.isFinite(max)) {
        previousXRange.current = { min, max };
      }
      observer.disconnect();
      instance.destroy();
      if (plot.current === instance) plot.current = null;
    };
  }, [activeChannels, channelColor, chartAvailable, dark, device.hand]);

  useEffect(() => {
    if (!plot.current) return;
    plot.current.setData(data, false);
    const times = data[0] as number[];
    if (followLive && times.length) {
      const max = times[times.length - 1];
      plot.current.setScale("x", { min: max - windowSeconds, max });
    }
  }, [data, followLive, windowSeconds]);

  const chartStatus = device.state === "connected"
    ? { label: paused ? "Paused" : "Live", tone: paused ? "waiting" as const : "positive" as const }
    : device.state === "connecting"
      ? { label: "Connecting", tone: "waiting" as const }
      : device.state === "error"
        ? { label: "Connection error", tone: "negative" as const }
        : { label: "Offline", tone: "neutral" as const };

  return (
    <article id={`chart-${device.hand}`} className="chart-card health-live-chart-card one-ui-surface" data-hand={device.hand}>
      <header className="health-live-chart-head">
        <div className="health-live-chart-identity">
          <span className={`hand-mark compact ${device.hand}`}>{device.hand_label}</span>
          <div>
            <h3>{device.display_name}</h3>
            <p>{device.hand === "left" ? "Solid line" : "Dashed line"} · raw sensors</p>
          </div>
        </div>
        <OneUIStatusIndicator
          className="chart-status health-live-chart-status"
          emphasis="quiet"
          label={chartStatus.label}
          size="medium"
          tone={chartStatus.tone}
        />
      </header>

      {chartAvailable ? (
        <>
          <div className="health-live-plot-shell">
          <div
            ref={host}
            className="plot-host health-live-plot"
            role="img"
            onWheel={onExplore}
            onPointerDown={onExplore}
            aria-label={`${paused ? "Paused" : "Live"} chart for ${device.display_name}: ${activeChannels.map((channel) => `${channel.label} (${channel.unit})`).join(", ")}`}
          />
          </div>
          <p className="health-chart-axis-caption">Time · raw values, units per channel</p>
          <ul className="health-chart-legend" aria-label={`Visible channels ${device.hand_label}`}>
            {activeChannels.map((channel) => {
              const value = shown?.values[channel.id]?.at(-1);
              return (
                <li key={channel.id} className="health-chart-legend__item" data-channel={channel.id}>
                  <span className="health-chart-legend__swatch" style={{ color: channelColor.get(channel.id) }} aria-hidden="true" />
                  <span className="health-chart-legend__label">{channel.label}</span>
                  <span className="health-chart-legend__value">{value == null || !Number.isFinite(value) ? "—" : Math.round(value).toLocaleString("en-US")} {channel.unit}</span>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="chart-state-slot health-live-chart-empty">
          <OneUIStateMessage
            className="chart-state-message"
            title={activeChannels.length === 0 ? "No channels selected" : "No data source"}
            description={activeChannels.length === 0
              ? "Select at least one raw signal to display data on the chart."
              : device.state === "connecting"
                ? `${device.display_name} is connecting.`
                : device.state === "error"
                  ? `${device.display_name} has a connection error. Check the source in Device Manager.`
                  : `${device.display_name} is currently disconnected.`}
          />
        </div>
      )}
    </article>
  );
}
