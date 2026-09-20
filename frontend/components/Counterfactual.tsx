import type { ScenarioResponse, WeatherExposure } from "@/types/api";
import { pct, pp } from "@/lib/api";

type ExposureMetric = Exclude<keyof WeatherExposure, "observation_count" | "limited_sample">;

const ROWS: { key: ExposureMetric; label: string }[] = [
  { key: "precipitation", label: "Precipitation" },
  { key: "strong_gust", label: "Strong gusts" },
  { key: "low_visibility", label: "Low visibility" },
  { key: "strong_wind", label: "Breezy wind" },
  { key: "temperature_extreme", label: "High temperature" },
];

export function Counterfactual({ data }: { data: ScenarioResponse }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TimeCard title="Original" time={data.original_start} exposure={data.original} />
      <TimeCard title="Alternative" time={data.alternative_start} exposure={data.alternative} />
      <div className="md:col-span-2 rounded-2xl border border-stroke bg-black/30 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Historical change</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ROWS.map((row) => {
            const delta = data.delta[row.key] ?? 0;
            const better = delta < 0;
            return (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <span className="text-sm">{row.label}</span>
                <span className={`font-mono text-sm ${better ? "text-teal" : delta > 0 ? "text-f1" : "text-muted"}`}>
                  {pct(data.original[row.key], 0)} → {pct(data.alternative[row.key], 0)}{" "}
                  <span className="text-muted">({pp(delta, 0)})</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-muted">
          Negative percentage points means the alternative had a lower historical frequency in the NOAA ISD record. This is not a prediction for a future British Grand Prix.
        </p>
      </div>
    </div>
  );
}

function TimeCard({
  title,
  time,
  exposure,
}: {
  title: string;
  time: string;
  exposure: ScenarioResponse["original"];
}) {
  return (
    <div className="rounded-2xl border border-stroke bg-panel-2 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
      <p className="mt-2 font-mono text-3xl">{time}</p>
      <ul className="mt-4 space-y-1.5 font-mono text-sm text-muted">
        <li>Rain {pct(exposure.precipitation, 0)}</li>
        <li>Gust {pct(exposure.strong_gust, 0)}</li>
        <li>Visibility {pct(exposure.low_visibility, 0)}</li>
      </ul>
    </div>
  );
}
