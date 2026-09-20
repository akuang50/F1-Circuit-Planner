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


HOURLY_FIELDS = (
    "circuit_id",
    "month",
    "hour",
    "observation_count",
    "rain_probability",
    "strong_wind_probability",
    "strong_gust_probability",
    "low_visibility_probability",
    "high_temperature_probability",
    "volatility_index",
    "volatility_label",
)

MONTHLY_FIELDS = (
    "circuit_id",
    "month",
    "observation_count",
    "rain_probability",
    "strong_gust_probability",
    "low_visibility_probability",
    "high_temperature_probability",
    "volatility_index",
    "volatility_label",
)


def _rows(path: Path) -> list[dict]:
    return [{k: _clean(v) for k, v in row.items()} for row in pq.read_table(path).to_pylist()]


def _project(rows: list[dict], fields: tuple[str, ...]) -> list[dict]:
    return [{key: _clean(row.get(key)) for key in fields} for row in rows]


def _provenance(mapping: dict, thresholds: dict, stations: dict, qc: dict) -> dict:
    return {
        "data_source": "NOAA Integrated Surface Database (ISD)",
        "registry": stations["registry"],
        "station_id": mapping["station_id"],
        "station_name": mapping["station_name"],
        "latitude": mapping["latitude"],
        "longitude": mapping["longitude"],
        "distance_km": mapping["distance_km"],
        "start_year": mapping["start_year"],
        "end_year": mapping["end_year"],
        "observation_count": qc.get("valid_count", qc.get("row_count", 0)),
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
    }


def main() -> None:
    hourly = _project(_rows(ROOT / "data/processed/hourly_profiles.parquet"), HOURLY_FIELDS)
    monthly = _project(_rows(ROOT / "data/processed/monthly_profiles.parquet"), MONTHLY_FIELDS)
    circuits = json.loads((ROOT / "data/metadata/circuits.json").read_text())
    stations = json.loads((ROOT / "data/metadata/stations.json").read_text())
    thresholds = json.loads((ROOT / "data/metadata/thresholds.json").read_text())
    sessions = json.loads((ROOT / "data/metadata/sessions.json").read_text())
    history = json.loads((ROOT / "data/metadata/circuit_history.json").read_text())
    qc = json.loads((ROOT / "data/processed/qc_stats.json").read_text())
    if isinstance(qc, dict) and "valid_count" in qc and "circuit_id" in qc:
        qc = {qc["circuit_id"]: qc}

    mappings = {item["circuit_id"]: item for item in stations["mappings"]}
    provenances = {
        circuit_id: _provenance(mapping, thresholds, stations, qc.get(circuit_id, {}))
        for circuit_id, mapping in mappings.items()
    }
    silverstone = provenances.get("silverstone") or next(iter(provenances.values()))
    payload = {
        "circuits": circuits["circuits"],
        "history": history,
        "thresholds": thresholds,
        "sessions": sessions,
        "hourly": hourly,
        "monthly": monthly,
        "provenances": provenances,
        "provenance": silverstone,
    }
    out = ROOT / "frontend/public/data/app.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, allow_nan=False, separators=(",", ":")))
    print(
        f"Wrote {out} ({out.stat().st_size} bytes, {len(hourly)} hourly rows, "
        f"{len(provenances)} circuits)"
    )


if __name__ == "__main__":
    main()
