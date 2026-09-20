"use client";

import { closedPath, elevColor, elevationRange, localMinima, resampleClosed, steepClimbs, TRACK_VIEWBOX } from "@/lib/trackGeometry";
import type { CircuitGuide } from "@/lib/circuitGuides";

export function CircuitThumb({ guide, className }: { guide: CircuitGuide; className?: string }) {
  const samples = resampleClosed(guide.points, 80);
  const { min, max } = elevationRange(samples);
  return (
    <svg viewBox={TRACK_VIEWBOX} className={className ?? "h-16 w-full"} aria-hidden>
      <path d={closedPath(samples)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" strokeLinejoin="round" />
      {samples.map((point, index) => {
        const next = samples[(index + 1) % samples.length];
        return (
          <line
            key={`${guide.id}-t-${index}`}
            x1={point.x}
            y1={point.y}
            x2={next.x}
            y2={next.y}
            stroke={elevColor(point.elev, min, max, false)}
            strokeWidth="6"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function CircuitDiagram({
  guide,
  wet = false,
  title,
}: {
  guide: CircuitGuide;
  wet?: boolean;
  title?: string;
}) {
  const samples = resampleClosed(guide.points, 180);
  const { min, max } = elevationRange(samples);
  const dips = wet ? localMinima(guide.points) : [];
  const climbs = steepClimbs(guide.points);
  const start = guide.points[0];
  const labels = guide.points.filter((point) => point.name);

  return (
    <figure className="overflow-hidden rounded-2xl border border-stroke bg-black/40">
      <svg viewBox={TRACK_VIEWBOX} role="img" aria-label={title ?? `${guide.id} schematic`} className="h-auto w-full">
        <rect width="520" height="300" fill={wet ? "#0a1628" : "#0c0c10"} />
        {wet ? <rect width="520" height="300" fill="url(#rainfade)" /> : null}
        <defs>
          <linearGradient id="rainfade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={closedPath(samples)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" strokeLinejoin="round" />
        {samples.map((point, index) => {
          const next = samples[(index + 1) % samples.length];
          return (
            <line
              key={`${guide.id}-s-${index}`}
              x1={point.x}
              y1={point.y}
              x2={next.x}
              y2={next.y}
              stroke={elevColor((point.elev + next.elev) / 2, min, max, wet)}
              strokeWidth="7"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={start.x} cy={start.y} r="7" fill="#f4f1ea" stroke="#070708" strokeWidth="2" />
        <text x={start.x + 10} y={start.y - 10} fill="#f4f1ea" fontSize="10" fontFamily="inherit">
          S/F
        </text>
        {labels.map((label) => {
          if (label.name === "Start/finish") return null;
          const dist = Math.hypot(label.x - start.x, label.y - start.y);
          if (dist < 28) return null;
          return (
            <text
              key={`${guide.id}-${label.name}`}
              x={label.x}
              y={label.y - 8}
              fill="rgba(244,241,234,0.78)"
              fontSize="9"
              fontFamily="inherit"
              textAnchor="middle"
            >
              {label.name}
            </text>
          );
        })}
        {climbs.map((point, index) => (
          <g key={`${guide.id}-climb-${index}`}>
            <polygon
              points={`${point.x},${point.y - 14} ${point.x - 5},${point.y - 4} ${point.x + 5},${point.y - 4}`}
              fill="#00d2be"
            />
          </g>
        ))}
        {dips.map((point, index) => (
          <circle key={`${guide.id}-dip-${index}`} cx={point.x} cy={point.y} r="9" fill="#3b82f6" fillOpacity="0.45" />
        ))}
      </svg>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-stroke px-3 py-2 text-[11px] text-muted">
        <span>
          Original schematic · {guide.direction} · {guide.lengthKm.toFixed(2)} km · not an official map
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-full bg-amber" /> low
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-full bg-teal" /> high
          </span>
          {wet ? (
            <span className="flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-full bg-blue-500" /> standing-water dip
            </span>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}

export function ElevationProfile({ guide }: { guide: CircuitGuide }) {
  const samples = resampleClosed(guide.points, 80);
  const { min, max } = elevationRange(samples);
  const width = 520;
  const height = 110;
  const pad = 16;
  const span = max - min || 1;
  const coords = samples.map((point, index) => {
    const x = pad + (index / (samples.length - 1)) * (width - pad * 2);
    const y = height - pad - ((point.elev - min) / span) * (height - pad * 2);
    return { x, y, elev: point.elev, name: point.name };
  });
  const area = `M ${coords[0].x} ${height - pad} ${coords.map((c) => `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ")} L ${coords[coords.length - 1].x} ${height - pad} Z`;
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const labelled = coords.filter((c) => c.name).filter((_, i) => i % 2 === 0).slice(0, 6);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-muted">Elevation around a lap</p>
      <p className="mt-1 font-mono text-sm">
        {min.toFixed(0)}–{max.toFixed(0)} m
        <span className="ml-2 text-muted">Δ {(max - min).toFixed(0)} m</span>
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-auto w-full" role="img" aria-label="Lap elevation">
        <path d={area} fill="rgba(0,210,190,0.12)" />
        <path d={line} fill="none" stroke="#00d2be" strokeWidth="2.4" />
        {labelled.map((c) => (
          <g key={`${c.name}-${c.x}`}>
            <circle cx={c.x} cy={c.y} r="2.5" fill="#f2b90d" />
            <text x={c.x} y={Math.max(12, c.y - 8)} fill="rgba(244,241,234,0.7)" fontSize="9" textAnchor="middle">
              {c.name === "Start/finish" ? "S/F" : c.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
