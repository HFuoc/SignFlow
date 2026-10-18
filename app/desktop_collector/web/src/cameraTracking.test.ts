import { describe, expect, it } from "vitest";
import { FrameRate, readTracking, visiblePoint } from "./trackingMetrics";
const fixture = () => ({ schema: "holistic-overlay-v1", xy: Array.from({ length: 75 }, () => [0, .5]),
  present: Array(75).fill(true), pose_visibility: Array(33).fill(.9), connections: [[0, 1], [33, 34]] });
describe("tracking display contract", () => {
  it("counts presented frames when the browser skips a video callback", () => {
    const rate = new FrameRate();
    rate.add(0); expect(rate.add(100, 6)).toBe(60);
    expect(rate.add(200, 6)).toBe(60);
    expect(rate.value(1300)).toBeNull();
  });
  it("accepts zero coordinates but hides absent, low-visibility and out-of-frame points", () => {
    const t = readTracking(fixture())!;
    expect(visiblePoint(t, 0)).toBe(true);
    t.present[0] = false; expect(visiblePoint(t, 0)).toBe(false);
    t.pose_visibility[1] = .1; expect(visiblePoint(t, 1)).toBe(false);
    t.xy[33][0] = -1; expect(visiblePoint(t, 33)).toBe(false);
    expect(visiblePoint(t, 34)).toBe(true);
  });
  it("rejects missing, incompatible and malformed optional display data", () => {
    expect(readTracking(undefined)).toBeNull();
    expect(readTracking({ ...fixture(), schema: "other" })).toBeNull();
    expect(readTracking({ ...fixture(), connections: [[0, 75]] })).toBeNull();
    expect(readTracking({ ...fixture(), xy: [[NaN, 0]] })).toBeNull();
  });
  it("measures observed rate and expires stopped frame samples", () => {
    const rate = new FrameRate();
    expect(rate.add(100)).toBeNull(); expect(rate.add(200)).toBe(10);
    expect(rate.add(300)).toBe(10); expect(rate.value(1400)).toBeNull();
    expect(rate.add(1500)).toBeNull(); expect(rate.add(1700)).toBe(5);
  });
});
