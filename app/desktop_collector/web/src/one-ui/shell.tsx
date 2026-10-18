import {
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { flushSync } from "react-dom";

import drawerGlyphUrl from "../assets/one-ui/figma/drawer.svg";
import deviceGlyphUrl from "../assets/one-ui/figma/devices.svg";
import appsGlyphUrl from "../assets/one-ui/figma/apps.svg";
import folderGlyphUrl from "../assets/one-ui/figma/folder.svg";
import folderOutlineGlyphUrl from "../assets/one-ui/figma/folder-outline.svg";
import imageGlyphUrl from "../assets/one-ui/figma/image.svg";
import imageOutlineGlyphUrl from "../assets/one-ui/figma/image-outline.svg";
import labsGlyphUrl from "../assets/one-ui/figma/labs.svg";
import labsOutlineGlyphUrl from "../assets/one-ui/figma/labs-outline.svg";
import translateGlyphUrl from "../assets/one-ui/figma/translate.svg";
import reportGlyphUrl from "../assets/one-ui/figma/report.svg";
import brightnessGlyphUrl from "../assets/one-ui/figma/brightness.svg";
import darkGlyphUrl from "../assets/one-ui/figma/dark.svg";
import equalizerGlyphUrl from "../assets/one-ui/figma/equalizer-2.svg";
import speedGlyphUrl from "../assets/one-ui/figma/speed.svg";
import { FigmaIcon } from "./figma-icon";
import accountGlyphUrl from "../assets/one-ui/figma/contact.svg";
import accountOutlineGlyphUrl from "../assets/one-ui/figma/contact-outline.svg";
import appsOutlineGlyphUrl from "../assets/one-ui/figma/apps-outline.svg";
import deviceOutlineGlyphUrl from "../assets/one-ui/figma/devices.svg";
import equalizerOutlineGlyphUrl from "../assets/one-ui/figma/equalizer-2.svg";

import { OneUIIconButton, OneUIStatusIndicator } from "./controls";
import { OneUIAppDock, OneUITopNavigation, OneUIUtilityToolbar, type OneUIAppDockItem } from "./navigation";
import "./shell.css";
import { NavigationOverlayContext } from "./navigation-context";

export type ShellPage = "devices" | "live" | "studio" | "users";

function FigmaGlyph({ src, className = "one-ui-figma-glyph" }: { src: string; className?: string }) {
  return <FigmaIcon className={className} src={src} />;
}

function ThemeGlyph({ dark }: { dark: boolean }) {
  return <FigmaGlyph src={dark ? brightnessGlyphUrl : darkGlyphUrl} />;
}

function StatusGlyph() {
  return <FigmaIcon className="one-ui-state-glyph" src={speedGlyphUrl} />;
}

function AccountGlyph({ selected = false }: { selected?: boolean }) {
  return <FigmaIcon className="one-ui-state-glyph" src={selected ? accountGlyphUrl : accountOutlineGlyphUrl} />;
}

function DevicesGlyph({ selected = false }: { selected?: boolean }) {
  return <FigmaIcon className="one-ui-state-glyph" src={selected ? deviceGlyphUrl : deviceOutlineGlyphUrl} />;
}

function MonitorGlyph({ selected = false }: { selected?: boolean }) {
  return <FigmaIcon className="one-ui-state-glyph" src={selected ? equalizerGlyphUrl : equalizerOutlineGlyphUrl} />;
}

function StudioGlyph({ selected = false }: { selected?: boolean }) {
  return <FigmaIcon className="one-ui-state-glyph" src={selected ? labsGlyphUrl : labsOutlineGlyphUrl} />;
}

function UsersGlyph({ selected = false }: { selected?: boolean }) {
  return <FigmaIcon className="one-ui-state-glyph" src={selected ? accountGlyphUrl : accountOutlineGlyphUrl} />;
}

function StudioSectionGlyph({ id, selected = false }: { id: string; selected?: boolean }) {
  const pair = {
    overview: [appsOutlineGlyphUrl, appsGlyphUrl],
    dataset: [folderOutlineGlyphUrl, folderGlyphUrl],
    mediapipe: [imageOutlineGlyphUrl, imageGlyphUrl],
    train: [labsOutlineGlyphUrl, labsGlyphUrl],
    evaluate: [reportGlyphUrl, reportGlyphUrl],
    translate: [translateGlyphUrl, translateGlyphUrl],
  }[id] ?? [appsOutlineGlyphUrl, appsGlyphUrl];
  return <FigmaIcon className="one-ui-state-glyph" src={selected ? pair[1] : pair[0]} />;
}

type ContextItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  selectedIcon?: ReactNode;
  target?: string;
};

