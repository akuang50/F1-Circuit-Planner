"""DuckDB-backed lookups for precomputed NOAA ISD profiles."""

from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

import duckdb
import polars as pl

from config import (
    ISD_REGISTRY,
    PROCESSED_DIR,
    circuit_by_id,
    station_mapping,
    thresholds,
)

PROFILES_PATH = PROCESSED_DIR / "hourly_profiles.parquet"
MONTHLY_PATH = PROCESSED_DIR / "monthly_profiles.parquet"
QC_PATH = PROCESSED_DIR / "qc_stats.json"


class DataNotReady(RuntimeError):
    pass


def _require(path: Path) -> Path:
    if not path.exists():
        raise DataNotReady(
            f"Missing {path}. Run `python scripts/seed_demo_data.py` to download NOAA ISD and build features."
        )
    return path


@lru_cache(maxsize=1)
def connection() -> duckdb.DuckDBPyConnection:
    con = duckdb.connect(database=":memory:")
    hourly = _require(PROFILES_PATH)
    monthly = _require(MONTHLY_PATH)
    con.execute(f"CREATE VIEW hourly_profiles AS SELECT * FROM read_parquet('{hourly.as_posix()}')")
    con.execute(f"CREATE VIEW monthly_profiles AS SELECT * FROM read_parquet('{monthly.as_posix()}')")
    return con


def hourly_rows(month: int | None = None) -> list[dict]:
    con = connection()
    if month is None:
        frame = con.execute("SELECT * FROM hourly_profiles ORDER BY month, hour").pl()
    else:
        frame = con.execute(
            "SELECT * FROM hourly_profiles WHERE month = ? ORDER BY hour",
            [month],
        ).pl()
    return frame.to_dicts()


def monthly_rows() -> list[dict]:
    con = connection()
    return con.execute("SELECT * FROM monthly_profiles ORDER BY month").pl().to_dicts()


def observation_count() -> int:
    import json

    if QC_PATH.exists():
        payload = json.loads(QC_PATH.read_text())
        return int(payload.get("valid_count", 0))
    rows = hourly_rows()
    return int(sum(r.get("observation_count", 0) for r in rows))


def provenance(circuit_id: str) -> dict:
    circuit = circuit_by_id(circuit_id)
    mapping = station_mapping(circuit_id)
    cfg = thresholds()
    return {
        "data_source": "NOAA Integrated Surface Database (ISD)",
        "registry": ISD_REGISTRY,
        "station_id": mapping["station_id"],
        "station_name": mapping["station_name"],
        "latitude": mapping["latitude"],
        "longitude": mapping["longitude"],
        "distance_km": mapping["distance_km"],
        "start_year": mapping["start_year"],
        "end_year": mapping["end_year"],
        "observation_count": observation_count(),
        "generated_at": datetime.now(timezone.utc).date().isoformat(),
        "model_version": cfg["model_version"],
        "rationale": mapping["rationale"],
        "thresholds": {
            "precipitation_mm": cfg["precipitation_mm"]["value"],
            "strong_wind_ms": cfg["strong_wind_ms"]["value"],
            "strong_gust_ms": cfg["strong_gust_ms"]["value"],
            "low_visibility_m": cfg["low_visibility_m"]["value"],
            "high_temperature_c": cfg["high_temperature_c"]["value"],
        },
        "circuit": circuit,
    }
