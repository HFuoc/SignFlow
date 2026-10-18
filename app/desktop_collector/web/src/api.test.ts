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


describe("Recognition API boundary", () => {
  it("fetches reference media with header authentication, cookies and cancellation, without a token URL", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{"references":[]}'))
      .mockResolvedValueOnce(new Response(new Uint8Array([26, 69, 223, 163]), { headers: { "Content-Type": "video/webm" } }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new BridgeClient({ apiOrigin: origin, token: "reference-memory-token" });
    const abort = new AbortController();
    await client.recognitionReferences(abort.signal);
    const blob = await client.recognitionReferenceMedia("visign25-00", abort.signal);
    expect(blob.type).toBe("video/webm");
    expect(blob.size).toBe(4);
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0][0]).toBe(`${origin}/api/v1/recognition/references?provider_id=visign-ridge-25`);
    expect(calls[1][0]).toBe(`${origin}/api/v1/recognition/references/visign25-00/media`);
    expect(calls[1][1].cache).toBe("no-store");
    for (const [url, init] of calls) {
      expect(url).not.toContain("reference-memory-token");
      expect(init.credentials).toBe("include");
      expect(init.signal).toBe(abort.signal);
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer reference-memory-token");
    }
  });

  it("rejects invalid reference payloads and sanitizes expired sessions through the same auth boundary", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("not video", { headers: { "Content-Type": "text/html" } }))
      .mockResolvedValueOnce(new Response(null, { headers: { "Content-Type": "video/webm" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "session_invalid", detail: "private-path-or-token" }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new BridgeClient({ apiOrigin: origin, token: "reference-memory-token" });
    const invalidated = vi.fn();
    client.onAuthInvalidated(invalidated);
    await expect(client.recognitionReferenceMedia("visign25-00")).rejects.toMatchObject({ code: "reference_unavailable" });
    await expect(client.recognitionReferenceMedia("visign25-00")).rejects.toMatchObject({ code: "reference_unavailable" });
    await expect(client.recognitionReferenceMedia("visign25-00")).rejects.toMatchObject({ code: "session_invalid", message: "The sign-in session is no longer valid." });
    expect(invalidated).toHaveBeenCalledOnce();
  });

  it("sends only IDs, authenticates cancellation and supports abortable polling", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", {status:200}));
    vi.stubGlobal("fetch", fetchMock);
    const client = new BridgeClient({apiOrigin:origin, token:"memory-only"});
    const controller = new AbortController();
    await client.recognitionModels(controller.signal);
    await client.recognitionSamples(controller.signal);
    await client.recognitionJobs(controller.signal);
    await client.submitRecognition("kvsl:do_vat:W00395", "kvsl-gcn-do-vat");
    await client.recognitionJob("opaque-id", controller.signal);
    await client.cancelRecognition("opaque-id");
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(JSON.parse(calls[3][1].body as string)).toEqual({sample_id:"kvsl:do_vat:W00395",provider_id:"kvsl-gcn-do-vat"});
    expect(calls[4][1].signal).toBe(controller.signal);
    expect(calls[5][1].method).toBe("DELETE");
    for(const [url, init] of calls) {
      expect(url).not.toContain("memory-only");
      expect(init.credentials).toBe("include");
      expect((init.headers as Record<string,string>).Authorization).toBe("Bearer memory-only");
    }
  });
});
