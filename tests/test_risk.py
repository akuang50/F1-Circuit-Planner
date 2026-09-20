from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from analytics import (  # noqa: E402
    attach_volatility,
    build_hourly_profiles,
    exposure_for_window,
    observation_is_rain,
    volatility_label,
    weather_cost,
    window_hour_weights,
)


def _obs(hour: int, month: int = 7, **kwargs) -> dict:
    local = datetime(2024, month, 7, hour, tzinfo=ZoneInfo("Europe/London"))
    row = {
        "timestamp_local": local,
        "local_month": month,
        "local_hour": hour,
        "temperature_c": 18.0,
        "wind_speed_ms": 4.0,
        "wind_gust_ms": 8.0,
        "visibility_m": 20000.0,
        "precipitation_mm": 0.0,
        "weather_code_precip": False,
    }
    row.update(kwargs)
    return row


def test_rain_threshold():
    assert observation_is_rain({"precipitation_mm": 0.1}, 0.1) is True
    assert observation_is_rain({"precipitation_mm": 0.0}, 0.1) is False
    assert observation_is_rain({"precipitation_mm": None, "weather_code_precip": True}, 0.1) is True


def test_percentiles_and_rain_probability():
    rows = []
    for day_hour in range(10):
        rows.append(_obs(14, precipitation_mm=0.5 if day_hour < 3 else 0.0))
        rows.append(_obs(15, precipitation_mm=0.0))
    attach_volatility(rows)
    profiles = { (p["month"], p["hour"]): p for p in build_hourly_profiles(rows) }
    rain_14 = profiles[(7, 14)]["rain_probability"]
    rain_15 = profiles[(7, 15)]["rain_probability"]
    assert abs(rain_14 - 0.3) < 1e-9
    assert rain_15 == 0.0
    assert profiles[(7, 14)]["observation_count"] == 10


def test_volatility_increases_when_conditions_flip():
    stable = [
        _obs(10, precipitation_mm=0.0, temperature_c=18.0, wind_speed_ms=4.0),
        _obs(11, precipitation_mm=0.0, temperature_c=18.2, wind_speed_ms=4.1),
    ]
    volatile = [
        _obs(10, precipitation_mm=0.0, temperature_c=12.0, wind_speed_ms=2.0, visibility_m=20000),
        _obs(11, precipitation_mm=2.0, temperature_c=18.0, wind_speed_ms=9.0, visibility_m=2000),
    ]
    attach_volatility(stable)
    attach_volatility(volatile)
    assert stable[1]["volatility"] < volatile[1]["volatility"]
    assert volatility_label(0.05) == "LOW"
    assert volatility_label(0.2) == "MEDIUM"
    assert volatility_label(0.4) == "HIGH"


def test_window_weights_partial_hours():
    weights = window_hour_weights(15.5, 120)
    assert weights[0] == (15, 30)
    assert sum(m for _, m in weights) == 120


def test_exposure_and_cost():
    rows = [_obs(13, precipitation_mm=0.5) for _ in range(8)] + [
        _obs(16, precipitation_mm=0.0) for _ in range(8)
    ]
    attach_volatility(rows)
    hourly = build_hourly_profiles(rows)
    early = exposure_for_window(hourly, 7, 13, 60)
    late = exposure_for_window(hourly, 7, 16, 60)
    assert early["precipitation"] > late["precipitation"]
    weights = {"precipitation": 1, "wind": 0, "gust": 0, "visibility": 0, "temperature": 0, "volatility": 0}
    assert weather_cost(early, weights) > weather_cost(late, weights)
