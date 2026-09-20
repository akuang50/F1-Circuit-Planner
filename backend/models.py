"""Pydantic models for the weather-resilience API."""

from __future__ import annotations

from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, Field


class Circuit(BaseModel):
    id: str
    name: str
    country: str
    latitude: float
    longitude: float
    timezone: str
    elevation_m: float | None = None


class StationProvenance(BaseModel):
    data_source: str
    registry: str
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    distance_km: float
    start_year: int
    end_year: int
    observation_count: int
    generated_at: str
    model_version: str
    rationale: str
    thresholds: dict


class WeatherExposure(BaseModel):
    precipitation: float
    strong_wind: float
    strong_gust: float
    low_visibility: float
    temperature_extreme: float
    volatility: float
    observation_count: int
    limited_sample: bool = False


class HourlyProfile(BaseModel):
    hour: int
    observation_count: int
    rain_probability: float | None
    strong_wind_probability: float | None
    strong_gust_probability: float | None
    low_visibility_probability: float | None
    high_temperature_probability: float | None
    mean_temperature: float | None
    p10_temperature: float | None
    p50_temperature: float | None
    p90_temperature: float | None
    mean_wind: float | None
    p50_wind: float | None
    p90_wind: float | None
    mean_gust: float | None
    p50_gust: float | None
    p90_gust: float | None
    median_visibility: float | None
    p10_visibility: float | None
    weather_change_frequency: float | None
    volatility_index: float | None
    volatility_label: Literal["LOW", "MEDIUM", "HIGH"] | None


class MonthlyExposure(BaseModel):
    month: int
    observation_count: int
    rain_probability: float | None
    strong_gust_probability: float | None
    low_visibility_probability: float | None
    high_temperature_probability: float | None
    volatility_index: float | None
    volatility_label: Literal["LOW", "MEDIUM", "HIGH"] | None


class Flexibility(BaseModel):
    best_start_hour: int
    window_start_hour: int
    window_end_hour: int
    flexibility_minutes: int
    note: str = "Historical scheduling flexibility, not a safety guarantee."


class WeatherProfileResponse(BaseModel):
    circuit: Circuit
    month: int
    start_hour: int
    end_hour: int
    exposure: WeatherExposure
    flexibility: Flexibility
    volatility_label: Literal["LOW", "MEDIUM", "HIGH"] | None
    provenance: StationProvenance


class WeatherByHourResponse(BaseModel):
    circuit: Circuit
    month: int
    hours: list[HourlyProfile]
    provenance: StationProvenance


class ScenarioRequest(BaseModel):
    circuit: str = "silverstone"
    month: int = Field(ge=1, le=12, default=7)
    original_start: str = "15:00"
    alternative_start: str = "13:00"
    duration_minutes: int = Field(default=120, ge=15, le=240)


class ScenarioResponse(BaseModel):
    circuit: Circuit
    month: int
    original_start: str
    alternative_start: str
    duration_minutes: int
    original: WeatherExposure
    alternative: WeatherExposure
    delta: dict[str, float]
    provenance: StationProvenance


class WeightConfig(BaseModel):
    precipitation: float = 1.0
    wind: float = 0.5
    gust: float = 0.8
    visibility: float = 0.7
    temperature: float = 0.3
    volatility: float = 0.5
    schedule_deviation: float = 0.6
    broadcast: float = 0.4


class OptimizeRequest(BaseModel):
    circuit: str = "silverstone"
    month: int = Field(ge=1, le=12, default=7)
    sessions: list[str] | None = None
    weights: WeightConfig = Field(default_factory=WeightConfig)


class ScheduledSession(BaseModel):
    session_id: str
    name: str
    day_name: str
    start_time: str
    end_time: str
    duration_minutes: int
    exposure: WeatherExposure


class CandidateSchedule(BaseModel):
    id: str
    label: str
    summary: str
    weather_cost: float
    deviation_cost: float
    broadcast_cost: float
    total_cost: float
    weather_band: Literal["VERY LOW", "LOW", "MEDIUM", "HIGH"]
    deviation_band: Literal["VERY LOW", "LOW", "MEDIUM", "HIGH"]
    sessions: list[ScheduledSession]


class OptimizeResponse(BaseModel):
    circuit: Circuit
    month: int
    baseline: CandidateSchedule
    candidates: list[CandidateSchedule]
    provenance: StationProvenance


class ClimateProfileResponse(BaseModel):
    circuit: Circuit
    months: list[MonthlyExposure]
    provenance: StationProvenance
