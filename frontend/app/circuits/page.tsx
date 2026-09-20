import { CircuitTable, YearSchedule } from "@/components/CircuitSchedule";
import { CircuitThumb } from "@/components/CircuitDiagram";
import { HISTORY_CIRCUITS, HISTORY_SOURCE, WEATHER_CIRCUITS } from "@/lib/circuitCatalog";
import { getCircuitGuide } from "@/lib/circuitGuides";
import { layoutHref } from "@/lib/circuitNav";
import Link from "next/link";

export default function CircuitsPage() {
  const currentCount = HISTORY_CIRCUITS.filter((row) => row.current_2026).length;
  const weatherCount = HISTORY_CIRCUITS.filter((row) => row.weather_circuit_id).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-center text-xs uppercase tracking-[0.22em] text-amber">
        World Championship venues since 1950 — not a calendar forecast
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-f1">Circuit history</p>
        <h1 className="mt-2 text-4xl leading-tight">Every World Championship circuit</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          {HISTORY_CIRCUITS.length} venues have hosted a Formula 1 World Championship round. {currentCount} are on the
          2026 calendar. NOAA hourly weather is loaded for {weatherCount} of them. Original schematics below show terrain
          and how the season moves the tyre call.
        </p>
      </div>
      <section className="rounded-3xl border border-stroke bg-panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Circuit diagrams</p>
        <h2 className="mt-1 text-2xl">Layout, elevation and tyres</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Original drawings — not official maps. Open a venue on the main page to orbit the 3D lap and see how rain and
          heat change the slick vs intermediate vs wet call.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WEATHER_CIRCUITS.map((circuit) => {
            const guide = getCircuitGuide(circuit.id);
            if (!guide) return null;
            return (
              <li key={circuit.id}>
                <Link
                  href={layoutHref(circuit.id)}
                  className="block rounded-2xl border border-stroke bg-black/30 px-3 py-3 hover:border-white/30"
                >
                  <CircuitThumb guide={guide} className="h-20 w-full" />
                  <p className="mt-2">{circuit.name}</p>
                  <p className="text-xs text-muted">
                    {guide.direction} · Δ{" "}
                    {(Math.max(...guide.points.map((p) => p.elev)) - Math.min(...guide.points.map((p) => p.elev))).toFixed(
                      0,
                    )}{" "}
                    m · C{guide.typicalSlicks[0]}–C{guide.typicalSlicks[1]}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
      <YearSchedule circuits={HISTORY_CIRCUITS} />
      <CircuitTable circuits={HISTORY_CIRCUITS} />
      <p className="text-xs leading-5 text-muted">{HISTORY_SOURCE}</p>
    </div>
  );
}
