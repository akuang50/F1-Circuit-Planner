export type TrackPoint = {
  x: number;
  y: number;
  elev: number;
  name?: string;
};

const VIEW = { w: 520, h: 300 };

export const TRACK_VIEWBOX = `0 0 ${VIEW.w} ${VIEW.h}`;

function crPoint(p0: TrackPoint, p1: TrackPoint, p2: TrackPoint, p3: TrackPoint, t: number): TrackPoint {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  const elev =
    0.5 *
    (2 * p1.elev +
      (-p0.elev + p2.elev) * t +
      (2 * p0.elev - 5 * p1.elev + 4 * p2.elev - p3.elev) * t2 +
      (-p0.elev + 3 * p1.elev - 3 * p2.elev + p3.elev) * t3);
  return { x, y, elev };
}

export function resampleClosed(points: TrackPoint[], samples = 160): TrackPoint[] {
  if (points.length < 3) return points;
  const n = points.length;
  const out: TrackPoint[] = [];
  const per = Math.max(2, Math.round(samples / n));
  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    for (let s = 0; s < per; s += 1) {
      const t = s / per;
      const pt = crPoint(p0, p1, p2, p3, t);
      if (s === 0 && p1.name) pt.name = p1.name;
      out.push(pt);
    }
  }
  return out;
}

export function closedPath(points: TrackPoint[]): string {
  if (!points.length) return "";
  return `${points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} Z`;
}

export function elevationRange(points: TrackPoint[]): { min: number; max: number } {
  const elevs = points.map((p) => p.elev);
  return { min: Math.min(...elevs), max: Math.max(...elevs) };
}

export function elevColor(elev: number, min: number, max: number, wetLow: boolean): string {
  const t = max === min ? 0.5 : (elev - min) / (max - min);
  if (wetLow && t < 0.38) {
    const wet = 1 - t / 0.38;
    const g = Math.round(90 + 80 * (1 - wet));
    return `rgb(${Math.round(40 + 30 * (1 - wet))} ${g} ${Math.round(180 + 50 * wet)})`;
  }
  const h = 28 + t * 142;
  const s = 72;
  const l = 42 + t * 10;
  return `hsl(${h} ${s}% ${l}%)`;
}

export function localMinima(points: TrackPoint[], limit = 5): TrackPoint[] {
  const { min, max } = elevationRange(points);
  const range = max - min || 1;
  const n = points.length;
  const found: TrackPoint[] = [];
  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const p = points[i];
    const low = (p.elev - min) / range <= 0.28;
    const dip = p.elev <= prev.elev && p.elev <= next.elev;
    if (low && dip) found.push(p);
  }
  const unique = found.filter((p, i, arr) => {
    if (!p.name) return true;
    return arr.findIndex((q) => q.name === p.name) === i;
  });
  return unique.slice(0, limit);
}

export function steepClimbs(points: TrackPoint[]): TrackPoint[] {
  const n = points.length;
  const scored = points.map((p, i) => {
    const next = points[(i + Math.max(1, Math.round(n / 18))) % n];
    return { p, gain: next.elev - p.elev };
  });
  scored.sort((a, b) => b.gain - a.gain);
  return scored.filter((row) => row.gain > 8).slice(0, 3).map((row) => row.p);
}
