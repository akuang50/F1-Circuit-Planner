#!/usr/bin/env python3
"""Bake Open-Meteo ERA5, Jolpica race dates, and OpenF1 session weather into extras.json.

GitHub Pages is static, so this script fetches public APIs at build time. No API keys.
"""

from __future__ import annotations

import json
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend/public/data/extras.json"
CACHE = ROOT / "data/raw/extras-cache"

START = date(2010, 1, 1)
END = date(2026, 9, 15)
OPENF1_YEARS = (2023, 2024, 2025, 2026)
JOLPICA_YEARS = range(2010, 2027)
RAIN_MM = 1.0
STORM_CODES = {95, 96, 99}
FOG_CODES = {45, 48}

JOLPICA_TO_APP = {
    "albert_park": "albert-park",
    "shanghai": "shanghai",
    "suzuka": "suzuka",
    "bahrain": "bahrain",
    "jeddah": "jeddah",
    "miami": "miami",
    "imola": "imola",
    "monaco": "monaco",
    "villeneuve": "montreal",
    "catalunya": "barcelona",
    "red_bull_ring": "red-bull-ring",
    "silverstone": "silverstone",
    "spa": "spa",
    "hungaroring": "hungaroring",
    "zandvoort": "zandvoort",
    "monza": "monza",
    "madrid": "madring",
    "madring": "madring",
    "baku": "baku",
    "sepang": "sepang",
    "marina_bay": "marina-bay",
    "americas": "cota",
    "rodriguez": "mexico",
    "interlagos": "interlagos",
    "vegas": "las-vegas",
    "losail": "lusail",
    "yas_marina": "yas-marina",
}

OPENF1_LOCATION_TO_APP = {
    "melbourne": "albert-park",
    "shanghai": "shanghai",
    "suzuka": "suzuka",
    "sakhir": "bahrain",
    "jeddah": "jeddah",
    "miami": "miami",
    "imola": "imola",
    "monaco": "monaco",
    "monte carlo": "monaco",
    "montreal": "montreal",
    "barcelona": "barcelona",
    "catalunya": "barcelona",
    "spielberg": "red-bull-ring",
    "silverstone": "silverstone",
    "spa-francorchamps": "spa",
    "spa": "spa",
    "budapest": "hungaroring",
    "zandvoort": "zandvoort",
    "monza": "monza",
    "madrid": "madring",
    "baku": "baku",
    "kuala lumpur": "sepang",
    "sepang": "sepang",
    "singapore": "marina-bay",
    "austin": "cota",
    "mexico city": "mexico",
    "sao paulo": "interlagos",
    "são paulo": "interlagos",
    "las vegas": "las-vegas",
    "lusail": "lusail",
    "doha": "lusail",
    "yas island": "yas-marina",
    "abu dhabi": "yas-marina",
}

OPENF1_EVENT_TO_APP = {
    "australian grand prix": "albert-park",
    "chinese grand prix": "shanghai",
    "japanese grand prix": "suzuka",
    "bahrain grand prix": "bahrain",
    "saudi arabian grand prix": "jeddah",
    "miami grand prix": "miami",
    "emilia romagna grand prix": "imola",
    "emilia-romagna grand prix": "imola",
    "monaco grand prix": "monaco",
    "canadian grand prix": "montreal",
    "spanish grand prix": "barcelona",
    "barcelona-catalunya": "barcelona",
    "austrian grand prix": "red-bull-ring",
    "british grand prix": "silverstone",
    "belgian grand prix": "spa",
    "hungarian grand prix": "hungaroring",
    "dutch grand prix": "zandvoort",
    "italian grand prix": "monza",
    "azerbaijan grand prix": "baku",
    "malaysian grand prix": "sepang",
    "singapore grand prix": "marina-bay",
    "united states grand prix": "cota",
    "mexico city grand prix": "mexico",
    "mexican grand prix": "mexico",
    "são paulo grand prix": "interlagos",
    "sao paulo grand prix": "interlagos",
    "brazilian grand prix": "interlagos",
    "las vegas grand prix": "las-vegas",
    "qatar grand prix": "lusail",
    "abu dhabi grand prix": "yas-marina",
    "madrid grand prix": "madring",
}

