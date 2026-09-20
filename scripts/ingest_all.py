#!/usr/bin/env python3
"""Download NOAA ISD for every mapped circuit and rebuild hourly/monthly profiles."""

from __future__ import annotations

import json
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "scripts"))

from analytics import attach_volatility, build_hourly_profiles, build_monthly_profiles  # noqa: E402
from config import PROCESSED_DIR, RAW_DIR, circuits, station_mapping  # noqa: E402
from download_isd import download_history, download_year  # noqa: E402
from isd import parse_csv_file  # noqa: E402


def ingest_circuit(circuit: dict) -> tuple[list[dict], list[dict], dict]:
    mapping = station_mapping(circuit["id"])
    station_id = mapping["station_id"]
    start = mapping["start_year"]
    end = mapping["end_year"]
    years = list(range(start, end + 1))
    print(f"\n=== {circuit['id']}  {station_id}  {start}–{end} ===", flush=True)
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(download_year, station_id, year) for year in years]
        for future in as_completed(futures):
            future.result()

    year_dir = RAW_DIR / "isd-csv" / station_id
    files = sorted(path for path in year_dir.glob("*.csv") if path.stat().st_size > 0)
    if not files:
        raise SystemExit(f"No CSV files for {circuit['id']} at {year_dir}")

    all_rows: list[dict] = []
    stats: Counter = Counter()
    for path in files:
        rows, file_stats = parse_csv_file(
            path,
            timezone_name=circuit["timezone"],
            station_id=station_id,
        )
        stats.update(file_stats)
        all_rows.extend(rows)
    print(f"parsed {len(all_rows)} observations for {circuit['id']}", flush=True)
    all_rows = attach_volatility(all_rows)
    hourly = build_hourly_profiles(all_rows)
    monthly = build_monthly_profiles(hourly)
    for row in hourly:
        row["circuit_id"] = circuit["id"]
    for row in monthly:
        row["circuit_id"] = circuit["id"]
    qc = {
        **dict(stats),
        "circuit_id": circuit["id"],
        "station_id": station_id,
        "timezone": circuit["timezone"],
        "files": [path.name for path in files],
        "row_count": len(all_rows),
    }
    return hourly, monthly, qc


def main() -> None:
    download_history()
    hourly_all: list[dict] = []
    monthly_all: list[dict] = []
    qc_all: dict[str, dict] = {}
    for circuit in circuits():
        hourly, monthly, qc = ingest_circuit(circuit)
        hourly_all.extend(hourly)
        monthly_all.extend(monthly)
        qc_all[circuit["id"]] = qc

    import polars as pl

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    hourly_frame = pl.DataFrame(hourly_all, infer_schema_length=None)
    monthly_frame = pl.DataFrame(monthly_all, infer_schema_length=None)
    hourly_frame.write_parquet(PROCESSED_DIR / "hourly_profiles.parquet")
    monthly_frame.write_parquet(PROCESSED_DIR / "monthly_profiles.parquet")
    (PROCESSED_DIR / "qc_stats.json").write_text(json.dumps(qc_all, indent=2))
    print(
        f"\nWrote {hourly_frame.height} hourly / {monthly_frame.height} monthly rows "
        f"for {len(qc_all)} circuits",
        flush=True,
    )


if __name__ == "__main__":
    main()
