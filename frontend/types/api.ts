export type Circuit = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation_m: number | null;
  event?: string;
  typical_month?: number;
  current_2026?: boolean;
};

export type WeatherExposure = {
  precipitation: number;
  strong_wind: number;
  strong_gust: number;
  low_visibility: number;
  temperature_extreme: number;
  volatility: number;
  observation_count: number;
  limited_sample: boolean;
};

export type StationProvenance = {
  data_source: string;
  registry: string;
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  start_year: number;
  end_year: number;
  observation_count: number;
  generated_at: string;
  model_version: string;
  rationale: string;
  thresholds: {
    precipitation_mm: number;
    strong_wind_ms: number;
    strong_gust_ms: number;
    low_visibility_m: number;
    high_temperature_c: number;
  };
};

export type HourlyProfile = {
  circuit_id?: string;
  month?: number;
  hour: number;
  observation_count: number;
  rain_probability: number | null;
  strong_wind_probability: number | null;
  strong_gust_probability: number | null;
  low_visibility_probability: number | null;
  high_temperature_probability: number | null;
  mean_temperature: number | null;
  p50_temperature: number | null;
  p90_temperature: number | null;
  mean_wind: number | null;
  p90_wind: number | null;
  mean_gust: number | null;
  p90_gust: number | null;
  median_visibility: number | null;
  weather_change_frequency: number | null;
  volatility_index: number | null;
  volatility_label: "LOW" | "MEDIUM" | "HIGH" | null;
};

export type Flexibility = {
  best_start_hour: number;
  window_start_hour: number;
  window_end_hour: number;
  flexibility_minutes: number;
  note: string;
};

export type WeatherProfileResponse = {
  circuit: Circuit;
  month: number;
  start_hour: number;
  end_hour: number;
  exposure: WeatherExposure;
  flexibility: Flexibility;
  volatility_label: "LOW" | "MEDIUM" | "HIGH" | null;
  provenance: StationProvenance;
};

export type WeatherByHourResponse = {
  circuit: Circuit;
  month: number;
  hours: HourlyProfile[];
  provenance: StationProvenance;
};

export type ScenarioResponse = {
  circuit: Circuit;
  month: number;
  original_start: string;
  alternative_start: string;
  duration_minutes: number;
  original: WeatherExposure;
  alternative: WeatherExposure;
  delta: Record<string, number>;
  provenance: StationProvenance;
};

export type ScheduledSession = {
  session_id: string;
  name: string;
  day_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  exposure: WeatherExposure;
};

export type CandidateSchedule = {
  id: string;
  label: string;
  summary: string;
  weather_cost: number;
  deviation_cost: number;
  broadcast_cost: number;
  total_cost: number;
  weather_band: "VERY LOW" | "LOW" | "MEDIUM" | "HIGH";
  deviation_band: "VERY LOW" | "LOW" | "MEDIUM" | "HIGH";
  sessions: ScheduledSession[];
};

export type OptimizeResponse = {
  circuit: Circuit;
  month: number;
  baseline: CandidateSchedule;
  candidates: CandidateSchedule[];
  provenance: StationProvenance;
};

export type MonthlyExposure = {
  circuit_id?: string;
  month: number;
  observation_count: number;
  rain_probability: number | null;
  strong_gust_probability: number | null;
  low_visibility_probability: number | null;
  high_temperature_probability: number | null;
  volatility_index: number | null;
  volatility_label: "LOW" | "MEDIUM" | "HIGH" | null;
};

export type CircuitHistoryEntry = {
  id: string;
  name: string;
  country: string;
  location: string;
  type: string;
  grands_prix: string[];
  seasons: string;
  races: number;
  weather_circuit_id?: string;
  current_2026?: boolean;
};

export type CircuitHistory = {
  source: string;
  note?: string;
  circuits: CircuitHistoryEntry[];
};

export type ClimateProfileResponse = {
  circuit: Circuit;
  months: MonthlyExposure[];
  provenance: StationProvenance;
};

export type ExtraSource = {
  id: string;
  name: string;
  url: string;
  note: string;
};

export type Era5MonthClimate = {
  month: number;
  days: number;
  rain_days: number;
  rain_day_fraction: number | null;
  mean_precip_mm: number | null;
  mean_temp_c: number | null;
  max_temp_c: number | null;
  min_temp_c: number | null;
  mean_wind_kmh: number | null;
  mean_gust_kmh: number | null;
  mean_precip_hours: number | null;
  storm_day_fraction: number | null;
  fog_day_fraction: number | null;
  median_sunrise: string | null;
  median_sunset: string | null;
  daylight_hours: number | null;
};

export type RaceDayClimate = {
  season: number;
  round: number;
  date: string;
  event: string;
  winner?: string | null;
  status?: string | null;
  laps?: number | null;
  precip_mm: number | null;
  wet: boolean | null;
  temp_mean_c: number | null;
  weather_code?: number | null;
};

export type RaceDaySummary = {
  races: number;
  wet_races: number;
  wet_fraction: number | null;
  mean_precip_mm: number | null;
  mean_temp_c: number | null;
  first_season: number | null;
  last_season: number | null;
};

export type OpenF1SessionWeather = {
  name?: string;
  samples: number;
  rainfall_fraction: number | null;
  mean_track_temp_c: number | null;
  mean_air_temp_c: number | null;
  mean_humidity: number | null;
  mean_wind_ms: number | null;
};

export type OpenF1MeetingWeather = OpenF1SessionWeather & {
  year: number;
  meeting_name: string | null;
  date_start: string | null;
  sessions?: OpenF1SessionWeather[];
};

export type CircuitExtras = {
  elevation_m: number | null;
  climate: Era5MonthClimate[];
  race_days: RaceDayClimate[];
  race_day_summary: RaceDaySummary;
  openf1: OpenF1MeetingWeather[];
};

export type ExtrasDataset = {
  generated_at: string;
  period: { start: string; end: string };
  rain_day_mm: number;
  sources: ExtraSource[];
  circuits: Record<string, CircuitExtras>;
};
