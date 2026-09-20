"use client";

import type { HourlyProfile } from "@/types/api";
import { hourLabel, pct } from "@/lib/api";

export function HourlyChart({
  hours,
  selectedHour,
}: {
  hours: HourlyProfile[];
  selectedHour: number;
}) {
  const slice = hours.filter((row) => row.hour >= 9 && row.hour <= 18);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="pb-3 font-normal">Hour</th>
            <th className="pb-3 font-normal">Precipitation</th>
            <th className="pb-3 font-normal">Gusts</th>
            <th className="pb-3 font-normal">Visibility</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((row) => {
            const active = row.hour === Math.floor(selectedHour);
            return (
              <tr
                key={row.hour}
                className={`border-t border-stroke ${active ? "bg-f1/10" : ""}`}
              >
                <td className="py-2 font-mono">{hourLabel(row.hour)}</td>
                <td className="py-2 font-mono">
                  <MiniBar value={row.rain_probability} color="bg-f1" />
                  {pct(row.rain_probability, 0)}
                </td>
                <td className="py-2 font-mono">
                  <MiniBar value={row.strong_gust_probability} color="bg-teal" />
                  {pct(row.strong_gust_probability, 0)}
                </td>
                <td className="py-2 font-mono">
                  <MiniBar value={row.low_visibility_probability} color="bg-amber" />
                  {pct(row.low_visibility_probability, 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 font-mono text-[11px] text-muted">
        Highlighted row is the selected race start hour. Values are historical frequencies in the NOAA ISD record, not forecasts.
      </p>
    </div>
  );
}

function MiniBar({ value, color }: { value: number | null; color: string }) {
  const width = Math.max(3, Math.min(100, (value ?? 0) * 100));
  return (
    <span className="mr-2 inline-block h-1.5 w-20 overflow-hidden rounded-full bg-white/10 align-middle">
      <span className={`block h-full ${color}`} style={{ width: `${width}%` }} />
    </span>
  );
}
