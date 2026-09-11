import type { CollectorState } from "./store";

export type SearchTarget =
  | { kind: "navigate"; page: "devices" | "live" | "studio" | "users"; section?: string; targetId?: string }
  | { kind: "action"; action: "theme" | "quick-status" | "account" };

export type SearchCategory =
  | "places" | "devices" | "channels" | "actions"
  | "datasets" | "gestures" | "runs" | "models";

export interface SearchEntry {
  id: string;
  category: SearchCategory;
  title: string;
  description: string;
  keywords?: readonly string[];
  target: SearchTarget;
}

export const searchCategories: ReadonlyArray<{
  id: SearchCategory;
  label: string;
  emptyDescription: string;
}> = [
  { id: "places", label: "App sections", emptyDescription: "No app sections are available." },
  { id: "devices", label: "Devices & gloves", emptyDescription: "No devices are currently available in the collector." },
  { id: "channels", label: "Sensor channels", emptyDescription: "Channel definitions will appear when the collector is ready." },
  { id: "actions", label: "Actions & settings", emptyDescription: "No application actions are available." },
  { id: "datasets", label: "Datasets", emptyDescription: "No datasets are available. Dataset import is not connected yet." },
  { id: "gestures", label: "Gesture labels", emptyDescription: "No gesture labels are available in the current workspace." },
  { id: "runs", label: "Training runs", emptyDescription: "There are no training runs. Training is not connected yet." },
  { id: "models", label: "Models", emptyDescription: "No model artifacts are available in the current workspace." },
];

const places: readonly SearchEntry[] = [
  { id: "place-devices", category: "places", title: "Devices", description: "Device Manager · Overview", keywords: ["hardware", "connection"], target: { kind: "navigate", page: "devices", section: "overview", targetId: "device-overview" } },
  { id: "place-gloves", category: "places", title: "Gloves", description: "Devices · Left and right gloves", target: { kind: "navigate", page: "devices", section: "gloves", targetId: "device-gloves" } },
  { id: "place-device-signals", category: "places", title: "Sensor overview", description: "Devices · Signals", keywords: ["flex", "sensors"], target: { kind: "navigate", page: "devices", section: "signals", targetId: "device-signals" } },
  { id: "place-simulator", category: "places", title: "Simulator settings", description: "Devices · Sample rate, noise and packet loss", keywords: ["simulation", "seed"], target: { kind: "navigate", page: "devices", section: "simulator", targetId: "device-settings" } },
  { id: "place-monitor", category: "places", title: "Live Monitor", description: "Monitor · Sensor charts", keywords: ["signals", "chart", "telemetry"], target: { kind: "navigate", page: "live", section: "signals", targetId: "live-charts" } },
  { id: "place-statistics", category: "places", title: "Acquisition statistics", description: "Monitor · Sample rate and packet loss", target: { kind: "navigate", page: "live", section: "statistics", targetId: "live-signals" } },
  { id: "place-raw-values", category: "places", title: "Raw values & quality", description: "Monitor · Latest packet values", keywords: ["packets", "raw data"], target: { kind: "navigate", page: "live", section: "packets", targetId: "live-table" } },
  { id: "place-channels", category: "places", title: "Raw signals", description: "Monitor · Channel selection", keywords: ["channels", "display"], target: { kind: "navigate", page: "live", section: "channels", targetId: "live-channels" } },
  { id: "place-studio", category: "places", title: "Studio", description: "Studio · Workflow overview", keywords: ["readiness"], target: { kind: "navigate", page: "studio", section: "overview" } },
  { id: "place-dataset", category: "places", title: "Dataset", description: "Studio · Dataset readiness and import", keywords: ["datasets", "samples", "gestures", "provenance"], target: { kind: "navigate", page: "studio", section: "dataset" } },
  { id: "place-mediapipe", category: "places", title: "MediaPipe", description: "Studio · Camera and hand tracking readiness", keywords: ["camera", "landmarks", "recording"], target: { kind: "navigate", page: "studio", section: "mediapipe" } },
  { id: "place-train", category: "places", title: "Train", description: "Studio · Training configuration", keywords: ["training", "model", "features", "fusion"], target: { kind: "navigate", page: "studio", section: "train" } },
  { id: "place-evaluate", category: "places", title: "Evaluate", description: "Studio · Evaluation readiness", keywords: ["evaluation", "accuracy", "confusion matrix", "metrics"], target: { kind: "navigate", page: "studio", section: "evaluate" } },
  { id: "place-translate", category: "places", title: "Translate", description: "Studio · Translation readiness", keywords: ["translation", "inference", "speech", "sentence"], target: { kind: "navigate", page: "studio", section: "translate" } },
];

