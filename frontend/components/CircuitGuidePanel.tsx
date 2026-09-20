"use client";

import Link from "next/link";
import { CircuitDiagram, ElevationProfile } from "@/components/CircuitDiagram";
import { TireChoice } from "@/components/TireChoice";
import { getCircuitGuide } from "@/lib/circuitGuides";
import { adviseTires } from "@/lib/tireAdvice";
import type { WeatherExposure } from "@/types/api";

export function CircuitGuidePanel({
  circuitId,
  month,
  exposure,
}: {
  circuitId: string;
  month: number;
  exposure: WeatherExposure | null;
}) {
  const guide = getCircuitGuide(circuitId);
  if (!guide || !exposure) return null;
  const advice = adviseTires(guide, exposure, month);
  const wet = advice.wetScore >= 0.22;

  return (
    <section className="rounded-3xl border border-stroke bg-panel p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Circuit diagram · terrain · tyres</p>
          <h2 className="mt-1 text-2xl">What the lap does to weather and rubber</h2>
        </div>
        <Link href={`/circuits/${circuitId}`} className="text-sm text-teal hover:underline">
          Open full circuit page
        </Link>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <CircuitDiagram guide={guide} wet={wet} />
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
          <TireChoice advice={advice} />
        </div>
      </div>
    </section>
  );
}
