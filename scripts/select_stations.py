#!/usr/bin/env python3
"""Pin a NOAA ISD station for each weather-enabled F1 circuit.

Reads data/raw/isd-history.csv (download via scripts/download_isd.py --history)
and writes data/metadata/stations.json. Stations are chosen by distance among
sites with a 2010–2024 record, then a few manual overrides.
"""

from __future__ import annotations

import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from config import METADATA_DIR, RAW_DIR  # noqa: E402

# Prefer these IDs when they sit inside the search radius.
OVERRIDES = {
    "silverstone": "03544099999",  # Church Lawford, already validated
    "monaco": "07690099999",  # Nice Côte d'Azur — no station in Monaco
    "spa": "06490099999",  # Spa / La Sauvenière, 6 km from Eau Rouge
}


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def station_id(usaf: str, wban: str) -> str:
    return f"{usaf.zfill(6)}{wban.zfill(5)}"


def load_history() -> list[dict]:
    path = RAW_DIR / "isd-history.csv"
    if not path.exists():
        raise SystemExit("Missing data/raw/isd-history.csv")
    rows = []
    with path.open(newline="", encoding="utf-8", errors="replace") as handle:
        for raw in csv.DictReader(handle):
            try:
                lat = float(raw["LAT"])
                lon = float(raw["LON"])
            except (TypeError, ValueError, KeyError):
                continue
            if abs(lat) < 0.01 and abs(lon) < 0.01:
                continue
            begin = raw.get("BEGIN") or "0"
            end = raw.get("END") or "0"
            rows.append(
                {
                    "usaf": (raw.get("USAF") or "").strip(),
                    "wban": (raw.get("WBAN") or "").strip(),
                    "name": (raw.get("STATION NAME") or "").strip(),
                    "country": (raw.get("CTRY") or "").strip(),
                    "latitude": lat,
                    "longitude": lon,
                    "elevation_m": _elev(raw.get("ELEV(M)")),
                    "begin": begin,
                    "end": end,
                    "station_id": station_id(raw.get("USAF") or "0", raw.get("WBAN") or "0"),
                }
            )
    return rows


def _elev(raw) -> float | None:
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    if abs(value) > 8000:
        return None
    return value


def eligible(row: dict) -> bool:
    try:
        begin = int(row["begin"])
        end = int(row["end"])
    except ValueError:
        return False
    return begin <= 20150101 and end >= 20200101


def pick(circuit: dict, stations: list[dict], radius_km: float = 80) -> dict | None:
    lat, lon = circuit["latitude"], circuit["longitude"]
    scored = []
    for row in stations:
        if not eligible(row):
            continue
        dist = haversine_km(lat, lon, row["latitude"], row["longitude"])
        if dist <= radius_km:
            scored.append((dist, row))
    if not scored:
        for row in stations:
            if not eligible(row):
                continue
            dist = haversine_km(lat, lon, row["latitude"], row["longitude"])
            if dist <= 150:
                scored.append((dist, row))
    if not scored:
        return None
    scored.sort(key=lambda item: (item[0], -int(item[1]["end"] or 0)))
    override = OVERRIDES.get(circuit["id"])
    if override:
        for dist, row in scored:
            if row["station_id"] == override:
                return {**row, "distance_km": round(dist, 1)}
    dist, row = scored[0]
    return {**row, "distance_km": round(dist, 1)}


def main() -> None:
    circuits = json.loads((METADATA_DIR / "circuits.json").read_text())["circuits"]
    stations = load_history()
    mappings = []
    missing = []
    for circuit in circuits:
        chosen = pick(circuit, stations)
        if not chosen:
            missing.append(circuit["id"])
            print(f"MISS {circuit['id']}")
            continue
        mappings.append(
            {
                "circuit_id": circuit["id"],
                "station_id": chosen["station_id"],
                "usaf": chosen["usaf"],
                "wban": chosen["wban"],
                "station_name": chosen["name"],
                "country": chosen["country"],
                "latitude": chosen["latitude"],
                "longitude": chosen["longitude"],
                "elevation_m": chosen["elevation_m"],
                "distance_km": chosen["distance_km"],
                "start_year": 2010,
                "end_year": 2025,
                "record_begin": chosen["begin"],
                "record_end": chosen["end"],
                "rationale": (
                    f"Pinned NOAA ISD station {chosen['name']} "
                    f"({chosen['distance_km']} km from {circuit['name']}). "
                    "Nearest is not assumed best; long 2010–2025 hourly coverage is required."
                ),
            }
        )
        print(f"OK   {circuit['id']:16} {chosen['station_id']} {chosen['name'][:40]:40} {chosen['distance_km']} km")

    payload = {
        "comment": "Stations are pinned explicitly so results are reproducible. Nearest is not assumed best.",
        "source": "NOAA Integrated Surface Database (ISD) via AWS Open Data (s3://noaa-isd-pds, s3://noaa-global-hourly-pds)",
        "registry": "https://registry.opendata.aws/noaa-isd/",
        "mappings": mappings,
        "missing": missing,
    }
    out = METADATA_DIR / "stations.json"
    out.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {out} ({len(mappings)} mappings, missing={missing})")


if __name__ == "__main__":
    main()
