import weatherCatalog from "@/data/circuits.json";
import historyCatalog from "@/data/circuit-history.json";
import type { Circuit, CircuitHistoryEntry } from "@/types/api";

export const WEATHER_CIRCUITS = weatherCatalog.circuits as Circuit[];
export const HISTORY_CIRCUITS = historyCatalog.circuits as CircuitHistoryEntry[];
export const HISTORY_SOURCE = historyCatalog.source as string;

export function yearsFromSeasons(seasons: string): number[] {
  const years = new Set<number>();
  for (const chunk of seasons.split(",")) {
    const token = chunk.trim().replace(/\s/g, "").replace(/–/g, "-");
    const range = token.match(/^(\d{4})-(\d{4})$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      for (let year = start; year <= end; year += 1) years.add(year);
      continue;
    }
    if (/^\d{4}$/.test(token)) years.add(Number(token));
  }
  return [...years].sort((a, b) => a - b);
}

export function circuitsInYear(year: number): CircuitHistoryEntry[] {
  return HISTORY_CIRCUITS.filter((row) => yearsFromSeasons(row.seasons).includes(year)).sort(
    (a, b) => a.name.localeCompare(b.name),
  );
}

export const CALENDAR_2026 = WEATHER_CIRCUITS.filter((row) => row.current_2026).sort(
  (a, b) => (a.typical_month ?? 99) - (b.typical_month ?? 99),
);

export const HISTORY_YEARS = Array.from({ length: 2026 - 1950 + 1 }, (_, index) => 1950 + index);
