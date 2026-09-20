import type { StationProvenance } from "@/types/api";

export function Provenance({ data }: { data: StationProvenance }) {
  return (
    <aside className="rounded-2xl border border-stroke bg-black/40 p-4 text-sm leading-6 text-muted">
      <p className="text-xs uppercase tracking-[0.2em] text-amber">Historical analysis</p>
      <p className="mt-2 text-foreground">
        {data.data_source}
      </p>
      <p>
        Station {data.station_id} {data.station_name} · {data.distance_km.toFixed(1)} km from the circuit
      </p>
      <p>
        {data.start_year}–{data.end_year} · n = {data.observation_count.toLocaleString()} observations
      </p>
      <p>Generated {data.generated_at} · model {data.model_version}</p>
      <p className="mt-2 text-[12px]">{data.rationale}</p>
      <p className="mt-2 font-mono text-[11px]">
        thresholds: rain ≥ {data.thresholds.precipitation_mm} mm · wind ≥ {data.thresholds.strong_wind_ms} m/s · gust ≥ {data.thresholds.strong_gust_ms} m/s · vis &lt; {data.thresholds.low_visibility_m} m · temp ≥ {data.thresholds.high_temperature_c} °C
      </p>
      <a className="mt-3 inline-block text-teal underline-offset-2 hover:underline" href={data.registry}>
        NOAA ISD on AWS Open Data
      </a>
    </aside>
  );
}
