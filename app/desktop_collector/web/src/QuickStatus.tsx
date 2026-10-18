import type { RefObject } from "react";
import type { NowBarTelemetrySnapshot } from "./RuntimeActivityView";
import type { CollectorState } from "./store";
import { telemetryActivity } from "./telemetryNowBar";
import { OneUIStatusIndicator } from "./one-ui";
import { FigmaIcon } from "./one-ui/figma-icon";
import equalizerGlyph from "./assets/one-ui/figma/equalizer-2.svg";
import unreadNotificationGlyph from "./assets/one-ui/figma/notification.svg";
import notificationGlyph from "./assets/one-ui/figma/notification-outline.svg";
import settingsGlyph from "./assets/one-ui/figma/settings-outline.svg";
import chevronGlyph from "./assets/one-ui/figma/arrow-right.svg";
import "./quick-status.css";

export function QuickStatus({ telemetry, simulation, contentRef, unread, onNotifications }: {
  telemetry: NowBarTelemetrySnapshot;
  simulation: CollectorState["simulation"];
  contentRef: RefObject<HTMLDivElement | null>;
  unread: number;
  onNotifications: () => void;
}) {
  const status = telemetryActivity(telemetry);
  const tone = status.state === "live" ? "positive" : status.state === "degraded" ? "warning" : status.state === "connecting" ? "waiting" : "neutral";
  return <div ref={contentRef} className="quick-status-content" tabIndex={-1} aria-label="Quick status content" data-state={status.state}>
    <section className="quick-summary" aria-label="Acquisition status">
      <span className="quick-summary__icon"><FigmaIcon src={equalizerGlyph} /></span>
      <OneUIStatusIndicator emphasis="quiet" label={status.label} tone={tone} />
      <div className="quick-summary__rate"><strong>{status.rate === null ? "—" : status.rate.toFixed(1)}</strong><span>Hz</span></div>
      <p>Total sample rate</p>
      <span className="quick-summary__sources">{status.online}/{telemetry.totalSources} sources online</span>
      <small>{status.sourceMode === "simulated" ? "Simulated data" : status.sourceMode === "mixed" ? "Mixed simulated and sensor data" : "Sensor data"}</small>
    </section>
    <section className="quick-sources" aria-label="Two-glove status">
      {status.sources.map(source => <article className="quick-source" key={source.id}>
        <div className="quick-source__identity"><h2>{source.name}</h2><p>{source.hand === "left" ? "Left glove" : "Right glove"}{source.simulated ? " · SIM" : ""}</p></div>
        <div className="quick-source__rate"><strong>{source.rateLabel ?? "—"}</strong><small>{source.health}</small></div>
        <dl><div><dt>{status.current ? "Packets received" : "Last received count"}</dt><dd>{source.statisticsAvailable ? source.receivedPackets.toLocaleString("en-US") : "—"}</dd></div><div><dt>Packet gaps</dt><dd>{source.statisticsAvailable ? source.lostPackets.toLocaleString("en-US") : "—"}</dd></div></dl>
      </article>)}
      {!status.sources.length ? <p className="quick-source">No sources available.</p> : null}
    </section>
    {status.issue ? <p className="quick-status-issue" role="status">{status.issue}</p> : null}
    <div className="quick-session-settings"><FigmaIcon src={settingsGlyph} /><div><h2>Simulator</h2><p>{simulation.sample_rate_hz} Hz per source · {(simulation.packet_loss_rate * 100).toFixed(1)}% packet loss · Seed {simulation.seed}</p></div></div>
    <button type="button" className="quick-notifications-link" onClick={onNotifications}><FigmaIcon src={unread ? unreadNotificationGlyph : notificationGlyph} /><span>Notifications<small>{unread ? `${unread} unread` : "All caught up"}</small></span><FigmaIcon src={chevronGlyph} /></button>
  </div>;
}
