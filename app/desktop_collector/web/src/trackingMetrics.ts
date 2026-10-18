export interface Tracking {
  schema: "holistic-overlay-v1";
  xy: [number, number][];
  present: boolean[];
  pose_visibility: number[];
  connections: [number, number][];
}

/** Optional versioned display data. Older workers simply have no overlay. */
export function readTracking(value: unknown): Tracking | null {
  const t = value as Tracking | undefined;
  if (!t || t.schema !== "holistic-overlay-v1" || !Array.isArray(t.xy) || t.xy.length !== 75
    || !t.xy.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))
    || !Array.isArray(t.present) || t.present.length !== 75 || !t.present.every(p => typeof p === "boolean")
    || !Array.isArray(t.pose_visibility) || t.pose_visibility.length !== 33
    || !t.pose_visibility.every(p => Number.isFinite(p) && p >= 0 && p <= 1)
    || !Array.isArray(t.connections) || t.connections.length > 100
    || !t.connections.every(e => Array.isArray(e) && e.length === 2 && e.every(i => Number.isInteger(i) && i >= 0 && i < 75))) return null;
  return t;
}

export function visiblePoint(t: Tracking, index: number) {
  return t.present[index] && (index >= 33 || t.pose_visibility[index] >= .5)
    && t.xy[index].every(n => n >= 0 && n <= 1);
}

export class FrameRate {
  private samples: { at: number; count: number }[] = [];
  private count = 0;
  add(now: number, frames = 1) {
    this.count += frames;
    this.samples.push({ at: now, count: this.count });
    return this.value(now);
  }
  value(now: number): number | null {
    this.samples = this.samples.filter(t => now - t.at <= 1000);
    if (this.samples.length < 2) return null;
    const last = this.samples.at(-1)!, first = this.samples[0];
    const span = last.at - first.at;
    return span > 0 ? (last.count - first.count) * 1000 / span : null;
  }
}