UA = "F1-Circuit-Planner/extras (+https://github.com/akuang50/F1-Circuit-Planner)"


def round_or_none(value: Any, digits: int = 2) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number != number:  # NaN
        return None
    return round(number, digits)


def map_jolpica_circuit(circuit_id: str) -> str | None:
    return JOLPICA_TO_APP.get((circuit_id or "").strip())


def map_openf1_meeting(
    location: str | None = None,
    circuit_short_name: str | None = None,
    meeting_name: str | None = None,
) -> str | None:
    for raw in (location, circuit_short_name):
        key = (raw or "").strip().lower()
        if key in OPENF1_LOCATION_TO_APP:
            return OPENF1_LOCATION_TO_APP[key]
    haystack = " ".join(part for part in (location, circuit_short_name, meeting_name) if part).lower()
    for needle, app_id in sorted(OPENF1_LOCATION_TO_APP.items(), key=lambda item: -len(item[0])):
        if len(needle) < 5:
            continue
        if needle in haystack:
            return app_id
    for needle, app_id in sorted(OPENF1_EVENT_TO_APP.items(), key=lambda item: -len(item[0])):
        if needle in haystack:
            return app_id
    return None


def is_rain_day(precip_mm: float | None, threshold: float = RAIN_MM) -> bool:
    return precip_mm is not None and precip_mm >= threshold


def is_storm_code(code: int | None) -> bool:
    return code in STORM_CODES


def is_fog_code(code: int | None) -> bool:
    return code in FOG_CODES


def _parse_clock(value: str | None) -> int | None:
    if not value:
        return None
    text = value.replace("Z", "+00:00")
    try:
        stamp = datetime.fromisoformat(text)
    except ValueError:
        try:
            stamp = datetime.fromisoformat(text[:19])
        except ValueError:
            return None
    return stamp.hour * 60 + stamp.minute


def _clock_label(minutes: int | None) -> str | None:
    if minutes is None:
        return None
    minutes = int(minutes) % (24 * 60)
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def _median_int(values: list[int]) -> int | None:
    if not values:
        return None
    return int(round(statistics.median(values)))


