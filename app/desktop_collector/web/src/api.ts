export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
export type Hand = "left" | "right";
export type UserRole = "participant" | "researcher" | "administrator" | "developer";

export interface AuthUser {
  id: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AuthStatus {
  setup_required: boolean;
  authenticated: boolean;
  user: AuthUser | null;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  outcome: "success" | "failure" | "denied";
  occurred_at: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface ChannelDefinition {
  id: string;
  label: string;
  unit: string;
  group: "flex" | "fsr" | "accel" | "gyro" | "distance";
}

export interface DeviceDescriptor {
  device_id: string;
  display_name: string;
  hand: Hand;
  hand_label: "L" | "R";
  source_kind: string;
  nominal_sample_rate_hz: number;
  simulated: boolean;
  state: ConnectionState;
  capabilities: {
    flex_channels: boolean[];
    fsr: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
    distance: boolean;
  };
}

export interface SimulationConfig {
  seed: number;
  sample_rate_hz: number;
  noise_std: number;
  packet_loss_rate: number;
}

export interface BootstrapPayload {
  bridge_schema_version: string;
  display_fps: number;
  display_fps_limits: [number, number];
  channels: ChannelDefinition[];
  devices: DeviceDescriptor[];
  simulation: SimulationConfig;
}

export interface DeviceStatistics {
  device_id: string;
  received_packets: number;
  lost_packets: number;
  sample_rate_hz: number;
  packet_loss_percent: number;
  last_packet_host_ns: string | null;
  channel_stddev: Record<string, number | null>;
  channel_peak_to_peak: Record<string, number | null>;
}

export interface PacketBlock {
  device_id: string;
  sequence_numbers: number[];
  device_timestamp_ms: number[];
  host_timestamp_ns: string[];
  status_flags: number[];
  quality_flags: number[];
  simulated: boolean[];
  values: Record<string, Array<number | null>>;
}

export type BridgeMessage =
  | ({ type: "hello" } & BootstrapPayload)
  | {
      type: "telemetry_batch";
      bridge_schema_version: string;
      batch_sequence: number;
      sent_host_ns: string;
      devices: PacketBlock[];
    }
  | { type: "statistics"; devices: DeviceStatistics[] }
  | { type: "device_state"; device_id: string; state: ConnectionState }
  | { type: "resync_required"; device_id: string; reason: string }
  | { type: "pong" };

export interface TelemetrySnapshot {
  type: "telemetry_snapshot";
  bridge_schema_version: string;
  window_seconds: number;
  devices: PacketBlock[];
}

interface LaunchCredentials {
  apiOrigin: string;
  token: string;
}

export const bridgeUnavailableMessage = "The data connection is temporarily unavailable.";

export class BridgeRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "bridge_error", status = 0) {
    super(message);
    this.name = "BridgeRequestError";
    this.code = code;
    this.status = status;
  }
}

export function userFacingBridgeError(error: unknown): string {
  return error instanceof BridgeRequestError ? error.message : bridgeUnavailableMessage;
}

function isLoopbackOrigin(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" && parsed.hostname === "127.0.0.1" && !!parsed.port;
  } catch {
    return false;
  }
}

export function consumeLaunchCredentials(location: Location = window.location): LaunchCredentials {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const apiOrigin = params.get("api") ?? "";
  const token = params.get("token") ?? "";
  window.history.replaceState(null, "", `${location.pathname}${location.search}`);
  if (!isLoopbackOrigin(apiOrigin) || !token) {
    throw new Error("The desktop session is invalid. Open the application from the PyWebView shell.");
  }
  return { apiOrigin, token };
}

export class BridgeClient {
  readonly apiOrigin: string;
  private token: string;
  private socket: WebSocket | null = null;
  private authInvalidatedListeners = new Set<() => void>();

