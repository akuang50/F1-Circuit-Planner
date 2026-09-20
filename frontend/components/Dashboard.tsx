"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CircuitGuidePanel } from "@/components/CircuitGuidePanel";
import { Counterfactual } from "@/components/Counterfactual";
import { ExposureList, MetricBar } from "@/components/MetricBar";
import { HourlyChart } from "@/components/HourlyChart";
import { Provenance } from "@/components/Provenance";
import { RaceClimatePanel } from "@/components/RaceClimatePanel";
import { RaceSlider } from "@/components/RaceSlider";
import { ScheduleCard } from "@/components/ScheduleCard";
import { MONTHS, hourLabel } from "@/lib/api";
import { CIRCUIT_SELECT_EVENT } from "@/lib/circuitNav";
import { hoursForMonth, loadDataset, provenanceFor, type StaticDataset } from "@/lib/dataset";
import { loadExtras } from "@/lib/extras";
import { exposureForWindow, flexibilityWindow } from "@/lib/exposure";
import { optimize } from "@/lib/optimizer";
import type {
  CandidateSchedule,
  Circuit,
  ExtrasDataset,
  OptimizeResponse,
  ScenarioResponse,
  WeatherByHourResponse,
  WeatherProfileResponse,
} from "@/types/api";

const CircuitMap = dynamic(
  () => import("@/components/CircuitMap").then((mod) => mod.CircuitMap),
  { ssr: false, loading: () => <div className="h-56 rounded-2xl bg-panel-2" /> },
);

const ORIGINAL_START = 16;

