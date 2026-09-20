"""Historical weather features, exposure vectors, and volatility."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from statistics import mean, median
from typing import Iterable

from config import thresholds as load_thresholds


def _pct(values: list[float], q: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    idx = min(len(ordered) - 1, max(0, int(round((len(ordered) - 1) * q))))
    return float(ordered[idx])


def _mean(values: list[float]) -> float | None:
    return float(mean(values)) if values else None


def _clip01(value: float) -> float:
    return max(0.0, min(1.0, value))


def volatility_label(index: float | None, cfg: dict | None = None) -> str | None:
    if index is None:
        return None
    cfg = cfg or load_thresholds()["volatility"]
    if index <= cfg["labels"]["low_max"]:
        return "LOW"
    if index <= cfg["labels"]["medium_max"]:
        return "MEDIUM"
    return "HIGH"


def observation_is_rain(obs: dict, rain_mm: float) -> bool | None:
    precip = obs.get("precipitation_mm")
    code_flag = obs.get("weather_code_precip")
    if precip is not None:
        return precip >= rain_mm
    if code_flag is True:
        return True
    if code_flag is False:
        return False
    return None


def hourly_volatility_components(prev: dict, curr: dict, cfg: dict) -> float | None:
    pieces = []
    weights = cfg["weights"]
    t0, t1 = prev.get("temperature_c"), curr.get("temperature_c")
    if t0 is not None and t1 is not None:
        pieces.append(
            (
                weights["temperature"],
                _clip01(abs(t1 - t0) / cfg["temp_scale_c"]),
            )
        )
    w0, w1 = prev.get("wind_speed_ms"), curr.get("wind_speed_ms")
    if w0 is not None and w1 is not None:
        pieces.append(
            (
                weights["wind"],
                _clip01(abs(w1 - w0) / cfg["wind_scale_ms"]),
            )
        )
    rain_mm = load_thresholds()["precipitation_mm"]["value"]
    r0, r1 = observation_is_rain(prev, rain_mm), observation_is_rain(curr, rain_mm)
    if r0 is not None and r1 is not None:
        pieces.append((weights["precipitation_transition"], 1.0 if r0 != r1 else 0.0))
    v0, v1 = prev.get("visibility_m"), curr.get("visibility_m")
    if v0 is not None and v1 is not None:
        pieces.append(
            (
                weights["visibility"],
                _clip01(abs(v1 - v0) / cfg["visibility_scale_m"]),
            )
        )
    if not pieces:
        return None
    total_w = sum(w for w, _ in pieces)
    return sum(w * x for w, x in pieces) / total_w


def attach_volatility(observations: list[dict]) -> list[dict]:
    cfg = load_thresholds()["volatility"]
    ordered = sorted(observations, key=lambda row: row["timestamp_local"])
    prev = None
    for row in ordered:
        row["volatility"] = None
        row["precip_transition"] = None
        if prev is not None:
            delta_s = (row["timestamp_local"] - prev["timestamp_local"]).total_seconds()
            if 0 < delta_s <= 3 * 3600:
                row["volatility"] = hourly_volatility_components(prev, row, cfg)
                rain_mm = load_thresholds()["precipitation_mm"]["value"]
                r0 = observation_is_rain(prev, rain_mm)
                r1 = observation_is_rain(row, rain_mm)
                if r0 is not None and r1 is not None:
                    row["precip_transition"] = 1.0 if r0 != r1 else 0.0
        prev = row
    return ordered


def build_hourly_profiles(observations: Iterable[dict]) -> list[dict]:
    cfg = load_thresholds()
    rain_mm = cfg["precipitation_mm"]["value"]
    wind_t = cfg["strong_wind_ms"]["value"]
    gust_t = cfg["strong_gust_ms"]["value"]
    vis_t = cfg["low_visibility_m"]["value"]
    temp_t = cfg["high_temperature_c"]["value"]

    buckets: dict[tuple[int, int], list[dict]] = defaultdict(list)
    for row in observations:
        buckets[(row["local_month"], row["local_hour"])].append(row)

    profiles = []
    for month in range(1, 13):
        for hour in range(24):
            rows = buckets.get((month, hour), [])
            temps = [r["temperature_c"] for r in rows if r["temperature_c"] is not None]
            winds = [r["wind_speed_ms"] for r in rows if r["wind_speed_ms"] is not None]
            gusts = [r["wind_gust_ms"] for r in rows if r["wind_gust_ms"] is not None]
            vis = [r["visibility_m"] for r in rows if r["visibility_m"] is not None]
            rain_flags = [observation_is_rain(r, rain_mm) for r in rows]
            rain_known = [x for x in rain_flags if x is not None]
            vol = [r["volatility"] for r in rows if r.get("volatility") is not None]
            transitions = [
                r["precip_transition"]
                for r in rows
                if r.get("precip_transition") is not None
            ]
            vol_index = _mean(vol)
            profiles.append(
                {
                    "month": month,
                    "hour": hour,
                    "observation_count": len(rows),
                    "rain_probability": mean(rain_known) if rain_known else None,
                    "strong_wind_probability": (
                        mean(w >= wind_t for w in winds) if winds else None
                    ),
                    "strong_gust_probability": (
                        mean(g >= gust_t for g in gusts) if gusts else None
                    ),
                    "low_visibility_probability": (
                        mean(v < vis_t for v in vis) if vis else None
                    ),
                    "high_temperature_probability": (
                        mean(t >= temp_t for t in temps) if temps else None
                    ),
                    "mean_temperature": _mean(temps),
                    "p10_temperature": _pct(temps, 0.10),
                    "p50_temperature": _pct(temps, 0.50),
                    "p90_temperature": _pct(temps, 0.90),
                    "mean_wind": _mean(winds),
                    "p50_wind": _pct(winds, 0.50),
                    "p90_wind": _pct(winds, 0.90),
                    "mean_gust": _mean(gusts),
                    "p50_gust": _pct(gusts, 0.50),
                    "p90_gust": _pct(gusts, 0.90),
                    "median_visibility": median(vis) if vis else None,
                    "p10_visibility": _pct(vis, 0.10),
                    "weather_change_frequency": _mean(transitions),
                    "volatility_index": vol_index,
                    "volatility_label": volatility_label(vol_index),
                }
            )
    return profiles


def build_monthly_profiles(hourly: list[dict]) -> list[dict]:
    by_month: dict[int, list[dict]] = defaultdict(list)
    for row in hourly:
        by_month[row["month"]].append(row)
    out = []
    for month in range(1, 13):
        rows = [r for r in by_month[month] if r["observation_count"]]
        if not rows:
            out.append(
                {
                    "month": month,
                    "observation_count": 0,
                    "rain_probability": None,
                    "strong_gust_probability": None,
                    "low_visibility_probability": None,
                    "high_temperature_probability": None,
                    "volatility_index": None,
                    "volatility_label": None,
                }
            )
            continue
        total_n = sum(r["observation_count"] for r in rows)

        def weighted(field: str) -> float | None:
            parts = [
                (r[field], r["observation_count"])
                for r in rows
                if r[field] is not None and r["observation_count"]
            ]
            if not parts:
                return None
            return sum(v * n for v, n in parts) / sum(n for _, n in parts)

        vol = weighted("volatility_index")
        out.append(
            {
                "month": month,
                "observation_count": total_n,
                "rain_probability": weighted("rain_probability"),
                "strong_gust_probability": weighted("strong_gust_probability"),
                "low_visibility_probability": weighted("low_visibility_probability"),
                "high_temperature_probability": weighted("high_temperature_probability"),
                "volatility_index": vol,
                "volatility_label": volatility_label(vol),
            }
        )
    return out


def exposure_from_hours(hour_rows: list[dict], minute_weights: list[float] | None = None) -> dict:
    if not hour_rows:
        return empty_exposure()
    weights = minute_weights or [1.0] * len(hour_rows)
    total_w = sum(weights) or 1.0

    def wavg(field: str) -> float:
        acc = 0.0
        wsum = 0.0
        for row, w in zip(hour_rows, weights):
            value = row.get(field)
            if value is None:
                continue
            acc += float(value) * w
            wsum += w
        return acc / wsum if wsum else 0.0

    n = int(sum(r.get("observation_count", 0) for r in hour_rows))
    vol = wavg("volatility_index")
    return {
        "precipitation": wavg("rain_probability"),
        "strong_wind": wavg("strong_wind_probability"),
        "strong_gust": wavg("strong_gust_probability"),
        "low_visibility": wavg("low_visibility_probability"),
        "temperature_extreme": wavg("high_temperature_probability"),
        "volatility": vol,
        "observation_count": n,
        "limited_sample": n < 200,
    }


def empty_exposure() -> dict:
    return {
        "precipitation": 0.0,
        "strong_wind": 0.0,
        "strong_gust": 0.0,
        "low_visibility": 0.0,
        "temperature_extreme": 0.0,
        "volatility": 0.0,
        "observation_count": 0,
        "limited_sample": True,
    }


def window_hour_weights(start_hour: float, duration_minutes: int) -> list[tuple[int, float]]:
    """Split a session into (hour, minutes_in_hour) covering local time."""
    remaining = duration_minutes
    hour = int(start_hour)
    offset_minutes = int(round((start_hour - hour) * 60))
    first_span = min(remaining, 60 - offset_minutes)
    weights: list[tuple[int, float]] = []
    if first_span > 0:
        weights.append((hour % 24, float(first_span)))
        remaining -= first_span
        hour += 1
    while remaining > 0:
        span = min(60, remaining)
        weights.append((hour % 24, float(span)))
        remaining -= span
        hour += 1
    return weights


def exposure_for_window(hourly: list[dict], month: int, start_hour: float, duration_minutes: int) -> dict:
    by_hour = {(row["month"], row["hour"]): row for row in hourly}
    weights = window_hour_weights(start_hour, duration_minutes)
    rows = []
    wts = []
    for hour, minutes in weights:
        row = by_hour.get((month, hour))
        if row:
            rows.append(row)
            wts.append(minutes)
    return exposure_from_hours(rows, wts)


def weather_cost(exposure: dict, weights: dict) -> float:
    return (
        weights.get("precipitation", 1.0) * exposure["precipitation"]
        + weights.get("wind", 0.5) * exposure["strong_wind"]
        + weights.get("gust", 0.8) * exposure["strong_gust"]
        + weights.get("visibility", 0.7) * exposure["low_visibility"]
        + weights.get("temperature", 0.3) * exposure["temperature_extreme"]
        + weights.get("volatility", 0.5) * exposure["volatility"]
    )


def flexibility_window(
    hourly: list[dict],
    month: int,
    duration_minutes: int,
    start_hours: Iterable[int],
    tolerance: float | None = None,
) -> dict:
    cfg = load_thresholds()
    tol = tolerance if tolerance is not None else cfg["flexibility_tolerance"]
    weights = {
        "precipitation": 1.0,
        "wind": 0.5,
        "gust": 0.8,
        "visibility": 0.7,
        "temperature": 0.3,
        "volatility": 0.5,
    }
    scored = []
    for hour in start_hours:
        exp = exposure_for_window(hourly, month, hour, duration_minutes)
        scored.append((hour, weather_cost(exp, weights), exp))
    scored.sort(key=lambda item: item[1])
    best_hour, best_cost, _ = scored[0]
    nearby = [h for h, cost, _ in scored if abs(cost - best_cost) <= tol]
    window_start = min(nearby)
    window_end = max(nearby)
    return {
        "best_start_hour": best_hour,
        "window_start_hour": window_start,
        "window_end_hour": window_end,
        "flexibility_minutes": max(0, (window_end - window_start) * 60),
        "note": "Historical scheduling flexibility, not a safety guarantee.",
    }
