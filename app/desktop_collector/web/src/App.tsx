import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";

import { BridgeClient, userFacingBridgeError, type AuthStatus } from "./api";
import {
  AccountSheet,
  AuthLoading,
  AuthStartupError,
  FirstRunSetup,
  ForcedPasswordChange,
  LoginScreen,
  ParticipantAccess,
} from "./AuthScreens";
import { DeviceManager, type DeviceSection } from "./DeviceManager";
import { LiveMonitor, type LiveSection } from "./LiveMonitor";
import { UserManagement, type AccountSection } from "./UserManagement";
import { Studio } from "./Studio";
import { studioSections, type StudioSection } from "./studioModel";
import { GlobalSearch } from "./GlobalSearch";
import type { SearchTarget } from "./search";
import searchGlyphUrl from "./assets/one-ui/figma/search.svg";
import studioHeroPreviewUrl from "./assets/studio-hero-device-preview.webp";
import { NotificationCenter, NowBar, visibleActivitiesForRole } from "./RuntimeActivityView";
import { createTelemetryMarker } from "./telemetryNowBar";
import {
  OneUIShell,
  OneUIButton,
  OneUIIconButton,
  OneUIInteractionPage,
  OneUISnackbar,
  OneUIStateMessage,
  OneUIStatusIndicator,
  type ShellPage,
  type ShellNavigationTarget,
  type SnackbarNotice,
} from "./one-ui";
import { collectorStore, useCollectorState } from "./store";
import {
  collectorAudiences,
  initialRuntimeActivityState,
  runtimeActivityReducer,
  unreadActivityCount,
  type RuntimeActivityCommand,
  type RuntimeActivityInput,
  type RuntimeActivityItem,
} from "./runtimeActivity";

const themePreferenceKey = "smartglove-collector-theme";

const accountSections: Array<{ id: AccountSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Accounts" },
  { id: "security", label: "Security" },
];

const deviceSections: Array<{ id: DeviceSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "gloves", label: "Gloves" },
  { id: "signals", label: "Signals" },
  { id: "simulator", label: "Simulator" },
];

const liveSections: Array<{ id: LiveSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "signals", label: "Signals" },
  { id: "statistics", label: "Statistics" },
  { id: "packets", label: "Packets" },
  { id: "channels", label: "Channels" },
];

