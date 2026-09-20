"""NOAA ISD CSV parsing, quality control, and local-time conversion.

Source: AWS Open Data NOAA Integrated Surface Database
https://registry.opendata.aws/noaa-isd/
CSV bucket: s3://noaa-global-hourly-pds
Original bucket: s3://noaa-isd-pds
"""

from __future__ import annotations

import csv
import io
import math
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from config import VALID_QC

SENTINEL_INTS = {999, 9999, 99999, 999999}


def _ok_qc(code: str | None) -> bool:
    if code is None or code == "":
        return True
    return code in VALID_QC


def _maybe_int(raw: str | None) -> int | None:
    if raw is None or raw == "":
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def parse_tmp(raw: str | None) -> float | None:
    """TMP: signed tenths of a degree C, e.g. +0075,1 -> 7.5."""
    if not raw:
        return None
    parts = raw.split(",")
    value = parts[0]
    qc = parts[1] if len(parts) > 1 else "1"
    if not _ok_qc(qc) or value in {"+9999", "-9999", "9999"}:
        return None
    try:
        celsius = int(value) / 10.0
    except ValueError:
        return None
    if celsius < -80 or celsius > 60:
        return None
    return celsius


def parse_wnd(raw: str | None) -> tuple[float | None, float | None]:
    """WND: direction,dir_qc,type,speed,speed_qc. Speed is tenths of m/s."""
    if not raw:
        return None, None
    parts = raw.split(",")
    if len(parts) < 5:
        return None, None
    direction = _maybe_int(parts[0])
    speed = _maybe_int(parts[3])
    dir_qc, speed_qc = parts[1], parts[4]
    wind_dir = None
    wind_speed = None
    if direction is not None and direction not in SENTINEL_INTS and _ok_qc(dir_qc):
        if 0 <= direction <= 360:
            wind_dir = float(direction)
    if speed is not None and speed not in SENTINEL_INTS and _ok_qc(speed_qc):
        ms = speed / 10.0
        if 0 <= ms <= 100:
            wind_speed = ms
    return wind_dir, wind_speed


def parse_vis(raw: str | None) -> float | None:
    """VIS: distance in meters."""
    if not raw:
        return None
    parts = raw.split(",")
    distance = _maybe_int(parts[0])
    qc = parts[1] if len(parts) > 1 else "1"
    if distance is None or distance in SENTINEL_INTS or not _ok_qc(qc):
        return None
    if distance < 0 or distance > 200000:
        return None
    return float(distance)


def parse_slp(raw: str | None) -> float | None:
    """SLP: sea-level pressure in tenths of hPa."""
    if not raw:
        return None
    parts = raw.split(",")
    value = _maybe_int(parts[0])
    qc = parts[1] if len(parts) > 1 else "1"
    if value is None or value in SENTINEL_INTS or not _ok_qc(qc):
        return None
    hpa = value / 10.0
    if hpa < 860 or hpa > 1090:
        return None
    return hpa


def parse_precip_aa1(raw: str | None) -> float | None:
    """AA1: period hours, depth tenths of mm, condition, quality.

    Only 1-hour accumulation is used so hourly probabilities are not diluted
    by 3/6/24-hour totals.
    """
    if not raw:
        return None
    parts = raw.split(",")
    if len(parts) < 4:
        return None
    period = _maybe_int(parts[0])
    depth = _maybe_int(parts[1])
    qc = parts[3]
    if period != 1:
        return None
    if depth is None or depth in SENTINEL_INTS or not _ok_qc(qc):
        return None
    mm = depth / 10.0
    if mm < 0 or mm > 500:
        return None
    return mm


def parse_gust(oc1: str | None, od1: str | None) -> float | None:
    """Gust from OC1 (preferred) or OD1 supplementary wind speed."""
    if oc1:
        parts = oc1.split(",")
        speed = _maybe_int(parts[0])
        qc = parts[1] if len(parts) > 1 else "1"
        if speed is not None and speed not in SENTINEL_INTS and _ok_qc(qc):
            ms = speed / 10.0
            if 0 <= ms <= 120:
                return ms
    if od1:
        parts = od1.split(",")
        if len(parts) >= 4:
            speed = _maybe_int(parts[2])
            qc = parts[3]
            if speed is not None and speed not in SENTINEL_INTS and _ok_qc(qc):
                ms = speed / 10.0
                if 0 <= ms <= 120:
                    return ms
    return None


def weather_code_precip(aw1: str | None) -> bool | None:
    """Automated present-weather codes that indicate liquid/solid precipitation."""
    if not aw1:
        return None
    code = _maybe_int(aw1.split(",")[0])
    if code is None:
        return None
    return code in range(50, 100) or code in range(20, 30)


def parse_timestamp_utc(raw: str) -> datetime:
    stamp = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=timezone.utc)
    return stamp.astimezone(timezone.utc)


def localize(stamp_utc: datetime, timezone_name: str) -> datetime:
    return stamp_utc.astimezone(ZoneInfo(timezone_name))


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def parse_csv_file(
    path: Path,
    *,
    timezone_name: str,
    station_id: str,
) -> tuple[list[dict], Counter]:
    """Parse one NOAA ISD global-hourly CSV year file."""
    stats: Counter = Counter()
    rows: list[dict] = []
    text = path.read_text(encoding="utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    seen_ts: set[str] = set()

    for raw in reader:
        stats["raw_count"] += 1
        try:
            stamp_utc = parse_timestamp_utc(raw["DATE"])
        except (KeyError, ValueError):
            stats["corrupt_count"] += 1
            continue

        key = stamp_utc.isoformat()
        if key in seen_ts:
            stats["duplicate_count"] += 1
            continue
        seen_ts.add(key)

        local = localize(stamp_utc, timezone_name)
        temp = parse_tmp(raw.get("TMP"))
        dew = parse_tmp(raw.get("DEW"))
        wind_dir, wind_speed = parse_wnd(raw.get("WND"))
        vis = parse_vis(raw.get("VIS"))
        precip = parse_precip_aa1(raw.get("AA1"))
        gust = parse_gust(raw.get("OC1"), raw.get("OD1"))
        pressure = parse_slp(raw.get("SLP"))
        code = (raw.get("AW1") or "").split(",")[0] or None

        if temp is None:
            stats["missing_temperature"] += 1
        if wind_speed is None:
            stats["missing_wind"] += 1
        if vis is None:
            stats["missing_visibility"] += 1
        if precip is None:
            stats["missing_precipitation"] += 1
        if gust is None:
            stats["missing_gust"] += 1

        stats["valid_count"] += 1
        rows.append(
            {
                "station_id": station_id,
                "timestamp_utc": stamp_utc,
                "timestamp_local": local,
                "local_date": local.date(),
                "local_hour": local.hour,
                "local_month": local.month,
                "local_year": local.year,
                "temperature_c": temp,
                "dew_point_c": dew,
                "wind_speed_ms": wind_speed,
                "wind_direction_deg": wind_dir,
                "wind_gust_ms": gust,
                "visibility_m": vis,
                "precipitation_mm": precip,
                "pressure_hpa": pressure,
                "weather_code": code,
                "weather_code_precip": weather_code_precip(raw.get("AW1")),
            }
        )

    return rows, stats
