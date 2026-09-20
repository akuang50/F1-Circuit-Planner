"use client";

import { useState } from "react";
import { CircuitDiagram, ElevationProfile } from "@/components/CircuitDiagram";
import { CircuitTrack3D } from "@/components/CircuitTrack3D";
import { TireChoice } from "@/components/TireChoice";
import { getCircuitGuide } from "@/lib/circuitGuides";
import { extrasFor } from "@/lib/extras";
import { adviseTires } from "@/lib/tireAdvice";
import type { CircuitExtras, ExtrasDataset, WeatherExposure } from "@/types/api";

export function CircuitGuidePanel({
  circuitId,
  month,
  exposure,
  extras = null,
}: {
  circuitId: string;
  month: number;
  exposure: WeatherExposure | null;
  extras?: ExtrasDataset | CircuitExtras | null;
}) {
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const guide = getCircuitGuide(circuitId);
  if (!guide || !exposure) return null;
  const circuitExtras = extras && "circuits" in extras ? extrasFor(extras, circuitId) : extras;
  const advice = adviseTires(guide, exposure, month, circuitExtras);
  const wet = advice.wetScore >= 0.22;

  return (
    <section id="layout" className="scroll-mt-24 rounded-3xl border border-stroke bg-panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">3D layout · terrain · tyres</p>
          <h2 className="mt-1 text-2xl">What the lap does to weather and rubber</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-stroke p-1 text-xs">
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${mode === "3d" ? "bg-white/10" : "text-muted"}`}
              onClick={() => setMode("3d")}
            >
              3D
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${mode === "2d" ? "bg-white/10" : "text-muted"}`}
              onClick={() => setMode("2d")}
            >
              Plan
            </button>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {mode === "3d" ? <CircuitTrack3D guide={guide} wet={wet} /> : <CircuitDiagram guide={guide} wet={wet} />}
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
