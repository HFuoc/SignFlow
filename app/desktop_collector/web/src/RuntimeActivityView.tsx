import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

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
import infoGlyph from "./assets/one-ui/figma/info-outline.svg";
import errorGlyph from "./assets/one-ui/figma/error-outline.svg";
import checkGlyph from "./assets/one-ui/figma/completed.svg";
import telemetryGlyph from "./assets/one-ui/figma/equalizer-2.svg";
import { telemetryActivity } from "./telemetryNowBar";
import { FigmaIcon } from "./one-ui/figma-icon";
import { useNavigationOverlay } from "./one-ui/navigation-context";

function ActivityMark({ severity }: { severity: RuntimeActivityItem["severity"] }) {
  return <span className="runtime-activity-mark" data-severity={severity}><FigmaIcon src={severity === "success" ? checkGlyph : severity === "info" ? infoGlyph : errorGlyph} /></span>;
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

export function LiveStatusNotification({
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
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<NowBarPhase>("collapsed");
  const [anchorBounds, setAnchorBounds] = useState<NowBarAnchorBounds | null>(null);
  const [contentHeight, setContentHeight] = useState(288);
  const anchorRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLSpanElement>(null);
  const expandedContentRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<Animation[]>([]);
  const initializedRef = useRef(false);
  const navigationOpen = useNavigationOverlay();
  const status = telemetryActivity(telemetry);
  const overlayActive = phase !== "collapsed";

  const measureAnchor = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const dock = document.querySelector(".health-bottom-dock")?.getBoundingClientRect();
    const bottom = dock && dock.width > dock.height ? dock.top : window.innerHeight;
    const nav = document.querySelector(".health-context-nav")?.getBoundingClientRect();
    const expandedWidth = Math.min(360, window.innerWidth - 32);
    const top = rect.top + 6;
    const targetTop = Math.max(rect.bottom + 10, (nav?.bottom ?? 0) + 12);
    const next = {
      top, left: rect.left, width: rect.width, height: 32, expandedWidth,
      shiftX: Math.max(16, rect.right - expandedWidth) - rect.left,
      shiftY: targetTop - top,
      availableHeight: Math.max(64, bottom - targetTop - 12),
    };
    setAnchorBounds(current => current && Object.keys(next).every(
      key => current[key as keyof NowBarAnchorBounds] === next[key as keyof NowBarAnchorBounds],
    ) ? current : next);
  };

  const closeSurface = (restoreFocus = true) => {
    setExpanded(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  };

  useLayoutEffect(() => {
    measureAnchor();
    const anchor = anchorRef.current;
    if (!anchor) return;
    let frame = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureAnchor);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(anchor);
    // A centered desktop gutter can move this fixed-width anchor without resizing it.
    // Observe the containing layout and measure after responsive styles settle.
    const shell = anchor.closest(".app-shell");
    const heading = shell?.querySelector(".health-topbar");
    if (shell) observer.observe(shell);
    if (heading) observer.observe(heading);
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, []);

  useLayoutEffect(() => {
    const details = detailsRef.current;
    if (!details) return;
    const measure = () => setContentHeight(details.offsetHeight);
    const observer = new ResizeObserver(measure);
    measure(); observer.observe(details);
    return () => observer.disconnect();
  }, [!!anchorBounds]);

  // One timeline owns geometry and the sequential text handoff. Read every
  // presentation value before cancelling, including during a direction reversal.
  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const compact = compactRef.current;
    const detail = expandedContentRef.current;
    if (!surface || !compact || !detail || !anchorBounds) return;
    const rect = surface.getBoundingClientRect();
    const radius = getComputedStyle(surface).borderRadius;
    const compactOpacity = Number(getComputedStyle(compact).opacity);
    const detailOpacity = Number(getComputedStyle(detail).opacity);
    motionRef.current.forEach(animation => animation.cancel());
    const target = {
      left: `${anchorBounds.left + (expanded ? anchorBounds.shiftX : 0)}px`,
      top: `${anchorBounds.top + (expanded ? anchorBounds.shiftY : 0)}px`,
      width: `${expanded ? anchorBounds.expandedWidth : anchorBounds.width}px`,
      height: `${expanded ? Math.min(contentHeight, anchorBounds.availableHeight) : 32}px`,
      borderRadius: expanded ? "28px" : "32px",
    };
    Object.assign(surface.style, target);
    compact.style.opacity = expanded ? "0" : "1";
    detail.style.opacity = expanded ? "1" : "0";
    const finish = () => {
      motionRef.current = [];
      setPhase(expanded ? "open" : "collapsed");
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!initializedRef.current || reduced || (!expanded && phase === "collapsed")) {
      initializedRef.current = true; finish(); return;
    }
    setPhase(expanded ? "opening" : "closing");
    const style = getComputedStyle(surface);
    // Production CSS may minify 640ms to .64s; WAAPI always expects milliseconds.
    const cssDuration = style.getPropertyValue(expanded ? "--now-open-duration" : "--now-close-duration").trim();
    const fullDuration = parseFloat(cssDuration) * (cssDuration.endsWith("ms") ? 1 : 1000);
    const expandedHeight = Math.min(contentHeight, anchorBounds.availableHeight);
    const distance = Math.max(
      Math.abs(parseFloat(target.height) - rect.height) / Math.max(1, expandedHeight - 32),
      Math.abs(parseFloat(target.width) - rect.width) / Math.max(1, anchorBounds.expandedWidth - anchorBounds.width),
      Math.abs(parseFloat(target.top) - rect.top) / Math.max(1, anchorBounds.shiftY),
    );
    // motion.mp4: one continuous shell with a sequential content handoff.
    // Spread visible travel across the duration: the previous spring completed
    // 10-90% of the opening in ~116ms despite a nominal 460ms timeline.
    // Smoothstep eases both ends without a long, almost-static settling tail.
    // Reversals retain the presented geometry and a perceptible minimum duration.
    const duration = fullDuration * Math.max(.45, Math.min(1, Math.sqrt(distance)));
    const mix = (from: number, to: string, progress: number) => `${from + (parseFloat(to) - from) * progress}px`;
    const frames = Array.from({ length: 61 }, (_, index) => {
      const time = index / 60;
      const progress = time * time * (3 - 2 * time);
      // Width leads height slightly, retaining the capsule silhouette at takeoff.
      const heightProgress = expanded ? Math.pow(progress, 1.15) : progress;
      return {
        offset: time,
        left: mix(rect.left, target.left, progress), top: mix(rect.top, target.top, progress),
        width: mix(rect.width, target.width, progress), height: mix(rect.height, target.height, heightProgress),
        borderRadius: mix(parseFloat(radius), target.borderRadius, progress),
      };
    });
    const animation = surface.animate(frames, { duration, easing: "linear" });
    const outgoing = expanded ? compact : detail;
    const incoming = expanded ? detail : compact;
    const outgoingOpacity = expanded ? compactOpacity : detailOpacity;
    const incomingOpacity = expanded ? detailOpacity : compactOpacity;
    const fadeOut = Math.max(.001, .16 * outgoingOpacity);
    const reveal = outgoingOpacity > .001 ? Math.max(fadeOut + .04, expanded ? .28 : .24) : 0;
    const fadeAway = outgoing.animate([
      { opacity: outgoingOpacity }, { opacity: 0, offset: fadeOut }, { opacity: 0 },
    ], { duration, easing: "linear" });
    const revealText = incoming.animate([
      { opacity: incomingOpacity }, { opacity: incomingOpacity, offset: reveal },
      { opacity: 1, offset: .72 }, { opacity: 1 },
    ], { duration, easing: "linear" });
    const animations = [animation, fadeAway, revealText];
    const startTime = document.timeline.currentTime;
    animations.forEach(item => { item.startTime = startTime; });
    motionRef.current = animations;
    animation.onfinish = () => { if (motionRef.current === animations) finish(); };
  }, [expanded, anchorBounds, contentHeight]);

  useEffect(() => () => { motionRef.current.forEach(animation => animation.cancel()); }, []);
  useLayoutEffect(() => {
    if (phase === "open" && document.activeElement === triggerRef.current) {
      detailsRef.current?.querySelector<HTMLElement>(expandedFocusableSelector)?.focus({ preventScroll: true });
    }
  }, [phase]);

  useEffect(() => {
    if (!expanded) return;
    const scrollRoot = anchorRef.current?.closest(".app-shell")?.querySelector(".app-content");
    const onScroll = () => closeSurface(!!surfaceRef.current?.contains(document.activeElement));
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || surfaceRef.current?.contains(event.target)) return;
      const movesFocus = event.target instanceof Element && event.target.closest("button, a, input, select, textarea, [tabindex]");
      closeSurface(!movesFocus && !!surfaceRef.current?.contains(document.activeElement));
    };
    scrollRoot?.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", outside, true);
    return () => { scrollRoot?.removeEventListener("scroll", onScroll); document.removeEventListener("pointerdown", outside, true); };
  }, [expanded]);

  useEffect(() => { if (centerOpen) setExpanded(false); }, [centerOpen]);
  useLayoutEffect(() => { if (navigationOpen) setExpanded(false); }, [navigationOpen]);
  useEffect(() => { setExpanded(false); }, [page]);

  const summaryTitle = "Live telemetry";
  const summaryMessage = status.label;
  const sourceModeLabel = status.sourceMode === "simulated" ? "SIM" : status.sourceMode === "mixed" ? "Mixed" : null;
  const chartMessage = telemetry.chartPaused
    ? `Charts paused${status.current && status.online > 0 ? " · acquisition continues" : ""}`
    : status.current && status.online > 0 ? "Charts following live data" : "Charts waiting for data";
  const toggleExpanded = () => {
    if (expanded) closeSurface();
    else { measureAnchor(); setExpanded(true); }
  };
  const overlayStyle = anchorBounds ? ({
    "--runtime-now-bar-expanded-width": `${anchorBounds.expandedWidth}px`,
  } as CSSProperties) : undefined;
  return (
    <div ref={anchorRef} className="runtime-now-bar-anchor" data-overlay-active={overlayActive || undefined}>
      <span tabIndex={0} className="runtime-now-bar__focus-entry"
        onFocus={() => triggerRef.current?.focus({ preventScroll: true })} />
      {anchorBounds && createPortal(<div
        ref={surfaceRef}
        className="runtime-now-bar"
        data-layout="reserved"
        data-phase={phase}
        data-overlay={overlayActive || undefined}
        data-expanded={expanded || undefined}
        data-constrained={anchorBounds && contentHeight > anchorBounds.availableHeight || undefined}
        data-live={status.state === "live" || undefined}
        data-state={status.state}
        data-chart-paused={telemetry.chartPaused || undefined}
        data-suppressed={centerOpen || undefined}
        data-testid="runtime-now-bar"
        style={overlayStyle}
        aria-hidden={centerOpen || navigationOpen || undefined}
        inert={centerOpen || navigationOpen}
        role="complementary"
        aria-label="Live status notification"
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            const next = anchorRef.current?.nextElementSibling?.querySelector<HTMLElement>("button:not(:disabled)");
            const first = event.target === triggerRef.current;
            const last = event.target === detailsRef.current?.querySelector(".runtime-now-bar__actions button:last-child");
            if (!event.shiftKey && (last || (first && !expanded))) {
              event.preventDefault(); closeSurface(false); next?.focus();
            } else if (event.shiftKey && first) {
              event.preventDefault(); closeSurface(false);
              anchorRef.current?.closest(".app-shell")?.querySelector<HTMLElement>(".skip-link")?.focus();
            }
          }
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
          tabIndex={-1}
          className="runtime-now-bar__summary"
          type="button"
          aria-expanded={expanded}
          aria-controls="runtime-now-bar-details"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${summaryTitle}`}
          aria-describedby="runtime-now-bar-description runtime-now-bar-chart-state"
          onClick={toggleExpanded}
        />
        <div className="runtime-now-bar__clip">
        <span ref={compactRef} className="runtime-now-bar__compact" aria-hidden={expanded}>
          <span className="runtime-now-bar__compact-icon" aria-hidden="true"><img src={telemetryGlyph} alt="" /></span>
          <span className="runtime-now-bar__compact-copy">
            <strong>{status.state === "live" ? (telemetry.chartPaused ? "Paused" : "Live") : status.compactLabel}{sourceModeLabel ? <small aria-label={status.sourceMode === "simulated" ? "Simulated sources" : "Mixed simulated and sensor sources"}>{sourceModeLabel}</small> : null}</strong>

          </span>
          <span className="runtime-now-bar__compact-rate">{status.rate === null ? "—" : Math.round(status.rate)}<small>Hz</small></span>
        </span>
        <div ref={expandedContentRef} className="runtime-now-bar__expanded-content" aria-hidden={!expanded} inert={!expanded}>
        <span className="runtime-now-bar__icon runtime-now-bar__shared" aria-hidden="true">
          <img src={telemetryGlyph} alt="" />
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
                  <span className="runtime-now-bar__source-name" title={source.name}><strong>{source.name}</strong><small>{source.hand === "left" ? "Left glove" : "Right glove"}{source.simulated ? <span aria-label="Simulated source"> · SIM</span> : null}</small></span>
                  <span className="runtime-now-bar__source-rate"><strong>{source.rateLabel ?? "—"}</strong><small>{source.health}</small></span>
                </div>
              ))}
            </div>
            {!telemetry.sources.length ? <p className="runtime-now-bar__chart-state">No sources available.</p> : null}
            {status.hasCounters && (status.state === "degraded" || !status.current) ? <div className="runtime-now-bar__packet-health">
              <span>Received <strong>{telemetry.totalReceivedPackets.toLocaleString("en-US")}</strong></span>
              <span>Gaps <strong>{telemetry.totalLostPackets.toLocaleString("en-US")}</strong></span>
            </div> : null}
            <p id="runtime-now-bar-chart-state" className="runtime-now-bar__chart-state">{chartMessage}</p>
            {status.issue ? <p className="runtime-now-bar__exception">{status.issue}</p> : null}
            <div className="runtime-now-bar__actions">
              <OneUIButton
                variant="quiet"
                className="runtime-now-bar__chart-command"
                data-size="compact"
                aria-pressed={telemetry.chartPaused}
                title="Pause or resume the chart display only"
                onClick={() => void onExecute({ kind: telemetry.chartPaused ? "resume-chart" : "pause-chart" })}
              >
                {telemetry.chartPaused ? "Resume charts" : "Pause charts"}
              </OneUIButton>
              <OneUIButton variant="quiet" data-size="compact" aria-label="Mark event" onClick={onMarkEvent} disabled={!onMarkEvent}>Mark</OneUIButton>
            </div>
        </div>
        </div>
        </div>
      </div>, document.body)}
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
  const groups = [
    { id: "active", label: "Needs attention", items: notifications.filter(item => item.active) },
    { id: "history", label: "Session history", items: notifications.filter(item => !item.active) },
  ].filter(group => group.items.length > 0);
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
        <div className="notification-center__groups">{groups.map(group => <section key={group.id} aria-labelledby={`notification-${group.id}`}>
        <h2 id={`notification-${group.id}`} className="notification-center__group-title">{group.label}<span>{group.items.length}</span></h2>
        <ol className="notification-list" aria-label={group.label}>
          {group.items.map((item) => (
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
        </ol></section>)}</div>
      ) : (
        <OneUIStateMessage title="No notifications in this session" description="Action results and actionable alerts will appear here." />
      )}
    </div>
  );
}

export function visibleActivitiesForRole(items: RuntimeActivityItem[], role: UserRole): RuntimeActivityItem[] {
  return items.filter((item) => activityVisibleTo(item, role));
}
