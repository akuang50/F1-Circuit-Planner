"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Counterfactual } from "@/components/Counterfactual";
import { ExposureList, MetricBar } from "@/components/MetricBar";
import { HourlyChart } from "@/components/HourlyChart";
import { Provenance } from "@/components/Provenance";
import { RaceSlider } from "@/components/RaceSlider";
import { ScheduleCard } from "@/components/ScheduleCard";
import { MONTHS, apiGet, apiPost, hourLabel } from "@/lib/api";
import { exposureForWindow } from "@/lib/exposure";
import type {
  CandidateSchedule,
  Circuit,
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
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [circuitId, setCircuitId] = useState("silverstone");
  const [month, setMonth] = useState(7);
  const [raceHour, setRaceHour] = useState(13);
  const [profile, setProfile] = useState<WeatherProfileResponse | null>(null);
  const [hourly, setHourly] = useState<WeatherByHourResponse | null>(null);
  const [optimize, setOptimize] = useState<OptimizeResponse | null>(null);
  const [weatherWeight, setWeatherWeight] = useState(1);
  const [scheduleWeight, setScheduleWeight] = useState(0.6);
  const [broadcastWeight, setBroadcastWeight] = useState(0.4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ circuits: Circuit[] }>("/api/circuits")
      .then((data) => setCircuits(data.circuits))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setOptimize(null);
    Promise.all([
      apiGet<WeatherProfileResponse>(
        `/api/circuits/${circuitId}/weather-profile?month=${month}&start_hour=12&end_hour=18`,
      ),
      apiGet<WeatherByHourResponse>(`/api/circuits/${circuitId}/weather-by-hour?month=${month}`),
    ])
      .then(([profileData, hourlyData]) => {
        if (cancelled) return;
        setProfile(profileData);
        setHourly(hourlyData);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [circuitId, month]);

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

  async function generateScenarios() {
    setBusy(true);
    setError(null);
    try {
      const result = await apiPost<OptimizeResponse>("/api/optimize", {
        circuit: circuitId,
        month,
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
      setOptimize(result);
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
            What if the British GP started two hours earlier?
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            Counterfactual planning from historical observations. Humans still own safety, sport, broadcast and logistics.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-muted">
            Circuit
            <select
              className="rounded-xl border border-stroke bg-panel px-3 py-2 text-sm text-foreground"
              value={circuitId}
              onChange={(event) => setCircuitId(event.target.value)}
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
          <Link
            href="/climate"
            className="self-end rounded-xl border border-stroke px-4 py-2 text-sm hover:border-white/30"
          >
            Climate profile
          </Link>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-f1/40 bg-f1/10 px-4 py-3 text-sm">
          {error}. Start the API on port 8000 if it is not running.
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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
        {optimize ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ScheduleCard schedule={optimize.baseline} featured />
            {optimize.candidates.map((candidate: CandidateSchedule) => (
              <ScheduleCard key={candidate.id} schedule={candidate} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Generate at least three valid weekend schedules to compare weather vs disruption.</p>
        )}
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
