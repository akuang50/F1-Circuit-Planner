import Link from "next/link";
import { MONTHS } from "@/lib/api";
import { CALENDAR_2026, HISTORY_CIRCUITS } from "@/lib/circuitCatalog";
import { getCircuitGuide } from "@/lib/circuitGuides";
import { CircuitThumb } from "@/components/CircuitDiagram";

const LEGENDS = [...HISTORY_CIRCUITS].sort((a, b) => b.races - a.races).slice(0, 12);

export function CircuitDirectory() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-stroke bg-panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">2026 World Championship</p>
        <h2 className="mt-1 text-2xl">Every current calendar circuit</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Click a venue to load its NOAA ISD weather profile in the planner above. Month jumps to that grand prix’s usual
          slot.
        </p>
        <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CALENDAR_2026.map((circuit) => {
            const guide = getCircuitGuide(circuit.id);
            return (
            <li key={circuit.id} className="rounded-2xl border border-stroke bg-black/30 px-4 py-3">
              <Link href={`/?circuit=${circuit.id}`} className="block hover:text-white">
                {guide ? <CircuitThumb guide={guide} className="mb-2 h-16 w-full" /> : null}
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber">
                  {MONTHS[(circuit.typical_month ?? 1) - 1]}
                </p>
                <p className="mt-1">{circuit.name}</p>
                <p className="text-xs text-muted">
                  {circuit.event} · {circuit.country}
                </p>
              </Link>
              <Link href={`/circuits/${circuit.id}`} className="mt-2 inline-block text-sm text-teal hover:underline">
                Layout, terrain and tyres
              </Link>
            </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-3xl border border-stroke bg-panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Used in the past</p>
        <h2 className="mt-1 text-2xl">World Championship venues since 1950</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          {HISTORY_CIRCUITS.length} circuits have hosted a championship round. These are the busiest. The full season
          list — including Adelaide, Nürburgring, Imola, Indianapolis — is on the circuits page.
        </p>
        <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LEGENDS.map((row) => (
            <li key={row.id} className="rounded-2xl border border-stroke bg-black/30 px-4 py-3">
              <p>{row.name}</p>
              <p className="text-xs text-muted">
                {row.country} · {row.seasons}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">{row.races} championship races</p>
              {row.weather_circuit_id ? (
                <span className="mt-2 flex flex-col gap-1">
                  <Link href={`/?circuit=${row.weather_circuit_id}`} className="text-sm text-teal hover:underline">
                    Open weather planner
                  </Link>
                  <Link href={`/circuits/${row.weather_circuit_id}`} className="text-sm text-teal hover:underline">
                    Layout and tyres
                  </Link>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <Link
          href="/circuits"
          className="mt-5 inline-block rounded-xl border border-stroke px-4 py-2 text-sm hover:border-white/30"
        >
          Full circuit history and year-by-year schedule
        </Link>
      </section>
    </div>
  );
}
