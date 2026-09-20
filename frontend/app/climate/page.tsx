"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Provenance } from "@/components/Provenance";
import { MONTHS, apiGet, pct } from "@/lib/api";
import type { ClimateProfileResponse } from "@/types/api";

export default function ClimatePage() {
  const [data, setData] = useState<ClimateProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<ClimateProfileResponse>("/api/circuits/silverstone/climate")
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-center text-xs uppercase tracking-[0.22em] text-amber">
        Historical NOAA ISD analysis — not a weather forecast
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-f1">Circuit climate profile</p>
          <h1 className="mt-2 text-4xl">Silverstone, year-round</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Long-term monthly exposure from Church Lawford ISD observations. Useful for calendar questions, not race-day calls.
          </p>
        </div>
        <Link href="/" className="rounded-xl border border-stroke px-4 py-2 text-sm">
          Back to planner
        </Link>
      </div>
      {error ? <p className="text-f1">{error}</p> : null}
      <div className="overflow-x-auto rounded-3xl border border-stroke bg-panel p-5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.16em] text-muted">
            <tr>
              <th className="pb-3">Month</th>
              <th className="pb-3">Rain</th>
              <th className="pb-3">Gusts</th>
              <th className="pb-3">Visibility</th>
              <th className="pb-3">Heat</th>
              <th className="pb-3">Volatility</th>
            </tr>
          </thead>
          <tbody>
            {data?.months.map((row) => (
              <tr key={row.month} className="border-t border-stroke">
                <td className="py-3">{MONTHS[row.month - 1]}</td>
                <td className="py-3 font-mono">
                  <Bar value={row.rain_probability} /> {pct(row.rain_probability, 0)}
                </td>
                <td className="py-3 font-mono">
                  <Bar value={row.strong_gust_probability} color="teal" /> {pct(row.strong_gust_probability, 0)}
                </td>
                <td className="py-3 font-mono">
                  <Bar value={row.low_visibility_probability} color="amber" /> {pct(row.low_visibility_probability, 0)}
                </td>
                <td className="py-3 font-mono">{pct(row.high_temperature_probability, 0)}</td>
                <td className="py-3">{row.volatility_label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data ? <Provenance data={data.provenance} /> : null}
    </div>
  );
}

function Bar({ value, color = "red" }: { value: number | null; color?: "red" | "teal" | "amber" }) {
  const width = Math.max(4, Math.min(100, (value ?? 0) * 100));
  const cls = color === "teal" ? "bg-teal" : color === "amber" ? "bg-amber" : "bg-f1";
  return (
    <span className="mr-2 inline-block h-2 w-24 overflow-hidden rounded-full bg-white/10 align-middle">
      <span className={`block h-full ${cls}`} style={{ width: `${width}%` }} />
    </span>
  );
}