export type ShellContextNavigation = {
  items: ContextItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

export type ShellNavigationTarget = { id: string; contextId?: string; key: number };

type ContextTransitionDirection = "forward" | "backward";

function runContextTransition(direction: ContextTransitionDirection, update: () => void) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const content = document.getElementById("workspace-stage");
  const scrollRoot = document.getElementById("collector-content");
  const shell = scrollRoot?.closest<HTMLElement>(".app-shell");
  const previousPage = shell?.dataset.page;
  const previousScroll = scrollRoot?.scrollTop ?? 0;

  const running = content?.getAnimations().find(animation => animation.id === "context-page-enter");
  const interruptedTransform = running && content ? getComputedStyle(content).transform : null;
  const interruptedOpacity = running && content ? getComputedStyle(content).opacity : null;
  running?.cancel();
  flushSync(update);
  if (scrollRoot && shell && shell.dataset.page === previousPage) {
    const heading = content?.querySelector<HTMLElement>("h1");
    const navigation = shell.querySelector<HTMLElement>(".health-context-nav");
    // A newly selected destination starts with its heading below the floating
    // navigation. Keep the compact state where space allows, not the old page's
    // deep scroll offset. This is a one-time navigation measurement.
    const lastClearOffset = heading && navigation
      ? scrollRoot.scrollTop + heading.getBoundingClientRect().top - navigation.getBoundingClientRect().bottom - 24
      : previousScroll;
    scrollRoot.scrollTop = Math.max(0, Math.min(previousScroll, lastClearOffset));
  }

  if (reducedMotion || !content) return;

  const offset = direction === "forward" ? 28 : -28;
  const motion = getComputedStyle(content);
  const animation = content.animate(
    [
      { transform: interruptedTransform ?? `translate3d(${offset}px, 0, 0)`, opacity: interruptedOpacity ?? 0.35 },
      { transform: "translate3d(0, 0, 0)", opacity: 1 },
    ],
    { duration: Number.parseFloat(motion.getPropertyValue("--ou-motion-standard")) || 240, easing: motion.getPropertyValue("--ou-ease-basic-transform").trim(), fill: "none" },
  );
  animation.id = "context-page-enter";
}

