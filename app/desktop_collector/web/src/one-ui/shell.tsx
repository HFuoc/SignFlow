import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import { flushSync } from "react-dom";

import deviceGlyphUrl from "../assets/one-ui/figma/device.svg";
import monitorGlyphUrl from "../assets/one-ui/figma/sound-outline.svg";
import settingsGlyphUrl from "../assets/one-ui/figma/settings-outline.svg";
import appsGlyphUrl from "../assets/one-ui/figma/apps.svg";
import folderGlyphUrl from "../assets/one-ui/figma/folder.svg";
import folderOutlineGlyphUrl from "../assets/one-ui/figma/folder-outline.svg";
import imageGlyphUrl from "../assets/one-ui/figma/image.svg";
import imageOutlineGlyphUrl from "../assets/one-ui/figma/image-outline.svg";
import labsGlyphUrl from "../assets/one-ui/figma/labs.svg";
import labsOutlineGlyphUrl from "../assets/one-ui/figma/labs-outline.svg";
import soundOutlineGlyphUrl from "../assets/one-ui/figma/sound-outline.svg";
import brightnessGlyphUrl from "../assets/one-ui/figma/brightness.svg";
import darkGlyphUrl from "../assets/one-ui/figma/dark.svg";
import equalizerGlyphUrl from "../assets/one-ui/figma/equalizer.svg";
import infoGlyphUrl from "../assets/one-ui/figma/info.svg";
import infoOutlineGlyphUrl from "../assets/one-ui/figma/info-outline.svg";
import listFilterGlyphUrl from "../assets/one-ui/figma/list-filter.svg";
import listGlyphUrl from "../assets/one-ui/figma/list.svg";
import accountGlyphUrl from "../assets/one-ui/figma/contact.svg";
import speedGlyphUrl from "../assets/one-ui/figma/speed.svg";
import accountOutlineGlyphUrl from "../assets/one-ui/figma/contact-outline.svg";
import appsOutlineGlyphUrl from "../assets/one-ui/figma/apps-outline.svg";
import deviceOutlineGlyphUrl from "../assets/one-ui/figma/device-outline.svg";
import equalizerOutlineGlyphUrl from "../assets/one-ui/derived/equalizer-outline.svg";
import monitorFilledGlyphUrl from "../assets/one-ui/figma/sound.svg";
import channelOutlineGlyphUrl from "../assets/one-ui/derived/list-filter-outline.svg";
import packetOutlineGlyphUrl from "../assets/one-ui/derived/list-outline.svg";
import settingsFilledGlyphUrl from "../assets/one-ui/figma/settings.svg";
import speedOutlineGlyphUrl from "../assets/one-ui/derived/speed-outline.svg";

import { OneUIIconButton, OneUIStatusIndicator } from "./controls";
import { OneUIAppDock, OneUITopNavigation, OneUIUtilityToolbar, type OneUIAppDockItem } from "./navigation";
import "./shell.css";

export type ShellPage = "devices" | "live" | "studio" | "users";
export const landscapeRailQuery = "(min-width: 1260px) and (min-height: 680px) and (min-aspect-ratio: 4/3)";

function FigmaGlyph({ src, className = "one-ui-figma-glyph" }: { src: string; className?: string }) {
  return <img className={className} src={src} alt="" />;
}

function ThemeGlyph({ dark }: { dark: boolean }) {
  return <FigmaGlyph src={dark ? brightnessGlyphUrl : darkGlyphUrl} />;
}

function StatusGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? speedGlyphUrl : speedOutlineGlyphUrl} alt="" />;
}

function AccountGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? accountGlyphUrl : accountOutlineGlyphUrl} alt="" />;
}

function OverviewGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? appsGlyphUrl : appsOutlineGlyphUrl} alt="" />;
}

function GlovesGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? deviceGlyphUrl : deviceOutlineGlyphUrl} alt="" />;
}

function SignalGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? equalizerGlyphUrl : equalizerOutlineGlyphUrl} alt="" />;
}

function StatisticsGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? speedGlyphUrl : speedOutlineGlyphUrl} alt="" />;
}

function PacketGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? listGlyphUrl : packetOutlineGlyphUrl} alt="" />;
}

function ChannelGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? listFilterGlyphUrl : channelOutlineGlyphUrl} alt="" />;
}

function SettingsGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? settingsFilledGlyphUrl : settingsGlyphUrl} alt="" />;
}

function DevicesGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? deviceGlyphUrl : deviceOutlineGlyphUrl} alt="" />;
}

function MonitorGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? equalizerGlyphUrl : equalizerOutlineGlyphUrl} alt="" />;
}

function StudioGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? appsGlyphUrl : appsOutlineGlyphUrl} alt="" />;
}

function UsersGlyph({ selected = false }: { selected?: boolean }) {
  return <img className="one-ui-state-glyph" src={selected ? accountGlyphUrl : accountOutlineGlyphUrl} alt="" />;
}

function StudioSectionGlyph({ id, selected = false }: { id: string; selected?: boolean }) {
  const pair = {
    overview: [appsOutlineGlyphUrl, appsGlyphUrl],
    dataset: [folderOutlineGlyphUrl, folderGlyphUrl],
    mediapipe: [imageOutlineGlyphUrl, imageGlyphUrl],
    train: [labsOutlineGlyphUrl, labsGlyphUrl],
    evaluate: [infoOutlineGlyphUrl, infoGlyphUrl],
    translate: [soundOutlineGlyphUrl, monitorFilledGlyphUrl],
  }[id] ?? [appsOutlineGlyphUrl, appsGlyphUrl];
  return <img className="one-ui-state-glyph" src={selected ? pair[1] : pair[0]} alt="" />;
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
  const content = document.getElementById("collector-content");

  // React's controlled subpage state must commit immediately. The previous
  // View Transition snapshot path could stall on chart/table-heavy pages before
  // the first visible frame. Animate the live DOM instead so the response is
  // immediate and compositor-only, closer to Galaxy Store's horizontal paging.
  for (const animation of content?.getAnimations() ?? []) {
    if (animation.id === "context-page-enter") animation.cancel();
  }
  flushSync(update);

  if (reducedMotion || !content) return;

  const offset = direction === "forward" ? 52 : -52;
  const animation = content.animate(
    [
      { transform: `translate3d(${offset}px, 0, 0)`, opacity: 0.82 },
      { transform: "translate3d(0, 0, 0)", opacity: 1 },
    ],
    { duration: 220, easing: "cubic-bezier(.2, 0, 0, 1)", fill: "both" },
  );
  animation.id = "context-page-enter";
}

function contextItems(page: ShellPage): ContextItem[] {
  if (page === "devices") {
    return [
      { id: "overview", label: "Overview", icon: <OverviewGlyph />, selectedIcon: <OverviewGlyph selected />, target: "device-overview" },
      { id: "gloves", label: "Gloves", icon: <GlovesGlyph />, selectedIcon: <GlovesGlyph selected />, target: "device-gloves" },
      { id: "signals", label: "Signals", icon: <SignalGlyph />, selectedIcon: <SignalGlyph selected />, target: "device-signals" },
      { id: "simulator", label: "Simulator", icon: <SettingsGlyph />, selectedIcon: <SettingsGlyph selected />, target: "device-settings" },
    ];
  }
  if (page === "live") {
    return [
      { id: "overview", label: "Overview", icon: <OverviewGlyph />, selectedIcon: <OverviewGlyph selected />, target: "live-overview" },
      { id: "signals", label: "Signals", icon: <SignalGlyph />, selectedIcon: <SignalGlyph selected />, target: "live-charts" },
      { id: "statistics", label: "Statistics", icon: <StatisticsGlyph />, selectedIcon: <StatisticsGlyph selected />, target: "live-signals" },
      { id: "packets", label: "Packets", icon: <PacketGlyph />, selectedIcon: <PacketGlyph selected />, target: "live-table" },
      { id: "channels", label: "Channels", icon: <ChannelGlyph />, selectedIcon: <ChannelGlyph selected />, target: "live-channels" },
    ];
  }
  return [
    { id: "overview", label: "Overview", icon: <OverviewGlyph />, selectedIcon: <OverviewGlyph selected />, target: "users-overview" },
  ];
}

