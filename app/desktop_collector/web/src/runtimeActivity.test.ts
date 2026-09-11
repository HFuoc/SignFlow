import { describe, expect, it } from "vitest";

import {
  MAX_RUNTIME_ACTIVITIES,
  collectorAudiences,
  initialRuntimeActivityState,
  notificationsForRole,
  runtimeActivityReducer,
  unreadActivityCount,
  type RuntimeActivityInput,
  type RuntimeActivityState,
} from "./runtimeActivity";

function event(key: string, overrides: Partial<RuntimeActivityInput> = {}): RuntimeActivityInput {
  return {
    key,
    kind: "device",
    surface: "center",
    severity: "success",
    title: "Đã cập nhật thiết bị",
    message: "Trạng thái thiết bị đã được xác nhận.",
    audiences: collectorAudiences,
    active: false,
    dismissible: true,
    ...overrides,
  };
}

function upsert(state: RuntimeActivityState, input: RuntimeActivityInput, now: number): RuntimeActivityState {
  return runtimeActivityReducer(state, { type: "upsert", input, now });
}

describe("runtime activity reducer", () => {
  it("deduplicates by key without repeatedly incrementing unread state", () => {
    let state = upsert(initialRuntimeActivityState, event("packet-loss"), 1);
    state = runtimeActivityReducer(state, { type: "mark-read", id: state.items[0].id });
    state = upsert(state, event("packet-loss", { message: "Tổng cộng 4 gói bị mất." }), 2);

    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ message: "Tổng cộng 4 gói bị mất.", unread: false });

    state = upsert(state, event("packet-loss", { markUnread: "always", severity: "error" }), 3);
    expect(state.items[0].unread).toBe(true);
  });

  it("keeps active items from dismiss and clears only resolved read items", () => {
    let state = upsert(initialRuntimeActivityState, event("bridge", {
      active: true,
      dismissible: false,
      severity: "error",
      surface: "both",
    }), 1);
    state = runtimeActivityReducer(state, { type: "dismiss", id: state.items[0].id });
    expect(state.items).toHaveLength(1);

    state = runtimeActivityReducer(state, { type: "mark-all-read", role: "researcher" });
    state = runtimeActivityReducer(state, { type: "clear-read", role: "researcher" });
    expect(state.items).toHaveLength(1);

    state = runtimeActivityReducer(state, { type: "resolve", key: "bridge" });
    state = runtimeActivityReducer(state, { type: "clear-read", role: "researcher" });
    expect(state.items).toHaveLength(0);
  });

  it("enforces audiences for unread counts and clear actions", () => {
    let state = upsert(initialRuntimeActivityState, event("collector"), 1);
    state = upsert(state, event("admin", { audiences: ["administrator"], kind: "admin" }), 2);

    expect(unreadActivityCount(state, "researcher")).toBe(1);
    expect(unreadActivityCount(state, "administrator")).toBe(2);
    expect(notificationsForRole(state, "participant")).toHaveLength(0);

    state = runtimeActivityReducer(state, { type: "mark-all-read", role: "researcher" });
    expect(state.items.find((item) => item.key === "admin")?.unread).toBe(true);
  });

  it("caps the RAM-only list at fifty items and resets it as one session unit", () => {
    let state = initialRuntimeActivityState;
    for (let index = 0; index < MAX_RUNTIME_ACTIVITIES + 7; index += 1) {
      state = upsert(state, event(`event-${index}`), index);
    }
    expect(state.items).toHaveLength(MAX_RUNTIME_ACTIVITIES);
    expect(state.items.some((item) => item.key === "event-56")).toBe(true);
    expect(runtimeActivityReducer(state, { type: "reset" })).toEqual(initialRuntimeActivityState);
  });

  it("never stores Now-Bar-only activity as unread notification history", () => {
    const state = upsert(initialRuntimeActivityState, event("chart-paused", {
      active: true,
      dismissible: false,
      surface: "now",
      severity: "warning",
    }), 1);
    expect(state.items[0].unread).toBe(false);
    expect(notificationsForRole(state, "developer")).toHaveLength(0);
  });
});

