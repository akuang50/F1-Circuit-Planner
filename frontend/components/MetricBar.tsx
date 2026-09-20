import type { WeatherExposure } from "@/types/api";
import { pct } from "@/lib/api";

const METRICS: {
  key: keyof WeatherExposure;
  label: string;
  hint: string;
}[] = [
  {
    key: "precipitation",
    label: "Precipitation",
    hint: "Historical frequency of measurable precipitation",
  },
  {
    key: "strong_gust",
    label: "Strong gusts",
    hint: "Historical frequency above the selected gust threshold",
  },
  {
    key: "strong_wind",
    label: "Breezy wind",
    hint: "Historical frequency above the selected wind threshold",
  },
  {
    key: "low_visibility",
    label: "Low visibility",
    hint: "Historical frequency below the selected visibility threshold",
  },
  {
    key: "temperature_extreme",
    label: "High temperature",
    hint: "Historical frequency above the selected temperature threshold",
  },
];

export function MetricBar({
  label,
  value,
  hint,
  accent = "red",
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: "red" | "teal" | "amber";
}) {
  const width = Math.max(2, Math.min(100, value * 100));
  const color =
    accent === "teal"
      ? "bg-teal"
      : accent === "amber"
        ? "bg-amber"
        : "bg-f1";
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">{label}</span>
        <span className="font-mono text-sm">{pct(value, 0)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      {hint ? <p className="text-[11px] leading-4 text-muted/80">{hint}</p> : null}
    </div>
  );
}

export function ExposureList({
  exposure,
  compact = false,
}: {
  exposure: WeatherExposure;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      {METRICS.map((metric) => (
        <MetricBar
          key={metric.key}
          label={metric.label}
          value={Number(exposure[metric.key] ?? 0)}
          hint={compact ? undefined : metric.hint}
        />
      ))}
    </div>
  );
}
