import type { SessionCatalog, SessionDef } from "@/lib/dataset";
import { exposureForWindow, weatherCost } from "@/lib/exposure";
import type {
  CandidateSchedule,
  Circuit,
  HourlyProfile,
  OptimizeResponse,
  ScheduledSession,
  StationProvenance,
  WeatherExposure,
} from "@/types/api";

const PREFERRED_BROADCAST_START = 15.0;

export type OptimizerWeights = {
  precipitation?: number;
  wind?: number;
  gust?: number;
  visibility?: number;
  temperature?: number;
  volatility?: number;
  schedule_deviation?: number;
  broadcast?: number;
};

type Assignment = Record<string, number>;

type Scored = {
  assignment: Assignment;
  exposure: WeatherExposure;
  weather_cost: number;
  deviation_cost: number;
  broadcast_cost: number;
  total_cost: number;
};

function parseHhmm(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours + minutes / 60;
}

function formatHhmm(value: number): string {
  let hours = Math.floor(value) % 24;
  let minutes = Math.round((value - Math.floor(value)) * 60) % 60;
  if (minutes === 60) {
    hours = (hours + 1) % 24;
    minutes = 0;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function relativeBand(
  value: number,
  values: number[],
): CandidateSchedule["weather_band"] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (hi - lo < 1e-9) return "LOW";
  const t = (value - lo) / (hi - lo);
  if (t <= 0.15) return "VERY LOW";
  if (t <= 0.4) return "LOW";
  if (t <= 0.7) return "MEDIUM";
  return "HIGH";
}

function sessionDefs(catalog: SessionCatalog, selected?: string[]): SessionDef[] {
  if (!selected?.length) return catalog.sessions;
  const wanted = new Set(selected);
  return catalog.sessions.filter((session) => wanted.has(session.id));
}

function candidateStarts(session: SessionDef, stepMinutes: number): number[] {
  const earliest = parseHhmm(session.earliest_start);
  const latestEnd = parseHhmm(session.latest_end);
  const durationH = session.duration_minutes / 60;
  const latestStart = latestEnd - durationH;
  const starts: number[] = [];
  const step = stepMinutes / 60;
  for (let t = earliest; t <= latestStart + 1e-9; t += step) {
    starts.push(Math.round(t * 10000) / 10000);
  }
  return starts;
}

function overlaps(
  aStart: number,
  aDur: number,
  bStart: number,
  bDur: number,
  gapMinutes: number,
): boolean {
  const aEnd = aStart + aDur / 60;
  const bEnd = bStart + bDur / 60;
  const gapH = gapMinutes / 60;
  return !(aEnd + gapH <= bStart || bEnd + gapH <= aStart);
}

function isFeasible(assignment: Assignment, sessions: SessionDef[], gapMinutes: number): boolean {
  const byId = Object.fromEntries(sessions.map((session) => [session.id, session]));
  for (const session of sessions) {
    const start = assignment[session.id];
    const end = start + session.duration_minutes / 60;
    if (start < parseHhmm(session.earliest_start) - 1e-9) return false;
    if (end > parseHhmm(session.latest_end) + 1e-9) return false;
    for (const dep of session.required_after) {
      if (!(dep in assignment)) continue;
      const other = byId[dep];
      if (other.day_offset === session.day_offset) {
        const depEnd = assignment[dep] + other.duration_minutes / 60;
        if (depEnd > start + 1e-9) return false;
      } else if (other.day_offset > session.day_offset) {
        return false;
      }
    }
  }
  for (let i = 0; i < sessions.length; i += 1) {
    for (let j = i + 1; j < sessions.length; j += 1) {
      const a = sessions[i];
      const b = sessions[j];
      if (a.day_offset !== b.day_offset) continue;
      if (
        overlaps(
          assignment[a.id],
          a.duration_minutes,
          assignment[b.id],
          b.duration_minutes,
          gapMinutes,
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

function cartesian(arrays: number[][]): number[][] {
  return arrays.reduce<number[][]>(
    (acc, curr) => acc.flatMap((prefix) => curr.map((item) => [...prefix, item])),
    [[]],
  );
}

function enumerateSchedules(
  sessions: SessionDef[],
  gapMinutes: number,
  stepMinutes: number,
): Assignment[] {
  const options = sessions.map((session) => candidateStarts(session, stepMinutes));
  const ids = sessions.map((session) => session.id);
  const feasible: Assignment[] = [];
  for (const combo of cartesian(options)) {
    const assignment = Object.fromEntries(ids.map((id, index) => [id, combo[index]]));
    if (isFeasible(assignment, sessions, gapMinutes)) feasible.push(assignment);
  }
  return feasible;
}

function baselineAssignment(sessions: SessionDef[]): Assignment {
  return Object.fromEntries(sessions.map((session) => [session.id, parseHhmm(session.baseline_start)]));
}

function deviationCost(assignment: Assignment, baseline: Assignment): number {
  const keys = Object.keys(assignment);
  if (!keys.length) return 0;
  return keys.reduce((sum, key) => sum + Math.abs(assignment[key] - baseline[key]), 0) / (keys.length * 6);
}

function broadcastCost(assignment: Assignment, sessions: SessionDef[]): number {
  const race = sessions.find((session) => session.id === "race");
  if (!race || !("race" in assignment)) {
    const quali = sessions.find((session) => session.id === "qualifying");
    if (!quali || !("qualifying" in assignment)) return 0;
    return Math.min(1, Math.abs(assignment.qualifying - PREFERRED_BROADCAST_START) / 6);
  }
  return Math.min(1, Math.abs(assignment.race - PREFERRED_BROADCAST_START) / 6);
}

function scheduleExposure(
  assignment: Assignment,
  sessions: SessionDef[],
  hours: HourlyProfile[],
): WeatherExposure {
  const parts = sessions.map((session) => ({
    exp: exposureForWindow(hours, assignment[session.id], session.duration_minutes),
    minutes: session.duration_minutes,
  }));
  const totalMin = parts.reduce((sum, part) => sum + part.minutes, 0) || 1;
  const merged: WeatherExposure = {
    precipitation: 0,
    strong_wind: 0,
    strong_gust: 0,
    low_visibility: 0,
    temperature_extreme: 0,
    volatility: 0,
    observation_count: 0,
    limited_sample: false,
  };
  for (const { exp, minutes } of parts) {
    const weight = minutes / totalMin;
    merged.precipitation += exp.precipitation * weight;
    merged.strong_wind += exp.strong_wind * weight;
    merged.strong_gust += exp.strong_gust * weight;
    merged.low_visibility += exp.low_visibility * weight;
    merged.temperature_extreme += exp.temperature_extreme * weight;
    merged.volatility += exp.volatility * weight;
    merged.observation_count += exp.observation_count;
  }
  merged.limited_sample = merged.observation_count < 200;
  return merged;
}

function scoreAssignment(
  assignment: Assignment,
  sessions: SessionDef[],
  hours: HourlyProfile[],
  weights: OptimizerWeights,
  baseline: Assignment,
): Scored {
  const exposure = scheduleExposure(assignment, sessions, hours);
  const wCost = weatherCost(exposure, weights);
  const dCost = deviationCost(assignment, baseline);
  const bCost = broadcastCost(assignment, sessions);
  return {
    assignment,
    exposure,
    weather_cost: wCost,
    deviation_cost: dCost,
    broadcast_cost: bCost,
    total_cost:
      wCost + (weights.schedule_deviation ?? 0.6) * dCost + (weights.broadcast ?? 0.4) * bCost,
  };
}

function sessionPayload(
  assignment: Assignment,
  sessions: SessionDef[],
  hours: HourlyProfile[],
): ScheduledSession[] {
  return sessions.map((session) => {
    const start = assignment[session.id];
    const end = start + session.duration_minutes / 60;
    return {
      session_id: session.id,
      name: session.name,
      day_name: session.day_name,
      start_time: formatHhmm(start),
      end_time: formatHhmm(end),
      duration_minutes: session.duration_minutes,
      exposure: exposureForWindow(hours, start, session.duration_minutes),
    };
  });
}

function candidateDict(
  score: Scored,
  sessions: SessionDef[],
  hours: HourlyProfile[],
  cid: string,
  label: string,
  summary: string,
): CandidateSchedule {
  return {
    id: cid,
    label,
    summary,
    weather_cost: Number(score.weather_cost.toFixed(4)),
    deviation_cost: Number(score.deviation_cost.toFixed(4)),
    broadcast_cost: Number(score.broadcast_cost.toFixed(4)),
    total_cost: Number(score.total_cost.toFixed(4)),
    weather_band: "MEDIUM",
    deviation_band: "MEDIUM",
    sessions: sessionPayload(score.assignment, sessions, hours),
  };
}

function applyRelativeBands(payloads: CandidateSchedule[]): void {
  const weatherVals = payloads.map((payload) => payload.weather_cost);
  const deviationVals = payloads.map((payload) => payload.deviation_cost);
  for (const payload of payloads) {
    payload.weather_band = relativeBand(payload.weather_cost, weatherVals);
    payload.deviation_band = relativeBand(payload.deviation_cost, deviationVals);
  }
}

function assignmentKey(assignment: Assignment): string {
  return Object.entries(assignment)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

export function optimize(options: {
  circuit: Circuit;
  month: number;
  hours: HourlyProfile[];
  sessions: SessionCatalog;
  provenance: StationProvenance;
  weights?: OptimizerWeights;
  selectedSessions?: string[];
  limit?: number;
}): OptimizeResponse {
  const {
    circuit,
    month,
    hours,
    sessions: catalog,
    provenance,
    weights = {},
    selectedSessions,
    limit = 5,
  } = options;
  const sessions = sessionDefs(catalog, selectedSessions);
  const gap = catalog.min_gap_minutes;
  const step = catalog.step_minutes;
  const baseline = baselineAssignment(sessions);
  let feasible = enumerateSchedules(sessions, gap, step);
  if (!feasible.length) feasible = [baseline];

  const scored = feasible.map((assignment) =>
    scoreAssignment(assignment, sessions, hours, weights, baseline),
  );
  const baselineScore = scoreAssignment(baseline, sessions, hours, weights, baseline);

  const weatherBest = scored.reduce((best, row) => (row.weather_cost < best.weather_cost ? row : best));
  const deviationBest = scored.reduce((best, row) =>
    row.deviation_cost < best.deviation_cost ? row : best,
  );
  const balanced = scored.reduce((best, row) => (row.total_cost < best.total_cost ? row : best));
  const rainBest = scored.reduce((best, row) =>
    row.exposure.precipitation < best.exposure.precipitation ? row : best,
  );
  const morning = scored.reduce((best, row) => {
    const bestHour = best.assignment.race ?? best.assignment.qualifying ?? 24;
    const rowHour = row.assignment.race ?? row.assignment.qualifying ?? 24;
    return rowHour < bestHour ? row : best;
  });
  const lateRace = scored.reduce((best, row) => {
    const bestHour = best.assignment.race ?? best.assignment.qualifying ?? 0;
    const rowHour = row.assignment.race ?? row.assignment.qualifying ?? 0;
    return rowHour > bestHour ? row : best;
  });

  const picks: [Scored, string][] = [
    [weatherBest, "Lowest historical weather exposure"],
    [balanced, "Balanced weather vs schedule change"],
    [deviationBest, "Closest to the current weekend template"],
    [rainBest, "Lowest historical precipitation exposure"],
    [morning, "Earliest race/qualifying window among feasible options"],
    [lateRace, "Latest feasible race window — useful broadcast comparison"],
  ];
  for (const score of [...scored].sort((a, b) => a.total_cost - b.total_cost)) {
    picks.push([score, "Another feasible trade-off on the cost surface"]);
  }

  const unique: CandidateSchedule[] = [];
  const seen = new Set<string>();
  const letters = "ABCDEFGH";
  for (const [score, summary] of picks) {
    const key = assignmentKey(score.assignment);
    if (seen.has(key)) continue;
    seen.add(key);
    const letter = letters[unique.length];
    unique.push(
      candidateDict(
        score,
        sessions,
        hours,
        `candidate-${letter.toLowerCase()}`,
        `Candidate ${letter}`,
        summary,
      ),
    );
    if (unique.length >= limit) break;
  }

  const baselinePayload = candidateDict(
    baselineScore,
    sessions,
    hours,
    "baseline",
    "Current template",
    "Illustrative British GP weekend structure used as the reference schedule.",
  );
  applyRelativeBands([baselinePayload, ...unique]);
  return {
    circuit,
    month,
    baseline: baselinePayload,
    candidates: unique,
    provenance,
  };
}
