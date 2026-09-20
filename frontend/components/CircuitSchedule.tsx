"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HISTORY_YEARS, yearsFromSeasons } from "@/lib/circuitCatalog";
import type { CircuitHistoryEntry } from "@/types/api";

export function YearSchedule({ circuits }: { circuits: CircuitHistoryEntry[] }) {
  const [year, setYear] = useState(2026);
  const hosted = useMemo(
    () =>
      circuits
        .filter((row) => yearsFromSeasons(row.seasons).includes(year))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [circuits, year],
  );

  return (
    <section className="rounded-3xl border border-stroke bg-panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Past World Championship schedule</p>
          <h2 className="mt-1 text-2xl">Who hosted a grand prix in {year}?</h2>
        </div>
        <label className="text-xs uppercase tracking-[0.16em] text-muted">
          Season
          <select
            className="mt-1 block rounded-xl border border-stroke bg-panel-2 px-3 py-2 text-sm normal-case tracking-normal text-foreground"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {HISTORY_YEARS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm text-muted">
        {hosted.length} World Championship {hosted.length === 1 ? "venue" : "venues"} that year.
      </p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {hosted.map((row) => (
          <li key={`${year}-${row.id}`} className="rounded-2xl border border-stroke bg-black/30 px-4 py-3">
            <p>{row.name}</p>
            <p className="text-xs text-muted">
              {row.country} · {row.grands_prix.join(", ")}
            </p>
            {row.weather_circuit_id ? (
              <p className="mt-2 flex flex-wrap gap-3">
                <Link href={`/?circuit=${row.weather_circuit_id}`} className="text-sm text-teal hover:underline">
                  Open weather planner
                </Link>
                <Link href={`/circuits/${row.weather_circuit_id}`} className="text-sm text-teal hover:underline">
                  Layout and tyres
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">No NOAA profile in this app</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CircuitTable({ circuits }: { circuits: CircuitHistoryEntry[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? circuits.filter((row) =>
          `${row.name} ${row.country} ${row.location} ${row.seasons} ${row.grands_prix.join(" ")}`
            .toLowerCase()
            .includes(needle),
        )
      : circuits;
    return [...list].sort((a, b) => b.races - a.races);
  }, [circuits, query]);

  return (
    <section className="rounded-3xl border border-stroke bg-panel p-5">
      <label className="block max-w-md text-xs uppercase tracking-[0.16em] text-muted">
        Filter the full list
        <input
          className="mt-1 w-full rounded-xl border border-stroke bg-panel-2 px-3 py-2 text-sm normal-case tracking-normal text-foreground"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Spa, Japan, 1994…"
        />
      </label>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.16em] text-muted">
            <tr>
              <th className="pb-3">Circuit</th>
              <th className="pb-3">Country</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Seasons</th>
              <th className="pb-3">Races</th>
              <th className="pb-3">Weather</th>
              <th className="pb-3">Diagram</th>
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
                <td className="py-3">
                  {row.weather_circuit_id ? (
                    <Link href={`/circuits/${row.weather_circuit_id}`} className="text-teal hover:underline">
                      Layout and tyres
                    </Link>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
