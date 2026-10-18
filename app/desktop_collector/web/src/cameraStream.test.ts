import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CameraStream } from "./cameraStream";
import { BridgeClient } from "./api";

class Socket extends EventTarget {
  static OPEN = 1;
  readyState = 1;
  bufferedAmount = 0;
  send = vi.fn();
  close = vi.fn(() => { this.readyState = 3; });
  constructor(public url = "") { super(); }
  message(value: unknown) { this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(value) })); }
}
const ready = { type: "ready", protocol: "smartglove-recognition-stream-v1", max_fps: 15, max_frame_bytes: 8 * 1024 * 1024 };

describe("bounded live frame sender", () => {
  let socket: Socket;
  let video: HTMLVideoElement;
  let encode: BlobCallback;
  let canvas: { width: number; height: number; getContext: ReturnType<typeof vi.fn>; toBlob: ReturnType<typeof vi.fn> };
  let draw: ReturnType<typeof vi.fn>;
  let state: ReturnType<typeof vi.fn>, result: ReturnType<typeof vi.fn>, error: ReturnType<typeof vi.fn>;
  let stream: CameraStream;
  beforeEach(() => {
    vi.useFakeTimers();
    const epoch = Date.now(); vi.spyOn(performance, "now").mockImplementation(() => Date.now() - epoch);
    vi.stubGlobal("WebSocket", Socket);
    socket = new Socket(); draw = vi.fn();
    canvas = { width: 0, height: 0, getContext: vi.fn(() => ({ drawImage: draw })), toBlob: vi.fn(callback => { encode = callback; }) };
    vi.stubGlobal("document", { createElement: vi.fn(() => canvas) });
    video = { readyState: 2, currentTime: 1, videoWidth: 1280, videoHeight: 720 } as HTMLVideoElement;
    state = vi.fn(); result = vi.fn(); error = vi.fn();
    stream = new CameraStream(socket as unknown as WebSocket, video, state, result, error);
  });
  afterEach(() => { stream.stop(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
  const advance = (ms = 0) => vi.advanceTimersByTimeAsync(ms);
  async function sendFirst() { socket.message(ready); await advance(); encode(new Blob(["PNG"], { type: "image/png" })); }
  async function header() {
    const buffer = await new Blob([socket.send.mock.calls.at(-1)![0]]).arrayBuffer();
    const length = new DataView(buffer).getUint32(0, false);
    return { data: JSON.parse(new TextDecoder().decode(buffer.slice(4, 4 + length))), png: new TextDecoder().decode(buffer.slice(4 + length)) };
  }
  async function ack() {
    const { data } = await header();
    socket.message({ ...data, state: "moving", phase: null, segment_id: 1, prediction: null, quality: {} });
  }
  it("waits for worker readiness, preserves full pixels, and never queues during encode or inference", async () => {
    await advance(10000); expect(canvas.toBlob).not.toHaveBeenCalled();
    socket.message(ready); await advance();
    expect(draw).toHaveBeenCalledWith(video, 0, 0, 1280, 720);
    expect(canvas.toBlob.mock.calls[0][1]).toBe("image/png");
    await advance(1000); expect(canvas.toBlob).toHaveBeenCalledOnce();
    encode(new Blob(["PNG"]));
    expect((await header()).png).toBe("PNG");
    expect((await header()).data).toEqual({ type: "frame", sequence: 0, timestamp_ms: 10000 });
    video.currentTime = 2; await advance(1000); expect(socket.send).toHaveBeenCalledOnce();
    await ack(); await advance(); expect(canvas.toBlob).toHaveBeenCalledTimes(2);
    expect(result).toHaveBeenCalledOnce();
  });
  it("limits fresh frames to negotiated fps even when worker replies immediately", async () => {
    await sendFirst(); video.currentTime = 2; await ack(); await advance(60);
    expect(canvas.toBlob).toHaveBeenCalledOnce(); await advance(10); expect(canvas.toBlob).toHaveBeenCalledTimes(2);
  });
  it("sends manual finish once on the next fresh frame, tied to the observed segment", async () => {
    expect(stream.finishSign()).toBe(false);
    socket.message({ ...ready, manual_finish: true }); await advance(); encode(new Blob(["PNG"]));
    expect(stream.finishSign()).toBe(false); // No active segment yet.
    await ack();
    expect(stream.finishSign()).toBe(true); expect(stream.finishSign()).toBe(false);
    video.currentTime = 2; await advance(70); encode(new Blob(["PNG"]));
    expect((await header()).data.finish_segment).toBe(1);
    const { data } = await header();
    socket.message({ ...data, state: "ready", phase: "final", segment_id: 1, prediction: null, quality: {} });
    expect(stream.finishSign()).toBe(false);
    video.currentTime = 3; await advance(70); encode(new Blob(["PNG"]));
    expect((await header()).data.finish_segment).toBeUndefined();
  });
  it("discards a queued finish if the in-flight frame already ended that segment", async () => {
    socket.message({ ...ready, manual_finish: true }); await advance(); encode(new Blob(["PNG"]));
    await ack(); video.currentTime = 2; await advance(70); encode(new Blob(["PNG"]));
    expect(stream.finishSign()).toBe(true);
    const { data } = await header();
    socket.message({ ...data, state: "ready", phase: "final", segment_id: 1, prediction: null, quality: {} });
    video.currentTime = 3; await advance(70); encode(new Blob(["PNG"]));
    expect((await header()).data.finish_segment).toBeUndefined();
  });
  it("does not send manual boundaries to a worker that did not advertise support", async () => {
    await sendFirst(); await ack(); expect(stream.finishSign()).toBe(false);
  });
  it("negotiates lossless RGBA with one outstanding frame and a 60 FPS ceiling", async () => {
    const pixels = new Uint8ClampedArray(1280 * 720 * 4);
    pixels[0] = 24; pixels[pixels.length - 1] = 255;
    const getImageData = vi.fn(() => ({ data: pixels }));
    canvas.getContext.mockReturnValue({ drawImage: draw, getImageData });
    socket.message({ ...ready, max_fps: 60, frame_formats: ["rgba8", "png"] }); await advance();
    expect(canvas.toBlob).not.toHaveBeenCalled();
    expect(getImageData).toHaveBeenCalledWith(0, 0, 1280, 720);
    expect((await header()).data).toMatchObject({ format: "rgba8", width: 1280, height: 720 });
    const packet = new Uint8Array(await (socket.send.mock.calls[0][0] as Blob).arrayBuffer());
    const offset = 4 + new DataView(packet.buffer).getUint32(0, false);
    expect(packet.byteLength - offset).toBe(pixels.byteLength);
    expect(packet.subarray(offset).every((value, index) => value === pixels[index])).toBe(true);
    video.currentTime = 2; await advance(100); expect(socket.send).toHaveBeenCalledOnce();
    await ack(); await advance(); expect(socket.send).toHaveBeenCalledTimes(2);
    video.currentTime = 3; await ack(); await advance(16); expect(socket.send).toHaveBeenCalledTimes(2);
    await advance(1); expect(socket.send).toHaveBeenCalledTimes(3);
  });
  it("stopping during asynchronous encoding cannot send a late frame or receive a stale result", async () => {
    socket.message(ready); await advance(); stream.stop(); encode(new Blob(["PNG"]));
    socket.message({ type: "frame" }); await advance(50000);
    expect(socket.send).not.toHaveBeenCalled(); expect(result).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    expect(canvas.width).toBe(0); expect(vi.getTimerCount()).toBe(0);
  });
  it("fails closed on an acknowledgement for another frame", async () => {
    await sendFirst(); socket.message({ type: "frame", sequence: 2, timestamp_ms: 0, state: "ready", phase: null, segment_id: null, prediction: null });
    expect(error).toHaveBeenCalledOnce(); expect(result).not.toHaveBeenCalled(); expect(socket.close).toHaveBeenCalledOnce();
  });
  it("bounds stalled worker and frozen video without retrying or duplicating frames", async () => {
    await sendFirst(); await advance(30000);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("timed out")); expect(socket.send).toHaveBeenCalledOnce();
  });
  it("stops on frozen video after the final acknowledgement", async () => {
    await sendFirst(); await ack(); await advance(5200);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Camera frames paused")); expect(socket.send).toHaveBeenCalledOnce();
  });
  it("wakes on a fresh video frame without polling another whole interval", async () => {
    let fresh!: VideoFrameRequestCallback;
    video.requestVideoFrameCallback = vi.fn(callback => { fresh = callback; return 7; });
    video.cancelVideoFrameCallback = vi.fn();
    await sendFirst(); await ack(); await advance(67);
    expect(video.requestVideoFrameCallback).toHaveBeenCalledOnce();
    expect(canvas.toBlob).toHaveBeenCalledOnce();
    video.currentTime = 2;
    fresh(performance.now(), {} as VideoFrameCallbackMetadata);
    expect(canvas.toBlob).toHaveBeenCalledTimes(2);
    stream.stop(); encode(new Blob(["PNG"]));
    expect(socket.send).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancels the video callback and times out even when the camera never supplies another frame", async () => {
    video.requestVideoFrameCallback = vi.fn(() => 9);
    video.cancelVideoFrameCallback = vi.fn();
    await sendFirst(); await ack(); await advance(5100);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Camera frames paused"));
    expect(video.cancelVideoFrameCallback).toHaveBeenCalledWith(9);
    expect(socket.send).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("rejects oversized frames before sending", async () => {
    socket.message({ ...ready, max_frame_bytes: 2 }); await advance(); encode(new Blob(["PNG"]));
    expect(error).toHaveBeenCalledWith(expect.stringContaining("limit")); expect(socket.send).not.toHaveBeenCalled();
  });
  it("handles cold readiness timeout without acquiring any frames", async () => {
    await advance(45000); expect(error).toHaveBeenCalledOnce(); expect(canvas.toBlob).not.toHaveBeenCalled();
  });
  it("keeps stream credentials out of URLs and closes all streams on bridge disposal", () => {
    const bridge = new BridgeClient({ apiOrigin: "http://127.0.0.1:12345", token: "memory-only" });
    const connection = bridge.openRecognitionStream() as unknown as Socket;
    expect(connection.url.toString()).toBe("ws://127.0.0.1:12345/api/v1/recognition/stream");
    expect(connection.send).not.toHaveBeenCalled(); connection.dispatchEvent(new Event("open"));
    expect(connection.send).toHaveBeenCalledWith(JSON.stringify({ type: "authenticate", token: "memory-only", provider_id: "visign-ridge-25" }));
    bridge.dispose(); expect(connection.close).toHaveBeenCalledOnce();
  });
  it.each(["visign-videomae-25", "vsl-gh-tcn-25"])("binds %s readiness and predictions to the chosen provider", async (providerId) => {
    stream.stop(); socket = new Socket(); error.mockClear(); result.mockClear();
    stream = new CameraStream(socket as unknown as WebSocket, video, state, result, error, providerId);
    socket.message({ ...ready, provider_id: "visign-ridge-25" });
    expect(error).toHaveBeenCalledOnce();
    socket = new Socket(); error.mockClear();
    stream = new CameraStream(socket as unknown as WebSocket, video, state, result, error, providerId);
    socket.message({ ...ready, provider_id: providerId });
    await advance(); encode(new Blob(["PNG"]));
    const { data } = await header();
    socket.message({ ...data, state: "ending", phase: "final", segment_id: 1, quality: {},
      prediction: { provider_id: providerId, score_kind: "uncalibrated_softmax_subset", status: "rejected", top_k: [] } });
    expect(error).not.toHaveBeenCalled(); expect(result).toHaveBeenCalledOnce();
  });
});