export function OneUITopAppBar({
  activity,
  hero,
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
  hero?: ReactNode;
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
  const [activeContext, setActiveContext] = useState("overview");
  const contextScrollLockUntil = useRef(0);
  const suppliedItems = contextNavigation?.items ?? contextItems(page);
  const items = page === "studio"
    ? suppliedItems.map((item) => item.icon ? item : {
        ...item,
        icon: <StudioSectionGlyph id={item.id} />,
        selectedIcon: <StudioSectionGlyph id={item.id} selected />,
      })
    : suppliedItems;
  const selectedContext = activeContext;
  const deviceStatus = simulatedDevices === totalDevices && totalDevices > 0
    ? `SIM ${connectedDevices}/${totalDevices}`
    : `Devices ${connectedDevices}/${totalDevices}`;

  useEffect(() => {
    setActiveContext(contextNavigation?.activeId ?? "overview");
  }, [page, contextNavigation?.activeId]);
  useEffect(() => {
    if (!navigationTarget?.contextId) return;
    contextScrollLockUntil.current = Date.now() + 350;
    setActiveContext(navigationTarget.contextId);
  }, [navigationTarget]);

  // Devices and Monitor use the contextual strip as a section navigator. Keep
  // its selected destination synchronized when the user scrolls manually so
  // the strip behaves like navigation rather than a set of one-shot anchors.
  useEffect(() => {
    if (contextNavigation) return;
    const content = document.getElementById("collector-content");
    const trackedItems = contextItems(page).filter((item) => item.target);
    if (!content || trackedItems.length <= 1) return;

    const tracked = trackedItems.flatMap((item) => {
      const element = item.target ? document.getElementById(item.target) : null;
      return element ? [{ id: item.id, element }] : [];
    });
    if (tracked.length <= 1) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < contextScrollLockUntil.current) return;

      const contentTop = content.getBoundingClientRect().top;
      const anchorY = contentTop + Math.min(160, Math.max(96, content.clientHeight * 0.18));
      const ordered = tracked
        .map(({ id, element }) => ({ id, top: element.getBoundingClientRect().top }))
        .sort((a, b) => a.top - b.top);

      let nextId = ordered[0]?.id;
      for (const entry of ordered) {
        if (entry.top <= anchorY) nextId = entry.id;
        else break;
      }
      if (nextId) setActiveContext((current) => current === nextId ? current : nextId);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    content.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      content.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [page, contextNavigation]);

  function activate(item: ContextItem) {
    if (item.id === selectedContext) return;
    const currentIndex = Math.max(0, items.findIndex((candidate) => candidate.id === selectedContext));
    const nextIndex = Math.max(0, items.findIndex((candidate) => candidate.id === item.id));
    const direction: ContextTransitionDirection = nextIndex >= currentIndex ? "forward" : "backward";

    runContextTransition(direction, () => {
      const content = document.getElementById("collector-content");
      setActiveContext(item.id);
      if (contextNavigation) {
        contextNavigation.onSelect(item.id);
        return;
      }

      if (!item.target) return;
      contextScrollLockUntil.current = Date.now() + 360;
      document.getElementById(item.target)?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    });
  }

  return (
    <div className="health-shell-header" data-has-hero={hero ? "true" : undefined}>
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
              icon={<StatusGlyph selected={quickStatusOpen} />}
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

      {hero ? <div className="health-shell-hero">{hero}</div> : null}

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

export function LandscapeAppRail({ page, canManageUsers, onNavigate }: { page: ShellPage; canManageUsers: boolean; onNavigate: (page: ShellPage) => void }) {
  return <CompactAppNavigation page={page} canManageUsers={canManageUsers} onNavigate={onNavigate} />;
}

export function CompactAppNavigation({ page, canManageUsers, onNavigate, onOpenAccount }: { page: ShellPage; canManageUsers: boolean; onNavigate: (page: ShellPage) => void; onOpenAccount?: () => void }) {
  const items = destinations.filter((destination) => destination.id !== "users" || canManageUsers || onOpenAccount);
  return (
    <OneUIAppDock
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
  hero,
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
  hero?: ReactNode;
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
  const initialPage = useRef(true);
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
    if (initialPage.current) {
      initialPage.current = false;
      return;
    }
    document.getElementById("page-title")?.focus();
  }, [page]);

  useEffect(() => {
    if (!navigationTarget) return;
    const target = document.getElementById(navigationTarget.id);
    if (!target) return;
    target.scrollIntoView({ behavior: "auto", block: "start" });
    // Search destinations may be non-interactive cards or channel labels.
    const hadTabIndex = target.hasAttribute("tabindex");
    if (!hadTabIndex) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    return () => { if (!hadTabIndex) target.removeAttribute("tabindex"); };
  }, [navigationTarget, page]);

  // Context destinations are sibling subpages. Switching between them must
  // preserve the current shell collapse/scroll state so the compact top bar
  // stays put, matching Galaxy Store's horizontal paging behavior.
  useEffect(() => {
    if (!contextNavigation) return;
    // Keep focus on the activated tab; do not jump focus or scroll vertically.
  }, [contextNavigation?.activeId]);

  useEffect(() => {
    const content = contentRef.current;
    const shell = shellRef.current;
    if (!content || !shell) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      // Keep collapse geometry independent from content height. On shorter
      // Account subpages, tiny viewport/content re-measures (for example when
      // hover chrome layers are composited) used to change maxScroll and make
      // the entire page appear to jump even though the user had not scrolled.
      const collapseTravel = hero ? 300 : 124;
      const progress = Math.max(0, Math.min(1, content.scrollTop / collapseTravel));
      const shellWidth = Math.max(320, shell.clientWidth);
      const gutter = shellWidth <= 640 ? 14 : shellWidth <= 900 ? 22 : 42;
      const availableWidth = Math.max(240, shellWidth - gutter * 2);
      const expandedWidth = page === "studio" ? 1400 : 1280;
      const startWidth = Math.min(expandedWidth, availableWidth);
      const endWidth = Math.min(520, availableWidth);
      const contextWidth = startWidth + (endWidth - startWidth) * progress;
      const startLeft = Math.max(gutter, (shellWidth - startWidth) / 2);
      const endLeft = gutter;
      const contextLeft = startLeft + (endLeft - startLeft) * progress;
      const compactTop = shellWidth <= 640 ? 14 : 24;
      const expandedTop = shellWidth <= 640 ? 82 : 88;
      const heroTop = shellWidth <= 640 ? 78 : 86;
      const heroExpandedHeight = shellWidth <= 640 ? 150 : 170;
      const heroCollapseEnd = 0.72;
      let contextTop = expandedTop + (compactTop - expandedTop) * progress;
      let heroHeight = 0;
      let heroOpacity = 0;

      if (hero) {
        const heroProgress = Math.min(1, progress / heroCollapseEnd);
        heroHeight = heroExpandedHeight * (1 - heroProgress);
        heroOpacity = heroHeight <= 0 ? 0 : Math.min(1, Math.max(0.22, heroHeight / heroExpandedHeight));
        if (progress <= heroCollapseEnd) {
          contextTop = heroTop + heroHeight + 14;
        } else {
          const settle = (progress - heroCollapseEnd) / (1 - heroCollapseEnd);
          const postHeroTop = heroTop + 14;
          contextTop = postHeroTop + (compactTop - postHeroTop) * settle;
        }
      }

      shell.style.setProperty("--shell-collapse-progress", progress.toFixed(4));
      shell.style.setProperty("--shell-context-width", `${contextWidth.toFixed(2)}px`);
      shell.style.setProperty("--shell-context-left", `${contextLeft.toFixed(2)}px`);
      shell.style.setProperty("--shell-context-top", `${contextTop.toFixed(2)}px`);
      const navChromeOpacity = hero
        ? Math.max(0, Math.min(1, (progress - heroCollapseEnd) / (1 - heroCollapseEnd)))
        : Math.max(0, Math.min(1, (progress - 0.45) / 0.55));

      shell.style.setProperty("--shell-hero-height", `${heroHeight.toFixed(2)}px`);
      shell.style.setProperty("--shell-hero-opacity", heroOpacity.toFixed(4));
      shell.style.setProperty("--shell-nav-chrome-opacity", navChromeOpacity.toFixed(4));
      if (progress >= 0.94) shell.dataset.shellCompact = "true";
      else delete shell.dataset.shellCompact;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    content.addEventListener("scroll", onScroll, { passive: true });
    // Do not observe the scroll content itself: hover/compositing changes in
    // Chromium/PyWebView can generate harmless content re-measures that must
    // not drive shell collapse. Recompute only when the window really resizes.
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      content.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [page, hero]);

  return (
    <div ref={shellRef} className="app-shell health-app-shell" data-page={page} data-navigation="bottom" data-has-hero={hero ? "true" : undefined}>
      <a className="skip-link" href="#collector-content">Skip navigation</a>
      <OneUITopAppBar
        activity={activity}
        hero={hero}
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
      <main id="collector-content" ref={contentRef} className="app-content health-app-content">
        {children}
      </main>
      <CompactAppNavigation page={page} canManageUsers={canManageUsers} onNavigate={onNavigate} onOpenAccount={onToggleAccount} />
    </div>
  );
}
