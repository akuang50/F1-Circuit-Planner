import Link from "next/link";
import { notFound } from "next/navigation";
import { CircuitDetail } from "@/components/CircuitDetail";
import { CircuitThumb } from "@/components/CircuitDiagram";
import { WEATHER_CIRCUITS } from "@/lib/circuitCatalog";
import { allCircuitGuides, getCircuitGuide } from "@/lib/circuitGuides";
import { layoutHref } from "@/lib/circuitNav";

export function generateStaticParams() {
  return allCircuitGuides().map((guide) => ({ id: guide.id }));
}

export const dynamicParams = false;

export default async function CircuitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const circuit = WEATHER_CIRCUITS.find((row) => row.id === id);
  const guide = getCircuitGuide(id);
  if (!circuit || !guide) notFound();

  const others = WEATHER_CIRCUITS.filter((row) => row.id !== id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-center text-xs uppercase tracking-[0.22em] text-amber">
        Original schematic — not an official FIA map, not a race-day tyre call
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-f1">{circuit.country}</p>
        <h1 className="mt-2 text-4xl leading-tight">{circuit.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          {circuit.event}. Layout, terrain and how {circuit.typical_month ? "the usual race month" : "the season"} moves
          the wet/dry tyre call. NOAA ISD is history, not a forecast.
        </p>
      </div>
      <CircuitDetail circuit={circuit} />
      <section className="rounded-3xl border border-stroke bg-panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Other circuits</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((row) => {
            const otherGuide = getCircuitGuide(row.id);
            return (
              <li key={row.id}>
                <Link
                  href={layoutHref(row.id)}
                  className="block rounded-2xl border border-stroke bg-black/30 px-3 py-2 hover:border-white/30"
                >
                  {otherGuide ? <CircuitThumb guide={otherGuide} className="h-14 w-full" /> : null}
                  <p className="mt-1 text-sm">{row.name}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
