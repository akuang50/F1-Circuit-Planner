"""Export processed NOAA ISD profiles as a single JSON file for GitHub Pages."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]


def _clean(value):
    if value is None:
        return None
    if isinstance(value, float) and value != value:
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def _rows(path: Path) -> list[dict]:
    return [{k: _clean(v) for k, v in row.items()} for row in pq.read_table(path).to_pylist()]


def main() -> None:
    hourly = _rows(ROOT / "data/processed/hourly_profiles.parquet")
    monthly = _rows(ROOT / "data/processed/monthly_profiles.parquet")
    circuits = json.loads((ROOT / "data/metadata/circuits.json").read_text())
    stations = json.loads((ROOT / "data/metadata/stations.json").read_text())
    thresholds = json.loads((ROOT / "data/metadata/thresholds.json").read_text())
    sessions = json.loads((ROOT / "data/metadata/sessions.json").read_text())
    qc = json.loads((ROOT / "data/processed/qc_stats.json").read_text())
    mapping = stations["mappings"][0]
    payload = {
        "circuits": circuits["circuits"],
        "station": mapping,
        "thresholds": thresholds,
        "sessions": sessions,
        "qc": qc,
        "hourly": hourly,
        "monthly": monthly,
        "provenance": {
            "data_source": "NOAA Integrated Surface Database (ISD)",
            "registry": stations["registry"],
            "station_id": mapping["station_id"],
            "station_name": mapping["station_name"],
            "latitude": mapping["latitude"],
            "longitude": mapping["longitude"],
            "distance_km": mapping["distance_km"],
            "start_year": mapping["start_year"],
            "end_year": mapping["end_year"],
            "observation_count": qc.get("valid_count", 0),
            "generated_at": date.today().isoformat(),
            "model_version": thresholds["model_version"],
            "rationale": mapping["rationale"],
            "thresholds": {
                "precipitation_mm": thresholds["precipitation_mm"]["value"],
                "strong_wind_ms": thresholds["strong_wind_ms"]["value"],
                "strong_gust_ms": thresholds["strong_gust_ms"]["value"],
                "low_visibility_m": thresholds["low_visibility_m"]["value"],
                "high_temperature_c": thresholds["high_temperature_c"]["value"],
            },
        },
    }
    out = ROOT / "frontend/public/data/app.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, allow_nan=False))
    print(f"Wrote {out} ({out.stat().st_size} bytes, {len(hourly)} hourly rows)")


if __name__ == "__main__":
    main()
