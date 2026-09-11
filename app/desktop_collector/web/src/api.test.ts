import { afterEach, describe, expect, it, vi } from "vitest";

import { BridgeClient, BridgeRequestError, userFacingBridgeError } from "./api";

const origin = "http://127.0.0.1:49152";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BridgeClient authentication boundary", () => {
  it("keeps bridge authentication in a header and includes the HttpOnly session cookie mode", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      setup_required: false,
      authenticated: false,
      user: null,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new BridgeClient({ apiOrigin: origin, token: "bridge-memory-token" });
    await client.authStatus();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${origin}/api/v1/auth/status`);
    expect(url).not.toContain("bridge-memory-token");
    expect(init.credentials).toBe("include");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer bridge-memory-token");
  });

  it("discards hostile response details and announces only an invalidated user session", async () => {
    const secret = "Bearer leaked-token C:\\private\\trace.py";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: secret, stack: secret, code: "session_invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: secret, code: "permission_denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new BridgeClient({ apiOrigin: origin, token: "bridge-memory-token" });
    const invalidated = vi.fn();
    client.onAuthInvalidated(invalidated);

    let firstFailure: unknown;
    try { await client.authStatus(); } catch (error) { firstFailure = error; }
    expect(firstFailure).toBeInstanceOf(BridgeRequestError);
    expect(userFacingBridgeError(firstFailure)).not.toContain(secret);
    expect(JSON.stringify(firstFailure)).not.toContain(secret);
    expect(invalidated).toHaveBeenCalledOnce();

    await expect(client.listUsers()).rejects.toMatchObject({ code: "permission_denied", status: 403 });
    expect(invalidated).toHaveBeenCalledOnce();
  });
});