export function OneUITopAppBar({
  activity,
  page,
  dark,
  bridgeOpen,
  connectedDevices,
  totalDevices,
  simulatedDevices,
  quickStatusOpen,
  quickStatusButtonRef,
  accountLabel,
  accountOpen,
  accountButtonRef,
  onToggleTheme,
  onToggleQuickStatus,
  onToggleAccount,
  utilityActions,
  contextNavigation,
  navigationTarget,
}: {
  activity?: ReactNode;
  page: ShellPage;
  dark: boolean;
  bridgeOpen: boolean;
  connectedDevices: number;
  totalDevices: number;
  simulatedDevices: number;
  quickStatusOpen: boolean;
  quickStatusButtonRef: RefObject<HTMLButtonElement | null>;
  accountLabel: string;
  accountOpen: boolean;
  accountButtonRef: RefObject<HTMLButtonElement | null>;
  onToggleTheme: () => void;
  onToggleQuickStatus: () => void;
  onToggleAccount: () => void;
  utilityActions?: ReactNode;
  contextNavigation?: ShellContextNavigation;
  navigationTarget?: ShellNavigationTarget | null;
}) {
  const suppliedItems = contextNavigation?.items ?? [];
  const items = page === "studio"
    ? suppliedItems.map((item) => item.icon ? item : { ...item,
        icon: <StudioSectionGlyph id={item.id} />,
        selectedIcon: <StudioSectionGlyph id={item.id} selected /> })
    : suppliedItems;
  const selectedContext = contextNavigation?.activeId ?? "overview";
  const deviceStatus = simulatedDevices === totalDevices && totalDevices > 0
    ? `SIM ${connectedDevices}/${totalDevices}` : `Devices ${connectedDevices}/${totalDevices}`;

  function activate(item: ContextItem) {
    if (item.id === selectedContext || !contextNavigation) return;
    const direction = items.findIndex(i => i.id === item.id) >= items.findIndex(i => i.id === selectedContext)
      ? "forward" : "backward";
    runContextTransition(direction, () => contextNavigation.onSelect(item.id));
  }

  return (
    <div className="health-shell-header">
      <header className="health-topbar" aria-label="Application bar">
        <div className="health-brand" aria-label="Dataset Studio">
          <span className="health-brand__title">Dataset Studio</span>
          <span className="health-brand__dot" aria-hidden="true" />
        </div>
        <div className="health-utility">
          <div className="health-utility-status" aria-label="Collector status">
            <OneUIStatusIndicator className="health-status" label={bridgeOpen ? "Bridge online" : "Bridge connecting"} tone={bridgeOpen ? "positive" : "waiting"} />
            <OneUIStatusIndicator className="health-status" label={deviceStatus} tone={connectedDevices > 0 ? "positive" : "neutral"} />
          </div>
          {activity}
          <OneUIUtilityToolbar>
            {utilityActions}
            <OneUIIconButton
              icon={<ThemeGlyph dark={dark} />}
              label={`Switch to ${dark ? "light" : "dark"} mode`}
              data-testid="theme-control"
              type="button"
              onClick={onToggleTheme}
            />
            <OneUIIconButton
              ref={quickStatusButtonRef}
              className="quick-status-button"
              icon={<StatusGlyph />}
              label="Quick Status"
              type="button"
              aria-expanded={quickStatusOpen}
              aria-controls="quick-status-panel"
              onClick={onToggleQuickStatus}
            />
            <OneUIIconButton
              ref={accountButtonRef}
              className="account-button"
              icon={<AccountGlyph selected={accountOpen} />}
              label={`Account: ${accountLabel}`}
              type="button"
              aria-expanded={accountOpen}
              aria-controls="account-panel"
              onClick={onToggleAccount}
            />
          </OneUIUtilityToolbar>
        </div>
      </header>

      {items.length > 1 ? (
        <OneUITopNavigation
          items={items.map((item) => ({ id: item.id, label: item.label, icon: item.icon, selectedIcon: item.selectedIcon, controls: item.target }))}
          activeId={selectedContext}
          onSelect={(id) => {
            const item = items.find((candidate) => candidate.id === id);
            if (item) activate(item);
          }}
        />
      ) : null}
    </div>
  );
}

const destinations: Array<OneUIAppDockItem<ShellPage>> = [
  { id: "devices", label: "Devices", icon: <DevicesGlyph />, selectedIcon: <DevicesGlyph selected /> },
  { id: "live", label: "Monitor", icon: <MonitorGlyph />, selectedIcon: <MonitorGlyph selected /> },
  { id: "studio", label: "Studio", icon: <StudioGlyph />, selectedIcon: <StudioGlyph selected /> },
  { id: "users", label: "Account", icon: <UsersGlyph />, selectedIcon: <UsersGlyph selected /> },
];

export function CompactAppNavigation({ page, canManageUsers, onNavigate, onOpenAccount, hidden = false }: { hidden?: boolean; page: ShellPage; canManageUsers: boolean; onNavigate: (page: ShellPage) => void; onOpenAccount?: () => void }) {
  const items = destinations.filter((destination) => destination.id !== "users" || canManageUsers || onOpenAccount);
  return (
    <OneUIAppDock
      id="app-navigation"
      inert={hidden || undefined}
      aria-hidden={hidden || undefined}
      items={items}
      activeId={page}
      onSelect={(nextPage) => {
        if (nextPage === "users" && !canManageUsers) onOpenAccount?.();
        else onNavigate(nextPage);
      }}
    />
  );
}