function initialDarkTheme(): boolean {
  try {
    const stored = window.localStorage.getItem(themePreferenceKey);
    if (stored === "dark" || stored === "light") return stored === "dark";
  } catch {
    // The OS preference remains the safe fallback when storage is unavailable.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const deviceStateLabel = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Receiving data",
  error: "Error",
} as const;

export function App({ bridge }: { bridge: BridgeClient }) {
  const state = useCollectorState();
  const [auth, setAuth] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; status: AuthStatus }
  >({ kind: "loading" });
  const [authSessionGeneration, setAuthSessionGeneration] = useState(0);
  const [page, setPage] = useState<ShellPage>("devices");
  const [deviceSection, setDeviceSection] = useState<DeviceSection>("overview");
  const [liveSection, setLiveSection] = useState<LiveSection>("overview");
  const [studioSection, setStudioSection] = useState<StudioSection>("overview");
  const [accountSection, setAccountSection] = useState<AccountSection>("overview");
  const [searchOpen, setSearchOpen] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<ShellNavigationTarget | null>(null);
  const [dark, setDark] = useState(initialDarkTheme);
  const [utilitySurface, setUtilitySurface] = useState<"quick" | "notifications" | null>(null);
  const [utilityOrigin, setUtilityOrigin] = useState<"quick" | "now">("quick");
  const [accountOpen, setAccountOpen] = useState(false);
  const [chartPaused, setChartPaused] = useState(false);
  const [activityState, dispatchActivity] = useReducer(runtimeActivityReducer, initialRuntimeActivityState);
  const [authEventMessage, setAuthEventMessage] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarNotice | null>(null);
  const snackbarIdRef = useRef(0);
  const quickStatusButtonRef = useRef<HTMLButtonElement>(null);
  const quickStatusContentRef = useRef<HTMLDivElement>(null);
  const previousUtilitySurfaceRef = useRef<"quick" | "notifications" | null>(null);
  const nowBarButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchNavigationSequence = useRef(0);
  const bridgeWasOpenRef = useRef(false);
  const bridgeFailureActiveRef = useRef(false);
  const previousLostPacketsRef = useRef<Record<string, number>>({});
  const activityUserRef = useRef<string | null>(null);

  const closeUtilitySurface = useCallback(() => setUtilitySurface(null), []);
  const recordActivity = useCallback((input: RuntimeActivityInput) => {
    dispatchActivity({ type: "upsert", input });
  }, []);
  const notify = useCallback((notice: Omit<SnackbarNotice, "id">) => {
    snackbarIdRef.current += 1;
    setSnackbar({ ...notice, id: snackbarIdRef.current });
  }, []);
  const dismissSnackbar = useCallback((id: number) => {
    setSnackbar((current) => current?.id === id ? null : current);
  }, []);

  const acceptAuth = useCallback((status: AuthStatus) => {
    const nextUser = status.user?.id ?? null;
    if (activityUserRef.current !== nextUser) {
      activityUserRef.current = nextUser;
      previousLostPacketsRef.current = {};
      bridgeWasOpenRef.current = false;
      bridgeFailureActiveRef.current = false;
      dispatchActivity({ type: "reset" });
    }
    setAuth({ kind: "ready", status });
    if (status.authenticated) setAuthEventMessage(null);
    setAuthSessionGeneration((generation) => generation + 1);
    setAccountOpen(false);
    setUtilitySurface(null);
    setSearchOpen(false);
  }, []);

  const refreshAuth = useCallback(async () => {
    setAuth({ kind: "loading" });
    try {
      acceptAuth(await bridge.authStatus());
    } catch (error) {
      setAuth({ kind: "error", message: userFacingBridgeError(error) });
    }
  }, [acceptAuth, bridge]);

  const logout = useCallback(async () => {
    collectorStore.stop();
    setAuthEventMessage(null);
    setAccountOpen(false);
    setUtilitySurface(null);
    setSearchOpen(false);
    setStudioSection("overview");
    setNavigationTarget(null);
    dispatchActivity({ type: "reset" });
    setPage("devices");
    try {
      await bridge.logout();
      acceptAuth({ setup_required: false, authenticated: false, user: null });
    } catch {
      await refreshAuth();
    }
  }, [acceptAuth, bridge, refreshAuth]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      window.localStorage.setItem(themePreferenceKey, dark ? "dark" : "light");
    } catch {
      // Theme remains active for the current session when storage is unavailable.
    }
  }, [dark]);

  useEffect(() => { void refreshAuth(); }, [refreshAuth]);

  useLayoutEffect(() => {
    const previous = previousUtilitySurfaceRef.current;
    previousUtilitySurfaceRef.current = utilitySurface;
    if (previous === "notifications" && utilitySurface === "quick") {
      quickStatusContentRef.current?.focus({ preventScroll: true });
    }
  }, [utilitySurface]);

  useEffect(() => bridge.onAuthInvalidated(() => {
    collectorStore.stop();
    dispatchActivity({ type: "reset" });
    setAuthEventMessage("Your session expired or was revoked. Sign in again to continue.");
    void refreshAuth();
  }), [bridge, refreshAuth]);

  const currentUser = auth.kind === "ready" ? auth.status.user : null;
  const collectorAccess = !!currentUser
    && auth.kind === "ready"
    && auth.status.authenticated
    && !currentUser.must_change_password
    && currentUser.role !== "participant";

  useEffect(() => {
    if (!collectorAccess) {
      collectorStore.stop();
      return;
    }
    void collectorStore.start(bridge);
    return () => collectorStore.stop();
  }, [authSessionGeneration, bridge, collectorAccess, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (page === "users" && currentUser?.role !== "administrator") setPage("devices");
  }, [currentUser?.role, page]);

  useEffect(() => {
    if (state.bridgeStatus === "open") {
      bridgeWasOpenRef.current = true;
      if (bridgeFailureActiveRef.current) {
        bridgeFailureActiveRef.current = false;
        recordActivity({
          key: "bridge-connection",
          kind: "bridge",
          surface: "center",
          severity: "success",
          title: "Bridge reconnected",
          message: "Live telemetry is available again.",
          audiences: collectorAudiences,
          active: false,
          dismissible: true,
          actionLabel: "Open Quick Status",
          command: { kind: "open-status" },
        });
      }
      return;
    }
    if (bridgeWasOpenRef.current && (state.bridgeStatus === "closed" || state.bridgeStatus === "error")) {
      bridgeFailureActiveRef.current = true;
      recordActivity({
        key: "bridge-connection",
        kind: "bridge",
        surface: "both",
        severity: "error",
        title: "Bridge interrupted",
        message: "Telemetry is paused; the latest state is preserved for inspection.",
        audiences: collectorAudiences,
        active: true,
        dismissible: false,
        actionLabel: "Reconnect",
        command: { kind: "reconnect-bridge" },
        markUnread: "always",
      });
    }
  }, [recordActivity, state.bridgeStatus]);

  useEffect(() => {
    const resync = state.latestResync;
    if (!resync) return;
    const device = state.devices.find((candidate) => candidate.device_id === resync.deviceId);
    const name = device?.display_name ?? "Data source";
    if (resync.status === "pending") {
      recordActivity({
        key: `resync:${resync.deviceId}`,
        kind: "resync",
        surface: "both",
        severity: "warning",
        title: "Resyncing data",
        message: `${name} is restoring the latest data.`,
        audiences: collectorAudiences,
        active: true,
        dismissible: false,
        actionLabel: "Open Quick Status",
        command: { kind: "open-status" },
      });
    } else if (resync.status === "resolved") {
      recordActivity({
        key: `resync:${resync.deviceId}`,
        kind: "resync",
        surface: "center",
        severity: "success",
        title: "Data resynced",
        message: `${name} restored the latest data.`,
        audiences: collectorAudiences,
        active: false,
        dismissible: true,
        actionLabel: "Open Monitor",
        command: { kind: "navigate", page: "live" },
      });
    } else {
      recordActivity({
        key: `resync:${resync.deviceId}`,
        kind: "resync",
        surface: "both",
        severity: "error",
        title: "Could not resync data",
        message: state.error ?? "The bridge is temporarily unavailable.",
        audiences: collectorAudiences,
        active: true,
        dismissible: false,
        actionLabel: "Try again",
        command: { kind: "resync", deviceId: resync.deviceId },
        markUnread: "always",
      });
    }
  }, [recordActivity, state.devices, state.error, state.latestResync]);

  useEffect(() => {
    const previous = previousLostPacketsRef.current;
    for (const device of state.devices) {
      const lost = state.statistics[device.device_id]?.lost_packets ?? 0;
      const prior = previous[device.device_id] ?? 0;
      if (lost > prior) {
        recordActivity({
          key: `packet-loss:${device.device_id}`,
          kind: "packet-loss",
          surface: "center",
          severity: "warning",
          title: "Packet loss detected",
          message: `${device.display_name}: ${lost.toLocaleString("en-US")} packets lost in total.`,
          audiences: collectorAudiences,
          active: false,
          dismissible: true,
          actionLabel: "Open Monitor",
          command: { kind: "navigate", page: "live" },
          markUnread: "always",
        });
      }
      previous[device.device_id] = lost;
    }
  }, [recordActivity, state.devices, state.statistics]);

  const toggleTheme = useCallback(() => setDark((value) => !value), []);

  const connectedDevices = state.devices.filter((device) => device.state === "connected").length;
  const simulatedDevices = state.devices.filter((device) => device.simulated).length;
  const totalSampleRate = Object.values(state.statistics).reduce(
    (total, statistics) => total + statistics.sample_rate_hz,
    0,
  );
  const totalReceivedPackets = Object.values(state.statistics).reduce(
    (total, statistics) => total + statistics.received_packets,
    0,
  );
  const totalLostPackets = Object.values(state.statistics).reduce(
    (total, statistics) => total + statistics.lost_packets,
    0,
  );
  const unreadCount = currentUser ? unreadActivityCount(activityState, currentUser.role) : 0;
  const nowActivities = useMemo<RuntimeActivityItem[]>(() => {
    if (!collectorAccess) return [];
    let id = -1;
    const ephemeral: RuntimeActivityItem[] = [];
    const add = (input: RuntimeActivityInput) => ephemeral.push({
      ...input,
      id: id--,
      createdAt: 0,
      updatedAt: 0,
      unread: false,
    });
    const connecting = state.devices.filter((device) => device.state === "connecting");
    if (connecting.length) {
      add({
        key: "device-connecting",
        kind: "device",
        surface: "now",
        severity: "info",
        title: "Connecting devices",
        message: connecting.length === 1 ? connecting[0].display_name : `${connecting.length} sources are connecting.`,
        audiences: collectorAudiences,
        active: true,
        dismissible: false,
        actionLabel: "Open Devices",
        command: { kind: "navigate", page: "devices" },
      });
    }
    if (state.bridgeStatus === "open" && connectedDevices > 0 && state.batchesReceived > 0) {
      add({
        key: "sensor-data-running",
        kind: "device",
        surface: "now",
        severity: "info",
        title: "Live telemetry",
        message: "Receiving sensor data",
        audiences: collectorAudiences,
        active: true,
        dismissible: false,
        actionLabel: "Open Monitor",
        command: { kind: "navigate", page: "live" },
      });
    }
    return [...visibleActivitiesForRole(activityState.items, currentUser?.role ?? "participant"), ...ephemeral];
  }, [activityState.items, collectorAccess, connectedDevices, currentUser?.role, state.batchesReceived, state.bridgeStatus, state.devices]);

  const openQuickStatus = useCallback(() => {
    setSearchOpen(false);
    setAccountOpen(false);
    setUtilityOrigin("quick");
    setUtilitySurface((surface) => surface === "quick" ? null : "quick");
  }, []);

  const openNotificationCenter = useCallback((origin: "quick" | "now") => {
    setSearchOpen(false);
    setAccountOpen(false);
    setUtilityOrigin(origin);
    setUtilitySurface("notifications");
  }, []);

  const navigate = useCallback((nextPage: ShellPage) => {
    setPage(nextPage);
    if (nextPage === "devices") setDeviceSection("overview");
    if (nextPage === "live") setLiveSection("overview");
    if (nextPage === "studio") setStudioSection("overview");
    if (nextPage === "users") setAccountSection("overview");
    setUtilitySurface(null);
    setAccountOpen(false);
    setSearchOpen(false);
    setNavigationTarget(null);
  }, []);

  const selectSearchResult = useCallback((target: SearchTarget) => {
    setSearchOpen(false);
    if (target.kind === "action") {
      if (target.action === "theme") toggleTheme();
      if (target.action === "quick-status") openQuickStatus();
      if (target.action === "account") {
        setUtilitySurface(null);
        setAccountOpen(true);
      }
      return;
    }
    if (target.page === "users" && currentUser?.role !== "administrator") return;
    navigate(target.page);
    if (target.page === "devices" && deviceSections.some((section) => section.id === target.section)) {
      setDeviceSection(target.section as DeviceSection);
    }
    if (target.page === "live" && liveSections.some((section) => section.id === target.section)) {
      setLiveSection(target.section as LiveSection);
    }
    if (target.page === "studio" && studioSections.some((section) => section.id === target.section)) {
      setStudioSection(target.section as StudioSection);
    }
    if (target.page === "users" && accountSections.some((section) => section.id === target.section)) {
      setAccountSection(target.section as AccountSection);
    }
    searchNavigationSequence.current += 1;
    setNavigationTarget({
      id: target.targetId ?? "page-title",
      contextId: target.section,
      key: searchNavigationSequence.current,
    });
  }, [currentUser?.role, navigate, openQuickStatus, toggleTheme]);

  const executeActivityCommand = useCallback(async (command: RuntimeActivityCommand) => {
    if (command.kind === "navigate") {
      setPage(command.page);
      setUtilitySurface(null);
      return;
    }
    if (command.kind === "open-status") {
      setUtilitySurface("quick");
      return;
    }
    if (command.kind === "pause-chart" || command.kind === "resume-chart") {
      setChartPaused(command.kind === "pause-chart");
      return;
    }
    if (command.kind === "reconnect-bridge") {
      await collectorStore.start(bridge);
      return;
    }
    if (command.kind === "resync") {
      await collectorStore.resync(command.deviceId);
      return;
    }
    if (command.kind === "retry-simulator") {
      const succeeded = await collectorStore.configureSimulator(command.config);
      recordActivity(succeeded ? {
        key: "simulator-config",
        kind: "simulator",
        surface: "center",
        severity: "success",
        title: "Simulation settings applied",
        message: `${command.config.sample_rate_hz} Hz · packet loss ${(command.config.packet_loss_rate * 100).toFixed(1)}%.`,
        audiences: collectorAudiences,
        active: false,
        dismissible: true,
        actionLabel: "Open Devices",
        command: { kind: "navigate", page: "devices" },
        announcedBySnackbar: true,
      } : {
        key: "simulator-config",
        kind: "simulator",
        surface: "both",
        severity: "error",
        title: "Could not apply simulation settings",
        message: collectorStore.getSnapshot().error ?? "The bridge is temporarily unavailable.",
        audiences: collectorAudiences,
        active: true,
        dismissible: false,
        actionLabel: "Try again",
        command,
        announcedBySnackbar: true,
        markUnread: "always",
      });
      notify({ message: succeeded ? "Simulation settings applied." : "Could not apply simulation settings.", tone: succeeded ? "success" : "error" });
      return;
    }
    const succeeded = command.kind === "retry-device"
      ? await collectorStore.setConnected(command.deviceId, command.connect)
      : await collectorStore.setAllConnected(command.connect);
    const key = command.kind === "retry-device"
      ? `device-operation:${command.deviceId}:${command.connect ? "connect" : "disconnect"}`
      : `device-operation:all:${command.connect ? "connect" : "disconnect"}`;
    const subject = command.kind === "retry-device" ? command.deviceName : "all devices";
    recordActivity({
      key,
      kind: "device",
      surface: succeeded ? "center" : "both",
      severity: succeeded ? "success" : "error",
      title: succeeded ? "Devices connected" : "Could not connect devices",
      message: succeeded ? `${subject} confirmed the new state.` : collectorStore.getSnapshot().error ?? "The bridge is temporarily unavailable.",
      audiences: collectorAudiences,
      active: !succeeded,
      dismissible: succeeded,
      actionLabel: succeeded ? "Open Devices" : "Try again",
      command: succeeded ? { kind: "navigate", page: "devices" } : command,
      announcedBySnackbar: true,
      markUnread: succeeded ? "new-only" : "always",
    });
    notify({ message: succeeded ? `Connected ${subject}.` : `Could not connect ${subject}.`, tone: succeeded ? "success" : "error" });
  }, [bridge, notify, recordActivity]);

  if (auth.kind === "loading") {
    return <AuthLoading dark={dark} onToggleTheme={toggleTheme} />;
  }
  if (auth.kind === "error") {
    return <AuthStartupError dark={dark} message={auth.message} onRetry={() => void refreshAuth()} onToggleTheme={toggleTheme} />;
  }
  if (auth.status.setup_required) {
    return <FirstRunSetup bridge={bridge} dark={dark} onAuthenticated={acceptAuth} onToggleTheme={toggleTheme} />;
  }
  if (!auth.status.authenticated || !currentUser) {
    return <LoginScreen bridge={bridge} dark={dark} notice={authEventMessage} onAuthenticated={acceptAuth} onToggleTheme={toggleTheme} />;
  }
  if (currentUser.must_change_password) {
    return <ForcedPasswordChange bridge={bridge} dark={dark} onAuthenticated={acceptAuth} onLogout={() => void logout()} onToggleTheme={toggleTheme} user={currentUser} />;
  }
  if (currentUser.role === "participant") {
    return <ParticipantAccess dark={dark} onLogout={() => void logout()} onToggleTheme={toggleTheme} user={currentUser} />;
  }

  const initializationError = !state.ready && state.error;
  const bridgeError = state.ready && state.bridgeStatus === "error";

  return (
    <>
      <OneUIShell
        page={page}
        hero={page === "studio" && studioSection === "overview" ? (
          <figure className="studio-shell-hero-card" aria-label="SmartGlove live sensor workspace preview">
            <img src={studioHeroPreviewUrl} alt="" />
          </figure>
        ) : undefined}
        dark={dark}
        bridgeOpen={state.bridgeStatus === "open"}
        connectedDevices={connectedDevices}
        totalDevices={state.devices.length}
        simulatedDevices={simulatedDevices}
        quickStatusOpen={utilitySurface !== null && utilityOrigin === "quick"}
        quickStatusButtonRef={quickStatusButtonRef}
        accountLabel={currentUser.display_name || currentUser.username}
        accountOpen={accountOpen}
        accountButtonRef={accountButtonRef}
        canManageUsers={currentUser.role === "administrator"}
        onNavigate={navigate}
        onToggleTheme={() => { setSearchOpen(false); toggleTheme(); }}
        onToggleQuickStatus={openQuickStatus}
        onToggleAccount={() => { setSearchOpen(false); setUtilitySurface(null); setAccountOpen((open) => !open); }}
        utilityActions={(
          <OneUIIconButton
            ref={searchButtonRef}
            icon={<img className="one-ui-figma-glyph" src={searchGlyphUrl} alt="" />}
            label="Search"
            aria-expanded={searchOpen}
            aria-controls="global-search"
            
            onClick={() => {
              setAccountOpen(false);
              setUtilitySurface(null);
              setSearchOpen((open) => !open);
            }}
          />
        )}
        contextNavigation={page === "devices" ? {
          items: deviceSections.map(({ id, label }) => ({ id, label, target: "device-section" })),
          activeId: deviceSection,
          onSelect: (id) => { setNavigationTarget(null); setDeviceSection(id as DeviceSection); },
        } : page === "live" ? {
          items: liveSections.map(({ id, label }) => ({ id, label, target: "live-section" })),
          activeId: liveSection,
          onSelect: (id) => { setNavigationTarget(null); setLiveSection(id as LiveSection); },
        } : page === "studio" ? {
          items: studioSections.map(({ id, label }) => ({ id, label, target: "studio-section" })),
          activeId: studioSection,
          onSelect: (id) => { setNavigationTarget(null); setStudioSection(id as StudioSection); },
        } : page === "users" ? {
          items: accountSections.map(({ id, label }) => ({ id, label, target: "account-section" })),
          activeId: accountSection,
          onSelect: (id) => { setNavigationTarget(null); setAccountSection(id as AccountSection); },
        } : undefined}
        navigationTarget={navigationTarget}
        activity={(
          <NowBar
            activities={nowActivities}
            centerOpen={utilitySurface !== null || accountOpen || searchOpen}
            onExecute={executeActivityCommand}
            onMarkEvent={() => {
              const marker = createTelemetryMarker({ bridgeStatus: state.bridgeStatus, chartPaused,
                receivedPackets: totalReceivedPackets, lostPackets: totalLostPackets,
                sources: state.devices.map((device) => ({ id: device.device_id, state: device.state, simulated: device.simulated })) });
              const time = new Date(marker.createdAt).toLocaleTimeString("en-US");
              recordActivity({ key: `telemetry-marker:${marker.id}`, marker, kind: "marker", surface: "center",
                severity: "info", title: "Telemetry event marked",
                message: `${new Date(marker.createdAt).toISOString()} · Local session marker; not saved to a dataset.`,
                audiences: collectorAudiences, active: false, dismissible: true, announcedBySnackbar: true });
              notify({ message: `Event marked at ${time} · Local session only`, tone: "success" });
            }}
            page={page}
            telemetry={{
              bridgeStatus: state.bridgeStatus,
              resyncPending: state.latestResync?.status === "pending",
              connectedSources: connectedDevices,
              totalSources: state.devices.length,
              totalSampleRate,
              totalReceivedPackets,
              totalLostPackets,
              chartPaused,
              sources: state.devices.map((device) => ({
                id: device.device_id,
                name: device.display_name,
                hand: device.hand,
                handLabel: device.hand_label,
                state: device.state,
                simulated: device.simulated,
                statisticsAvailable: !!state.statistics[device.device_id],
                stateLabel: deviceStateLabel[device.state],
                sampleRate: state.statistics[device.device_id]?.sample_rate_hz ?? 0,
                receivedPackets: state.statistics[device.device_id]?.received_packets ?? 0,
                lostPackets: state.statistics[device.device_id]?.lost_packets ?? 0,
              })),
            }}
            triggerRef={nowBarButtonRef}
          />
        )}
      >
        {initializationError || bridgeError ? (
          <OneUIStateMessage
            announce
            className="app-state-message"
            tone="error"
            title={bridgeError ? "Bridge connection interrupted" : "Could not open the collector"}
            description={bridgeError ? "The data connection is interrupted. Device state is preserved for inspection." : state.error}
          />
        ) : null}
        {!state.ready && !state.error ? (
          <OneUIStateMessage
            announce
            className="application-loading-state"
            pending
            tone="waiting"
            title="Initializing collector"
            description="Preparing simulation sources and the data connection…"
          />
        ) : null}
        {state.ready && page === "devices" ? <DeviceManager state={state} section={deviceSection} onActivity={recordActivity} onNotify={notify} /> : null}
        {state.ready && page === "live" ? <LiveMonitor state={state} section={liveSection} dark={dark} paused={chartPaused} onPausedChange={setChartPaused} /> : null}
        {page === "studio" ? (
          <Studio state={state} section={studioSection} onSectionChange={setStudioSection} />
        ) : null}
        {page === "users" && currentUser.role === "administrator" ? (
          <UserManagement
            bridge={bridge}
            currentUser={currentUser}
            section={accountSection}
            onSectionChange={setAccountSection}
            onActivity={recordActivity}
            onNotify={notify}
          />
        ) : null}
      </OneUIShell>

      <GlobalSearch
        open={searchOpen}
        onDismiss={() => setSearchOpen(false)}
        returnFocusRef={searchButtonRef}
        state={state}
        canManageUsers={currentUser.role === "administrator"}
        onSelect={selectSearchResult}
      />

      <OneUIInteractionPage presentation="status"
        className={utilitySurface === "notifications" ? "notification-center-sheet" : "quick-status-sheet"}
        eyebrow={utilitySurface === "notifications" ? "Session activity" : "Collector status"}
        id="quick-status-panel"
        onDismiss={closeUtilitySurface}
        open={utilitySurface !== null}
        returnFocusRef={utilityOrigin === "now" ? nowBarButtonRef : quickStatusButtonRef}
        title={utilitySurface === "notifications" ? "Notifications" : "Quick Status"}
      >
        {utilitySurface === "quick" ? (
          <div ref={quickStatusContentRef} className="quick-status-content" tabIndex={-1} aria-label="Quick status content">
          <div className="quick-connection-line">
            <OneUIStatusIndicator
              emphasis="quiet"
              label={state.bridgeStatus === "open" ? "Connected" : "Connecting"}
              size="medium"
              tone={state.bridgeStatus === "open" ? "positive" : "waiting"}
            />
            <span>{state.bridgeStatus === "open" ? "Authenticated · memory only" : "Session not ready"}</span>
          </div>

          <div className="quick-rate" role="group" aria-label={`Total sample rate ${totalSampleRate.toFixed(1)} Hz`}>
            <span>Total sample rate</span>
            <strong>{totalSampleRate.toFixed(1)}<small> Hz</small></strong>
            <p>{connectedDevices}/{state.devices.length} sources are streaming live data</p>
          </div>

          <div className="quick-device-grid" role="group" aria-label="Two-glove status">
            {state.devices.map((device) => (
              <div key={device.device_id}>
                <span className={`hand-mark compact ${device.hand}`} role="img" aria-label={`${device.hand_label} glove`}>{device.hand_label}</span>
                <span><strong>{device.display_name}</strong><small>{deviceStateLabel[device.state]}</small></span>
                <strong>{state.statistics[device.device_id]?.sample_rate_hz.toFixed(1) ?? "0.0"} Hz</strong>
              </div>
            ))}
          </div>

          <div className="quick-control-row">
            <div>
              <strong>Simulator</strong>
              <span>Seed {state.simulation.seed} · {state.simulation.sample_rate_hz} Hz · packet loss {(state.simulation.packet_loss_rate * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="quick-notification-row">
            <OneUIButton variant="secondary" onClick={() => openNotificationCenter("quick")}>
              {unreadCount ? `Notifications · ${unreadCount} unread` : "Notifications"}
            </OneUIButton>
          </div>
          </div>
        ) : utilitySurface === "notifications" ? (
          <NotificationCenter
            role={currentUser.role}
            state={activityState}
            onMarkRead={(id) => dispatchActivity({ type: "mark-read", id })}
            onMarkAllRead={() => dispatchActivity({ type: "mark-all-read", role: currentUser.role })}
            onDismiss={(id) => dispatchActivity({ type: "dismiss", id })}
            onClearRead={() => dispatchActivity({ type: "clear-read", role: currentUser.role })}
            onExecute={executeActivityCommand}
          />
        ) : null}
      </OneUIInteractionPage>

      <AccountSheet
        bridge={bridge}
        onAuthenticated={acceptAuth}
        onDismiss={() => setAccountOpen(false)}
        onLogout={() => void logout()}
        open={accountOpen}
        returnFocusRef={accountButtonRef}
        user={currentUser}
      />

      <OneUISnackbar
        notice={snackbar}
        onDismiss={dismissSnackbar}
      />

    </>
  );
}
