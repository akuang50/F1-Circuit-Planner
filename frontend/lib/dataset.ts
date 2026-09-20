import type {
  Circuit,
  CircuitHistory,
  HourlyProfile,
  MonthlyExposure,
  StationProvenance,
} from "@/types/api";
import { asset } from "@/lib/paths";

export type SessionDef = {
  id: string;
  name: string;
  day_offset: number;
  day_name: string;
  duration_minutes: number;
  earliest_start: string;
  latest_end: string;
  required_after: string[];
  baseline_start: string;
};

export type SessionCatalog = {
  comment?: string;
  baseline_event?: string;
  min_gap_minutes: number;
  step_minutes: number;
  sessions: SessionDef[];
};

export type StaticDataset = {
  circuits: Circuit[];
  sessions: SessionCatalog;
  hourly: (HourlyProfile & { month: number; circuit_id?: string })[];
  monthly: (MonthlyExposure & { circuit_id?: string })[];
  provenance: StationProvenance;
  provenances?: Record<string, StationProvenance>;
  history?: CircuitHistory;
};

let cache: StaticDataset | null = null;

export async function loadDataset(): Promise<StaticDataset> {
  if (cache) return cache;
  const response = await fetch(asset("/data/app.json"));
  if (!response.ok) {
    throw new Error(`Could not load historical profiles (${response.status})`);
  }
  cache = (await response.json()) as StaticDataset;
  return cache;
}

export function hoursForMonth(dataset: StaticDataset, month: number, circuitId?: string) {
  return dataset.hourly.filter((row) => {
    if (row.month !== month) return false;
    if (!circuitId) return true;
    return !row.circuit_id || row.circuit_id === circuitId;
  });
}

export function monthlyForCircuit(dataset: StaticDataset, circuitId: string) {
  const rows = dataset.monthly.filter((row) => !row.circuit_id || row.circuit_id === circuitId);
  return rows.length ? rows : dataset.monthly;
}

export function provenanceFor(dataset: StaticDataset, circuitId: string): StationProvenance {
  return dataset.provenances?.[circuitId] ?? dataset.provenance;
}