export function Dashboard() {
  const [dataset, setDataset] = useState<StaticDataset | null>(null);
  const [extras, setExtras] = useState<ExtrasDataset | null>(null);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [circuitId, setCircuitId] = useState("silverstone");
  const [month, setMonth] = useState(7);
  const [raceHour, setRaceHour] = useState(13);
  const [profile, setProfile] = useState<WeatherProfileResponse | null>(null);
  const [hourly, setHourly] = useState<WeatherByHourResponse | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResponse | null>(null);
  const [weatherWeight, setWeatherWeight] = useState(1);
  const [scheduleWeight, setScheduleWeight] = useState(0.6);
  const [broadcastWeight, setBroadcastWeight] = useState(0.4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDataset()
      .then((data) => {
        if (cancelled) return;
        setDataset(data);
        setCircuits(data.circuits);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    loadExtras()
      .then((data) => {
        if (!cancelled) setExtras(data);
      })
      .catch(() => {
        if (!cancelled) setExtras(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dataset) return;
    const circuit =
      dataset.circuits.find((item) => item.id === circuitId) ?? dataset.circuits[0];
    const hours = hoursForMonth(dataset, month, circuitId);
    const exposure = exposureForWindow(hours, 12, 360);
    const provenance = provenanceFor(dataset, circuit.id);
    setHourly({
      circuit,
      month,
      hours,
      provenance,
    });
    setProfile({
      circuit,
      month,
      start_hour: 12,
      end_hour: 18,
      exposure,
      flexibility: flexibilityWindow(hours),
      volatility_label:
        exposure.volatility > 0.28 ? "HIGH" : exposure.volatility > 0.12 ? "MEDIUM" : "LOW",
      provenance,
    });
    setOptimizeResult(null);
  }, [dataset, circuitId, month]);

  const scenario = useMemo<ScenarioResponse | null>(() => {
    const hours = hourly?.hours ?? [];
    if (!hours.length || !hourly) return null;
    const original = exposureForWindow(hours, ORIGINAL_START, 120);
    const alternative = exposureForWindow(hours, raceHour, 120);
    const keys = [
      "precipitation",
      "strong_wind",
      "strong_gust",
      "low_visibility",
      "temperature_extreme",
      "volatility",
    ] as const;
    const delta = Object.fromEntries(
      keys.map((key) => [key, Number((alternative[key] - original[key]).toFixed(4))]),
    );
    return {
      circuit: hourly.circuit,
      month,
      original_start: hourLabel(ORIGINAL_START),
      alternative_start: hourLabel(raceHour),
      duration_minutes: 120,
      original,
      alternative,
      delta,
      provenance: hourly.provenance,
    };
  }, [hourly, month, raceHour]);

  const afternoonExposure = useMemo(() => {
    if (!hourly?.hours.length) return null;
    return exposureForWindow(hourly.hours, 12, 360);
  }, [hourly]);

  const circuit = useMemo(
    () => circuits.find((item) => item.id === circuitId) ?? profile?.circuit ?? hourly?.circuit,
    [circuits, circuitId, profile, hourly],
  );

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("circuit");
    if (fromUrl) setCircuitId(fromUrl);
    function onSelect(event: Event) {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (id) setCircuitId(id);
    }
    function onPop() {
      const next = new URLSearchParams(window.location.search).get("circuit");
      if (next) setCircuitId(next);
    }
    window.addEventListener(CIRCUIT_SELECT_EVENT, onSelect);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener(CIRCUIT_SELECT_EVENT, onSelect);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    if (!dataset) return;
    const next = dataset.circuits.find((item) => item.id === circuitId);
    if (next?.typical_month) setMonth(next.typical_month);
  }, [circuitId, dataset]);

  useEffect(() => {
    function scrollToHash() {
      const id = window.location.hash.slice(1);
      if (id !== "layout" && id !== "weather" && id !== "calendar" && id !== "datasets") return;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  const layoutReady = Boolean(afternoonExposure);

  useEffect(() => {
    if (!layoutReady) return;
    if (window.location.hash !== "#layout") return;
    const timer = window.setTimeout(() => {
      document.getElementById("layout")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [circuitId, layoutReady]);

  useEffect(() => {
    if (!extras) return;
    if (window.location.hash !== "#datasets") return;
    const timer = window.setTimeout(() => {
      document.getElementById("datasets")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [circuitId, extras]);

  async function generateScenarios() {
    if (!hourly || !dataset) return;
    setBusy(true);
    setError(null);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 20));
      const result = optimize({
        circuit: hourly.circuit,
        month,
        hours: hourly.hours,
        sessions: dataset.sessions,
        provenance: hourly.provenance,
        weights: {
          precipitation: weatherWeight,
          wind: weatherWeight * 0.5,
          gust: weatherWeight * 0.8,
          visibility: weatherWeight * 0.7,
          volatility: weatherWeight * 0.5,
          schedule_deviation: scheduleWeight,
          broadcast: broadcastWeight,
        },
      });
      setOptimizeResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimize failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-center text-xs uppercase tracking-[0.22em] text-amber">
        Historical NOAA ISD analysis — not a weather forecast
      </div>

      <header className="flex flex-col gap-5 border-b border-stroke pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-f1">F1 Weather Resilience</p>
          <h1 className="mt-2 max-w-2xl text-3xl leading-tight sm:text-5xl">
            What if the {circuit?.event ?? "British Grand Prix"} started two hours earlier?
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Counterfactual planning from historical observations. Humans still own safety, sport, broadcast and logistics
            — the lesson Formula 1 relearned in the wet at Suzuka in 2014.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
            Circuit
            <select
              className="rounded-xl border border-stroke bg-panel px-3 py-2 text-sm text-foreground"
              value={circuitId}
              onChange={(event) => {
                const nextId = event.target.value;
                setCircuitId(nextId);
                const nextCircuit = dataset?.circuits.find((item) => item.id === nextId);
                if (nextCircuit?.typical_month) setMonth(nextCircuit.typical_month);
                const url = new URL(window.location.href);
                url.searchParams.set("circuit", nextId);
                window.history.replaceState(null, "", url);
              }}
            >
              {(circuits.length ? circuits : [{ id: "silverstone", name: "Silverstone Circuit" }]).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
            Month
            <select
              className="rounded-xl border border-stroke bg-panel px-3 py-2 text-sm text-foreground"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <a
            href="#layout"
            className="self-end rounded-xl border border-stroke px-4 py-2 text-sm hover:border-white/30"
          >
            3D layout
          </a>
          <Link
            href="/circuits"
            className="self-end rounded-xl border border-stroke px-4 py-2 text-sm hover:border-white/30"
          >
            Circuit history
          </Link>
          <Link
            href={`/climate?circuit=${circuitId}`}
            className="self-end rounded-xl border border-stroke px-4 py-2 text-sm hover:border-white/30"
          >
            Climate profile
          </Link>
          <Link
            href="/safety"
            className="self-end rounded-xl border border-stroke px-4 py-2 text-sm hover:border-white/30"
          >
            Safety history
          </Link>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 text-sm">
        <a href="#weather" className="rounded-full border border-stroke px-3 py-1.5 hover:border-white/30">
          Weather planner
        </a>
        <a href="#layout" className="rounded-full border border-stroke px-3 py-1.5 hover:border-white/30">
          3D layout and tyres
        </a>
        <a href="#datasets" className="rounded-full border border-stroke px-3 py-1.5 hover:border-white/30">
          Race-day climate
        </a>
        <a href="#calendar" className="rounded-full border border-stroke px-3 py-1.5 hover:border-white/30">
          2026 calendar
        </a>
      </nav>

      {error ? (
        <p className="rounded-xl border border-f1/40 bg-f1/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {circuit && afternoonExposure ? (
        <CircuitGuidePanel
          circuitId={circuit.id}
          month={month}
          exposure={afternoonExposure}
          extras={extras}
        />
      ) : (
        <section id="layout" className="scroll-mt-24 rounded-3xl border border-stroke bg-panel p-5">
          <p className="text-muted">Loading 3D layout…</p>
        </section>
      )}

      {extras ? <RaceClimatePanel circuitId={circuitId} month={month} extras={extras} /> : null}

      <section id="weather" className="scroll-mt-24 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-stroke bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Historical weather profile</p>
            <h2 className="mt-1 text-2xl">
              {circuit?.name ?? "Silverstone"} · {MONTHS[month - 1]}
            </h2>
            {afternoonExposure && hourly ? (
              <div className="mt-6 space-y-5">
                <ExposureList exposure={afternoonExposure} />
                <MetricBar
                  label="Volatility"
                  value={afternoonExposure.volatility}
                  hint={`${afternoonExposure.volatility > 0.28 ? "HIGH" : afternoonExposure.volatility > 0.12 ? "MEDIUM" : "LOW"} · how often adjacent hours change`}
                  accent="amber"
                />
                <p className="text-sm text-muted">
                  Historical scheduling flexibility for a two-hour race window: {hourLabel(profile?.flexibility.window_start_hour ?? 12)}–
                  {hourLabel(profile?.flexibility.window_end_hour ?? 17)} (best start {hourLabel(profile?.flexibility.best_start_hour ?? 12)}).
                  This is not a safety guarantee.
                </p>
                {afternoonExposure.limited_sample ? (
                  <p className="text-amber">Limited historical observations for this slice.</p>
                ) : (
                  <p className="font-mono text-xs text-muted">n = {afternoonExposure.observation_count.toLocaleString()} observations in the 12:00–18:00 window</p>
                )}
              </div>
            ) : (
              <p className="mt-6 text-muted">Loading NOAA ISD profiles…</p>
            )}
          </div>

          <div className="rounded-3xl border border-stroke bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Hourly historical distribution</p>
            <h2 className="mt-1 text-2xl">How the day typically behaves</h2>
            <div className="mt-4">
              {hourly ? <HourlyChart hours={hourly.hours} selectedHour={raceHour} /> : <p className="text-muted">Loading hours…</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-stroke bg-panel p-5">
            <RaceSlider value={raceHour} onChange={setRaceHour} />
            <p className="mt-4 text-sm text-muted">
              Reference race: {hourLabel(ORIGINAL_START)}. Drag to ask: what if Sunday moved?
            </p>
          </div>
          <div className="rounded-3xl border border-stroke bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Compare times</p>
            <h2 className="mt-1 text-2xl">Counterfactual exposure</h2>
            <div className="mt-4">
              {scenario ? <Counterfactual data={scenario} /> : <p className="text-muted">Computing scenario…</p>}
            </div>
          </div>
          {circuit && profile ? <CircuitMap circuit={circuit} provenance={profile.provenance} /> : null}
        </div>
      </section>

      <section className="rounded-3xl border border-stroke bg-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Optimize weekend</p>
            <h2 className="mt-1 text-2xl">Several feasible templates, not one answer</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              FP1–Race, minimum gaps, no overlaps. Weights are yours: there is no universal trade-off between rain, wind and TV.
            </p>
          </div>
          <button
            type="button"
            onClick={generateScenarios}
            disabled={busy}
            className="rounded-full bg-f1 px-5 py-3 text-sm uppercase tracking-[0.16em] disabled:opacity-50"
          >
            {busy ? "Searching…" : "Generate scenarios"}
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <WeightSlider label="Weather" value={weatherWeight} onChange={setWeatherWeight} />
          <WeightSlider label="Schedule fidelity" value={scheduleWeight} onChange={setScheduleWeight} />
          <WeightSlider label="Broadcast window" value={broadcastWeight} onChange={setBroadcastWeight} />
        </div>
        {optimizeResult ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ScheduleCard schedule={optimizeResult.baseline} featured />
            {optimizeResult.candidates.map((candidate: CandidateSchedule) => (
              <ScheduleCard key={candidate.id} schedule={candidate} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Generate at least three valid weekend schedules to compare weather vs disruption.</p>
        )}
      </section>

      <section className="rounded-3xl border border-stroke bg-panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Formula 1 safety history</p>
        <h2 className="mt-1 text-2xl">The wet taught the sport to slow the field</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          On 5 October 2014 Jules Bianchi crashed in the rain at Suzuka, striking a recovery vehicle. He died the next
          July. The FIA’s answer was not a cleverer forecast. It was the Virtual Safety Car in 2015: an enforced slow
          zone so cranes are not sharing the road with cars at speed. Halo (2018) came from a longer head-protection
          programme and later proved itself — including Zhou Guanyu at this circuit in 2022.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Imola 1994, debris accidents in 2009, Bahrain 2020: each one bought a rule, a barrier, or a piece of the car.
          This NOAA table is none of those things.
        </p>
        <Link
          href="/safety"
          className="mt-4 inline-block rounded-xl border border-stroke px-4 py-2 text-sm hover:border-white/30"
        >
          Full safety timeline
        </Link>
      </section>

      {profile ? <Provenance data={profile.provenance} /> : null}
    </div>
  );
}

function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs uppercase tracking-[0.16em] text-muted">
        {label}
        <span className="font-mono text-foreground">{value.toFixed(1)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={2}
        step={0.1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-[#e10600]"
      />
    </label>
  );
}
