import type { HourlyProfile, MonthlyExposure, WeatherExposure } from "@/types/api";

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

export function weatherCost(
  exposure: WeatherExposure,
  weights: {
    precipitation?: number;
    wind?: number;
    gust?: number;
    visibility?: number;
    temperature?: number;
    volatility?: number;
  },
): number {
  return (
    (weights.precipitation ?? 1) * exposure.precipitation +
    (weights.wind ?? 0.5) * exposure.strong_wind +
    (weights.gust ?? 0.8) * exposure.strong_gust +
    (weights.visibility ?? 0.7) * exposure.low_visibility +
    (weights.temperature ?? 0.3) * exposure.temperature_extreme +
    (weights.volatility ?? 0.5) * exposure.volatility
  );
}

export function flexibilityWindow(
  hours: HourlyProfile[],
  durationMinutes = 120,
  startHours: number[] = [12, 13, 14, 15, 16, 17],
  tolerance = 0.03,
): {
  best_start_hour: number;
  window_start_hour: number;
  window_end_hour: number;
  flexibility_minutes: number;
  note: string;
} {
  const weights = {
    precipitation: 1,
    wind: 0.5,
    gust: 0.8,
    visibility: 0.7,
    temperature: 0.3,
    volatility: 0.5,
  };
  if (!hours.length) {
    return {
      best_start_hour: startHours[0] ?? 12,
      window_start_hour: startHours[0] ?? 12,
      window_end_hour: startHours[startHours.length - 1] ?? 17,
      flexibility_minutes: 0,
      note: "Historical scheduling flexibility, not a safety guarantee.",
    };
  }
  const scored = startHours.map((hour) => {
    const exp = exposureForWindow(hours, hour, durationMinutes);
    return { hour, cost: weatherCost(exp, weights) };
  });
  scored.sort((a, b) => a.cost - b.cost);
  const best = scored[0];
  const nearby = scored.filter((row) => Math.abs(row.cost - best.cost) <= tolerance).map((row) => row.hour);
  const window_start_hour = Math.min(...nearby);
  const window_end_hour = Math.max(...nearby);
  return {
    best_start_hour: best.hour,
    window_start_hour,
    window_end_hour,
    flexibility_minutes: Math.max(0, (window_end_hour - window_start_hour) * 60),
    note: "Historical scheduling flexibility, not a safety guarantee.",
  };
}

export function exposureFromMonthly(row: MonthlyExposure | undefined): WeatherExposure {
  if (!row) return emptyExposure();
  return {
    precipitation: row.rain_probability ?? 0,
    strong_wind: 0,
    strong_gust: row.strong_gust_probability ?? 0,
    low_visibility: row.low_visibility_probability ?? 0,
    temperature_extreme: row.high_temperature_probability ?? 0,
    volatility: row.volatility_index ?? 0,
    observation_count: row.observation_count,
    limited_sample: row.observation_count < 200,
  };
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
