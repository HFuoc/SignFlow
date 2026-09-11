import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";

import type { ConnectionState, Hand, UserRole } from "./api";
import type { ShellPage } from "./one-ui";
import { OneUIButton, OneUIStateMessage } from "./one-ui";
import {
  activityVisibleTo,
  notificationsForRole,
  unreadActivityCount,
  type RuntimeActivityCommand,
  type RuntimeActivityItem,
  type RuntimeActivityState,
} from "./runtimeActivity";

import "./runtime-activity.css";
import telemetryGlyph from "./assets/one-ui/figma/equalizer.svg";
import { telemetryActivity } from "./telemetryNowBar";

function ActivityMark({ severity }: { severity: RuntimeActivityItem["severity"] }) {
  return <span className="runtime-activity-mark" data-severity={severity} aria-hidden="true" />;
}

export interface NowBarTelemetrySource {
  id: string;
  name: string;
  hand: Hand;
  handLabel: "L" | "R";
  state: ConnectionState;
  stateLabel: string;
  sampleRate: number;
  receivedPackets: number;
  lostPackets: number;
  simulated?: boolean;
  statisticsAvailable?: boolean;
}

export interface NowBarTelemetrySnapshot {
  bridgeStatus?: "idle" | "connecting" | "open" | "closed" | "error";
  resyncPending?: boolean;
  recentPacketLoss?: boolean;
  connectedSources: number;
  totalSources: number;
  totalSampleRate: number;
  totalReceivedPackets: number;
  totalLostPackets: number;
  chartPaused: boolean;
  sources: NowBarTelemetrySource[];
}

type NowBarPhase = "collapsed" | "opening" | "open" | "closing";

interface NowBarAnchorBounds {
  top: number;
  left: number;
  width: number;
  height: number;
  expandedWidth: number;
  availableHeight: number;
  shiftX: number;
  shiftY: number;
}

