import type { HourlyProfile, WeatherExposure } from "@/types/api";

function emptyExposure(): WeatherExposure {
  return {
    precipitation: 0,
    strong_wind: 0,
    strong_gust: 0,
    low_visibility: 0,
    temperature_extreme: 0,
    volatility: 0,
    observation_count: 0,
    limited_sample: true,
  };
}

function windowWeights(startHour: number, durationMinutes: number): [number, number][] {
  let remaining = durationMinutes;
  let hour = Math.floor(startHour);
  const offset = Math.round((startHour - hour) * 60);
  const weights: [number, number][] = [];
  const first = Math.min(remaining, 60 - offset);
  if (first > 0) {
    weights.push([hour % 24, first]);
    remaining -= first;
    hour += 1;
  }
  while (remaining > 0) {
    const span = Math.min(60, remaining);
    weights.push([hour % 24, span]);
    remaining -= span;
    hour += 1;
  }
  return weights;
}

function weighted(hours: HourlyProfile[], field: keyof HourlyProfile, weights: [number, number][]): number {
  let acc = 0;
  let wsum = 0;
  const byHour = new Map(hours.map((row) => [Number(row.hour), row]));
  for (const [hour, minutes] of weights) {
    const row = byHour.get(hour);
    const value = row ? Number(row[field]) : NaN;
    if (!Number.isNaN(value)) {
      acc += value * minutes;
      wsum += minutes;
    }
  }
  return wsum ? acc / wsum : 0;
}

export function exposureForWindow(
  hours: HourlyProfile[],
  startHour: number,
  durationMinutes = 120,
): WeatherExposure {
  if (!hours.length) return emptyExposure();
  const weights = windowWeights(startHour, durationMinutes);
  const byHour = new Map(hours.map((row) => [row.hour, row]));
  const observation_count = weights.reduce((sum, [hour]) => sum + (byHour.get(hour)?.observation_count ?? 0), 0);
  return {
    precipitation: weighted(hours, "rain_probability", weights),
    strong_wind: weighted(hours, "strong_wind_probability", weights),
    strong_gust: weighted(hours, "strong_gust_probability", weights),
    low_visibility: weighted(hours, "low_visibility_probability", weights),
    temperature_extreme: weighted(hours, "high_temperature_probability", weights),
    volatility: weighted(hours, "volatility_index", weights),
    observation_count,
    limited_sample: observation_count < 200,
  };
}