def monthly_climate(days: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for day in days:
        month = int(day["date"][5:7])
        buckets[month].append(day)
    rows: list[dict[str, Any]] = []
    for month in range(1, 13):
        group = buckets.get(month, [])
        if not group:
            continue
        precips = [row["precip_mm"] for row in group if row.get("precip_mm") is not None]
        rain_days = sum(1 for value in precips if is_rain_day(value))
        temps = [row["temp_mean_c"] for row in group if row.get("temp_mean_c") is not None]
        tmax = [row["temp_max_c"] for row in group if row.get("temp_max_c") is not None]
        tmin = [row["temp_min_c"] for row in group if row.get("temp_min_c") is not None]
        winds = [row["wind_max_kmh"] for row in group if row.get("wind_max_kmh") is not None]
        gusts = [row["gust_max_kmh"] for row in group if row.get("gust_max_kmh") is not None]
        hours = [row["precip_hours"] for row in group if row.get("precip_hours") is not None]
        daylight = [row["daylight_hours"] for row in group if row.get("daylight_hours") is not None]
        sunrises = [row["sunrise_min"] for row in group if row.get("sunrise_min") is not None]
        sunsets = [row["sunset_min"] for row in group if row.get("sunset_min") is not None]
        storms = sum(1 for row in group if is_storm_code(row.get("weather_code")))
        fog = sum(1 for row in group if is_fog_code(row.get("weather_code")))
        n = len(group)
        rows.append(
            {
                "month": month,
                "days": n,
                "rain_days": rain_days,
                "rain_day_fraction": round(rain_days / n, 4) if n else None,
                "mean_precip_mm": round_or_none(statistics.mean(precips) if precips else None, 2),
                "mean_temp_c": round_or_none(statistics.mean(temps) if temps else None, 1),
                "max_temp_c": round_or_none(statistics.mean(tmax) if tmax else None, 1),
                "min_temp_c": round_or_none(statistics.mean(tmin) if tmin else None, 1),
                "mean_wind_kmh": round_or_none(statistics.mean(winds) if winds else None, 1),
                "mean_gust_kmh": round_or_none(statistics.mean(gusts) if gusts else None, 1),
                "mean_precip_hours": round_or_none(statistics.mean(hours) if hours else None, 1),
                "storm_day_fraction": round(storms / n, 4) if n else None,
                "fog_day_fraction": round(fog / n, 4) if n else None,
                "median_sunrise": _clock_label(_median_int(sunrises)),
                "median_sunset": _clock_label(_median_int(sunsets)),
                "daylight_hours": round_or_none(statistics.mean(daylight) if daylight else None, 1),
            }
        )
    return rows


def join_race_days(races: list[dict[str, Any]], daily_by_date: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    joined: list[dict[str, Any]] = []
    for race in races:
        day = daily_by_date.get(race["date"])
        precip = day.get("precip_mm") if day else None
        joined.append(
            {
                "season": race["season"],
                "round": race["round"],
                "date": race["date"],
                "event": race["event"],
                "winner": race.get("winner"),
                "status": race.get("status"),
                "laps": race.get("laps"),
                "precip_mm": round_or_none(precip, 1),
                "wet": is_rain_day(precip) if precip is not None else None,
                "temp_mean_c": round_or_none(day.get("temp_mean_c") if day else None, 1),
                "weather_code": day.get("weather_code") if day else None,
            }
        )
    return joined


def summarize_race_days(race_days: list[dict[str, Any]]) -> dict[str, Any]:
    dated = [row for row in race_days if row.get("precip_mm") is not None]
    wet = [row for row in dated if row.get("wet")]
    precips = [row["precip_mm"] for row in dated]
    temps = [row["temp_mean_c"] for row in dated if row.get("temp_mean_c") is not None]
    n = len(dated)
    return {
        "races": n,
        "wet_races": len(wet),
        "wet_fraction": round(len(wet) / n, 4) if n else None,
        "mean_precip_mm": round_or_none(statistics.mean(precips) if precips else None, 2),
        "mean_temp_c": round_or_none(statistics.mean(temps) if temps else None, 1),
        "first_season": dated[0]["season"] if dated else None,
        "last_season": dated[-1]["season"] if dated else None,
    }


def summarize_weather_rows(rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not rows:
        return None
    rain = [1.0 if row.get("rainfall") else 0.0 for row in rows]
    track = [row["track_temperature"] for row in rows if row.get("track_temperature") is not None]
    air = [row["air_temperature"] for row in rows if row.get("air_temperature") is not None]
    humidity = [row["humidity"] for row in rows if row.get("humidity") is not None]
    wind = [row["wind_speed"] for row in rows if row.get("wind_speed") is not None]
    return {
        "samples": len(rows),
        "rainfall_fraction": round(sum(rain) / len(rain), 4) if rain else None,
        "mean_track_temp_c": round_or_none(statistics.mean(track) if track else None, 1),
        "mean_air_temp_c": round_or_none(statistics.mean(air) if air else None, 1),
        "mean_humidity": round_or_none(statistics.mean(humidity) if humidity else None, 0),
        "mean_wind_ms": round_or_none(statistics.mean(wind) if wind else None, 1),
    }


def session_label(session_name: str | None, session_type: str | None) -> str | None:
    name = (session_name or session_type or "").strip()
    if not name:
        return None
    lowered = name.lower()
    mapping = {
        "race": "Race",
        "qualifying": "Qualifying",
        "sprint": "Sprint",
        "sprint qualifying": "Sprint Qualifying",
        "sprint shootout": "Sprint Qualifying",
        "practice 1": "FP1",
        "practice 2": "FP2",
        "practice 3": "FP3",
        "fp1": "FP1",
        "fp2": "FP2",
        "fp3": "FP3",
    }
    return mapping.get(lowered, name)


def fetch_json(url: str, retries: int = 6, pause: float = 0.35, timeout: int = 40) -> Any:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(request, timeout=timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
            time.sleep(pause)
            return payload
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code in {429, 500, 502, 503, 504} and attempt < retries - 1:
                time.sleep(min(16, 2 ** attempt))
                continue
            raise
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            last_error = exc
            if attempt < retries - 1:
                time.sleep(min(16, 2 ** attempt))
                continue
            raise
    raise RuntimeError(f"Failed {url}: {last_error}")


def cache_path(name: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    return CACHE / name


def load_or_fetch(name: str, loader) -> Any:
    path = cache_path(name)
    if path.exists() and path.stat().st_size > 40:
        print(f"  cache hit {name}", flush=True)
        return json.loads(path.read_text())
    payload = loader()
    path.write_text(json.dumps(payload))
    return payload


def circuits() -> list[dict[str, Any]]:
    payload = json.loads((ROOT / "frontend/data/circuits.json").read_text())
    return payload["circuits"]


def open_meteo_chunk(lat: float, lon: float, timezone_name: str, start: date, end: date) -> dict[str, Any]:
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lon:.4f}",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "daily": ",".join(
            [
                "precipitation_sum",
                "rain_sum",
                "precipitation_hours",
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean",
                "wind_speed_10m_max",
                "wind_gusts_10m_max",
                "weather_code",
                "sunrise",
                "sunset",
                "daylight_duration",
            ]
        ),
        "timezone": timezone_name,
    }
    url = "https://archive-api.open-meteo.com/v1/archive?" + urllib.parse.urlencode(params)
    return fetch_json(url, pause=0.45, timeout=45)


def parse_era5_days(payload: dict[str, Any]) -> tuple[list[dict[str, Any]], float | None]:
    daily = payload.get("daily") or {}
    dates = daily.get("time") or []
    elevation = round_or_none(payload.get("elevation"), 0)
    days: list[dict[str, Any]] = []
    for index, day in enumerate(dates):
        daylight_s = (daily.get("daylight_duration") or [None] * len(dates))[index]
        days.append(
            {
                "date": day,
                "precip_mm": round_or_none((daily.get("precipitation_sum") or [None])[index], 2),
                "rain_mm": round_or_none((daily.get("rain_sum") or [None])[index], 2),
                "precip_hours": round_or_none((daily.get("precipitation_hours") or [None])[index], 1),
                "temp_max_c": round_or_none((daily.get("temperature_2m_max") or [None])[index], 1),
                "temp_min_c": round_or_none((daily.get("temperature_2m_min") or [None])[index], 1),
                "temp_mean_c": round_or_none((daily.get("temperature_2m_mean") or [None])[index], 1),
                "wind_max_kmh": round_or_none((daily.get("wind_speed_10m_max") or [None])[index], 1),
                "gust_max_kmh": round_or_none((daily.get("wind_gusts_10m_max") or [None])[index], 1),
                "weather_code": (daily.get("weather_code") or [None])[index],
                "sunrise_min": _parse_clock((daily.get("sunrise") or [None])[index]),
                "sunset_min": _parse_clock((daily.get("sunset") or [None])[index]),
                "daylight_hours": round_or_none((daylight_s / 3600) if daylight_s else None, 2),
            }
        )
    return days, elevation


def open_meteo_days(lat: float, lon: float, timezone_name: str) -> tuple[list[dict[str, Any]], float | None]:
    chunks = [
        (date(2010, 1, 1), date(2014, 12, 31)),
        (date(2015, 1, 1), date(2019, 12, 31)),
        (date(2020, 1, 1), date(2025, 12, 31)),
        (date(2026, 1, 1), END),
    ]
    days: list[dict[str, Any]] = []
    elevation: float | None = None
    for start, end in chunks:
        if start > END:
            continue
        payload = open_meteo_chunk(lat, lon, timezone_name, start, min(end, END))
        chunk_days, chunk_elev = parse_era5_days(payload)
        days.extend(chunk_days)
        if elevation is None:
            elevation = chunk_elev
    return days, elevation


def ensure_era5(circuit: dict[str, Any]) -> dict[str, Any]:
    cid = circuit["id"]
    path = cache_path(f"era5-{cid}.json")
    if path.exists() and path.stat().st_size > 40:
        era5 = json.loads(path.read_text())
        days = era5.get("days") or []
        last = max((row["date"] for row in days), default="2000-01-01")
        if last < END.isoformat():
            start = date.fromisoformat(last) + timedelta(days=1)
            print(f"  extending ERA5 {cid} {start}–{END}", flush=True)
            payload = open_meteo_chunk(circuit["latitude"], circuit["longitude"], circuit["timezone"], start, END)
            extra, elev = parse_era5_days(payload)
            days.extend(extra)
            era5 = {"days": days, "elevation": era5.get("elevation") if era5.get("elevation") is not None else elev}
            path.write_text(json.dumps(era5))
        return era5

    def _era5() -> dict[str, Any]:
        days, elevation = open_meteo_days(circuit["latitude"], circuit["longitude"], circuit["timezone"])
        return {"days": days, "elevation": elevation}

    return load_or_fetch(f"era5-{cid}.json", _era5)


def fetch_jolpica_races() -> dict[str, list[dict[str, Any]]]:
    by_circuit: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for year in JOLPICA_YEARS:
        calendar = fetch_json(f"https://api.jolpi.ca/ergast/f1/{year}.json?limit=100", pause=0.25)
        races = (((calendar.get("MRData") or {}).get("RaceTable") or {}).get("Races") or [])
        winners: dict[tuple[int, int], dict[str, Any]] = {}
        try:
            results = fetch_json(
                f"https://api.jolpi.ca/ergast/f1/{year}/results/1.json?limit=40",
                pause=0.25,
            )
            for race in (((results.get("MRData") or {}).get("RaceTable") or {}).get("Races") or []):
                result = (race.get("Results") or [{}])[0]
                driver = result.get("Driver") or {}
                winners[(int(race.get("season", year)), int(race.get("round", 0)))] = {
                    "winner": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip() or None,
                    "status": result.get("status"),
                    "laps": int(result["laps"]) if str(result.get("laps", "")).isdigit() else None,
                }
        except Exception as exc:  # noqa: BLE001 — a season without results is fine
            print(f"  jolpica results {year}: {exc}", flush=True)
        for race in races:
            app_id = map_jolpica_circuit((race.get("Circuit") or {}).get("circuitId", ""))
            if not app_id:
                continue
            season = int(race.get("season", year))
            rnd = int(race.get("round", 0))
            extra = winners.get((season, rnd), {})
            by_circuit[app_id].append(
                {
                    "season": season,
                    "round": rnd,
                    "date": race.get("date"),
                    "event": race.get("raceName"),
                    **extra,
                }
            )
        print(f"  jolpica {year}: {len(races)} races", flush=True)
    return by_circuit


def fetch_openf1() -> dict[str, list[dict[str, Any]]]:
    by_circuit: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for year in OPENF1_YEARS:
        try:
            meetings = fetch_json(f"https://api.openf1.org/v1/meetings?year={year}", pause=0.2)
        except Exception as exc:  # noqa: BLE001
            print(f"  openf1 meetings {year}: {exc}", flush=True)
            continue
        if not isinstance(meetings, list):
            continue
        for meeting in meetings:
            name = (meeting.get("meeting_name") or meeting.get("meeting_official_name") or "").lower()
            if "test" in name or "pre-season" in name:
                continue
            app_id = map_openf1_meeting(
                meeting.get("location"),
                meeting.get("circuit_short_name"),
                meeting.get("meeting_name"),
            )
            if not app_id:
                continue
            meeting_key = meeting.get("meeting_key")
            try:
                sessions = fetch_json(
                    f"https://api.openf1.org/v1/sessions?meeting_key={meeting_key}",
                    pause=0.15,
                )
            except Exception as exc:  # noqa: BLE001
                print(f"  openf1 sessions {meeting_key}: {exc}", flush=True)
                sessions = []
            session_names = {
                row.get("session_key"): session_label(row.get("session_name"), row.get("session_type"))
                for row in sessions
                if isinstance(row, dict)
            }
            try:
                weather = fetch_json(
                    f"https://api.openf1.org/v1/weather?meeting_key={meeting_key}",
                    pause=0.2,
                )
            except Exception as exc:  # noqa: BLE001
                print(f"  openf1 weather {meeting_key}: {exc}", flush=True)
                weather = []
            if not isinstance(weather, list):
                weather = []
            overall = summarize_weather_rows(weather)
            if not overall:
                continue
            by_session: dict[str, list[dict[str, Any]]] = defaultdict(list)
            for row in weather:
                label = session_names.get(row.get("session_key"))
                if label:
                    by_session[label].append(row)
            session_summaries = []
            for label in ("FP1", "FP2", "FP3", "Sprint Qualifying", "Sprint", "Qualifying", "Race"):
                summary = summarize_weather_rows(by_session.get(label, []))
                if summary:
                    session_summaries.append({"name": label, **summary})
            by_circuit[app_id].append(
                {
                    "year": year,
                    "meeting_name": meeting.get("meeting_official_name") or meeting.get("meeting_name"),
                    "date_start": (meeting.get("date_start") or "")[:10] or None,
                    **overall,
                    "sessions": session_summaries,
                }
            )
            print(f"  openf1 {year} {app_id} n={overall['samples']}", flush=True)
    return by_circuit


def empty_circuit() -> dict[str, Any]:
    return {
        "elevation_m": None,
        "climate": [],
        "race_days": [],
        "race_day_summary": summarize_race_days([]),
        "openf1": [],
    }


def main() -> None:
    circuit_rows = circuits()
    print("Fetching Jolpica race calendar…", flush=True)
    jolpica = load_or_fetch("jolpica.json", fetch_jolpica_races)
    print("Fetching OpenF1 session weather…", flush=True)
    openf1 = load_or_fetch("openf1.json", fetch_openf1)

    payload_circuits: dict[str, Any] = {}
    for circuit in circuit_rows:
        cid = circuit["id"]
        print(f"Open-Meteo ERA5 {cid}…", flush=True)
        era5 = ensure_era5(circuit)
        days = era5["days"]
        elevation = era5.get("elevation")
        daily_by_date = {row["date"]: row for row in days}
        races = [row for row in jolpica.get(cid, []) if row.get("date")]
        race_days = join_race_days(races, daily_by_date)
        payload_circuits[cid] = {
            "elevation_m": (
                elevation
                if elevation is not None and elevation >= 0
                else circuit.get("elevation_m")
            ),
            "climate": monthly_climate(days),
            "race_days": race_days,
            "race_day_summary": summarize_race_days(race_days),
            "openf1": openf1.get(cid, []),
        }

    payload = {
        "generated_at": date.today().isoformat(),
        "period": {"start": START.isoformat(), "end": END.isoformat()},
        "rain_day_mm": RAIN_MM,
        "sources": [
            {
                "id": "open-meteo-era5",
                "name": "Open-Meteo Archive (ERA5)",
                "url": "https://open-meteo.com/en/docs/historical-weather-api",
                "note": "Daily reanalysis at the circuit lat/lon, 2010 through mid-2026. Climate at the venue that day, not a lap-by-lap race log, and not a forecast.",
            },
            {
                "id": "jolpica",
                "name": "Jolpica F1 API (Ergast successor)",
                "url": "https://api.jolpi.ca/ergast/f1/",
                "note": "World Championship race dates, winners and finishing status since 2010.",
            },
            {
                "id": "openf1",
                "name": "OpenF1",
                "url": "https://openf1.org/",
                "note": "Session weather from 2023: track/air temperature, humidity, wind and a rainfall flag. Numeric fields only; no F1 media assets.",
            },
        ],
        "circuits": payload_circuits,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, allow_nan=False, separators=(",", ":")))
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes, {len(payload_circuits)} circuits)", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"ingest_extras failed: {exc}", file=sys.stderr)
        raise