const actions: readonly SearchEntry[] = [
  { id: "action-theme", category: "actions", title: "Switch theme", description: "Change between light and dark mode", keywords: ["appearance", "settings", "brightness"], target: { kind: "action", action: "theme" } },
  { id: "action-status", category: "actions", title: "Quick Status", description: "View bridge and device connection status", keywords: ["runtime", "activity", "notifications"], target: { kind: "action", action: "quick-status" } },
  { id: "action-account", category: "actions", title: "Account", description: "Open your account", keywords: ["profile", "password", "settings"], target: { kind: "action", action: "account" } },
];

const channelGroups = { flex: "Flex", fsr: "Force", accel: "Accelerometer", gyro: "Gyroscope", distance: "Distance" } as const;
const deviceStates = { connected: "Connected", connecting: "Connecting", disconnected: "Disconnected", error: "Connection error" } as const;

/** Pure frontend index. Future services can contribute actual records without UI dependencies. */
export function buildSearchIndex(
  state: Pick<CollectorState, "devices" | "channels">,
  canManageUsers: boolean,
  additionalEntries: readonly SearchEntry[] = [],
): SearchEntry[] {
  const entries: SearchEntry[] = [
    ...places,
    ...state.devices.map((device): SearchEntry => ({
      id: `device:${device.device_id}`,
      category: "devices",
      title: device.display_name,
      description: `${device.hand === "left" ? "Left" : "Right"} glove · ${device.simulated ? "Simulated" : device.source_kind} · ${deviceStates[device.state]}`,
      keywords: [device.device_id, device.hand, device.hand_label, device.source_kind, "glove"],
      target: { kind: "navigate", page: "devices", section: "gloves", targetId: `device-${device.hand}` },
    })),
    ...state.channels.map((channel): SearchEntry => ({
      id: `channel:${channel.id}`,
      category: "channels",
      title: channel.label,
      description: `${channelGroups[channel.group]}${channel.unit ? ` · ${channel.unit}` : ""} · Monitor channel controls`,
      keywords: [channel.id, channel.group, "sensor", "signal"],
      target: { kind: "navigate", page: "live", section: "channels", targetId: "live-channels" },
    })),
    ...actions,
  ];
  if (canManageUsers) {
    entries.push({ id: "place-users", category: "places", title: "User management", description: "Account · Manage local users", keywords: ["administration", "roles"], target: { kind: "navigate", page: "users", section: "overview", targetId: "users-overview" } });
  }
  return [...new Map([...entries, ...additionalEntries].map((entry) => [entry.id, entry])).values()];
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function searchIndex(entries: readonly SearchEntry[], query: string, category: SearchCategory | "all" = "all"): SearchEntry[] {
  const normalized = normalize(query);
  const words = normalized.split(/\s+/).filter(Boolean);
  return entries
    .filter((entry) => category === "all" || entry.category === category)
    .map((entry) => {
      const title = normalize(entry.title);
      const searchable = normalize([entry.title, entry.description, ...(entry.keywords ?? [])].join(" "));
      const score = title === normalized ? 3 : title.startsWith(normalized) ? 2 : title.includes(normalized) ? 1 : 0;
      return { entry, searchable, score };
    })
    .filter(({ searchable }) => words.every((word) => searchable.includes(word)))
    .sort((left, right) => right.score - left.score)
    .map(({ entry }) => entry);
}
