import { CircuitTable, YearSchedule } from "@/components/CircuitSchedule";
import { HISTORY_CIRCUITS, HISTORY_SOURCE } from "@/lib/circuitCatalog";

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
          2026 calendar. NOAA hourly weather is loaded for {weatherCount} of them.
        </p>
      </div>
      <YearSchedule circuits={HISTORY_CIRCUITS} />
      <CircuitTable circuits={HISTORY_CIRCUITS} />
      <p className="text-xs leading-5 text-muted">{HISTORY_SOURCE}</p>
    </div>
  );
}
