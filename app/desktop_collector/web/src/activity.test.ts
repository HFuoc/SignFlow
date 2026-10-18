import { describe, expect, it } from "vitest";
import { ACTIVITY_CONFIG as c, ActivitySegmenter, motionScore } from "./activity";

function fixture(noise = 0) {
  const s = new ActivitySegmenter(); let time = 0;
  const events: {event: string; time: number}[] = [];
  const feed = (score: number, ms: number) => {
    for (let n = 0; n < ms; n += 100) {
      time += 100; const event = s.sample(time, score); if (event) events.push({event,time});
    }
  };
  s.enable(0); feed(noise, c.calibrationMs);
  return {s, feed, events, now: () => time};
}
describe("isolated activity boundaries", () => {
  it("idle and tiny noise never trigger", () => {
    const {s,feed,events}=fixture(); feed(.001,10000); expect(s.state).toBe("armed"); expect(events).toEqual([]);
  });
  it("one maximal spike and its smoothing tail do not trigger", () => {
    const {s,feed,events}=fixture(); feed(1,100); expect(s.state).toBe("candidate"); feed(0,1000);
    expect(s.state).toBe("armed"); expect(events).toEqual([]);
  });
  it("sustained activity starts once and stillness ends once", () => {
    const {s,feed,events}=fixture(); feed(.15,2500); feed(0,1500);
    expect(events.map(e=>e.event)).toEqual(["segment_start","segment_end"]);
    expect(s.stopReason).toBe("stillness"); expect(s.state).toBe("recognizing");
    feed(.5,10000); expect(events).toHaveLength(2);
  });
  it("a move-and-hold respects minimum duration", () => {
    const {s,feed,events}=fixture(); feed(.15,300); feed(0,1900); expect(s.state).toBe("ending");
    feed(0,100); expect(events[1].time-events[0].time).toBe(c.minSegmentMs);
  });
  it("activity resuming during ending cancels stillness", () => {
    const {s,feed,events}=fixture(); feed(.15,2500); feed(0,500); feed(.15,300);
    expect(s.state).toBe("recording"); expect(events).toHaveLength(1);
  });
  it("maximum duration forces exactly one bounded segment", () => {
    const {s,feed,events}=fixture(); feed(.15,10000);
    expect(events).toHaveLength(2); expect(events[1].time-events[0].time).toBe(c.maxSegmentMs);
    expect(s.stopReason).toBe("max_duration");
  });
  it("cooldown waits for time AND a quiet pose before a second sign", () => {
    const {s,feed,events,now}=fixture(); feed(.15,2500); feed(0,1500); s.complete(now());
    feed(.15,3000); expect(s.state).toBe("cooldown");
    feed(0,1400); expect(s.state).toBe("armed"); feed(.15,2500); feed(0,1500);
    expect(events.filter(e=>e.event==="segment_start")).toHaveLength(2);
    expect(events.filter(e=>e.event==="segment_end")).toHaveLength(2);
  });
  it("cooldown cannot be bypassed by an immediate still frame", () => {
    const {s,feed,now}=fixture(); s.complete(now()); feed(0,900); expect(s.state).toBe("cooldown");
    feed(0,100); expect(s.state).toBe("armed");
  });
  it.each([0, .01, 1])("calibration noise %s stays bounded and allows large activity", noise => {
    const {s,feed,events}=fixture(noise);
    expect(s.startThreshold).toBeGreaterThanOrEqual(c.startMin); expect(s.startThreshold).toBeLessThanOrEqual(c.startMax);
    expect(s.endThreshold).toBeGreaterThanOrEqual(c.endMin); expect(s.endThreshold).toBeLessThanOrEqual(c.endMax);
    expect(s.startThreshold).toBeGreaterThan(s.endThreshold); feed(.2,500); expect(events[0].event).toBe("segment_start");
  });
  it("reset clears an in-progress sign and thresholds", () => {
    const {s,feed,events}=fixture(.02); feed(.2,500); s.reset(); feed(.5,9000);
    expect(s.state).toBe("off"); expect(events).toHaveLength(1); expect(s.startThreshold).toBe(c.startMin);
  });
  it("missing analysis time discards a recording and recalibrates", () => {
    const {s,feed,now}=fixture(); feed(.2,500);
    expect(s.sample(now()+1000,.2)).toBe("sample_gap"); expect(s.state).toBe("calibrating");
  });
  it("invalid or reversed timestamps cannot trigger", () => {
    const {s}=fixture(); s.sample(1500,1); s.sample(1000,1); s.sample(NaN,1); s.sample(1600,NaN);
    expect(s.state).toBe("armed");
  });
  it("cancel/failure completion re-arms without resetting camera ownership", () => {
    const {s,feed,now}=fixture(); feed(.2,400); s.complete(now()); feed(0,1500);
    expect(s.state).toBe("armed"); s.fail(); feed(.5,2000); expect(s.state).toBe("error");
  });
});
describe("frame score", () => {
  it("rejects uniform exposure shifts and small pixel noise", () => {
    const a=new Float32Array(100).fill(80), b=new Float32Array(100).fill(140);
    expect(motionScore(a,b)).toBe(0); b[0]+=4; expect(motionScore(a,b)).toBe(0);
  });
  it("measures nonuniform movement as an active-pixel ratio", () => {
    const a=new Float32Array(100).fill(80), b=a.slice(); b.fill(120,0,10);
    expect(motionScore(a,b)).toBe(.1);
  });
});