const expandedFocusableSelector = [
  "button:not(:disabled)",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function NowBar({
  activities,
  centerOpen,
  onExecute,
  page,
  telemetry,
  triggerRef,
  onMarkEvent,
}: {
  activities: RuntimeActivityItem[];
  centerOpen: boolean;
  onExecute: (command: RuntimeActivityCommand) => void | Promise<void>;
  page: ShellPage;
  telemetry: NowBarTelemetrySnapshot;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onMarkEvent?: () => void;
}) {
  const [phase, setPhase] = useState<NowBarPhase>("collapsed");
  const [anchorBounds, setAnchorBounds] = useState<NowBarAnchorBounds | null>(null);
  const [contentHeight, setContentHeight] = useState(288);
  const anchorRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const [recentPacketLoss, setRecentPacketLoss] = useState(false);
  const previousLoss = useRef(telemetry.totalLostPackets);
  const lossTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (telemetry.totalLostPackets > previousLoss.current) {
      setRecentPacketLoss(true);
      window.clearTimeout(lossTimer.current);
      lossTimer.current = window.setTimeout(() => setRecentPacketLoss(false), 10_000);
    } else if (telemetry.totalLostPackets < previousLoss.current) setRecentPacketLoss(false);
    previousLoss.current = telemetry.totalLostPackets;
  }, [telemetry.totalLostPackets]);
  useEffect(() => () => window.clearTimeout(lossTimer.current), []);
  const status = telemetryActivity({ ...telemetry, recentPacketLoss });

  const expanded = phase === "opening" || phase === "open";
  const overlayActive = phase !== "collapsed";

  const measureAnchor = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scrollRoot = anchorRef.current?.closest(".app-shell")?.querySelector<HTMLElement>(".app-content");
    const dock = document.querySelector(".health-bottom-dock")?.getBoundingClientRect();
    const bottom = Math.min(scrollRoot?.getBoundingClientRect().bottom ?? window.innerHeight, dock?.top ?? window.innerHeight);
    const expandedWidth = Math.min(360, window.innerWidth - 32);
    const topbar = anchorRef.current?.closest(".health-topbar")?.getBoundingClientRect();
    const contextNav = document.querySelector<HTMLElement>(".health-context-nav")?.getBoundingClientRect();
    const chromeBottom = Math.max(
      rect.bottom,
      topbar?.bottom ?? rect.bottom,
      contextNav?.bottom ?? rect.bottom,
    );
    const shiftY = Math.max(rect.height + 10, chromeBottom - rect.top + 12);
    flushSync(() => setAnchorBounds({
      top: rect.top, left: rect.left, width: rect.width, height: rect.height,
      expandedWidth,
      shiftX: Math.max(-8, 16 + expandedWidth - rect.right),
      shiftY,
      availableHeight: Math.max(64, bottom - rect.top - shiftY - 12),
    }));
  };

  const openSurface = () => {
    measureAnchor();
    void surfaceRef.current?.offsetWidth;
    setPhase("opening");
  };

  const closeSurface = (restoreFocus = true) => {
    if (surfaceRef.current) surfaceRef.current.scrollTop = 0;
    setPhase((current) => current === "collapsed" ? current : "closing");
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  };

  useLayoutEffect(() => {
    if (phase === "collapsed") setAnchorBounds(null);
  }, [phase]);

  useLayoutEffect(() => {
    if (phase !== "opening") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("open");
      return;
    }
    const frame = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useLayoutEffect(() => {
    const details = detailsRef.current;
    if (!details) return;
    const measure = () => setContentHeight(details.offsetHeight + 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(details);
    return () => observer.disconnect();
  }, [anchorBounds?.expandedWidth]);

  useEffect(() => {
    if (phase !== "closing") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("collapsed");
      return;
    }
    // A reversed transition can have zero distance and emit no transitionend.
    const timer = window.setTimeout(() => setPhase("collapsed"), 260);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useLayoutEffect(() => {
    if (phase !== "open") return;
    detailsRef.current?.querySelector<HTMLElement>(expandedFocusableSelector)?.focus({ preventScroll: true });
  }, [phase]);

  useLayoutEffect(() => {
    if (!overlayActive) return;
    const scrollRoot = anchorRef.current?.closest(".app-shell")?.querySelector<HTMLElement>(".app-content");
    if (!scrollRoot) return;
    let resizeFrame = 0;
    const handleResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measureAnchor);
    };
    // Let the page scroll normally; dismiss instead of leaving a detached surface.
    const handleScroll = () => {
      if (surfaceRef.current?.contains(document.activeElement)) triggerRef.current?.focus({ preventScroll: true });
      setPhase("collapsed");
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && surfaceRef.current?.contains(event.target)) return;
      const focusWillMove = event.target instanceof Element && event.target.closest("button, a, input, select, textarea, [tabindex]");
      closeSurface(!focusWillMove && !!surfaceRef.current?.contains(document.activeElement));
    };
    scrollRoot.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      cancelAnimationFrame(resizeFrame);
      scrollRoot.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [overlayActive]);

  useEffect(() => {
    if (centerOpen) setPhase("collapsed");
  }, [centerOpen]);
  useEffect(() => { setPhase("collapsed"); }, [page]);

  const summaryTitle = "Live telemetry";
  const summaryMessage = status.label;
  const toggleExpanded = () => expanded ? closeSurface() : openSurface();
  const overlayStyle = anchorBounds ? ({
    "--runtime-now-bar-anchor-top": `${anchorBounds.top}px`,
    "--runtime-now-bar-anchor-left": `${anchorBounds.left}px`,
    "--runtime-now-bar-anchor-width": `${anchorBounds.width}px`,
    "--runtime-now-bar-anchor-height": `${anchorBounds.height}px`,
    "--runtime-now-bar-expanded-width": `${anchorBounds.expandedWidth}px`,
    "--runtime-now-bar-expanded-height": `${contentHeight}px`,
    "--runtime-now-bar-available-height": `${anchorBounds.availableHeight}px`,
    "--runtime-now-bar-shift-x": `${anchorBounds.shiftX}px`,
    "--runtime-now-bar-shift-y": `${anchorBounds.shiftY}px`,
  } as CSSProperties) : undefined;
  return (
    <div ref={anchorRef} className="runtime-now-bar-anchor" data-overlay-active={overlayActive || undefined}>
      <div
        ref={surfaceRef}
        className="runtime-now-bar"
        data-layout="reserved"
        data-phase={phase}
        data-overlay={overlayActive || undefined}
        data-expanded={expanded || undefined}
        data-constrained={anchorBounds && contentHeight > anchorBounds.availableHeight || undefined}
        data-live={status.state === "live" || undefined}
        data-state={status.state}
        data-suppressed={centerOpen || undefined}
        data-testid="runtime-now-bar"
        style={overlayStyle}
        aria-hidden={centerOpen || undefined}
        inert={centerOpen}
        role="complementary"
        aria-label="Live telemetry activity"
        onTransitionEnd={(event) => {
          if (event.currentTarget !== event.target || event.propertyName !== "height" || phase !== "closing") return;
          setPhase("collapsed");
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && expanded) {
            event.preventDefault();
            event.stopPropagation();
            closeSurface();
            return;
          }
        }}
        onBlur={(event) => {
          if (expanded && event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) closeSurface(false);
        }}
      >
        <button
          ref={triggerRef}
          className="runtime-now-bar__summary"
          type="button"
          aria-expanded={expanded}
          aria-controls="runtime-now-bar-details"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${summaryTitle}`}
          aria-describedby="runtime-now-bar-description"
          onClick={toggleExpanded}
        />
        <span className="runtime-now-bar__compact" aria-hidden={expanded}>
          <i className="runtime-now-bar__live-dot" />
          <strong>Telemetry</strong>
          <span>{status.rate === null ? "—" : Math.round(status.rate)} <small>Hz</small></span>
        </span>
        <span className="runtime-now-bar__icon runtime-now-bar__shared" aria-hidden="true">
          <img src={telemetryGlyph} alt="" /><i className="runtime-now-bar__live-dot" />
        </span>
        <strong className="runtime-now-bar__identity runtime-now-bar__shared">{summaryTitle}</strong>
        <span id="runtime-now-bar-description" className="runtime-now-bar__description runtime-now-bar__shared">{summaryMessage}</span>
        <span className="runtime-now-bar__rate runtime-now-bar__shared"><strong>{status.rate === null ? "—" : status.rate.toFixed(1)}</strong> <span>Hz</span></span>
        <span className="runtime-now-bar__availability runtime-now-bar__shared" aria-label={`${status.online} of ${telemetry.totalSources} sources online`}>{status.online}/{telemetry.totalSources}<span className="runtime-now-bar__expanded-label"> sources online</span></span>
        <div
          ref={detailsRef}
          id="runtime-now-bar-details"
          className="runtime-now-bar__details"
          aria-hidden={!expanded}
          inert={!expanded}
        >
            <div className="runtime-now-bar__sources" role="list" aria-label="Telemetry source status">
              {status.sources.map((source) => (
                <div key={source.id} role="listitem" data-state={source.state}>
                  <span className={`runtime-now-bar__hand ${source.hand}`} aria-hidden="true">{source.handLabel}</span>
                  <span className="runtime-now-bar__source-name" title={source.name}>{source.name}{source.simulated ? <small aria-label="Simulated source">SIM</small> : null}</span>
                  <span className="runtime-now-bar__source-rate" title={source.rateLabel ?? undefined}>{source.health}</span>
                </div>
              ))}
            </div>
            {!telemetry.sources.length ? <p className="runtime-now-bar__chart-state">No sources available.</p> : null}
            {status.hasCounters && status.state === "degraded" ? <div className="runtime-now-bar__packet-health">
              <span>Received <strong>{telemetry.totalReceivedPackets.toLocaleString("en-US")}</strong></span>
              <span>Gaps <strong>{telemetry.totalLostPackets.toLocaleString("en-US")}</strong></span>
            </div> : null}
            {telemetry.chartPaused ? <p className="runtime-now-bar__chart-state">Charts paused · acquisition unchanged</p> : null}
            {status.issue ? <p className="runtime-now-bar__exception">{status.issue}</p> : null}
            <div className="runtime-now-bar__actions">
              <OneUIButton
                variant="quiet"
                className="runtime-now-bar__chart-command"
                aria-pressed={telemetry.chartPaused}
                title="Pause or resume the chart display only"
                onClick={() => void onExecute({ kind: telemetry.chartPaused ? "resume-chart" : "pause-chart" })}
              >
                {telemetry.chartPaused ? "Resume" : "Pause"}
              </OneUIButton>
              <OneUIButton variant="quiet" aria-label="Mark event" onClick={onMarkEvent} disabled={!onMarkEvent}>Mark</OneUIButton>
            </div>
        </div>
      </div>
    </div>
  );
}

function formatActivityTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

export function NotificationCenter({
  onClearRead,
  onDismiss,
  onExecute,
  onMarkAllRead,
  onMarkRead,
  role,
  state,
}: {
  onClearRead: () => void;
  onDismiss: (id: number) => void;
  onExecute: (command: RuntimeActivityCommand) => void | Promise<void>;
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
  role: UserRole;
  state: RuntimeActivityState;
}) {
  const centerRef = useRef<HTMLDivElement>(null);
  const notifications = notificationsForRole(state, role);
  const unread = unreadActivityCount(state, role);
  const clearable = notifications.some((item) => !item.active && !item.unread && item.dismissible);

  useLayoutEffect(() => { centerRef.current?.focus({ preventScroll: true }); }, []);

  return (
    <div ref={centerRef} className="notification-center" data-testid="notification-center" tabIndex={-1} aria-label="Notifications content">
      <div className="notification-center__toolbar" role="group" aria-label="Notification management">
        <span>{unread ? `${unread} unread` : "All read"}</span>
        <div>
          <OneUIButton variant="quiet" disabled={!unread} onClick={onMarkAllRead}>Mark all read</OneUIButton>
          <OneUIButton variant="quiet" disabled={!clearable} onClick={onClearRead}>Clear read</OneUIButton>
        </div>
      </div>
      {notifications.length ? (
        <ol className="notification-list" aria-label="Session notifications">
          {notifications.map((item) => (
            <li key={item.id} className="notification-item" data-unread={item.unread || undefined} data-severity={item.severity}>
              <ActivityMark severity={item.severity} />
              <div className="notification-item__content">
                <div><strong>{item.title}</strong><time dateTime={new Date(item.updatedAt).toISOString()}>{formatActivityTime(item.updatedAt)}</time></div>
                <p>{item.message}</p>
                <div className="notification-item__actions">
                  {item.command && item.actionLabel ? (
                    <OneUIButton variant="quiet" onClick={() => { onMarkRead(item.id); void onExecute(item.command!); }}>
                      {item.actionLabel}
                    </OneUIButton>
                  ) : null}
                  {item.unread ? <OneUIButton variant="quiet" onClick={() => onMarkRead(item.id)}>Mark as read</OneUIButton> : null}
                  {item.dismissible && !item.active ? <OneUIButton variant="quiet" onClick={() => onDismiss(item.id)}>Dismiss</OneUIButton> : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <OneUIStateMessage title="No notifications in this session" description="Action results and actionable alerts will appear here." />
      )}
    </div>
  );
}

export function visibleActivitiesForRole(items: RuntimeActivityItem[], role: UserRole): RuntimeActivityItem[] {
  return items.filter((item) => activityVisibleTo(item, role));
}
