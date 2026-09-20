import { asset } from "@/lib/paths";
import type {
  CircuitExtras,
  Era5MonthClimate,
  ExtrasDataset,
  OpenF1MeetingWeather,
} from "@/types/api";

let cache: ExtrasDataset | null = null;

export async function loadExtras(): Promise<ExtrasDataset> {
  if (cache) return cache;
  const response = await fetch(asset("/data/extras.json"));
  if (!response.ok) {
    throw new Error(`Could not load extra datasets (${response.status})`);
  }
  cache = (await response.json()) as ExtrasDataset;
  return cache;
}

export function extrasFor(dataset: ExtrasDataset | null, circuitId: string): CircuitExtras | null {
  return dataset?.circuits[circuitId] ?? null;
}

export function climateForMonth(extras: CircuitExtras | null, month: number): Era5MonthClimate | null {
  return extras?.climate.find((row) => row.month === month) ?? null;
}

export function grandPrixMeetings(extras: CircuitExtras | null): OpenF1MeetingWeather[] {
  if (!extras) return [];
  return extras.openf1.filter((meeting) => {
    const name = meeting.meeting_name ?? "";
    if (/test|pre-season|testing/i.test(name)) return false;
    return /grand prix/i.test(name) || Boolean(meeting.sessions?.some((session) => session.name === "Race"));
  });
}

export function latestMeeting(extras: CircuitExtras | null): OpenF1MeetingWeather | null {
  const meetings = grandPrixMeetings(extras);
  return meetings.length ? meetings[meetings.length - 1] : extras?.openf1.at(-1) ?? null;
}

export function mm(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)} mm`;
}

export function degC(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}°C`;
}
