"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Provenance } from "@/components/Provenance";
import { MONTHS, pct } from "@/lib/api";
import { loadDataset, monthlyForCircuit, provenanceFor, type StaticDataset } from "@/lib/dataset";
import type { Circuit, ClimateProfileResponse } from "@/types/api";

export default function ClimatePage() {
  const [dataset, setDataset] = useState<StaticDataset | null>(null);
  const [circuitId, setCircuitId] = useState("silverstone");
  const [data, setData] = useState<ClimateProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDataset()
      .then((loaded) => {
        setDataset(loaded);
        const fromUrl = new URLSearchParams(window.location.search).get("circuit");
        if (fromUrl && loaded.circuits.some((item) => item.id === fromUrl)) {
          setCircuitId(fromUrl);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!dataset) return;
    const circuit =
      dataset.circuits.find((item) => item.id === circuitId) ?? dataset.circuits[0];
    setData({
      circuit,
      months: monthlyForCircuit(dataset, circuit.id),
      provenance: provenanceFor(dataset, circuit.id),
    });
  }, [dataset, circuitId]);

  const circuits: Circuit[] = dataset?.circuits ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-center text-xs uppercase tracking-[0.22em] text-amber">
        Historical NOAA ISD analysis — not a weather forecast
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-f1">Circuit climate profile</p>
          <h1 className="mt-2 text-4xl">{data?.circuit.name ?? "Circuit"}, year-round</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Long-term monthly exposure from the pinned NOAA ISD station. Useful for calendar questions, not race-day
            calls.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
            Circuit
            <select
              className="rounded-xl border border-stroke bg-panel px-3 py-2 text-sm normal-case tracking-normal text-foreground"
              value={circuitId}
              onChange={(event) => setCircuitId(event.target.value)}
            >
              {circuits.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <Link href={`/?circuit=${circuitId}`} className="self-end rounded-xl border border-stroke px-4 py-2 text-sm">
            Back to planner
          </Link>
        </div>
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
