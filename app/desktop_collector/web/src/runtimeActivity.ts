import type { SimulationConfig, UserRole } from "./api";
import type { LocalTelemetryMarker } from "./telemetryNowBar";

export type RuntimeActivitySurface = "now" | "center" | "both";
export type RuntimeActivitySeverity = "info" | "success" | "warning" | "error";
export type RuntimeActivityKind =
  | "bridge"
  | "device"
  | "resync"
  | "packet-loss"
  | "simulator"
  | "admin"
  | "marker";

export type RuntimeActivityCommand =
  | { kind: "navigate"; page: "devices" | "live" | "users" }
  | { kind: "pause-chart" }
  | { kind: "resume-chart" }
  | { kind: "open-status" }
  | { kind: "reconnect-bridge" }
  | { kind: "retry-device"; connect: boolean; deviceId: string; deviceName: string }
  | { kind: "retry-all-devices"; connect: boolean }
  | { kind: "retry-simulator"; config: SimulationConfig }
  | { kind: "resync"; deviceId: string };

export interface RuntimeActivityInput {
  marker?: LocalTelemetryMarker;
  key: string;
  kind: RuntimeActivityKind;
  surface: RuntimeActivitySurface;
  severity: RuntimeActivitySeverity;
  title: string;
  message: string;
  audiences: UserRole[];
  active: boolean;
  dismissible: boolean;
  actionLabel?: string;
  command?: RuntimeActivityCommand;
  announcedBySnackbar?: boolean;
  markUnread?: "always" | "new-only" | "never";
}

export interface RuntimeActivityItem extends RuntimeActivityInput {
  id: number;
  createdAt: number;
  updatedAt: number;
  unread: boolean;
}

export interface RuntimeActivityState {
  items: RuntimeActivityItem[];
  nextId: number;
}

export type RuntimeActivityAction =
  | { type: "upsert"; input: RuntimeActivityInput; now?: number }
  | { type: "mark-read"; id: number }
  | { type: "mark-all-read"; role: UserRole }
  | { type: "resolve"; key: string }
  | { type: "dismiss"; id: number }
  | { type: "clear-read"; role: UserRole }
  | { type: "reset" };

export const MAX_RUNTIME_ACTIVITIES = 50;
export const collectorAudiences: UserRole[] = ["researcher", "administrator", "developer"];
export const initialRuntimeActivityState: RuntimeActivityState = { items: [], nextId: 1 };

function includesCenter(surface: RuntimeActivitySurface): boolean {
  return surface === "center" || surface === "both";
}

export function activityVisibleTo(item: RuntimeActivityItem, role: UserRole): boolean {
  return item.audiences.includes(role);
}

function retainWithinLimit(items: RuntimeActivityItem[]): RuntimeActivityItem[] {
  if (items.length <= MAX_RUNTIME_ACTIVITIES) return items;
  return [...items]
    .sort((left, right) => Number(right.active) - Number(left.active) || right.updatedAt - left.updatedAt)
    .slice(0, MAX_RUNTIME_ACTIVITIES);
}

export function runtimeActivityReducer(
  state: RuntimeActivityState,
  action: RuntimeActivityAction,
): RuntimeActivityState {
  switch (action.type) {
    case "upsert": {
      const now = action.now ?? Date.now();
      const existing = state.items.find((item) => item.key === action.input.key);
      const unreadMode = action.input.markUnread ?? "new-only";
      const canBeUnread = includesCenter(action.input.surface);
      const unread = !canBeUnread
        ? false
        : unreadMode === "always"
          ? true
          : unreadMode === "never"
            ? existing?.unread ?? false
            : existing?.unread ?? true;
      const item: RuntimeActivityItem = {
        ...existing,
        ...action.input,
        id: existing?.id ?? state.nextId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        unread,
      };
      const items = retainWithinLimit([item, ...state.items.filter((candidate) => candidate.key !== item.key)]);
      return { items, nextId: existing ? state.nextId : state.nextId + 1 };
    }
    case "mark-read":
      return {
        ...state,
        items: state.items.map((item) => item.id === action.id ? { ...item, unread: false } : item),
      };
    case "mark-all-read":
      return {
        ...state,
        items: state.items.map((item) => activityVisibleTo(item, action.role) ? { ...item, unread: false } : item),
      };
    case "resolve":
      return {
        ...state,
        items: state.items.map((item) => item.key === action.key
          ? { ...item, active: false, dismissible: true, surface: item.surface === "now" ? "center" : item.surface }
          : item),
      };
    case "dismiss":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id || item.active || !item.dismissible),
      };
    case "clear-read":
      return {
        ...state,
        items: state.items.filter((item) => (
          !activityVisibleTo(item, action.role) || item.active || item.unread
        )),
      };
    case "reset":
      return initialRuntimeActivityState;
    default:
      return state;
  }
}

export function notificationsForRole(
  state: RuntimeActivityState,
  role: UserRole,
): RuntimeActivityItem[] {
  return state.items
    .filter((item) => activityVisibleTo(item, role) && includesCenter(item.surface))
    .sort((left, right) => (
      Number(right.active) - Number(left.active)
      || Number(right.unread) - Number(left.unread)
      || right.updatedAt - left.updatedAt
    ));
}

export function unreadActivityCount(state: RuntimeActivityState, role: UserRole): number {
  return notificationsForRole(state, role).filter((item) => item.unread).length;
}

export function severityPriority(severity: RuntimeActivitySeverity): number {
  return { error: 50, warning: 40, info: 20, success: 10 }[severity];
}

export function nowActivityPriority(item: RuntimeActivityItem): number {
  const kindPriority: Record<RuntimeActivityKind, number> = {
    bridge: 500,
    resync: 400,
    device: 300,
    "packet-loss": 200,
    simulator: 100,
    admin: 50,
    marker: 25,
  };
  return severityPriority(item.severity) * 1_000 + kindPriority[item.kind];
}