export function OneUIShell({
  page,
  dark,
  bridgeOpen,
  connectedDevices,
  totalDevices,
  simulatedDevices,
  quickStatusOpen,
  quickStatusButtonRef,
  accountLabel,
  accountOpen,
  accountButtonRef,
  canManageUsers,
  onNavigate,
  onToggleTheme,
  onToggleQuickStatus,
  onToggleAccount,
  utilityActions,
  contextNavigation,
  navigationTarget,
  activity,
  children,
}: {
  page: ShellPage;
  dark: boolean;
  bridgeOpen: boolean;
  connectedDevices: number;
  totalDevices: number;
  simulatedDevices: number;
  quickStatusOpen: boolean;
  quickStatusButtonRef: RefObject<HTMLButtonElement | null>;
  accountLabel: string;
  accountOpen: boolean;
  accountButtonRef: RefObject<HTMLButtonElement | null>;
  canManageUsers: boolean;
  onNavigate: (page: ShellPage) => void;
  onToggleTheme: () => void;
  onToggleQuickStatus: () => void;
  onToggleAccount: () => void;
  utilityActions?: ReactNode;
  contextNavigation?: ShellContextNavigation;
  navigationTarget?: ShellNavigationTarget | null;
  activity?: ReactNode;
  children: ReactNode;
}) {
  const [railOpen, setRailOpen] = useState(false);
  const [rail, setRail] = useState(() => window.matchMedia("(min-width: 1100px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1100px)");
    const update = () => setRail(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const toggleRef = useRef<HTMLButtonElement>(null);
  function closeNavigation() {
    setRailOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
  }
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const lastPage = useRef(page);
  const scrollPositions = useRef<Partial<Record<ShellPage, number>>>({});

  useEffect(() => { if (!rail) setRailOpen(false); }, [rail]);
  useLayoutEffect(() => {
    if (contentRef.current) contentRef.current.inert = rail && railOpen;
    if (rail && railOpen) {
      const navigation = shellRef.current?.querySelector("#app-navigation");
      const selected = navigation?.querySelector<HTMLButtonElement>("[aria-current]")
        ?? navigation?.querySelector<HTMLButtonElement>("button");
      selected?.focus({ preventScroll: true });
    }
  }, [rail, railOpen]);
  function navigationKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!rail || !railOpen) return;
    if (event.key === "Escape") { event.preventDefault(); closeNavigation(); }
    if (event.key === "Tab") {
      const targets = [toggleRef.current, ...event.currentTarget.querySelectorAll<HTMLButtonElement>("#app-navigation button")].filter(Boolean) as HTMLButtonElement[];
      const index = targets.indexOf(document.activeElement as HTMLButtonElement);
      const next = (index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length;
      event.preventDefault(); targets[next]?.focus({ preventScroll: true });
    }
  }

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || lastPage.current === page) return;
    content.scrollTop = scrollPositions.current[page] ?? 0;
    lastPage.current = page;
    content.querySelector<HTMLElement>("h1, h2")?.focus({ preventScroll: true });
  }, [page]);

  useEffect(() => {
    if (!navigationTarget) return;
    const target = document.getElementById(navigationTarget.id);
    if (!target) return;
    target.scrollIntoView({ behavior: "auto", block: "start" });
    const hadTabIndex = target.hasAttribute("tabindex");
    if (!hadTabIndex) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    return () => { if (!hadTabIndex) target.removeAttribute("tabindex"); };
  }, [navigationTarget, page]);

  useEffect(() => {
    const content = contentRef.current;
    const shell = shellRef.current;
    if (!content || !shell) return;
    const heading = shell.querySelector<HTMLElement>(".health-topbar");
    let threshold = 72;
    let tabShift = 0;
    let shiftTravel = 1;
    let frame = 0;
    let compact = shell.dataset.shellCompact === "true";
    const update = () => {
      frame = 0;
      scrollPositions.current[lastPage.current] = content.scrollTop;
      const progress = Math.min(1, Math.max(0, content.scrollTop / Math.max(1, threshold)));
      shell.style.setProperty("--brand-opacity", String(1 - progress));
      shell.style.setProperty("--top-fade-opacity", String(0.24 + progress * 0.76));
      const clearance = Math.min(1, Math.max(0, content.scrollTop / shiftTravel));
      shell.style.setProperty("--context-nav-offset", `${tabShift * clearance}px`);
      const next = content.scrollTop >= threshold;
      if (compact !== next) {
        compact = next;
        shell.dataset.shellCompact = String(next);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      const navigation = shell.querySelector<HTMLElement>(".health-context-nav");
      const stickyTop = navigation ? Number.parseFloat(getComputedStyle(navigation).top) : 20;
      threshold = Math.max(0, (heading?.offsetHeight ?? 92) - stickyTop);
      const menu = toggleRef.current?.getBoundingClientRect();
      if (rail && navigation && menu) {
        const appliedShift = parseFloat(shell.style.getPropertyValue("--context-nav-offset")) || 0;
        const naturalLeft = navigation.getBoundingClientRect().left - appliedShift;
        const naturalTop = (heading?.getBoundingClientRect().bottom ?? 92) + content.scrollTop;
        tabShift = Math.max(0, menu.right + 16 - naturalLeft);
        // Finish lateral travel while an 8px vertical gap still separates targets.
        shiftTravel = Math.max(1, naturalTop - menu.bottom - 8);
        const utilityLeft = shell.querySelector(".health-utility")?.getBoundingClientRect().left ?? content.getBoundingClientRect().right;
        shell.style.setProperty("--context-nav-room", `${Math.max(0, utilityLeft - naturalLeft - 16)}px`);
      } else {
        tabShift = 0;
        shell.style.removeProperty("--context-nav-room");
      }
      update();
    };
    // Native sticky owns vertical travel. Only the tab strip moves horizontally;
    // the workspace never changes its gutter or available width.
    const observer = new ResizeObserver(measure);
    if (heading) observer.observe(heading);
    observer.observe(shell);
    const utility = shell.querySelector(".health-utility");
    if (utility) observer.observe(utility);
    measure();
    content.addEventListener("scroll", schedule, { passive: true });
    return () => { observer.disconnect(); content.removeEventListener("scroll", schedule); cancelAnimationFrame(frame); };
  }, [rail, page]);

  return (
    <NavigationOverlayContext.Provider value={rail && railOpen}>
    <div ref={shellRef} className="app-shell health-app-shell" data-page={page} data-navigation={rail ? "rail" : "bottom"} data-rail-open={rail && railOpen || undefined} onKeyDown={navigationKeyDown}>
      {rail ? <OneUIIconButton ref={toggleRef} className="health-rail-toggle" icon={<FigmaGlyph src={drawerGlyphUrl} />} label={railOpen ? "Hide navigation" : "Show navigation"} aria-expanded={railOpen} aria-controls="app-navigation" onClick={() => railOpen ? closeNavigation() : setRailOpen(true)} /> : null}
      <a className="skip-link" href="#collector-content">Skip navigation</a>
      <main id="collector-content" ref={contentRef} className="app-content health-app-content" tabIndex={-1}>
      <OneUITopAppBar
        activity={activity}
        page={page}
        dark={dark}
        bridgeOpen={bridgeOpen}
        connectedDevices={connectedDevices}
        totalDevices={totalDevices}
        simulatedDevices={simulatedDevices}
        quickStatusOpen={quickStatusOpen}
        quickStatusButtonRef={quickStatusButtonRef}
        accountLabel={accountLabel}
        accountOpen={accountOpen}
        accountButtonRef={accountButtonRef}
        onToggleTheme={onToggleTheme}
        onToggleQuickStatus={onToggleQuickStatus}
        onToggleAccount={onToggleAccount}
        utilityActions={utilityActions}
        contextNavigation={contextNavigation}
        navigationTarget={navigationTarget}
      />
        <div id="workspace-stage">{children}</div>
      </main>
      {rail ? <button className="health-navigation-scrim" tabIndex={-1} aria-label="Close navigation" aria-hidden={!railOpen || undefined} onClick={closeNavigation} /> : null}
      <CompactAppNavigation hidden={rail && !railOpen} page={page} canManageUsers={canManageUsers} onNavigate={(next) => {
        if (rail) closeNavigation();
        if (next === page) return;
        const order: ShellPage[] = ["devices", "live", "studio", "users"];
        runContextTransition(order.indexOf(next) > order.indexOf(page) ? "forward" : "backward", () => onNavigate(next));
      }} onOpenAccount={() => { if (rail) closeNavigation(); onToggleAccount(); }} />
    </div>
    </NavigationOverlayContext.Provider>
  );
}
