"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadDataset, type StaticDataset } from "@/lib/dataset";
import type { CircuitHistoryEntry } from "@/types/api";

export default function CircuitsPage() {
  const [rows, setRows] = useState<CircuitHistoryEntry[]>([]);
  const [source, setSource] = useState<string>("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDataset()
      .then((dataset: StaticDataset) => {
        setRows(dataset.history?.circuits ?? []);
        setSource(dataset.history?.source ?? "");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? rows.filter((row) =>
          `${row.name} ${row.country} ${row.location} ${row.seasons} ${row.grands_prix.join(" ")}`
            .toLowerCase()
            .includes(needle),
        )
      : rows;
    return [...list].sort((a, b) => b.races - a.races);
  }, [rows, query]);

  const currentCount = rows.filter((row) => row.current_2026).length;
  const weatherCount = rows.filter((row) => row.weather_circuit_id).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-center text-xs uppercase tracking-[0.22em] text-amber">
        World Championship venues since 1950 — not a calendar forecast
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-f1">Circuit history</p>
          <h1 className="mt-2 text-4xl leading-tight">Every World Championship circuit</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            {rows.length} venues have hosted a Formula 1 World Championship round. {currentCount} are on the 2026
            calendar. NOAA hourly weather is loaded for {weatherCount} of them — open the planner to compare rain, gusts
            and visibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="rounded-xl border border-stroke px-4 py-2 text-sm">
            Back to planner
          </Link>
          <Link href="/climate" className="rounded-xl border border-stroke px-4 py-2 text-sm">
            Climate
          </Link>
        </div>
      </div>
      <label className="block max-w-md text-xs uppercase tracking-[0.16em] text-muted">
        Filter
        <input
          className="mt-1 w-full rounded-xl border border-stroke bg-panel px-3 py-2 text-sm normal-case tracking-normal text-foreground"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Spa, Japan, 1994…"
        />
      </label>
      {error ? <p className="text-f1">{error}</p> : null}
      <div className="overflow-x-auto rounded-3xl border border-stroke bg-panel p-5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.16em] text-muted">
            <tr>
              <th className="pb-3">Circuit</th>
              <th className="pb-3">Country</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Seasons</th>
              <th className="pb-3">Races</th>
              <th className="pb-3">Weather</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-stroke">
                <td className="py-3">
                  <div>{row.name}</div>
                  <div className="text-xs text-muted">
                    {row.location}
                    {row.current_2026 ? " · 2026 calendar" : ""}
                  </div>
                </td>
                <td className="py-3">{row.country}</td>
                <td className="py-3 capitalize text-muted">{row.type}</td>
                <td className="py-3 font-mono text-xs text-muted">{row.seasons}</td>
                <td className="py-3 font-mono">{row.races}</td>
                <td className="py-3">
                  {row.weather_circuit_id ? (
                    <Link href={`/?circuit=${row.weather_circuit_id}`} className="text-teal hover:underline">
                      Open planner
                    </Link>
                  ) : (
                    <span className="text-muted">History only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {source ? <p className="text-xs leading-5 text-muted">{source}</p> : null}
    </div>
  );
}