  constructor(credentials: LaunchCredentials) {
    this.apiOrigin = credentials.apiOrigin;
    this.token = credentials.token;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.apiOrigin}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!response.ok) {
      let code = "request_failed";
      try {
        const body = await response.json() as { code?: unknown };
        if (typeof body.code === "string") code = body.code;
      } catch {
        // Raw server bodies are deliberately discarded.
      }
      const authMessages: Record<string, string> = {
        invalid_credentials: "The username or password is incorrect.",
        password_change_required: "You must change your password before continuing.",
        password_mismatch: "The passwords do not match.",
        password_too_short: "Password must contain at least 12 characters.",
        password_too_long: "The password exceeds the allowed length.",
        current_password_invalid: "The current password is incorrect.",
        invalid_username: "The username is invalid.",
        invalid_display_name: "The display name is invalid.",
        invalid_role: "The role is invalid.",
        username_conflict: "That username is already in use.",
        setup_unavailable: "First-time setup is no longer available.",
        protected_or_missing_user: "The last active administrator cannot be changed.",
        missing_user: "The account could not be found.",
        permission_denied: "You do not have permission to perform this action.",
        session_invalid: "The sign-in session is no longer valid.",
        invalid_request: "The request data is invalid.",
      };
      const message = authMessages[code]
        ?? (response.status >= 500
          ? bridgeUnavailableMessage
          : response.status === 401 || response.status === 403
            ? "The connection session is no longer valid."
            : "The request could not be completed.");
      if (code === "session_invalid") {
        this.authInvalidatedListeners.forEach((listener) => listener());
      }
      throw new BridgeRequestError(message, code, response.status);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  authStatus(): Promise<AuthStatus> {
    return this.request("/api/v1/auth/status");
  }

  onAuthInvalidated(listener: () => void): () => void {
    this.authInvalidatedListeners.add(listener);
    return () => this.authInvalidatedListeners.delete(listener);
  }

  setupAdministrator(input: {
    username: string;
    display_name: string | null;
    password: string;
    password_confirmation: string;
  }): Promise<AuthStatus> {
    return this.request("/api/v1/auth/setup", { method: "POST", body: JSON.stringify(input) });
  }

  login(username: string, password: string): Promise<AuthStatus> {
    return this.request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  logout(): Promise<{ authenticated: false }> {
    this.closeTelemetry();
    return this.request("/api/v1/auth/logout", { method: "POST" });
  }

  changePassword(input: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<AuthStatus> {
    return this.request("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listUsers(): Promise<{ users: AuthUser[] }> {
    return this.request("/api/v1/admin/users");
  }

  createUser(input: {
    username: string;
    display_name: string | null;
    password: string;
    role: UserRole;
  }): Promise<{ user: AuthUser }> {
    return this.request("/api/v1/admin/users", { method: "POST", body: JSON.stringify(input) });
  }

  updateUser(userId: string, input: {
    display_name: string | null;
    role: UserRole;
    is_active: boolean;
  }): Promise<{ user: AuthUser }> {
    return this.request(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  resetUserPassword(userId: string, temporaryPassword: string): Promise<{ user: AuthUser }> {
    return this.request(`/api/v1/admin/users/${encodeURIComponent(userId)}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ temporary_password: temporaryPassword }),
    });
  }

  revokeUserSessions(userId: string): Promise<{ revoked_sessions: number }> {
    return this.request(`/api/v1/admin/users/${encodeURIComponent(userId)}/revoke-sessions`, {
      method: "POST",
    });
  }

  listAuditEvents(): Promise<{ events: AuditEvent[] }> {
    return this.request("/api/v1/admin/audit-events?limit=100");
  }

  bootstrap(): Promise<BootstrapPayload> {
    return this.request("/api/v1/bootstrap");
  }

  setConnected(deviceId: string, connect: boolean): Promise<{ device_id: string; state: ConnectionState }> {
    const action = connect ? "connect" : "disconnect";
    return this.request(`/api/v1/devices/${encodeURIComponent(deviceId)}/${action}`, {
      method: "POST",
    });
  }

  configureSimulator(config: SimulationConfig): Promise<SimulationConfig> {
    return this.request("/api/v1/simulator/config", {
      method: "PUT",
      body: JSON.stringify(config),
    });
  }

  snapshot(windowSeconds = 60): Promise<TelemetrySnapshot> {
    return this.request(`/api/v1/telemetry/snapshot?window_seconds=${windowSeconds}`);
  }

  openTelemetry(
    onMessage: (message: BridgeMessage) => void,
    onStatus: (status: "connecting" | "open" | "closed" | "error") => void,
  ): () => void {
    this.closeTelemetry();
    const socketUrl = new URL("/ws/v1/telemetry", this.apiOrigin);
    socketUrl.protocol = "ws:";
    const socket = new WebSocket(socketUrl);
    this.socket = socket;
    onStatus("connecting");
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "authenticate", token: this.token }));
      onStatus("open");
    });
    socket.addEventListener("message", (event) => {
      try {
        onMessage(JSON.parse(String(event.data)) as BridgeMessage);
      } catch {
        onStatus("error");
      }
    });
    socket.addEventListener("error", () => onStatus("error"));
    socket.addEventListener("close", (event) => {
      onStatus("closed");
      if (event.code === 4401 || event.code === 4403) {
        this.authInvalidatedListeners.forEach((listener) => listener());
      }
    });
    return () => {
      if (this.socket === socket) {
        this.closeTelemetry();
      }
    };
  }

  setDisplayFps(displayFps: number): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "stream_config", display_fps: displayFps }));
    }
  }

  closeTelemetry(): void {
    this.socket?.close(1000, "collector closed");
    this.socket = null;
  }

  dispose(): void {
    this.closeTelemetry();
    this.authInvalidatedListeners.clear();
    this.token = "";
  }
}
