import type {
  Circuit,
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
  hourly: (HourlyProfile & { month: number })[];
  monthly: MonthlyExposure[];
  provenance: StationProvenance;
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

export function hoursForMonth(dataset: StaticDataset, month: number) {
  return dataset.hourly.filter((row) => row.month === month);
}
