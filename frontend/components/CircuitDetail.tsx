"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CircuitDiagram, ElevationProfile } from "@/components/CircuitDiagram";
import { CircuitTrack3D } from "@/components/CircuitTrack3D";
import { TireChoice } from "@/components/TireChoice";
import { MONTHS } from "@/lib/api";
import { getCircuitGuide, type CircuitGuide } from "@/lib/circuitGuides";
import { layoutHref } from "@/lib/circuitNav";
import { hoursForMonth, loadDataset, monthlyForCircuit, type StaticDataset } from "@/lib/dataset";
import { exposureForWindow, exposureFromMonthly } from "@/lib/exposure";
import { adviseTires } from "@/lib/tireAdvice";
import type { Circuit } from "@/types/api";

export function CircuitDetail({ circuit }: { circuit: Circuit }) {
  const guide = getCircuitGuide(circuit.id);
  const [dataset, setDataset] = useState<StaticDataset | null>(null);
  const [month, setMonth] = useState(circuit.typical_month ?? 7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDataset()
      .then(setDataset)
      .catch((err: Error) => setError(err.message));
  }, []);

  const exposure = useMemo(() => {
    if (!dataset) return null;
    const hours = hoursForMonth(dataset, month, circuit.id);
    if (hours.length) return exposureForWindow(hours, 12, 360);
    const monthly = monthlyForCircuit(dataset, circuit.id).find((row) => row.month === month);
    return exposureFromMonthly(monthly);
  }, [dataset, month, circuit.id]);

  if (!guide) {
    return <p className="text-muted">No original schematic for this venue yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
          Month
          <select
            className="rounded-xl border border-stroke bg-panel px-3 py-2 text-sm normal-case tracking-normal text-foreground"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
                {circuit.typical_month === index + 1 ? " · usual GP" : ""}
              </option>
            ))}
          </select>
        </label>
        <Link href={layoutHref(circuit.id)} className="self-end rounded-xl border border-stroke px-4 py-2 text-sm">
          Open on main page
        </Link>
        <Link
          href={`/climate?circuit=${circuit.id}`}
          className="self-end rounded-xl border border-stroke px-4 py-2 text-sm"
        >
          Climate table
        </Link>
      </div>
      {error ? <p className="text-f1">{error}</p> : null}
      <GuideBody guide={guide} month={month} exposure={exposure} />
    </div>
  );
}

function GuideBody({
  guide,
  month,
  exposure,
}: {
  guide: CircuitGuide;
  month: number;
  exposure: ReturnType<typeof exposureForWindow> | null;
}) {
  const advice = exposure ? adviseTires(guide, exposure, month) : null;
  const wet = (advice?.wetScore ?? 0) >= 0.22;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <CircuitTrack3D guide={guide} wet={wet} />
        <CircuitDiagram guide={guide} wet={wet} title={guide.id} />
        <ElevationProfile guide={guide} />
      </div>
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Terrain</p>
          <p className="mt-2 text-sm leading-6 text-muted">{guide.terrainCopy}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Season and weather</p>
          <p className="mt-2 text-sm leading-6 text-muted">{guide.weatherCopy}</p>
        </div>
        {advice ? <TireChoice advice={advice} /> : <p className="text-muted">Loading NOAA ISD profile…</p>}
      </div>
    </div>
  );
}
